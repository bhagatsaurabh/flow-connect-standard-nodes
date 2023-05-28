import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";

export class Destination extends Node {
  masterVolumeGainNode: GainNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  constructor() {
    super();
  }

  protected setupIO(_options: DestinationOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "out", dataType: "audio" },
      { type: TerminalType.IN, name: "gain", dataType: "audioparam" },
    ]);
  }

  protected created(options: DestinationOptions): void {
    const { width = 160, name = "Audio Destination", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = state;
    this.style = { ...DefaultDestinationStyle(), ...style };

    this.masterVolumeGainNode = this.audioCtx.createGain();
    this.inputs[0].ref = this.masterVolumeGainNode;
    this.inputs[0].ref.connect(this.audioCtx.destination);
    this.inputs[1].ref = this.inputs[0].ref.gain;
    this.inputs[1].on("data", (_, data) => typeof data === "number" && (this.inputs[1].ref.value = data));
  }

  protected process(_inputs: any[]): void {}
}

export interface DestinationOptions extends NodeOptions {}

export interface DestinationStyle extends NodeStyle {}

const DefaultDestinationStyle = (): DestinationStyle => ({
  rowHeight: 10,
  spacing: 15,
});
