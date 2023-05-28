import { Flow, Vector, Node } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import {
  FlowConnectState,
  HorizontalLayout,
  HorizontalLayoutOptions,
  Label,
  LabelOptions,
  NodeOptions,
  NodeStyle,
  TerminalType,
} from "flow-connect";
import { InputType, Input, Toggle } from "flow-connect/ui";

export class Metronome extends Node {
  autoToggle: Toggle;
  freqInput: Input;
  bpmInput: Input;
  source: AudioBufferSourceNode;

  volumeGainNode: GainNode;
  proxyParamSourceNode: AudioWorkletNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState: any = { frequency: 330, buffer: null, bpm: 130, loop: true, auto: true };

  constructor(_flow: Flow, _options: MetronomeOptions) {
    super();
  }

  protected setupIO(_options: MetronomeOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "trigger", dataType: "event" },
      { type: TerminalType.IN, name: "gain", dataType: "audioparam" },
      { type: TerminalType.IN, name: "detune", dataType: "audioparam" },
      { type: TerminalType.IN, name: "playback-rate", dataType: "audioparam" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: MetronomeOptions): void {
    const { width = 200, name = "Metronome", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...Metronome.DefaultState, ...state };
    this.style = { ...DefaultMetronomeStyle(), ...style };

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
    this.fillBuffer();

    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  fillBuffer() {
    let ctx = this.flow.flowConnect.audioContext;

    let buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    let channel = buffer.getChannelData(0);

    let phase = 0;
    let amp = 1;
    let durationFrames = ctx.sampleRate / 50;

    const f = this.state.frequency;
    for (let i = 0; i < durationFrames; i++) {
      channel[i] = Math.sin(phase) * amp;
      phase += (2 * Math.PI * f) / ctx.sampleRate;
      if (phase > 2 * Math.PI) {
        phase -= 2 * Math.PI;
      }
      amp -= 1 / durationFrames;
    }
    this.state.buffer = buffer;
  }
  setupUI() {
    this.autoToggle = this.createUI("core/toggle", { propName: "auto", height: 10, style: { grow: 0.2 } });
    this.freqInput = this.createUI("core/input", {
      propName: "frequency",
      height: 20,
      style: { type: InputType.Number, grow: 0.5 },
    });
    this.bpmInput = this.createUI("core/input", {
      propName: "bpm",
      height: 20,
      style: { type: InputType.Number, grow: 0.5 },
    });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Auto ?" }), this.autoToggle],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI<Label, LabelOptions>("core/label", { text: "Frequency" }),
          this.freqInput,
          this.createUI<Label, LabelOptions>("core/label", { text: "BPM" }),
          this.bpmInput,
        ],
        style: { spacing: 5 },
      }),
    ]);
  }
  playSource() {
    if (this.flow.flowConnect.state === FlowConnectState.Stopped || !this.state.buffer) return;

    let audioSource = new AudioBufferSourceNode(this.flow.flowConnect.audioContext);
    audioSource.buffer = this.state.buffer;
    audioSource.loop = true;
    this.source = audioSource;

    audioSource.loopEnd = 1 / (clamp(this.state.bpm, 30, 300) / 60);
    this.proxyParamSourceNode.connect(audioSource.detune, 0);
    this.proxyParamSourceNode.connect(audioSource.playbackRate, 1);
    audioSource.connect(this.outputs[0].ref);
    audioSource.start(0);
  }
  stopSource() {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
  }
  setupListeners() {
    this.bpmInput.on("change", () => {
      if (this.source) {
        this.source.loopEnd = 1 / (clamp(this.state.bpm, 30, 300) / 60);
      }
    });
    this.freqInput.on("change", () => {
      if (this.source) {
        this.stopSource();
        this.fillBuffer();
        this.playSource();
      } else this.fillBuffer();
    });
    this.inputs[0].on("event", () => this.playSource());

    this.flow.flowConnect.on("start", () => this.state.auto && this.playSource());
    this.flow.flowConnect.on("stop", () => this.stopSource());

    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface MetronomeOptions extends NodeOptions {}

export interface MetronomeStyle extends NodeStyle {}

const DefaultMetronomeStyle = (): MetronomeStyle => ({
  rowHeight: 10,
  spacing: 15,
});
