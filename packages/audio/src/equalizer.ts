import { Align, HorizontalLayout, HorizontalLayoutOptions, Label, LabelOptions, StackOptions } from "flow-connect";
import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp, isInRange } from "flow-connect/utils";
import { Toggle, VSlider, Stack, VSliderOptions } from "flow-connect/ui";

export class Equalizer extends Node {
  vSliders: VSlider[] = [];
  filters: BiquadFilterNode[] = [];
  bypassToggle: Toggle;
  inGain: GainNode;
  outGain: GainNode;

  frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  freqDisplay = ["32", "64", "125", "250", "500", "1K", "2K", "4K", "8K", "16K"];

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState = {
    eq1: 0,
    eq2: 0,
    eq3: 0,
    eq4: 0,
    eq5: 0,
    eq6: 0,
    eq7: 0,
    eq8: 0,
    eq9: 0,
    eq10: 0,
    bypass: false,
  };

  constructor(_flow: Flow, _options: EqualizerOptions) {
    super();
  }

  protected setupIO(_options: EqualizerOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: EqualizerOptions): void {
    const { width = 300, name = "Equalizer", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...Equalizer.DefaultState, ...state };
    this.style = { ...DefaultEqualizerStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.frequencies.forEach((freq, index) => {
      let filter = this.audioCtx.createBiquadFilter();
      filter.frequency.value = freq;
      if (index === 0) filter.type = "lowshelf";
      else if (index === 9) filter.type = "highshelf";
      else filter.type = "peaking";
      this.filters.push(filter);
    });
    for (let i = 1; i < 10; ++i) {
      this.filters[i - 1].connect(this.filters[i]);
    }

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
      this.inGain.connect(this.filters[0]);
      this.filters[9].connect(this.outGain);
    } else {
      this.inGain.disconnect();
      this.filters[9].disconnect();
      this.inGain.connect(this.outGain);
    }
  }
  setupUI() {
    let stacks: Stack[] = [];
    this.frequencies.forEach((_freq, index) => {
      const vSlider = this.createUI<VSlider, VSliderOptions>("core/v-slider", {
        min: -40,
        max: 40,
        height: 120,
        propName: `eq${index + 1}`,
      });
      this.vSliders.push(vSlider);
      const stack = this.createUI<Stack, StackOptions>("core/stack", {
        childs: [
          this.createUI("core/label", { text: this.freqDisplay[index], style: { align: Align.Center } }),
          vSlider,
          this.createUI("core/label", {
            text: this.state[`eq${index + 1}`],
            propName: `eq${index + 1}`,
            style: { align: Align.Center, precision: 0 },
          }),
        ],
        style: { grow: 0.1, spacing: 5 },
      });
      stacks.push(stack);
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", height: 10, style: { grow: 0.1 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: stacks,
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Bypass ?" }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("bypass", this.setBypass.bind(this));
    for (let i = 1; i <= 10; ++i) {
      this.watch(`eq${i}`, (_oldVal, newVal) => {
        if (!isInRange(newVal, -40, 40)) {
          this.state[`eq${i}`] = clamp(newVal, -40, 40);
        }
        this.filters[i - 1].gain.value = this.state[`eq${i}`];
      });
    }

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface EqualizerOptions extends NodeOptions {}

export interface EqualizerStyle extends NodeStyle {}

const DefaultEqualizerStyle = (): EqualizerStyle => ({
  rowHeight: 10,
  spacing: 10,
});
