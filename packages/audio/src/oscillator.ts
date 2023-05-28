import { Flow, Node, NodeOptions, TerminalType, NodeStyle } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import {
  InputType,
  Input,
  RadioGroup,
  Slider,
  HorizontalLayout,
  HorizontalLayoutOptions,
  RadioGroupOptions,
} from "flow-connect/ui";

export class Oscillator extends Node {
  freqSlider: Slider;
  freqInput: Input;
  freqHozLayout: HorizontalLayout;
  detuneSlider: Slider;
  detuneInput: Input;
  detuneHozLayout: HorizontalLayout;
  typeGroup: RadioGroup;

  oscillator: OscillatorNode;
  freqProxy: AudioWorkletNode;
  detuneProxy: AudioWorkletNode;
  outGain: GainNode;

  types = ["sine", "square", "sawtooth", "triangle"];

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState = { frequency: 440, detune: 0, type: "sine" };

  constructor() {
    super();
  }

  protected setupIO(_options: OscillatorOptions): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "out", dataType: "audio" }]);
  }

  protected created(options: OscillatorOptions): void {
    const { width = 250, name = "Oscillator", state = {}, style = {} } = options;

    this.name = name;
    this.width = width;
    this.state = { ...Oscillator.DefaultState, ...state };
    this.style = { ...DefaultOscillatorStyle(), ...style };

    this.freqProxy = new AudioWorkletNode(this.audioCtx, "proxy");
    this.detuneProxy = new AudioWorkletNode(this.audioCtx, "proxy");
    this.outGain = this.audioCtx.createGain();

    this.setupUI();

    this.inputsUI[0].ref = this.freqProxy;
    this.inputsUI[1].ref = this.detuneProxy;
    this.inputsUI[0].dataType = "audioparam";
    this.inputsUI[1].dataType = "audioparam";
    this.outputs[0].ref = this.outGain;

    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  startOscillator() {
    this.stopOscillator();
    this.oscillator = this.flow.flowConnect.audioContext.createOscillator();
    if (!this.inputsUI[0].isConnected()) this.oscillator.frequency.value = this.state.frequency;
    else {
      this.freqProxy.connect(this.oscillator.frequency);
      this.oscillator.frequency.value = 0;
    }
    if (!this.inputsUI[1].isConnected()) this.oscillator.detune.value = this.state.detune;
    else {
      this.detuneProxy.connect(this.oscillator.detune);
      this.oscillator.detune.value = 0;
    }

    this.oscillator.type = this.state.type;
    this.oscillator.connect(this.outGain);
    this.oscillator.start();
  }
  stopOscillator() {
    if (this.oscillator) {
      this.freqProxy.disconnect();
      this.detuneProxy.disconnect();
      this.oscillator.disconnect();
      this.oscillator.stop();
      this.oscillator = null;
    }
  }
  setupUI() {
    this.freqSlider = this.createUI("core/slider", {
      min: 0,
      max: 20000,
      height: 10,
      propName: "frequency",
      style: { grow: 0.5 },
      input: true,
    });
    this.freqInput = this.createUI("core/input", {
      propName: "frequency",
      height: 20,
      style: { type: InputType.Number, grow: 0.3, precision: 0 },
    });
    this.freqHozLayout = this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
      childs: [this.createUI("core/label", { text: "Freq.", style: { grow: 0.2 } }), this.freqSlider, this.freqInput],
      style: { spacing: 5 },
    });
    this.detuneSlider = this.createUI("core/slider", {
      min: -2400,
      max: 2400,
      height: 10,
      input: true,
      propName: "detune",
      style: { grow: 0.5 },
    });
    this.detuneInput = this.createUI("core/input", {
      propName: "detune",
      height: 20,
      style: { type: InputType.Number, grow: 0.3, precision: 0 },
    });
    this.detuneHozLayout = this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
      childs: [
        this.createUI("core/label", { text: "Detune", style: { grow: 0.2 } }),
        this.detuneSlider,
        this.detuneInput,
      ],
      style: { spacing: 5 },
    });
    this.typeGroup = this.createUI<RadioGroup, RadioGroupOptions>("core/radio-group", {
      values: this.types,
      selected: this.state.type,
      propName: "type",
      height: 20,
    });

    this.ui.append([this.freqHozLayout, this.detuneHozLayout, this.typeGroup]);
  }
  setupListeners() {
    this.inputsUI[0].on("data", (_inst, data) => typeof data === "number" && (this.state.frequency = data));
    this.inputsUI[1].on("data", (_inst, data) => typeof data === "number" && (this.state.detune = data));

    this.watch("frequency", (_oldVal, newVal) => {
      if (newVal < 0 || newVal > 20000) newVal = clamp(newVal, 0, 20000);
      if (!this.freqHozLayout.disabled) this.oscillator && (this.oscillator.frequency.value = newVal);
    });
    this.watch("detune", (_oldVal, newVal) => {
      if (!this.detuneHozLayout.disabled) this.oscillator && (this.oscillator.detune.value = newVal);
    });
    this.watch("type", (_oldVal, newVal) => {
      if (this.types.includes(newVal)) this.oscillator && (this.oscillator.type = newVal);
    });

    this.flow.on("start", () => this.startOscillator());
    this.flow.on("stop", () => this.stopOscillator());

    this.inputsUI[0].on("connect", () => {
      if (this.oscillator) {
        this.freqProxy.connect(this.oscillator.frequency);
        this.oscillator.frequency.value = 0;
      }
    });
    this.inputsUI[0].on("disconnect", () => {
      if (this.oscillator) {
        this.freqProxy.disconnect();
        this.oscillator.frequency.value = this.state.frequency;
      }
    });
    this.inputsUI[1].on("connect", () => {
      if (this.oscillator) {
        this.detuneProxy.connect(this.oscillator.detune);
        this.oscillator.detune.value = 0;
      }
    });
    this.inputsUI[1].on("disconnect", () => {
      if (this.oscillator) {
        this.detuneProxy.disconnect();
        this.oscillator.detune.value = this.state.detune;
      }
    });
    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface OscillatorOptions extends NodeOptions {}

export interface OscillatorStyle extends NodeStyle {}

const DefaultOscillatorStyle = (): OscillatorStyle => ({
  rowHeight: 10,
  spacing: 10,
});
