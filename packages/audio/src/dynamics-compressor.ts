import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { HorizontalLayout, HorizontalLayoutOptions, Toggle } from "flow-connect/ui";

export class DynamicsCompressor extends Node {
  bypassToggle: Toggle;

  inGain: GainNode;
  outGain: GainNode;
  compressor: DynamicsCompressorNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  constructor(_flow: Flow, _options: DynamicsCompressorOptions) {
    super();
  }

  protected setupIO(_options: DynamicsCompressorOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.IN, name: "threshold", dataType: "audioparam" },
      { type: TerminalType.IN, name: "ratio", dataType: "audioparam" },
      { type: TerminalType.IN, name: "knee", dataType: "audioparam" },
      { type: TerminalType.IN, name: "attack", dataType: "audioparam" },
      { type: TerminalType.IN, name: "release", dataType: "audioparam" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: DynamicsCompressorOptions): void {
    const { width = 230, name = "Dynamics Compressor", state = {}, style = {} } = options;
    this.width = width;
    this.name = name;
    this.state = { bypass: false, ...state };
    this.style = { ...DefaultDynamicsCompressorStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.ratio.value = 4;
    this.compressor.knee.value = 5;
    this.compressor.attack.value = 0.01;
    this.compressor.release.value = 0.12;

    this.inputs[0].ref = this.inGain;
    this.inputs[1].ref = this.compressor.threshold;
    this.inputs[2].ref = this.compressor.ratio;
    this.inputs[3].ref = this.compressor.knee;
    this.inputs[4].ref = this.compressor.attack;
    this.inputs[5].ref = this.compressor.release;
    this.outputs[0].ref = this.outGain;

    this.inputs[1].on(
      "data",
      (_, data) => typeof data === "number" && (this.inputs[1].ref.value = clamp(data, -100, 0))
    );
    this.inputs[2].on("data", (_, data) => typeof data === "number" && (this.inputs[2].ref.value = clamp(data, 1, 20)));
    this.inputs[3].on("data", (_, data) => typeof data === "number" && (this.inputs[3].ref.value = clamp(data, 0, 40)));
    this.inputs[4].on("data", (_, data) => typeof data === "number" && (this.inputs[4].ref.value = clamp(data, 0, 1)));
    this.inputs[5].on("data", (_, data) => typeof data === "number" && (this.inputs[5].ref.value = clamp(data, 0, 1)));

    this.setBypass();
    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setBypass() {
    if (this.state.bypass) {
      this.compressor.disconnect();
      this.inGain.disconnect();
      this.inGain.connect(this.outGain);
    } else {
      this.inGain.disconnect();
      this.inGain.connect(this.compressor);
      this.compressor.connect(this.outGain);
    }
  }
  setupUI() {
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.1 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("bypass", () => this.setBypass());

    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface DynamicsCompressorOptions extends NodeOptions {}

export interface DynamicsCompressorStyle extends NodeStyle {}

const DefaultDynamicsCompressorStyle = (): DynamicsCompressorStyle => ({
  rowHeight: 10,
  spacing: 10,
});
