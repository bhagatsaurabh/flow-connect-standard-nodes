import { Flow, Vector, Node, NodeOptions, TerminalType, NodeStyle } from "flow-connect/core";
import { clamp, denormalize } from "flow-connect/utils";
import { Toggle, Slider2D, Slider, Input, InputType, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class SpatialPanner extends Node {
  panSlider2D: Slider2D;
  zSlider: Slider;
  zInput: Input;
  bypassToggle: Toggle;

  panner: PannerNode;
  inGain: GainNode;
  outGain: GainNode;

  posX: number;
  posY: number;
  posZ: number;
  orientationX: number = 0.0;
  orientationY: number = 0.0;
  orientationZ: number = -1.0;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  private static DefaultState = { value: Vector.create(0.5, 0.5), z: -1, bypass: false };

  constructor() {
    super();
  }

  protected setupIO(_options: SpatialPannerOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: SpatialPannerOptions): void {
    const { width = 200, name = "3D Spatial Panner", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...SpatialPanner.DefaultState, ...state };
    this.style = { ...DefaultSpatialPannerStyle(), ...style };

    this.posX = this.audioCtx.listener.positionX.value;
    this.posY = this.audioCtx.listener.positionY.value;
    this.posZ = -1;

    this.inGain = this.audioCtx.createGain();
    this.outGain = this.audioCtx.createGain();
    this.panner = new PannerNode(this.audioCtx, {
      panningModel: "HRTF",
      distanceModel: "linear",
      positionX: this.posX,
      positionY: this.posY,
      positionZ: this.posZ,
      orientationX: this.orientationX,
      orientationY: this.orientationY,
      orientationZ: this.orientationZ,
    });

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
    this.panSlider2D = this.createUI("core/2d-slider", {
      propName: "value",
      height: this.width - this.style.padding * 2,
    });
    this.zSlider = this.createUI("core/slider", {
      min: -10000,
      max: 10000,
      height: 10,
      propName: "z",
      style: { grow: 0.6 },
    });
    this.zInput = this.createUI("core/input", {
      propName: "z",
      height: 20,
      style: { type: InputType.Number, grow: 0.3, precision: 0 },
    });
    this.bypassToggle = this.createUI("core/toggle", { propName: "bypass", style: { grow: 0.15 } });
    this.ui.append([
      this.panSlider2D,
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Z", style: { grow: 0.1 } }), this.zSlider, this.zInput],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Bypass ?", style: { grow: 0.3 } }), this.bypassToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("value", (_oldVal, newVal) => {
      let x = denormalize(newVal.x, -1, 1);
      let y = denormalize(newVal.y, -1, 1);
      this.panner.positionX.value = x;
      this.panner.positionY.value = y;
    });
    this.watch("z", (_oldVal, newVal) => {
      this.panner.positionZ.value = clamp(parseInt(newVal), -10000, 10000);
    });
    this.watch("bypass", this.setBypass.bind(this));

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface SpatialPannerOptions extends NodeOptions {}

export interface SpatialPannerStyle extends NodeStyle {}

const DefaultSpatialPannerStyle = (): SpatialPannerStyle => ({
  rowHeight: 10,
  spacing: 10,
});
