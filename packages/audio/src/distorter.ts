import { Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import {
  Toggle,
  Select,
  Input,
  InputType,
  Label,
  LabelOptions,
  HorizontalLayout,
  HorizontalLayoutOptions,
} from "flow-connect/ui";

export class Distorter extends Node {
  amountInput: Input;
  oversampleSelect: Select;
  bypassToggle: Toggle;

  distorter: WaveShaperNode;
  inGain: GainNode;
  outGain: GainNode;
  oversampleOptions = ["none", "2x", "4x"];

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState = { oversample: "none", amount: 50, bypass: false };

  constructor() {
    super();
  }

  protected setupIO(_options: DistorterOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: DistorterOptions): void {
    const { width = 200, name = "Distorter", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...Distorter.DefaultState, ...state };
    this.style = { ...DefaultDistorterStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.distorter = this.audioCtx.createWaveShaper();
    this.distorter.oversample = "none";
    this.distorter.curve = this.makeDistortionCurve(400);

    this.inputs[0].ref = this.inGain;
    this.outputs[0].ref = this.outGain;

    this.setBypass();
    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  makeDistortionCurve(amount: number) {
    let k = typeof amount === "number" ? amount : 50,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for (; i < n_samples; ++i) {
      x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
  setBypass() {
    if (!this.state.bypass) {
      this.inGain.disconnect();
      this.inGain.connect(this.distorter);
      this.distorter.connect(this.outGain);
    } else {
      this.distorter.disconnect();
      this.inGain.disconnect();
      this.inGain.connect(this.outGain);
    }
  }

  setupUI() {
    this.amountInput = this.createUI("core/input", {
      propName: "amount",
      height: 20,
      style: { grow: 1, type: InputType.Number, precision: 0 },
    });
    this.oversampleSelect = this.createUI("core/select", {
      values: this.oversampleOptions,
      height: 15,
      propName: "oversample",
      style: { grow: 1 },
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.15 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Amount" }), this.amountInput],
        style: { spacing: 10 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Oversample" }), this.oversampleSelect],
        style: { spacing: 10 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI<Label, LabelOptions>("core/label", { text: "Bypass ?", style: { grow: 0.3 } }),
          this.bypassToggle,
        ],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("oversample", (_oldVal, newVal) => {
      if (!this.oversampleOptions.includes(newVal)) this.state.oversample = "none";
      this.distorter.oversample = this.state.oversample;
    });
    this.watch("amount", (_oldVal, newVal) => {
      if (newVal < 0 || newVal > 1000) this.state.amount = clamp(parseInt(newVal), 0, 1000);
      this.distorter.curve = this.makeDistortionCurve(parseInt(this.state.amount));
    });
    this.watch("bypass", this.setBypass.bind(this));

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface DistorterOptions extends NodeOptions {}

export interface DistorterStyle extends NodeStyle {}

const DefaultDistorterStyle = (): DistorterStyle => ({
  rowHeight: 10,
  spacing: 10,
});
