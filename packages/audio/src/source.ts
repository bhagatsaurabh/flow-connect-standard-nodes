import {
  FlowState,
  HorizontalLayout,
  HorizontalLayoutOptions,
  Label,
  LabelOptions,
  NodeOptions,
  NodeStyle,
  TerminalType,
} from "flow-connect";
import { Node } from "flow-connect/core";
import { Log } from "flow-connect/utils";
import { Toggle, Source as OGSource } from "flow-connect/ui";

export class Source extends Node {
  fileInput: OGSource;
  loopToggle: Toggle;
  source: AudioBufferSourceNode;

  volumeGainNode: GainNode;
  proxyParamSourceNode: AudioWorkletNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState: any = { file: null, buffer: null, loop: true, prevChannelCount: -1 };

  constructor() {
    super();
  }

  protected setupIO(_options: SourceOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "array-buffer", dataType: "event" },
      { type: TerminalType.IN, name: "gain", dataType: "audioparam" },
      { type: TerminalType.IN, name: "detune", dataType: "audioparam" },
      { type: TerminalType.IN, name: "playback-rate", dataType: "audioparam" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
      { type: TerminalType.OUT, name: "ended", dataType: "event" },
    ]);
  }
  protected created(options: SourceOptions): void {
    const { width = 200, name = "Audio Source", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...Source.DefaultState, ...state };
    this.style = { ...DefaultSourceStyle(), ...style };

    this.volumeGainNode = this.audioCtx.createGain();
    this.proxyParamSourceNode = new AudioWorkletNode(this.audioCtx, "proxy-param-for-source", {
      numberOfOutputs: 2,
      parameterData: { detune: 0, playbackRate: 1 },
    });

    this.inputs[1].ref = this.volumeGainNode.gain;
    this.inputs[2].ref = (this.proxyParamSourceNode.parameters as Map<string, AudioParam>).get("detune");
    this.inputs[3].ref = (this.proxyParamSourceNode.parameters as Map<string, AudioParam>).get("playbackRate");
    this.inputs[1].on("data", (_, data) => typeof data === "number" && (this.inputs[1].ref.value = data));
    this.inputs[2].on("data", (_, data) => typeof data === "number" && (this.inputs[2].ref.value = data));
    this.inputs[3].on("data", (_, data) => typeof data === "number" && (this.inputs[3].ref.value = data));
    this.outputs[0].ref = this.volumeGainNode;

    this.setupUI();
    this.setupListeners();
  }
  protected process(_inputs: any[]): void {}

  propagateChannelChange(newNoOfChannels: number) {
    this.flow.executionGraph.propagate(this, (currNode: Node) => {
      currNode.call("channel-count-change", newNoOfChannels);
    });
  }
  async processFile(file: File) {
    let cached = this.flow.flowConnect.arrayBufferCache.get(file.name + file.type);
    if (!cached) {
      cached = await file.arrayBuffer();
      this.flow.flowConnect.arrayBufferCache.set(file.name + file.type, cached);
    }
    this.processArrayBuffer(cached);
  }
  async processArrayBuffer(arrayBuffer: ArrayBuffer) {
    let cached = this.flow.flowConnect.audioBufferCache.get(arrayBuffer);
    if (!cached) {
      cached = await this.flow.flowConnect.audioContext.decodeAudioData(arrayBuffer);
      this.flow.flowConnect.audioBufferCache.set(arrayBuffer, cached);

      // If no. of channels has been changed, start an event propagation that will notify
      // every node that has a direct/indirect connection in the graph from this node
      if (this.state.prevChannelCount < 0 || this.state.prevChannelCount !== cached.numberOfChannels) {
        this.propagateChannelChange(cached.numberOfChannels);
      }
      this.state.prevChannelCount = cached.numberOfChannels;
    }
    this.state.buffer = cached;

    this.stopSource();
    this.playSource();
  }
  playSource() {
    if (this.flow.state === FlowState.Stopped || !this.state.buffer) return;

    let audioSource = new AudioBufferSourceNode(this.flow.flowConnect.audioContext);
    audioSource.buffer = this.state.buffer;
    audioSource.loop = this.state.loop;
    this.source = audioSource;

    this.proxyParamSourceNode.connect(audioSource.detune, 0);
    this.proxyParamSourceNode.connect(audioSource.playbackRate, 1);
    audioSource.connect(this.outputs[0].ref);
    audioSource.start();
  }
  stopSource() {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
  }
  setupUI() {
    this.fileInput = this.createUI("core/source", {
      input: true,
      output: true,
      accept: "audio/*",
      height: 25,
      style: { grow: 0.7 },
      propName: "file",
    });
    this.loopToggle = this.createUI("core/toggle", {
      propName: "loop",
      input: true,
      output: true,
      height: 10,
      style: { grow: 0.2 },
    });

    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "File", style: { grow: 0.3 } }), this.fileInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Loop ?" }), this.loopToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.loopToggle.on("change", () => {
      if (this.state.loop) {
        this.stopSource();
        this.playSource();
      } else this.source && (this.source.loop = this.state.loop);
    });
    this.inputs[0].on("event", (_, data) => {
      if (!(data instanceof ArrayBuffer)) {
        Log.error("Data received on Audio Source Node is not of type ArrayBuffer");
        return;
      }
      this.processArrayBuffer(data);
    });
    this.fileInput.on("change", (_inst, _oldVal: File, newVal: File) => this.processFile(newVal));
    this.fileInput.on("upload", (_inst, _oldVal: File, newVal: File) => this.processFile(newVal));

    this.flow.on("start", () => this.playSource());
    this.flow.on("stop", () => this.stopSource());

    this.outputs[0].on("connect", (_, connector) => {
      this.state.buffer && this.propagateChannelChange(this.state.buffer.numberOfChannels);
      this.outputs[0].ref.connect(connector.end.ref);
    });
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => {
      this.outputs[0].ref.disconnect(end.ref);
    });
  }
}

export interface SourceOptions extends NodeOptions {}

export interface SourceStyle extends NodeStyle {}

const DefaultSourceStyle = (): SourceStyle => ({
  rowHeight: 10,
  spacing: 15,
});
