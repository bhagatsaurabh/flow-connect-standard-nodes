import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { InputType, Input, Slider, Toggle, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class PingPongEffect extends Node {
  delayLeftSlider: Slider;
  delayLeftInput: Input;
  delayRightSlider: Slider;
  delayRightInput: Input;
  feedbackSlider: Slider;
  feedbackInput: Input;
  wetSlider: Slider;
  wetInput: Input;
  bypassToggle: Toggle;
  pingPong: any;

  private static DefaultState = { delayLeft: 200, delayRight: 400, feedback: 0.3, wet: 0.5, bypass: false };

  constructor() {
    super();
  }

  protected setupIO(_options: PingPongOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: PingPongOptions): void {
    const { width = 230, name = "PingPong Effect", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...PingPongEffect.DefaultState, ...state };
    this.style = { ...DefaultPingPongStyle(), ...style };

    this.pingPong = new (window as any).__tuna__.PingPongDelay();
    this.inputs[0].ref = this.outputs[0].ref = this.pingPong;

    Object.assign(this.pingPong, {
      delayTimeLeft: this.state.delayLeft,
      delayTimeRight: this.state.delayRight,
      feedback: this.state.feedback,
      wetLevel: this.state.wet,
    });

    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setupUI() {
    this.delayLeftSlider = this.createUI("core/slider", {
      min: 1,
      max: 10000,
      height: 10,
      propName: "delayLeft",
      style: { grow: 0.5 },
    });
    this.delayLeftInput = this.createUI("core/input", {
      propName: "delayLeft",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 4 },
    });
    this.delayRightSlider = this.createUI("core/slider", {
      min: 1,
      max: 10000,
      height: 10,
      propName: "delayRight",
      style: { grow: 0.5 },
    });
    this.delayRightInput = this.createUI("core/input", {
      propName: "delayRight",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    this.feedbackSlider = this.createUI("core/slider", {
      min: 0,
      max: 1,
      height: 10,
      propName: "feedback",
      style: { grow: 0.5 },
    });
    this.feedbackInput = this.createUI("core/input", {
      propName: "feedback",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    this.wetSlider = this.createUI("core/slider", {
      min: 0,
      max: 1,
      height: 10,
      propName: "wet",
      style: { grow: 0.5 },
    });
    this.wetInput = this.createUI("core/input", {
      propName: "wet",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.1 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Delay L", style: { grow: 0.3 } }),
          this.delayLeftSlider,
          this.delayLeftInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Delay R", style: { grow: 0.3 } }),
          this.delayRightSlider,
          this.delayRightInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Feedback", style: { grow: 0.3 } }),
          this.feedbackSlider,
          this.feedbackInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Wet", style: { grow: 0.3 } }), this.wetSlider, this.wetInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("delayLeft", (_oldVal, newVal) => {
      if (newVal < 1 || newVal > 10000) this.state.delayLeft = clamp(newVal, 1, 10000);
      this.pingPong.delayTimeLeft = this.state.delayLeft;
    });
    this.watch("delayRight", (_oldVal, newVal) => {
      if (newVal < 1 || newVal > 10000) this.state.delayRight = clamp(newVal, 1, 10000);
      this.pingPong.delayTimeRight = this.state.delayRight;
    });
    this.watch("feedback", (_oldVal, newVal) => {
      if (newVal < 0 || newVal > 1) this.state.feedback = clamp(newVal, 0, 1);
      this.pingPong.feedback = this.state.feedback;
    });
    this.watch("wet", (_oldVal, newVal) => {
      if (newVal < 0 || newVal > 1) this.state.wet = clamp(newVal, 0, 1);
      this.pingPong.wetLevel = this.state.wet;
    });
    this.watch("bypass", (_oldVal, newVal) => (this.pingPong.bypass = newVal));

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface PingPongOptions extends NodeOptions {}

export interface PingPongStyle extends NodeStyle {}

const DefaultPingPongStyle = (): PingPongStyle => ({
  rowHeight: 10,
  spacing: 10,
});
