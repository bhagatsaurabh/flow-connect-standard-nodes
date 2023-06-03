import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { HorizontalLayout, HorizontalLayoutOptions, Label, LabelOptions, InputType } from "flow-connect/ui";
import { normalize } from "flow-connect/utils";

export class Normalize extends Node {
  min = Number.MAX_SAFE_INTEGER;
  max = Number.MIN_SAFE_INTEGER;
  normalizationType: "number" | "array";

  static DefaultState = { min: 0, max: 100, relative: false, constant: false, normalizationType: "array" };

  constructor() {
    super();
  }

  protected setupIO(options: NormalizeOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "data", dataType: options.normalizationType || "array" },
      { type: TerminalType.OUT, name: "normalized", dataType: options.normalizationType || "array" },
    ]);
  }

  protected created(options: NormalizeOptions): void {
    const { width = 150, name = "Normalize", style = {}, state = {}, normalizationType = "array" } = options;

    this.normalizationType = normalizationType;
    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...Normalize.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    let data = this.getInput(0);
    if (!data) return;

    let normalized;
    if (this.normalizationType === "number") {
      normalized = Number(normalize(data, this.state.min, this.state.max).toFixed(2));
    } else {
      if (this.state.relative) {
        let currMin = Math.min(...data);
        let currMax = Math.max(...data);
        if (currMin < this.min) this.min = currMin - (this.state.constant || 0);
        if (currMax > this.max) this.max = currMax + (this.state.constant || 0);
        normalized = data.map((item: number) => Number(normalize(item, this.min, this.max).toFixed(2)));
      } else {
        normalized = data.map((item: number) => Number(normalize(item, this.state.min, this.state.max).toFixed(2)));
      }
    }

    this.setOutputs("normalized", normalized);
  }

  setupUI() {
    if (this.normalizationType === "array") {
      const relativeToggle = this.createUI("core/toggle", { propName: "relative", height: 10, style: { grow: 0.5 } });
      this.ui.append(
        this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
          childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Relative ?" }), relativeToggle],
          style: { spacing: 20 },
        })
      );
    }

    if (this.normalizationType === "number" || !this.state.relative) {
      let minInput = this.createUI("core/input", {
        propName: "min",
        height: 20,
        style: { type: InputType.Number, grow: 0.3 },
      });
      let maxInput = this.createUI("core/input", {
        propName: "max",
        height: 20,
        style: { type: InputType.Number, grow: 0.3 },
      });
      this.ui.append(
        this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
          childs: [
            this.createUI("core/label", { text: "Min", style: { grow: 0.2 } }),
            minInput,
            this.createUI("core/label", { text: "Max", style: { grow: 0.2 } }),
            maxInput,
          ],
          style: { spacing: 5 },
        })
      );
    }

    if (this.state.constant) {
      let constantInput = this.createUI("core/input", {
        propName: "constant",
        height: 20,
        style: { type: InputType.Number, grow: 0.5 },
      });
      this.ui.append(
        this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
          childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Constant" }), constantInput],
          style: { spacing: 20 },
        })
      );
    }
  }
  setupListeners() {
    this.watch("relative", () => this.process());
    this.watch("min", () => this.process());
    this.watch("max", () => this.process());
    this.watch("constant", () => this.process());
  }
}

export interface NormalizeOptions extends NodeOptions {
  normalizationType: "number" | "array";
}
