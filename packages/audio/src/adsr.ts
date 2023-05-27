import { Flow, Vector, Node, NodeOptions, TerminalType, NodeStyle } from "flow-connect/core";
import { clamp, denormalize } from "flow-connect/utils";
import {
  Envelope,
  EnvelopeOptions,
  HorizontalLayout,
  HorizontalLayoutOptions,
  Input,
  InputOptions,
  InputType,
  Label,
  LabelOptions,
} from "flow-connect/ui";

export class ADSR extends Node {
  envelopeInput: Envelope;
  minInput: Input;
  maxInput: Input;
  aInput: Input;
  dInput: Input;
  sInput: Input;
  rInput: Input;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  proxyParamNode: AudioWorkletNode;
  proxyParam: AudioParam;

  private static DefaultState = {
    min: 0,
    max: 1,
    a: 0.4,
    d: 0.2,
    s: 0.6,
    r: 0.4,
    trigger: false,
  };

  constructor(_flow: Flow, _options: ADSRNodeOptions) {
    super();
  }

  protected setupIO(_options: ADSRNodeOptions): void {
    this.addTerminal({
      name: "trigger",
      type: TerminalType.IN,
      dataType: "event",
    });
    this.addTerminal({
      name: "out",
      type: TerminalType.OUT,
      dataType: "audio",
    });
  }

  protected created(options: ADSRNodeOptions): void {
    const { state = {}, style = {}, name = "ADSR", width = 240 } = options;

    this.name = name;
    this.width = width;
    this.state = { ...ADSR.DefaultState, ...state };
    this.style = { ...DefaultADSRNodeStyle(), ...style };

    this.proxyParamNode = new AudioWorkletNode(this.audioCtx, "proxy-param", {
      numberOfOutputs: 1,
      parameterData: { param: 0 },
    });
    this.proxyParam = (this.proxyParamNode.parameters as Map<string, AudioParam>).get("param");
    this.outputs[0].ref = this.proxyParamNode;

    this.setMinMax();
    this.state.s = clamp(this.state.s, 0, 1);
    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  setMinMax() {
    this.proxyParamNode.port.postMessage({
      type: "set-range",
      value: { min: this.state.min, max: this.state.max },
    });
  }
  setupUI() {
    let { a: atck, d: dcay, r: rlse } = this.state;
    let duration = atck + dcay + rlse;

    this.envelopeInput = this.createUI<Envelope, EnvelopeOptions>("core/envelope", {
      height: 145,
      values: [
        Vector.Zero(),
        Vector.create(atck / duration, 1),
        Vector.create((atck + dcay) / duration, this.state.s),
        Vector.create(1, 0),
      ],
      style: { pointColor: "#fcba03" },
    });
    this.envelopeInput.disabled = true;

    this.minInput = this.createUI<Input, InputOptions>("core/input", {
      propName: "min",
      height: 20,
      style: { type: InputType.Number, grow: 0.5, step: "any" },
    });
    this.maxInput = this.createUI<Input, InputOptions>("core/input", {
      propName: "max",
      height: 20,
      style: { type: InputType.Number, grow: 0.5, step: "any" },
    });
    this.aInput = this.createUI<Input, InputOptions>("core/input", {
      propName: "a",
      height: 20,
      style: { type: InputType.Number, grow: 0.5, step: "any", precision: 3 },
    });
    this.dInput = this.createUI<Input, InputOptions>("core/input", {
      propName: "d",
      height: 20,
      style: { type: InputType.Number, grow: 0.5, step: "any", precision: 3 },
    });
    this.sInput = this.createUI<Input, InputOptions>("core/input", {
      propName: "s",
      height: 20,
      style: { type: InputType.Number, grow: 0.5, step: "any", precision: 3 },
    });
    this.rInput = this.createUI<Input, InputOptions>("core/input", {
      propName: "r",
      height: 20,
      style: { type: InputType.Number, grow: 0.5, step: "any", precision: 3 },
    });

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
          this.createUI<Label, LabelOptions>("core/label", { text: "A" }),
          this.aInput,
          this.createUI<Label, LabelOptions>("core/label", { text: "D" }),
          this.dInput,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI<Label, LabelOptions>("core/label", { text: "S" }),
          this.sInput,
          this.createUI<Label, LabelOptions>("core/label", { text: "R" }),
          this.rInput,
        ],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.minInput.on("blur", this.setMinMax);
    this.maxInput.on("blur", this.setMinMax);
    this.aInput.on("blur", () => this.adsrChanged());
    this.dInput.on("blur", () => this.adsrChanged());
    this.sInput.on("blur", () => this.adsrChanged());
    this.rInput.on("blur", () => this.adsrChanged());

    this.inputs[0].on("event", () => {
      this.state.trigger = !this.state.trigger;
      let currTime = this.audioCtx.currentTime;
      const { a, d, s, r } = this.state;
      if (this.state.trigger) {
        this.attack(a, d, s, currTime);
      } else {
        this.release(r, currTime);
      }
    });

    // WebAudio connections
    this.outputs[0].on("connect", (_inst, connector) => {
      if (connector.end.ref instanceof AudioParam) {
        // Need to do this else the value provided by the worklet node as param value is getting offset instead of overwrite
        let offset = Math.max(0, connector.end.ref.minValue);
        connector.end.ref.value = offset;
        if (offset !== 0) {
          this.proxyParamNode.port.postMessage({
            type: "set-offset",
            value: offset,
          });
        }
      }
      this.outputs[0].ref.connect(connector.end.ref);
    });
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => {
      this.stopAutomation();
      this.outputs[0].ref.disconnect(end.ref);
    });
  }

  attack(a: number, d: number, s: number, currTime: number) {
    this.proxyParam.cancelScheduledValues(0);
    this.proxyParam.setValueAtTime(this.state.min, currTime);
    this.proxyParam.linearRampToValueAtTime(1 * this.state.max, currTime + a);
    this.proxyParam.linearRampToValueAtTime(denormalize(s, this.state.min, this.state.max), currTime + a + d);
  }
  release(r: number, currTime: number) {
    this.proxyParam.cancelScheduledValues(0);
    this.proxyParam.setValueAtTime(this.proxyParam.value, currTime);
    this.proxyParam.linearRampToValueAtTime(this.state.min, currTime + r);
  }

  adsrChanged() {
    this.state.s = clamp(this.state.s, 0, 1);
    const { a, d, r } = this.state;
    const totalDur = a + d + r;

    this.envelopeInput.value = [
      Vector.Zero(),
      Vector.create(a / totalDur, 1),
      Vector.create((a + d) / totalDur, this.state.s),
      Vector.create(1, 0),
    ];
  }
  stopAutomation() {
    this.proxyParam.cancelScheduledValues(this.audioCtx.currentTime);
  }
}

export interface ADSRNodeOptions extends NodeOptions {}

export interface ADSRNodeStyle extends NodeStyle {}

const DefaultADSRNodeStyle = (): NodeStyle => ({
  rowHeight: 10,
  spacing: 15,
});
