import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { InputType, Input, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class StringSource extends Node {
  input: Input;

  static DefaultState = { value: "" };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "value", dataType: "string" }]);
  }

  protected created(options: NodeOptions): void {
    const { width = 160, name = "String Source", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };

    this.setupUI();
    this.setupListeners();
  }

  protected process = () => this.setOutputs(0, this.state.value);

  setupUI() {
    this.input = this.createUI("core/input", {
      value: "",
      propName: "value",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Text, grow: 0.7 },
    });
    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Value", style: { grow: 0.3 } }), this.input],
        style: { spacing: 10 },
      })
    );
  }
  setupListeners() {
    this.watch("value", () => this.process());
  }
}
