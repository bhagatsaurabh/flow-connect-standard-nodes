import { Align, DisplayOptions, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect";
import { Flow, Node, Color, NodeOptions, TerminalType, NodeStyle } from "flow-connect/core";
import { clamp, denormalize, normalize } from "flow-connect/utils";
import { Slider, CanvasType, Display, Label, Select } from "flow-connect/ui";

export class SpectrogramAnalyser extends Node {
  colorScaleSelect: Select;
  fftSizeSlider: Slider;
  fftSizeLabel: Label;
  display: Display;

  analyser: AnalyserNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState = { fftSize: 11, colorScale: "Heated Metal" };

  colorScales = ["Heated Metal", "Monochrome", "Inverted Monochrome", "Spectrum"];
  fftSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
  timerId: number;

  colorScaleToInterp: Record<string, Function> = {};
  currInterpolator: Function;

  constructor(_flow: Flow, _options: SpectrogramAnalyserOptions) {
    super();
  }

  protected setupIO(_options: SpectrogramAnalyserOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: SpectrogramAnalyserOptions): void {
    const { width = 350, name = "Spectrogram Analyser", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...SpectrogramAnalyser.DefaultState, ...state };
    this.style = { ...DefaultSpectrogramAnalyserStyle(), ...style };

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = this.getFFTSize();
    this.inputs[0].ref = this.outputs[0].ref = this.analyser;

    this.setupUI();
    this.setupListeners();
  }

  protected process(_inputs: any[]): void {}

  getFFTSize() {
    return this.fftSizes[clamp(Math.round(this.state.fftSize), 5, 15) - 5];
  }
  setupUI() {
    this.fftSizeSlider = this.createUI("core/slider", {
      min: 5,
      max: 15,
      height: 10,
      propName: "fftSize",
      style: { grow: 0.6, precision: 0 },
    });
    this.fftSizeLabel = this.createUI("core/label", {
      text: this.getFFTSize(),
      height: 20,
      style: { grow: 0.2, align: Align.Right },
    });
    this.display = this.createUI<Display, DisplayOptions>("core/display", {
      height: 200,
      customRenderers: [
        {
          auto: true,
          canvasType: CanvasType.HTMLCanvasElement,
          renderer: (context, width, height) => this.customRenderer(context, width, height),
        },
      ],
    });
    this.colorScaleSelect = this.createUI("core/select", {
      values: this.colorScales,
      propName: "colorScale",
      height: 15,
      style: { grow: 0.6 },
    });

    this.ui.append([
      this.display,
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "FFT Size", style: { grow: 0.2 } }),
          this.fftSizeSlider,
          this.fftSizeLabel,
        ],
        style: { spacing: 5 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Color Scale", style: { grow: 0.2 } }), this.colorScaleSelect],
        style: { spacing: 5 },
      }),
    ]);
  }
  customRenderer(
    context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    width: number,
    height: number
  ): boolean {
    let value,
      i = 0,
      frequencyBinCount = this.analyser.frequencyBinCount,
      frequencyData = new Uint8Array(frequencyBinCount),
      barHeight = height / frequencyBinCount;

    this.analyser.getByteFrequencyData(frequencyData);

    for (; i < frequencyBinCount; i++) {
      value = frequencyData[i];
      context.fillStyle = this.currInterpolator(value / 256);
      context.fillRect(width - 1, denormalize(1 - normalize(i, 0, frequencyBinCount), 0, height), 1, barHeight);
    }

    context.globalCompositeOperation = "copy";
    context.drawImage(context.canvas, -1, 0);
    context.globalCompositeOperation = "source-over";

    return true;
  }
  setupListeners() {
    this.watch("fftSize", (_oldVal, newVal) => {
      if (newVal < 5 || newVal > 15) this.state.fftSize = clamp(Math.round(newVal), 5, 15);
      let actualFFTSize = this.getFFTSize();
      this.fftSizeLabel.text = actualFFTSize;
      this.analyser.fftSize = actualFFTSize;
    });
    this.watch("colorScale", (_oldVal, newVal) => {
      if (!this.colorScales.includes(newVal)) this.state.colorScale = this.colorScales[0];
      this.currInterpolator = this.colorScaleToInterp[this.state.colorScale];
    });

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));

    this.colorScaleToInterp["Heated Metal"] = Color.scale([
      [0, 0, 0, 1],
      [160, 32, 240, 1],
      [255, 0, 0, 1],
      [255, 165, 0, 1],
      [255, 255, 0, 1],
      [255, 255, 255, 1],
    ]);
    this.colorScaleToInterp["Monochrome"] = Color.scale([
      [0, 0, 0, 1],
      [255, 255, 255, 1],
    ]);
    this.colorScaleToInterp["Inverted Monochrome"] = Color.scale([
      [255, 255, 255, 1],
      [0, 0, 0, 1],
    ]);
    this.colorScaleToInterp["Spectrum"] = Color.scale([
      [135, 206, 235, 1],
      [0, 255, 0, 1],
      [255, 255, 0, 1],
      [255, 165, 0, 1],
      [255, 0, 0, 1],
    ]);

    this.currInterpolator = this.colorScaleToInterp["Heated Metal"];

    this.display.displayConfigs[0].shouldRender = false;
    this.flow.flowConnect.on("start", () => {
      this.display.displayConfigs[0].shouldRender = true;
    });
    this.flow.flowConnect.on("stop", () => {
      this.display.displayConfigs[0].shouldRender = false;
    });
  }
}

export interface SpectrogramAnalyserOptions extends NodeOptions {}

export interface SpectrogramAnalyserStyle extends NodeStyle {}

const DefaultSpectrogramAnalyserStyle = (): SpectrogramAnalyserStyle => ({
  rowHeight: 10,
  spacing: 10,
});
