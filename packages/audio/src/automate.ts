import { Node, NodeOptions, NodeStyle, TerminalType, Vector } from "flow-connect/core";
import { denormalize } from "flow-connect/utils";
import {
  InputType,
  Input,
  Envelope,
  Toggle,
  Label,
  LabelOptions,
  HorizontalLayout,
  HorizontalLayoutOptions,
} from "flow-connect/ui";

export class Automate extends Node {
  envelopeInput: Envelope;
  minInput: Input;
  maxInput: Input;
  durationInput: Input;
  autoToggle: Toggle;
  loopToggle: Toggle;

  proxyParamNode: AudioWorkletNode;
  proxyParam: AudioParam;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState = {
    min: 0,
    max: 1,
    value: 0.5,
    duration: 1,
    auto: true,
    loop: false,
    envelope: [Vector.create(0.2, 0.5), Vector.create(0.5, 0.8), Vector.create(0.9, 0.2)],
  };

  timerId: number;
  scheduleEndTime: number;
  finiteLoop = 2; // how much iterations to schedule in the future

  constructor() {
    super();
  }

  protected setupIO(_options: AutomateOptions): void {
    this.addTerminal({
      type: TerminalType.IN,
      name: "trigger",
      dataType: "event",
    });
    this.addTerminal({
      type: TerminalType.OUT,
      name: "out",
      dataType: "audio",
    });
  }

  protected created(options: AutomateOptions = DefaultAutomateOptions()): void {
    const {
      width = 280,
      state = {},
      style = {},
      name = "Automate",
      envelope = [Vector.create(0.2, 0.5), Vector.create(0.5, 0.8), Vector.create(0.9, 0.2)],
    } = options;

    this.width = width;
    this.name = name;
    this.state = { ...Automate.DefaultState, ...state };
    this.style = { ...DefaultAutomateStyle(), ...style };

    this.proxyParamNode = new AudioWorkletNode(this.audioCtx, "proxy-param", {
      numberOfOutputs: 1,
      parameterData: { param: this.state.value },
    });
    this.proxyParam = (this.proxyParamNode.parameters as Map<string, AudioParam>).get("param");
    this.setMinMax();
    this.outputs[0].ref = this.proxyParamNode;

    this.setupUI(envelope);
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setMinMax() {
    this.proxyParamNode.port.postMessage({ type: "set-range", value: { min: this.state.min, max: this.state.max } });
  }
  setupUI(envelope: Vector[]) {
    this.envelopeInput = this.createUI("core/envelope", {
      height: 145,
      values: envelope,
      input: true,
      output: true,
      propName: "envelope",
    });
    this.minInput = this.createUI("core/input", {
      propName: "min",
      height: 20,
      style: { type: InputType.Number, grow: 0.5, step: "any" },
    });
    this.maxInput = this.createUI("core/input", {
      propName: "max",
      height: 20,
      style: { type: InputType.Number, grow: 0.5, step: "any" },
    });
    this.durationInput = this.createUI("core/input", {
      propName: "duration",
      height: 20,
      style: { type: InputType.Number, step: "any", grow: 0.5 },
    });
    this.autoToggle = this.createUI("core/toggle", { propName: "auto" });
    this.loopToggle = this.createUI("core/toggle", { propName: "loop" });

    this.ui.append([
      this.envelopeInput,
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI<Label, LabelOptions>("core/label", { text: "Min" }),
          this.minInput,
          this.createUI<Label, LabelOptions>("core/label", { text: "Max" }),
          this.maxInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI<Label, LabelOptions>("core/label", { text: "Duration (seconds)", style: { grow: 0.5 } }),
          this.durationInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
            childs: [
              this.createUI<Label, LabelOptions>("core/label", { text: "Auto Start ?", height: 20 }),
              this.autoToggle,
            ],
            style: { spacing: 5, grow: 0.5 },
          }),
          this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
            childs: [this.createUI<Label, LabelOptions>("core/label", { text: "Loop ?", height: 20 }), this.loopToggle],
            style: { spacing: 5, grow: 0.5 },
          }),
        ],
      }),
    ]);
  }
  setupListeners() {
    this.watch("min", () => {
      this.setMinMax();
      this.startAutomation();
    });
    this.watch("max", () => {
      this.setMinMax();
      this.startAutomation();
    });
    this.watch("duration", () => this.startAutomation());
    this.watch("loop", () => this.startAutomation());
    this.watch("envelope", () => this.startAutomation());

    this.inputs[0].on("event", () => this.startAutomation());

    this.flow.on("start", () => this.state.auto && this.startAutomation());
    this.flow.on("stop", () => this.stopAutomation());

    this.outputs[0].on("connect", (_inst, connector) => {
      if (connector.end.ref instanceof AudioParam) {
        // Need to do this else the value provided by the worklet node as param value is getting offset instead of overwrite
        let offset = Math.max(0, connector.end.ref.minValue);
        connector.end.ref.value = offset;
        if (offset !== 0) {
          this.proxyParamNode.port.postMessage({ type: "set-offset", value: offset });
        }
      }
      this.outputs[0].ref.connect(connector.end.ref);
      this.startAutomation();
    });
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => {
      this.stopAutomation();
      this.outputs[0].ref.disconnect(end.ref);
    });
  }

  startAutomation() {
    // Stop any previously scheduled automations
    this.stopAutomation();

    // Convert normalized to actual values (x=time, y=param value)
    let values = this.envelopeInput.value;
    for (let currVal of values) {
      currVal.x = currVal.x * this.state.duration;
      currVal.y = denormalize(currVal.y, this.state.min, this.state.max);
    }

    let automateDuration = values[values.length - 1].x;
    if (this.state.loop) {
      // Schedule far in the future hoping that even if main thread blocks it recovers by the time scheduled automations are finished
      this.schedule(values, this.flow.flowConnect.audioContext.currentTime, this.finiteLoop);
      this.timerId = window.setInterval(() => {
        // If web audio clock reaches final iteration of scheduled automations, then reschedule another finiteLoop iterations
        if (this.flow.flowConnect.audioContext.currentTime > this.scheduleEndTime - automateDuration) {
          this.schedule(values, this.scheduleEndTime, this.finiteLoop);
        }
      }, 50);
    } else {
      this.schedule(values, this.flow.flowConnect.audioContext.currentTime, 1);
    }
  }
  stopAutomation() {
    this.proxyParam.cancelScheduledValues(this.flow.flowConnect.audioContext.currentTime);
    clearInterval(this.timerId);
  }
  schedule(values: Vector[], time: number, iterations: number) {
    for (let i = 0; i < iterations; i += 1) {
      values.forEach((value) => {
        this.proxyParam.linearRampToValueAtTime(value.y, time + value.x);
      });
    }
    this.scheduleEndTime = time + values[values.length - 1].x;
  }
}

export interface AutomateOptions extends NodeOptions {
  envelope: Vector[];
}

const DefaultAutomateOptions = (): AutomateOptions => ({
  name: "Automate",
  envelope: [Vector.create(0.2, 0.5), Vector.create(0.5, 0.8), Vector.create(0.9, 0.2)],
});

export interface AutomateStyle extends NodeStyle {}

const DefaultAutomateStyle = (): AutomateStyle => ({
  rowHeight: 10,
  spacing: 15,
});
