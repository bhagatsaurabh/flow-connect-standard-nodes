import { Flow, Vector, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { HorizontalLayout, HorizontalLayoutOptions, Select } from "flow-connect/ui";

export class Noise extends Node {
  noiseSelect: Select;
  noise: AudioWorkletNode;
  outGain: GainNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState = { type: "white" };

  constructor(_flow: Flow, _options: NoiseOptions) {
    super();
  }

  protected setupIO(_options: NoiseOptions): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "out", dataType: "audio" }]);
  }

  protected created(options: NoiseOptions): void {
    const { width = 170, name = "Noise", state = {}, style = {} } = options;

    this.name = name;
    this.width = width;
    this.state = { ...Noise.DefaultState, ...state };
    this.style = { ...DefaultNoiseStyle(), ...style };

    this.outGain = this.audioCtx.createGain();
    this.outputs[0].ref = this.outGain;

    this.noise = new AudioWorkletNode(this.audioCtx, "noise", {
      channelCount: 1,
      channelCountMode: "explicit",
      outputChannelCount: [1],
      numberOfInputs: 1,
      numberOfOutputs: 1,
    });
    this.noise.port.postMessage(this.state.type);

    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setupUI() {
    this.noiseSelect = this.createUI("core/select", {
      values: ["white", "pink", "brownian"],
      height: 15,
      propName: "type",
      style: { grow: 0.7 },
    });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Type", style: { grow: 0.3 } }), this.noiseSelect],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("type", (_oldVal, newVal) => {
      if (!this.noiseSelect.values.includes(newVal)) newVal = "white";
      this.noise.port.postMessage(newVal);
    });

    this.flow.flowConnect.on("start", () => {
      this.noise.connect(this.outGain);
    });
    this.flow.flowConnect.on("stop", () => {
      this.noise.disconnect();
    });

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface NoiseOptions extends NodeOptions {}

export interface NoiseStyle extends NodeStyle {}

const DefaultNoiseStyle = (): NoiseStyle => ({
  rowHeight: 10,
  spacing: 10,
});
