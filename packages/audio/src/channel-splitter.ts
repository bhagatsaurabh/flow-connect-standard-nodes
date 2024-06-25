import { exists } from "flow-connect";
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
    if (options.outputs?.length) {
      this.oldNoOfChannels = options.outputs.length;
      let splitter = this.audioCtx.createChannelSplitter(this.oldNoOfChannels);
      this.inputs[0].ref.connect(splitter);
      this.outputs.forEach((term, idx) => {
        term.ref = this.audioCtx.createGain();
        term.ref.channelCountMode = "explicit";
        splitter.connect(term.ref, idx);
      });
      this.splitter = splitter;
    } else {
      this.outputs[0].ref = this.audioCtx.createGain();
      this.outputs[0].ref.channelCountMode = "explicit";
    }

    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setupListeners() {
    this.on("channel-count-change", (newNoOfChannels) => this.checkChannels(newNoOfChannels));

    this.outputs.forEach((term) => {
      term.on("connect", (_inst, cntr) => term.ref.connect(cntr.end.ref));
      term.on("disconnect", (_inst, _cntr, _start, end) => term.ref.disconnect(end.ref));
    });
  }
  checkChannels(newNoOfChannels: number) {
    if (this.oldNoOfChannels === newNoOfChannels) return;

    this.splitter && this.splitter.disconnect();
    this.inputs[0].ref.disconnect();

    let splitter = this.audioCtx.createChannelSplitter(newNoOfChannels);
    this.inputs[0].ref.connect(splitter);

    let terminalsToRemove = [];
    for (let i = 0; i < Math.max(newNoOfChannels, this.oldNoOfChannels); i += 1) {
      if (i < newNoOfChannels) {
        if (i < this.oldNoOfChannels) {
          splitter.connect(this.outputs[i].ref, i);
        } else {
          const newTerminal = this.addTerminal({ type: TerminalType.OUT, name: `Channel ${i + 1}`, dataType: "audio" });
          newTerminal.ref = this.audioCtx.createGain();
          newTerminal.ref.channelCountMode = "explicit";
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
