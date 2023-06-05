import { Node, TerminalType, NodeOptions, NodeStyle } from "flow-connect/core";

export class ChannelSplitter extends Node {
  splitter: ChannelSplitterNode;

  oldNoOfChannels = 1;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  constructor() {
    super();
  }

  protected setupIO(_options: ChannelSplitterOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "Channel 1", dataType: "audio" },
    ]);
  }

  protected created(options: ChannelSplitterOptions): void {
    const { width = 160, name = "Channel Splitter", state = {}, style = {} } = options;

    this.name = name;
    this.width = width;
    this.state = state;
    this.style = { ...DefaultChannelSplitterStyle(), ...style };

    this.inputs[0].ref = this.audioCtx.createGain();
    this.outputs[0].ref = this.audioCtx.createGain();
    this.outputs[0].ref.channelCountMode = "explicit";

    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setupListeners() {
    this.on("channel-count-change", (newNoOfChannels) => this.checkChannels(newNoOfChannels));

    this.outputs[0].on("connect", (_inst, cntr) => this.outputs[0].ref.connect(cntr.end.ref));
    this.outputs[0].on("disconnect", (_inst, _cntr, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
  checkChannels(newNoOfChannels: number) {
    if (this.oldNoOfChannels === newNoOfChannels) return;

    this.splitter && this.splitter.disconnect();
    this.inputs[0].ref.disconnect();

    let splitter = this.flow.flowConnect.audioContext.createChannelSplitter(newNoOfChannels);
    this.inputs[0].ref.connect(splitter);

    let terminalsToRemove = [];
    for (let i = 0; i < Math.max(newNoOfChannels, this.oldNoOfChannels); i += 1) {
      if (i < newNoOfChannels) {
        if (i < this.oldNoOfChannels) {
          splitter.connect(this.outputs[i].ref, i);
        } else {
          const newTerminal = this.addTerminal({ type: TerminalType.OUT, name: `Channel ${i + 1}`, dataType: "audio" });
          newTerminal.ref = this.flow.flowConnect.audioContext.createGain();
          newTerminal.ref.channelCountMode = "explicit";
          this.addTerminal(newTerminal);
          this.outputs[i].on("connect", (_inst, cntr) => this.outputs[i].ref.connect(cntr.end.ref));
          this.outputs[i].on("disconnect", (_inst, _cntr, _start, end) => this.outputs[i].ref.disconnect(end.ref));
          splitter.connect(this.outputs[i].ref, i);
        }
      } else {
        terminalsToRemove.push(this.outputs[i]);
      }
    }
    terminalsToRemove.forEach((term) => {
      term.ref.disconnect();
      this.removeTerminal(term);
    });

    this.oldNoOfChannels = newNoOfChannels;
    this.splitter = splitter;
  }
}

export interface ChannelSplitterOptions extends NodeOptions {}

export interface ChannelSplitterStyle extends NodeStyle {}

const DefaultChannelSplitterStyle = (): ChannelSplitterStyle => ({
  rowHeight: 10,
  spacing: 15,
});
