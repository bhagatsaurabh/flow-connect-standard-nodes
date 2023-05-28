import { FlowState, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";

export class Debug extends Node {
  inGain: GainNode;
  outGain: GainNode;
  debugNode: AudioWorkletNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  constructor() {
    super();
  }

  protected setupIO(_options: DebugOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
      { type: TerminalType.OUT, name: "debug", dataType: "any" },
    ]);
  }

  protected created(options: DebugOptions): void {
    const { width = 120, name = "Debug", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = state;
    this.style = { ...DefaultDebugStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.inputs[0].ref = this.inGain;
    this.outputs[0].ref = this.outGain;

    this.debugNode = new AudioWorkletNode(this.audioCtx, "debug", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
    });
    this.debugNode.port.onmessage = (e: any) => {
      if (this.flow.state !== FlowState.Stopped) this.setOutputs(1, e.data);
    };
    this.inputs[0].ref.connect(this.debugNode);
    this.debugNode.connect(this.outputs[0].ref);

    this.setupListeners();
  }

  protected process(_nputs: any[]): void {}

  setupListeners() {
    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface DebugOptions extends NodeOptions {}

export interface DebugStyle extends NodeStyle {}

const DefaultDebugStyle = (): DebugStyle => ({
  rowHeight: 10,
});
