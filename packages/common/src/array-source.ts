import { Align } from "flow-connect";
import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import {
  InputType,
  Input,
  Toggle,
  HorizontalLayout,
  Stack,
  HorizontalLayoutOptions,
  StackOptions,
  InputOptions,
} from "flow-connect/ui";

export class ArraySource extends Node {
  arrayInput: Input;
  minInput: Input;
  maxInput: Input;
  numberToggle: Toggle;
  rangeToggle: Toggle;
  stepInput: Input;
  rangeLayout: HorizontalLayout;
  rangeStack: Stack;

  static DefaultState: any = { number: true, range: false, min: 0, max: 100, step: 0.1, rawInput: "" };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "array", dataType: "array" }]);
  }

  protected created(options: NodeOptions): void {
    const { width = 180, name = "Array Source", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...ArraySource.DefaultState, ...state };
    this.style = { rowHeight: 10, ...style };

    this.setupUI();
    this.setupListeners();
    this.checkNumber();
    this.checkRange();
  }

  protected process() {
    this.checkNumber();
    this.checkRange();

    let values = [];
    if (this.state.range) {
      for (let i = this.state.min; i <= this.state.max; i += this.state.step) values.push(i);
    } else {
      if (!this.arrayInput.inputEl.validity.patternMismatch) {
        if (!this.arrayInput.value) return;
        values = (this.arrayInput.value as string).split(",");
        if (this.state.number) values = values.map((item) => Number(item.trim()));
      }
    }

    this.setOutputs(0, values);
  }

  checkNumber() {
    this.rangeLayout.visible = this.state.number;
  }
  checkRange() {
    if (this.state.number && this.state.range) {
      this.arrayInput.visible = false;
      this.rangeStack.visible = true;
    } else {
      this.arrayInput.visible = true;
      this.rangeStack.visible = false;
    }
  }
  setupUI() {
    this.numberToggle = this.createUI("core/toggle", {
      propName: "number",
      input: true,
      output: true,
      height: 10,
      style: { grow: 0.2 },
    });
    this.rangeToggle = this.createUI("core/toggle", {
      propName: "range",
      input: true,
      output: true,
      height: 10,
      style: { grow: 0.2 },
    });
    this.rangeLayout = this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
      childs: [this.createUI("core/label", { text: "Range ?", style: { grow: 0.4 } }), this.rangeToggle],
      style: { spacing: 10 },
    });
    this.minInput = this.createUI("core/input", {
      propName: "min",
      height: 20,
      style: { type: InputType.Number, grow: 0.4, step: "any" },
    });
    this.maxInput = this.createUI("core/input", {
      propName: "max",
      height: 20,
      style: { type: InputType.Number, grow: 0.4, step: "any" },
    });
    let rangeInputLayout = this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
      childs: [
        this.minInput,
        this.createUI("core/label", { text: "to", style: { grow: 0.2, align: Align.Center } }),
        this.maxInput,
      ],
      style: { spacing: 5 },
    });
    this.stepInput = this.createUI("core/input", {
      propName: "step",
      height: 20,
      style: { type: InputType.Number, step: "any", grow: 0.6 },
    });
    this.rangeStack = this.createUI<Stack, StackOptions>("core/stack", {
      childs: [
        rangeInputLayout,
        this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
          childs: [this.createUI("core/label", { text: "Step", style: { grow: 0.4 } }), this.stepInput],
          style: { spacing: 5 },
        }),
      ],
      style: { spacing: 10 },
    });
    this.arrayInput = this.createUI<Input, InputOptions>("core/input", {
      propName: "rawInput",
      value: "",
      height: 20,
      style: { pattern: "^[^,]+(s*,s*[^,]+)*$" },
    });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Numbers ?", style: { grow: 0.4 } }), this.numberToggle],
        style: { spacing: 10 },
      }),
      this.rangeLayout,
      this.rangeStack,
      this.arrayInput,
    ]);
  }
  setupListeners() {
    this.watch("min", () => this.process());
    this.watch("max", () => this.process());
    this.watch("number", () => this.process());
    this.watch("range", () => this.process());
    this.watch("step", () => this.process());
    this.watch("rawInput", () => this.process());
  }
}
