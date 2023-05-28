import { Node, NodeOptions, TerminalType, NodeStyle } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { InputType, Input, Slider, Toggle, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class TremoloEffect extends Node {
  intensitySlider: Slider;
  intensityInput: Input;
  stereoPhaseSlider: Slider;
  stereoPhaseInput: Input;
  rateSlider: Slider;
  rateInput: Input;
  bypassToggle: Toggle;
  tremolo: any;

  private static DefaultState = { intensity: 0.3, stereoPhase: 0, rate: 5, bypass: false };

  constructor() {
    super();
  }

  protected setupIO(_options: TremoloOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: TremoloOptions): void {
    const { width = 230, name = "Tremolo Effect", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...TremoloEffect.DefaultState, ...state };
    this.style = { ...DefaultTremoloStyle(), ...style };

    this.tremolo = new (window as any).__tuna__.Tremolo();
    this.inputs[0].ref = this.outputs[0].ref = this.tremolo;

    Object.assign(this.tremolo, {
      intensity: this.state.intensity,
      stereoPhase: this.state.stereoPhase,
      rate: this.state.rate,
    });

    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setupUI() {
    this.intensitySlider = this.createUI("core/slider", {
      min: 0,
      max: 1,
      height: 10,
      propName: "intensity",
      style: { grow: 0.5 },
    });
    this.intensityInput = this.createUI("core/input", {
      propName: "intensity",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 4 },
    });
    this.stereoPhaseSlider = this.createUI("core/slider", {
      min: 0,
      max: 180,
      height: 10,
      propName: "stereoPhase",
      style: { grow: 0.5 },
    });
    this.stereoPhaseInput = this.createUI("core/input", {
      propName: "stereoPhase",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    this.rateSlider = this.createUI("core/slider", {
      min: 0.1,
      max: 11,
      height: 10,
      propName: "rate",
      style: { grow: 0.5 },
    });
    this.rateInput = this.createUI("core/input", {
      propName: "rate",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.1 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Intensity", style: { grow: 0.3 } }),
          this.intensitySlider,
          this.intensityInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Stereo Phase", style: { grow: 0.3 } }),
          this.stereoPhaseSlider,
          this.stereoPhaseInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Rate", style: { grow: 0.3 } }), this.rateSlider, this.rateInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("intensity", (_oldVal, newVal) => {
      if (newVal < 0 || newVal > 1) this.state.intensity = clamp(newVal, 0, 1);
      this.tremolo.intensity = this.state.intensity;
    });
    this.watch("stereoPhase", (_oldVal, newVal) => {
      if (newVal < 0 || newVal > 180) this.state.stereoPhase = clamp(newVal, 0, 180);
      this.tremolo.stereoPhase = this.state.stereoPhase;
    });
    this.watch("rate", (_oldVal, newVal) => {
      if (newVal < 0.1 || newVal > 11) this.state.rate = clamp(newVal, 0.1, 11);
      this.tremolo.rate = this.state.rate;
    });
    this.watch("bypass", (_oldVal, newVal) => (this.tremolo.bypass = newVal));

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface TremoloOptions extends NodeOptions {}

export interface TremoloStyle extends NodeStyle {}

const DefaultTremoloStyle = (): TremoloStyle => ({
  rowHeight: 10,
  spacing: 10,
});
