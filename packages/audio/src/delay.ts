import { Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { HorizontalLayout, HorizontalLayoutOptions, InputType, Slider } from "flow-connect/ui";

export class DelayEffect extends Node {
  delaySlider: Slider;
  feedbackSlider: Slider;
  cutoffSlider: Slider;
  drySlider: Slider;
  wetSlider: Slider;

  inGain: GainNode;
  outGain: GainNode;
  dryGain: GainNode;
  wetGain: GainNode;
  filter: BiquadFilterNode;
  delay: DelayNode;
  feedbackNode: GainNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState = { feedback: 0.45, cutoff: 20000, wet: 0.5, dry: 1, delayTime: 100, bypass: false };

  constructor() {
    super();
  }

  protected setupIO(_options: DelayOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: DelayOptions): void {
    const { width = 230, name = "Delay", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...DelayEffect.DefaultState, ...state };
    this.style = { ...DefaultDelayStyle(), ...style };

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.dryGain = this.audioCtx.createGain();
    this.wetGain = this.audioCtx.createGain();
    this.filter = this.audioCtx.createBiquadFilter();
    this.delay = this.audioCtx.createDelay(10);
    this.feedbackNode = this.audioCtx.createGain();
    this.state.filterType = "lowpass";

    this.setDelay();
    this.feedbackNode.gain.value = clamp(this.state.feedback, 0, 0.9);
    this.filter.frequency.value = clamp(this.state.cutoff, 20, 20000);
    this.wetGain.gain.value = clamp(this.state.wet, 0, 1);
    this.dryGain.gain.value = clamp(this.state.dry, 0, 1);

    this.inputs[0].ref = this.inGain;
    this.outputs[0].ref = this.outGain;

    this.delay.connect(this.filter);
    this.filter.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delay);
    this.feedbackNode.connect(this.wetGain);

    this.setBypass();
    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setBypass() {
    if (!this.state.bypass) {
      this.inGain.connect(this.delay);
      this.inGain.connect(this.dryGain);
      this.wetGain.connect(this.outGain);
      this.dryGain.connect(this.outGain);
    } else {
      this.inGain.disconnect();
      this.wetGain.disconnect();
      this.dryGain.disconnect();
      this.inGain.connect(this.outGain);
    }
  }
  setupUI() {
    let bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.1 } });
    this.delaySlider = this.createUI("core/slider", {
      min: 0,
      max: 10000,
      height: 10,
      propName: "delayTime",
      style: { grow: 0.5 },
    });
    let delayInput = this.createUI("core/input", {
      propName: "delayTime",
      height: 20,
      style: { type: InputType.Number, grow: 0.3, precision: 0 },
    });
    this.feedbackSlider = this.createUI("core/slider", {
      min: 0,
      max: 0.9,
      height: 10,
      propName: "feedback",
      style: { grow: 0.5 },
    });
    let feedbackInput = this.createUI("core/input", {
      propName: "feedback",
      height: 20,
      style: { type: InputType.Number, grow: 0.3, precision: 2 },
    });
    this.cutoffSlider = this.createUI("core/slider", {
      min: 20,
      max: 20000,
      height: 10,
      propName: "cutoff",
      style: { grow: 0.5 },
    });
    let cutoffInput = this.createUI("core/input", {
      propName: "cutoff",
      height: 20,
      style: { type: InputType.Number, grow: 0.3, precision: 0 },
    });
    this.wetSlider = this.createUI("core/slider", {
      min: 0,
      max: 1,
      height: 10,
      propName: "wet",
      style: { grow: 0.5 },
    });
    let wetInput = this.createUI("core/input", {
      propName: "wet",
      height: 20,
      style: { type: InputType.Number, grow: 0.3, precision: 2 },
    });
    this.drySlider = this.createUI("core/slider", {
      min: 0,
      max: 1,
      height: 10,
      propName: "dry",
      style: { grow: 0.5 },
    });
    let dryInput = this.createUI("core/input", {
      propName: "dry",
      height: 20,
      style: { type: InputType.Number, grow: 0.3, precision: 2 },
    });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Delay", style: { grow: 0.3 } }), this.delaySlider, delayInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Feedback", style: { grow: 0.3 } }),
          this.feedbackSlider,
          feedbackInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Cutoff", style: { grow: 0.3 } }), this.cutoffSlider, cutoffInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Wet", style: { grow: 0.3 } }), this.wetSlider, wetInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Dry", style: { grow: 0.3 } }), this.drySlider, dryInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setDelay() {
    this.delay.delayTime.value = clamp(this.state.delayTime, 10, 10000) / 1000;
  }
  setFeedback() {
    this.feedbackNode.gain.setTargetAtTime(clamp(this.state.feedback, 0, 0.9), this.audioCtx.currentTime, 0.01);
  }
  setCutOff() {
    this.filter.frequency.setTargetAtTime(clamp(this.state.cutoff, 20, 20000), this.audioCtx.currentTime, 0.01);
  }
  setWet() {
    this.wetGain.gain.setTargetAtTime(clamp(this.state.wet, 0, 1), this.audioCtx.currentTime, 0.01);
  }
  setDry() {
    this.dryGain.gain.setTargetAtTime(clamp(this.state.dry, 0, 1), this.audioCtx.currentTime, 0.01);
  }
  setupListeners() {
    this.watch("delayTime", () => this.setDelay());
    this.watch("feedback", () => this.setFeedback());
    this.watch("cutoff", () => this.setCutOff());
    this.watch("wet", () => this.setWet());
    this.watch("dry", () => this.setDry());
    this.watch("bypass", () => this.setBypass());

    this.outputs[0].on("connect", (_, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface DelayOptions extends NodeOptions {}

export interface DelayStyle extends NodeStyle {}

const DefaultDelayStyle = (): DelayStyle => ({
  rowHeight: 10,
  spacing: 10,
});
