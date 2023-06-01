import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { Log } from "flow-connect/utils";
import { InputType, Input, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class JsonSource extends Node {
  input: Input;

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "value", dataType: "any" }]);
  }

  protected created(options: NodeOptions): void {
    const { width = 150, name = "JSON Source", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { value: "", ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    if (!this.input.value) return;

    try {
      const value = JSON.parse(this.input.value as string);
      this.setOutputs(0, value);
    } catch (error) {
      this.input.inputEl.style.backgroundColor = "red";
      Log.error("JSON parse error", error);
    }
  }

  setupUI() {
    this.input = this.createUI("core/input", {
      propName: "value",
      value: "",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Text, grow: 0.7 },
    });
    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Value", style: { grow: 0.3 } }), this.input],
        style: { spacing: 20 },
      })
    );
  }
  setupListeners() {
    this.watch("value", () => this.process());
  }
}
