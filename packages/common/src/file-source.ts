import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { Source } from "flow-connect/ui";

export class FileSource extends Node {
  fileInput: Source;

  static DefaultState: any = { file: null };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "file", dataType: "file" }]);
  }

  protected created(options: NodeOptions): void {
    const { width = 130, name = "File Source", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...FileSource.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    this.setOutputs(0, this.state.file);
  }

  setupUI() {
    this.fileInput = this.createUI("core/source", { propName: "file", input: true, output: true, height: 20 });
    this.ui.append(this.fileInput);
  }
  setupListeners() {
    this.watch("file", () => this.process());
  }
}
