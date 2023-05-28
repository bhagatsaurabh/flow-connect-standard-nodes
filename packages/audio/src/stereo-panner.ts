import { Flow, Node, NodeOptions, TerminalType, NodeStyle } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { InputType, Input, Slider, Toggle, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class StereoPanner extends Node {
  panSlider: Slider;
  panInput: Input;
  bypassToggle: Toggle;
  panner: StereoPannerNode;
  inGain: GainNode;
  outGain: GainNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState = { pan: 0, bypass: false };

  constructor(_flow: Flow, _options: StereoPannerOptions) {
    super();
  }

  protected setupIO(_options: StereoPannerOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: StereoPannerOptions): void {
    const { width = 200, name = "Stereo Panner", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...StereoPanner.DefaultState, ...state };
    this.style = { ...DefaultStereoPannerStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.panner = new StereoPannerNode(this.audioCtx);
    this.panner.pan.value = this.state.pan;
    this.inputs[0].ref = this.inGain;
    this.outputs[0].ref = this.outGain;

    this.setBypass();
    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setBypass() {
    if (!this.state.bypass) {
      this.inGain.disconnect();
      this.inGain.connect(this.panner);
      this.panner.connect(this.outGain);
    } else {
      this.panner.disconnect();
      this.inGain.disconnect();
      this.inGain.connect(this.outGain);
    }
  }
  setupUI() {
    this.panSlider = this.createUI("core/slider", {
      min: -1,
      max: 1,
      height: 10,
      propName: "pan",
      style: { grow: 0.5 },
    });
    this.panInput = this.createUI("core/input", {
      propName: "pan",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.15 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Pan", style: { grow: 0.3 } }), this.panSlider, this.panInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("pan", (_oldVal, newVal) => {
      if (newVal < -1 || newVal > 1) this.state.pan = clamp(newVal, -1, 1);
      this.panner.pan.value = this.state.pan;
    });
    this.watch("bypass", this.setBypass.bind(this));

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface StereoPannerOptions extends NodeOptions {}

export interface StereoPannerStyle extends NodeStyle {}

const DefaultStereoPannerStyle = (): StereoPannerStyle => ({
  rowHeight: 10,
  spacing: 10,
});
