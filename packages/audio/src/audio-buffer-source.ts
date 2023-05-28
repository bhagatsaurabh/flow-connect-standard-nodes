import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { HorizontalLayout, HorizontalLayoutOptions, Label, LabelOptions, Source, SourceOptions } from "flow-connect/ui";

export class AudioBufferSource extends Node {
  fileInput: Source;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState: any = { file: null, buffer: null };

  constructor(_flow: Flow, _options: AudioBufferSourceOptions) {
    super();
  }

  protected setupIO(_options: NodeOptions): void {
    this.addTerminal({
      type: TerminalType.OUT,
      name: "buffer",
      dataType: "audio-buffer",
    });
  }

  protected created(options: NodeOptions): void {
    const { state = {}, name = "AudioBuffer Source", width = 170, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...AudioBufferSource.DefaultState, ...state };
    this.style = { ...DefaultAudioBufferSourceStyle(), ...style };

    this.setupUI();
    this.fileInput.on("change", () => this.processFile());
  }

  protected process(_inputs: any[]): void {
    this.processFile();
  }

  setupUI() {
    this.fileInput = this.createUI<Source, SourceOptions>("core/source", {
      accept: "audio/*",
      propName: "file",
      height: 20,
      style: { grow: 1 },
    });

    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "File" }), this.fileInput],
        style: { spacing: 20 },
      })
    );
  }

  async processFile() {
    const arrayBufferCache = this.flow.flowConnect.arrayBufferCache;
    const file = this.state.file;
    if (!file) return;

    let cached = arrayBufferCache.get(file.name + file.type);
    if (!cached) {
      cached = await file.arrayBuffer();
      arrayBufferCache.set(file.name + file.type, cached);
    }
    this.processArrayBuffer(cached);
  }
  async processArrayBuffer(arrayBuffer: ArrayBuffer) {
    const audioBufferCache = this.flow.flowConnect.audioBufferCache;
    let cached = audioBufferCache.get(arrayBuffer);
    if (!cached) {
      cached = await this.audioCtx.decodeAudioData(arrayBuffer);
      audioBufferCache.set(arrayBuffer, cached);
    }
    this.state.buffer = cached;
    this.setOutputs(0, this.state.buffer);
  }
}

export interface AudioBufferSourceOptions extends NodeOptions {}

export interface AudioBufferSourceStyle extends NodeStyle {}

const DefaultAudioBufferSourceStyle = (): AudioBufferSourceStyle => ({
  rowHeight: 10,
});
