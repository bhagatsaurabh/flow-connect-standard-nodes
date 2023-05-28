import { Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { HorizontalLayout, HorizontalLayoutOptions, Select, Toggle } from "flow-connect/ui";

export class BiquadFilter extends Node {
  typeSelect: Select;
  bypassToggle: Toggle;

  inGain: GainNode;
  outGain: GainNode;
  biquadFilter: BiquadFilterNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState = { filterType: "lowpass", bypass: false };

  constructor() {
    super();
  }

  protected setupIO(_options: NodeOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.IN, name: "gain", dataType: "audioparam" },
      { type: TerminalType.IN, name: "Q", dataType: "audioparam" },
      { type: TerminalType.IN, name: "frequency", dataType: "audioparam" },
      { type: TerminalType.IN, name: "detune", dataType: "audioparam" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: BiquadFilterOptions): void {
    const { width = 230, name = "Biquad Filter", style = {}, state = {} } = options;

    this.name = name;
    this.width = width;
    this.state = { ...BiquadFilter.DefaultState, ...state };
    this.style = { ...DefaultBiquadFilterStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.inputs[0].ref = this.inGain;
    this.outputs[0].ref = this.outGain;

    this.biquadFilter = this.audioCtx.createBiquadFilter();
    this.biquadFilter.gain.value = 0;
    this.biquadFilter.Q.value = 1;
    this.biquadFilter.frequency.value = 800;
    this.biquadFilter.detune.value = 0;
    this.biquadFilter.type = this.state.filterType;

    this.inputs[1].ref = this.biquadFilter.gain;
    this.inputs[2].ref = this.biquadFilter.Q;
    this.inputs[3].ref = this.biquadFilter.frequency;
    this.inputs[4].ref = this.biquadFilter.detune;
    this.inputs[1].on("data", (_, data) => typeof data === "number" && (this.inputs[1].ref.value = data));
    this.inputs[2].on("data", (_, data) => typeof data === "number" && (this.inputs[2].ref.value = data));
    this.inputs[3].on("data", (_, data) => typeof data === "number" && (this.inputs[3].ref.value = data));
    this.inputs[4].on("data", (_, data) => typeof data === "number" && (this.inputs[4].ref.value = data));

    this.setBypass();
    this.setupUI();

    this.typeSelect.on("change", () => {
      this.biquadFilter.type = this.state.filterType;
    });
    this.watch("bypass", () => this.setBypass());

    this.handleAudioConnections();
  }

  protected process(_inputs: any[]): void {}

  setBypass() {
    if (!this.state.bypass) {
      this.inGain.disconnect();
      this.inGain.connect(this.biquadFilter);
      this.biquadFilter.connect(this.outGain);
    } else {
      this.biquadFilter.disconnect();
      this.inGain.disconnect();
      this.inGain.connect(this.outGain);
    }
  }
  setupUI() {
    this.typeSelect = this.createUI("core/select", {
      propName: "filterType",
      height: 15,
      style: { grow: 0.7 },
      values: ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass"],
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.1 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Type", style: { grow: 0.3 } }), this.typeSelect],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  handleAudioConnections() {
    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface BiquadFilterOptions extends NodeOptions {}

export interface BiquadFilterStyle extends NodeStyle {}

const DefaultBiquadFilterStyle = (): BiquadFilterStyle => ({
  rowHeight: 10,
  spacing: 10,
});
