import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { HorizontalLayout, HorizontalLayoutOptions, Label, LabelOptions, Toggle } from "flow-connect/ui";

export class BooleanSource extends Node {
  toggleInput: Toggle;

  static DefaultState = { value: false };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "value", dataType: "boolean" }]);
  }

  protected created(options: NodeOptions): void {
    const { width = 130, name = "Boolean Source", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...BooleanSource.DefaultState, ...state };
    this.style = { rowHeight: 10, ...style };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    this.setOutputs(0, this.state.value);
  }

  setupUI() {
    this.toggleInput = this.createUI("core/toggle", {
      propName: "value",
      input: true,
      output: true,
      height: 10,
      style: { grow: 0.4 },
    });
    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Value" }), this.toggleInput],
        style: { spacing: 20 },
      })
    );
  }
  setupListeners() {
    this.watch("value", () => this.process());
  }
}
