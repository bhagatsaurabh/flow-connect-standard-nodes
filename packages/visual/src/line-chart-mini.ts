import { Color, Node, NodeOptions, TerminalType } from "flow-connect/core";
import {
  InputType,
  DisplayStyle,
  Display,
  DisplayOptions,
  Label,
  LabelOptions,
  HorizontalLayout,
  HorizontalLayoutOptions,
} from "flow-connect/ui";

export class LineChartMini extends Node {
  static DefaultState = { size: 10, colors: [""] };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.IN, name: "data", dataType: "array" }]);
  }

  protected created(options: LineChartMiniOptions): void {
    const { width = 150, name = "Line Chart Mini", style = {}, state = {}, height, displayStyle } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...LineChartMini.DefaultState, ...state };

    this.setupUI(height, displayStyle);
  }

  protected process(): void {}

  setupUI(height: number, displayStyle: DisplayStyle) {
    let display = this.createUI<Display, DisplayOptions>("core/display", {
      height,
      customRenderers: [
        {
          auto: true,
          renderer: (ctx, wdth, hght) => this.customRenderer(ctx, wdth, hght),
        },
      ],
      style: displayStyle ? displayStyle : {},
    });
    this.ui.append(display);
    let sizeInput = this.createUI("core/input", {
      propName: "size",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Number, grow: 0.5 },
    });
    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Size" }), sizeInput],
        style: { spacing: 20 },
      })
    );
  }

  customRenderer(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, wdth: number, hght: number) {
    let data = this.getInputs();
    if (!data || !data[0]) return true;
    data[0].forEach((input: number[], index: number) => {
      if (!input) return;
      let spacing = Number((wdth / (this.state.size - 1)).toFixed(2));
      context.strokeStyle = this.state.colors[index] || Color.Random().rgbaCSSString;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, (1 - input[0]) * hght);
      for (let i = 1; i < input.length; i += 1) context.lineTo(i * spacing, (1 - input[i]) * hght);
      context.stroke();
    });
    return true;
  }
}

export interface LineChartMiniOptions extends NodeOptions {
  height: number;
  colors: string[];
  displayStyle: DisplayStyle;
}
