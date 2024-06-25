import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { InputType, Input, Toggle, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class NumberSource extends Node {
  fractionalToggle: Toggle;
  input: Input;

  static DefaultState = { fractional: false, value: 0 };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "value", dataType: "number" }]);
  }

  protected created(options: NodeOptions): void {
    const { width = 160, name = "Number Source", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...NumberSource.DefaultState, ...state };
    this.style = { rowHeight: 10, ...style };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    this.input.style.step = this.state.fractional ? "any" : "";
    this.setOutputs(0, this.state.fractional ? this.state.value : Math.floor(this.state.value));
  }

  setupUI() {
    this.fractionalToggle = this.createUI("core/toggle", {
      propName: "fractional",
      input: true,
      output: true,
      height: 10,
      style: { grow: 0.2 },
    });
    this.input = this.createUI("core/input", {
      value: 0,
      propName: "value",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 0.6, step: this.state.fractional ? "any" : "" },
    });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Value", style: { grow: 0.4 } }), this.input],
        style: { spacing: 20 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Fractional ?", style: { grow: 0.5 } }), this.fractionalToggle],
        style: { spacing: 20 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("fractional", () => this.process());
    this.watch("value", () => this.process());

    this.outputs[0].on("connect", () => this.process());
    this.on("process", () => this.process());
  }
}
