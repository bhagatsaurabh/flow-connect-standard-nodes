import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { InputType, Input, Slider, Toggle, Select, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class OverdriveEffect extends Node {
  driveSlider: Slider;
  driveInput: Input;
  outGainSlider: Slider;
  outGainInput: Input;
  curveAmountSlider: Slider;
  curveAmountInput: Input;
  algorithmSelect: Select;
  bypassToggle: Toggle;
  overdrive: any;

  static DefaultState = { drive: 0.197, outGain: -9.154, curveAmount: 0.979, algorithm: 1, bypass: false };

  constructor(_flow: Flow, _options: OverdriveOptions) {
    super();
  }

  protected setupIO(_options: OverdriveOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: OverdriveOptions): void {
    const { width = 230, name = "Overdrive Effect", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...OverdriveEffect.DefaultState, ...state };
    this.style = { ...DefaultOverdriveStyle(), ...style };

    this.overdrive = new (window as any).__tuna__.Overdrive();
    this.inputs[0].ref = this.outputs[0].ref = this.overdrive;
    this.setupUI();
    Object.assign(this.overdrive, {
      drive: this.state.drive,
      outputGain: this.state.outGain,
      curveAmount: this.state.curveAmount,
      algorithmIndex: parseInt(this.state.algorithm) - 1,
    });

    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setupUI() {
    this.driveSlider = this.createUI("core/slider", {
      min: 0,
      max: 1,
      height: 10,
      propName: "drive",
      style: { grow: 0.5 },
    });
    this.driveInput = this.createUI("core/input", {
      propName: "drive",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 4 },
    });
    this.outGainSlider = this.createUI("core/slider", {
      min: -46,
      max: 0,
      height: 10,
      propName: "outGain",
      style: { grow: 0.5 },
    });
    this.outGainInput = this.createUI("core/input", {
      propName: "outGain",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    this.curveAmountSlider = this.createUI("core/slider", {
      min: 0,
      max: 0.95,
      height: 10,
      propName: "curveAmount",
      style: { grow: 0.5 },
    });
    this.curveAmountInput = this.createUI("core/input", {
      propName: "curveAmount",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    this.algorithmSelect = this.createUI("core/select", {
      values: ["1", "2", "3", "4", "5", "6"],
      propName: "algorithm",
      height: 20,
      style: { grow: 0.7 },
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.1 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Drive", style: { grow: 0.3 } }),
          this.driveSlider,
          this.driveInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Output Gain", style: { grow: 0.3 } }),
          this.outGainSlider,
          this.outGainInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Curve Amount", style: { grow: 0.3 } }),
          this.curveAmountSlider,
          this.curveAmountInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Algorithm", style: { grow: 0.3 } }), this.algorithmSelect],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }

  setupListeners() {
    this.watch("drive", (_oldVal, newVal) => {
      if (newVal < 0 || newVal > 1) this.state.drive = clamp(newVal, 0, 1);
      this.overdrive.drive = this.state.drive;
    });
    this.watch("outGain", (_oldVal, newVal) => {
      if (newVal < -46 || newVal > 0) this.state.outGain = clamp(newVal, -46, 0);
      this.overdrive.outputGain = this.state.outGain;
    });
    this.watch("curveAmount", (_oldVal, newVal) => {
      if (newVal < 0 || newVal > 1) this.state.curveAmount = clamp(newVal, 0, 1);
      this.overdrive.curveAmount = this.state.curveAmount;
    });
    this.watch("algorithm", (_oldVal, newVal) => {
      newVal = parseInt(newVal);
      if (!newVal) newVal = 1;
      if (newVal < 1 || newVal > 6) newVal = clamp(newVal, 1, 6);
      this.overdrive.algorithmIndex = newVal - 1;
    });
    this.watch("bypass", (_oldVal, newVal) => (this.overdrive.bypass = newVal));

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface OverdriveOptions extends NodeOptions {}

export interface OverdriveStyle extends NodeStyle {}

const DefaultOverdriveStyle = (): OverdriveStyle => ({
  rowHeight: 10,
  spacing: 10,
});
