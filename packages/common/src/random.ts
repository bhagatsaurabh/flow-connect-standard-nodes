import { Flow, Vector, Node, NodeOptions, TerminalType } from "flow-connect/core";
import { getRandom } from "flow-connect/utils";
import { InputType, Input, Toggle, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class Random extends Node {
  minInput: Input;
  maxInput: Input;
  fractionalToggle: Toggle;

  static DefaultState = { min: 0, max: 100, fractional: false };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "trigger", dataType: "event" },
      { type: TerminalType.OUT, name: "value", dataType: "number" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 150, name = "Random", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...Random.DefaultState, ...state };
    this.style = { rowHeight: 10, ...style };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    let random;
    if (this.state.fractional) random = getRandom(this.state.min, this.state.max);
    else random = Math.floor(getRandom(Math.floor(this.state.min), Math.floor(this.state.max)));

    this.setOutputs(0, random);
  }

  setupUI() {
    this.minInput = this.createUI("core/input", {
      propName: "min",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 1, step: "any" },
    });
    this.maxInput = this.createUI("core/input", {
      propName: "max",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 1, step: "any" },
    });
    this.fractionalToggle = this.createUI("core/toggle", {
      propName: "fractional",
      input: true,
      output: true,
      height: 10,
      style: { grow: 0.2 },
    });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Min:", style: { grow: 0.3 } }), this.minInput],
        style: { spacing: 20 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Max:", style: { grow: 0.3 } }), this.maxInput],
        style: { spacing: 20 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Fractional ?", style: { grow: 0.8 } }), this.fractionalToggle],
        style: { spacing: 10 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("min", () => this.process());
    this.watch("max", () => this.process());
    this.watch("fractional", () => this.process());

    this.inputs[0].on("event", () => this.process());
  }
}
