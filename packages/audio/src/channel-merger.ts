import { Node, TerminalType, NodeOptions, NodeStyle } from "flow-connect/core";
import { Button } from "flow-connect/ui";

export class ChannelMerger extends Node {
  addChannelButton: Button;
  merger: ChannelMergerNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  constructor() {
    super();
  }

  protected setupIO(_options: ChannelMergerOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "Channel 1", dataType: "audio" },
      { type: TerminalType.IN, name: "Channel 2", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: ChannelMergerOptions): void {
    const { width = 160, name = "Channel Merger", state = {}, style = {} } = options;

    this.name = name;
    this.width = width;
    this.state = state;
    this.style = { ...DefaultChannelMergerStyle(), ...style };

    this.outputs[0].ref = this.audioCtx.createGain();
    if (options.inputs?.length) {
      this.merger = this.audioCtx.createChannelMerger(options.inputs.length);
      this.inputs.forEach((term, idx) => {
        term.ref = this.audioCtx.createGain();
        term.ref.connect(this.merger, 0, idx);
      });
    } else {
      this.merger = this.audioCtx.createChannelMerger(2);
      this.inputs[0].ref = this.audioCtx.createGain();
      this.inputs[1].ref = this.audioCtx.createGain();
      this.inputs[0].ref.connect(this.merger, 0, 0);
      this.inputs[1].ref.connect(this.merger, 0, 1);
    }
    this.merger.connect(this.outputs[0].ref);

    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setupUI() {
    this.addChannelButton = this.createUI("core/button", { text: "Add In Channel", height: 20 });
    this.ui.append(this.addChannelButton);
  }
  setupListeners() {
    this.addChannelButton.on("click", () => {
      this.merger.disconnect();
      this.inputs.forEach((input) => input.ref.disconnect());
      this.merger = this.audioCtx.createChannelMerger(this.inputs.length + 1);

      const newTerm = this.addTerminal({
        type: TerminalType.IN,
        name: `Channel ${this.inputs.length + 1}`,
        dataType: "audio",
      });
      newTerm.ref = this.audioCtx.createGain();

      this.inputs.forEach((input, index) => input.ref.connect(this.merger, 0, index));
      this.merger.connect(this.outputs[0].ref);
    });

    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface ChannelMergerOptions extends NodeOptions {}

export interface ChannelMergerStyle extends NodeStyle {}

const DefaultChannelMergerStyle = (): ChannelMergerStyle => ({
  rowHeight: 10,
  spacing: 15,
});
