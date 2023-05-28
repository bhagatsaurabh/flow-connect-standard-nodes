import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";

export class Gain extends Node {
  gain: GainNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState = { gain: 1 };

  constructor(_flow: Flow, _options: GainOptions) {
    super();
  }

  protected setupIO(_options: GainOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.IN, name: "gain", dataType: "audioparam" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: GainOptions): void {
    const { width = 120, name = "Gain", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...Gain.DefaultState, ...state };
    this.style = { ...DefaultGainStyle, ...style };

    this.gain = this.audioCtx.createGain();
    this.inputs[0].ref = this.gain;
    this.outputs[0].ref = this.gain;
    this.inputs[1].ref = this.inputs[0].ref.gain;

    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setupListeners() {
    this.inputs[1].on("data", (_, data) => typeof data === "number" && (this.inputs[1].ref.value = data));

    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface GainOptions extends NodeOptions {}

export interface GainStyle extends NodeStyle {}

const DefaultGainStyle = (): GainStyle => ({
  rowHeight: 10,
});
