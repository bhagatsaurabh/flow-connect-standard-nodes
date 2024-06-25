import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { HorizontalLayout, HorizontalLayoutOptions, Label, LabelOptions, Toggle } from "flow-connect/ui";

export class Convolver extends Node {
  bypassToggle: Toggle;

  inGain: GainNode;
  outGain: GainNode;
  convolver: ConvolverNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState = { bypass: false };

  constructor() {
    super();
  }

  protected setupIO(_options: ConvolverOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.IN, name: "impulse", dataType: "audio-buffer" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: ConvolverOptions): void {
    const { width = 160, name = "Convolver", state = {}, style = {} } = options;

    this.name = name;
    this.width = width;
    this.state = { ...Convolver.DefaultState, ...state };
    this.style = { ...DefaultConvolverStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.convolver = this.audioCtx.createConvolver();

    this.inputs[0].ref = this.inGain;
    this.outputs[0].ref = this.outGain;

    this.setBypass();
    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setBypass() {
    if (!this.state.bypass) {
      this.inGain.disconnect();
      this.inGain.connect(this.convolver);
      this.convolver.connect(this.outGain);
    } else {
      this.inGain.disconnect();
      this.convolver.disconnect();
      this.inGain.connect(this.outGain);
    }
  }
  setupUI() {
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.25 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Bypass ?" }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("bypass", () => this.setBypass());

    this.inputs[1].on("data", (_inst, data) => {
      this.convolver.buffer = data;
    });

    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface ConvolverOptions extends NodeOptions {}

export interface ConvolverStyle extends NodeStyle {}

const DefaultConvolverStyle = (): ConvolverStyle => ({
  rowHeight: 10,
  spacing: 10,
});
