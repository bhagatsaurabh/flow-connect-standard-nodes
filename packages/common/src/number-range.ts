import { TerminalType, clamp } from "flow-connect";
import { Node, NodeOptions } from "flow-connect/core";
import { InputType, Input, Toggle, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class NumberRange extends Node {
  minInput: Input;
  maxInput: Input;
  stepInput: Input;
  loopToggle: Toggle;
  startValue = 0;
  value = 0;

  static DefaultState = { min: 0, max: 100, step: 1, loop: false };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "trigger", dataType: "event" },
      { type: TerminalType.IN, name: "reset", dataType: "event" },
      { type: TerminalType.OUT, name: "value", dataType: "number" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 200, name = "Number Range", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...NumberRange.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    this.value = clamp(this.value + this.state.step, this.state.min, this.state.max);

    if (this.state.loop) this.value = this.startValue;
    else return;

    this.setOutputs(0, this.value);
  }

  setupUI() {
    this.minInput = this.createUI("core/input", {
      propName: "min",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 0.3, step: "any" },
    });
    this.maxInput = this.createUI("core/input", {
      propName: "max",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 0.3, step: "any" },
    });
    this.stepInput = this.createUI("core/input", {
      propName: "step",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 0.3, step: "any" },
    });
    this.loopToggle = this.createUI("core/toggle", {
      propName: "loop",
      input: true,
      output: true,
      height: 10,
      style: { grow: 0.2 },
    });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Min", style: { grow: 0.2 } }),
          this.minInput,
          this.createUI("core/label", { text: "Max", style: { grow: 0.2 } }),
          this.maxInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Step", style: { grow: 0.2 } }), this.stepInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Loop ?", style: { grow: 0.2 } }), this.loopToggle],
        style: { spacing: 10 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("min", () => this.process());
    this.watch("max", () => this.process());
    this.watch("step", () => this.process());
    this.watch("loop", () => this.process());

    this.inputs[0].on("event", () => this.process());
    this.inputs[1].on("event", () => (this.value = this.state.min));
  }
}
