import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { InputType, Input, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class Clamp extends Node {
  minInput: Input;
  maxInput: Input;

  static DefaultState = { min: 0, max: 100 };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "x", dataType: "any" },
      { type: TerminalType.OUT, name: "[x]", dataType: "any" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 150, name = "Clamp", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...Clamp.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  process() {
    const input = this.getInputs()[0];
    if (typeof input === "number") {
      this.setOutputs(0, clamp(input, this.state.min, this.state.max));
    } else if (Array.isArray(input)) {
      this.setOutputs(
        0,
        input.map((item) => clamp(item, this.state.min, this.state.max))
      );
    }
  }

  setupUI() {
    this.minInput = this.createUI("core/input", {
      propName: "min",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 0.7 },
    });
    this.maxInput = this.createUI("core/input", {
      propName: "max",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 0.7 },
    });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Min", style: { grow: 0.3 } }), this.minInput],
        style: { spacing: 10 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Max", style: { grow: 0.3 } }), this.maxInput],
        style: { spacing: 10 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("min", () => this.process());
    this.watch("max", () => this.process());
  }
}
