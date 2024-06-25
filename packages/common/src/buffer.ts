import { TerminalType, clampMin } from "flow-connect";
import { Node, NodeOptions } from "flow-connect/core";
import { InputType, Input, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class Buffer extends Node {
  sizeInput: Input;
  buffer: any[] = [];

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "data", dataType: "any" },
      { type: TerminalType.OUT, name: "buffer", dataType: "array" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 150, name = "Buffer", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { size: 10, ...options.state, ...state };

    this.setupUI();
    this.setupListeners();
  }

  process(inputs: any[]) {
    if (inputs[0] === null || typeof inputs[0] === "undefined") return;
    const size = clampMin(this.state.size, 1);
    if (this.buffer.length === size) {
      this.buffer.shift();
    } else if (this.buffer.length > size) {
      this.buffer.splice(0, this.buffer.length - size + 1);
    }
    this.buffer.push(inputs[0]);

    this.setOutputs("buffer", this.buffer);
  }

  setupUI() {
    this.sizeInput = this.createUI("core/input", {
      propName: "size",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 0.7 },
    });
    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Size", style: { grow: 0.3 } }), this.sizeInput],
        style: { spacing: 20 },
      })
    );
  }
  setupListeners() {
    this.watch("size", () => this.process(this.getInputs()));
  }
}
