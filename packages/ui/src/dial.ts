import { Align } from "flow-connect";
import { Node, NodeOptions } from "flow-connect/core";
import {
  DialOptions,
  DialStyle,
  HorizontalLayout,
  HorizontalLayoutOptions,
  Stack,
  StackOptions,
} from "flow-connect/ui";
import { Dial as DialUI } from "flow-connect/ui";

export class Dial extends Node {
  static DefaultState = { value: 0, min: 0, max: 1 };

  constructor() {
    super();
  }

  protected setupIO(): void {}

  protected created(options: DialNodeOptions): void {
    const { width = 90, name = "Dial", style = {}, state = {}, dialStyle } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, padding: 5, spacing: 10, ...style };
    this.state = { ...Dial.DefaultState, ...state };

    Object.assign(this.ui.style, {
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderWidth: 0,
      shadowBlur: 0,
      shadowColor: "transparent",
    });

    this.setupUI(dialStyle);
    this.setupListeners();
  }

  protected process(): void {}

  setupUI(dialStyle: DialStyle) {
    let dial = this.createUI<DialUI, DialOptions>("core/dial", {
      height: this.height,
      min: this.state.min,
      max: this.state.max,
      value: this.state.value,
      propName: "value",
      input: true,
      output: true,
      style: dialStyle,
    });
    this.ui.append([
      dial,
      this.createUI<Stack, StackOptions>("core/stack", {
        childs: [
          this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
            childs: [
              this.createUI("core/label", {
                text: "",
                propName: "min",
                style: { precision: 1, fontSize: "11px", align: Align.Left, grow: 0.5 },
              }),
              this.createUI("core/label", {
                text: "",
                propName: "max",
                style: { precision: 1, fontSize: "11px", align: Align.Right, grow: 0.5 },
              }),
            ],
          }),
          this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
            childs: [
              this.createUI("core/label", {
                text: "",
                propName: "value",
                style: { precision: 1, fontSize: "20px", align: Align.Center, grow: 1 },
              }),
            ],
          }),
        ],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.outputsUI[0].on("connect", (_inst, connector) => {
      if (connector.end.ref instanceof AudioParam) this.state.value = connector.end.ref.value;
    });
  }
}

export interface DialNodeOptions extends NodeOptions {
  dialStyle?: DialStyle;
}
