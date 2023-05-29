import { Flow, Node, NodeOptions, TerminalType, NodeStyle } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { HorizontalLayout, HorizontalLayoutOptions, InputType, Slider, Toggle } from "flow-connect/ui";

export class MoogEffect extends Node {
  cutoffSlider: Slider;
  resonanceSlider: Slider;
  bypassToggle: Toggle;

  inGain: GainNode;
  outGain: GainNode;
  moog: AudioWorkletNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState = { cutoff: 0.065, resonance: 3.5, bypass: false };

  constructor() {
    super();
  }

  protected setupIO(_options: MoogOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: MoogOptions): void {
    const { width = 230, name = "Moog Effect", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...MoogEffect.DefaultState, ...state };
    this.style = { ...DefaultMoogStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.inputs[0].ref = this.inGain;
    this.outputs[0].ref = this.outGain;

    this.moog = new AudioWorkletNode(this.audioCtx, "moog-effect", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      processorOptions: { bufferSize: 4096 },
    });

    this.setBypass();
    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  paramsChanged() {
    this.moog.port.postMessage({
      cutoff: clamp(this.state.cutoff, 0.0001, 1.0),
      resonance: clamp(this.state.resonance, 0, 4.0),
    });
  }
  setBypass() {
    if (this.state.bypass) {
      this.moog.disconnect();
      this.inGain.disconnect();
      this.inGain.connect(this.outGain);
    } else {
      this.inGain.disconnect();
      this.inGain.connect(this.moog);
      this.moog.connect(this.outGain);
    }
  }
  setupUI() {
    this.cutoffSlider = this.createUI("core/slider", {
      min: 0.0001,
      max: 1.0,
      height: 10,
      propName: "cutoff",
      style: { grow: 0.5 },
    });
    this.resonanceSlider = this.createUI("core/slider", {
      min: 0,
      max: 4.0,
      height: 10,
      propName: "resonance",
      style: { grow: 0.5 },
    });
    let cutoffInput = this.createUI("core/input", {
      propName: "cutoff",
      height: 20,
      style: { type: InputType.Number, grow: 0.2, precision: 2 },
    });
    let resonanceInput = this.createUI("core/input", {
      propName: "resonance",
      height: 20,
      style: { type: InputType.Number, grow: 0.4, precision: 2 },
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.1 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Cutoff", style: { grow: 0.3 } }), this.cutoffSlider, cutoffInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Resonance", style: { grow: 0.3 } }),
          this.resonanceSlider,
          resonanceInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("bypass", () => this.setBypass());
    this.watch("cutoff", () => this.paramsChanged());
    this.watch("resonance", () => this.paramsChanged());

    this.flow.on("start", () => this.paramsChanged());

    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface MoogOptions extends NodeOptions {}

export interface MoogStyle extends NodeStyle {}

const DefaultMoogStyle = (): MoogStyle => ({
  rowHeight: 10,
  spacing: 10,
});
