import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import {
  InputType,
  Input,
  Slider,
  Toggle,
  Label,
  LabelOptions,
  HorizontalLayout,
  HorizontalLayoutOptions,
} from "flow-connect/ui";

export class BitcrusherEffect extends Node {
  bitsSlider: Slider;
  bitsInput: Input;
  normFreqSlider: Slider;
  normFreqInput: Input;
  bypassToggle: Toggle;

  inGain: GainNode;
  outGain: GainNode;
  bitcrusher: AudioWorkletNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState = { bits: 4, normFreq: 0.1, bypass: false };

  constructor(_flow: Flow, _options: BitcrusherOptions) {
    super();
  }

  protected setupIO(_options: BitcrusherOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: BitcrusherOptions): void {
    const { width = 230, name = "Bitcrusher Effect", state = {}, style = {} } = options;

    this.name = name;
    this.width = width;
    this.state = { ...BitcrusherEffect.DefaultState, ...state };
    this.style = { ...DefaultBitcrusherStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.inputs[0].ref = this.inGain;
    this.outputs[0].ref = this.outGain;

    this.bitcrusher = new AudioWorkletNode(this.audioCtx, "bitcrusher-effect", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      processorOptions: { bufferSize: 4096 },
    });

    this.setBypass();
    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setBypass() {
    if (!this.state.bypass) {
      this.inGain.disconnect();
      this.inGain.connect(this.bitcrusher);
      this.bitcrusher.connect(this.outGain);
    } else {
      this.bitcrusher.disconnect();
      this.inGain.disconnect();
      this.inGain.connect(this.outGain);
    }
  }
  paramsChanged() {
    this.bitcrusher.port.postMessage({ bits: this.state.bits, normFreq: this.state.normFreq });
  }
  setupUI() {
    this.bitsSlider = this.createUI("core/slider", {
      min: 1,
      max: 16,
      height: 10,
      propName: "bits",
      style: { grow: 0.5 },
    });
    this.normFreqSlider = this.createUI("core/slider", {
      min: 0,
      max: 1,
      height: 10,
      propName: "normFreq",
      style: { grow: 0.5 },
    });
    this.bitsInput = this.createUI("core/input", {
      propName: "bits",
      height: 20,
      style: { type: InputType.Number, grow: 0.2 },
    });
    this.normFreqInput = this.createUI("core/input", {
      propName: "normFreq",
      height: 20,
      style: { type: InputType.Number, grow: 0.4, precision: 2 },
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.1 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI<Label, LabelOptions>("core/label", { text: "Bits", style: { grow: 0.3 } }),
          this.bitsSlider,
          this.bitsInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI<Label, LabelOptions>("core/label", { text: "Norm Freq.", style: { grow: 0.3 } }),
          this.normFreqSlider,
          this.normFreqInput,
        ],
        style: { spacing: 5 },
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
    this.bitsSlider.on("change", () => this.paramsChanged());
    this.normFreqSlider.on("change", () => this.paramsChanged());
    this.bitsInput.on("change", () => this.paramsChanged());
    this.normFreqInput.on("change", () => this.paramsChanged());
    this.watch("bypass", () => this.setBypass());
    this.watch("bits", () => {
      if (this.state.bits < 1 || this.state.bits > 16 || !Number.isInteger(this.state.bits)) {
        this.state.bits = clamp(Math.floor(this.state.bits), 1, 16);
      }
    });
    this.watch("normFreq", () => {
      if (this.state.normFreq < 0 || this.state.normFreq > 1) this.state.normFreq = clamp(this.state.normFreq, 0, 1);
    });

    this.flow.flowConnect.on("start", () => this.paramsChanged());

    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface BitcrusherOptions extends NodeOptions {}

export interface BitcrusherStyle extends NodeStyle {}

const DefaultBitcrusherStyle = (): BitcrusherStyle => ({
  rowHeight: 10,
  spacing: 10,
});
