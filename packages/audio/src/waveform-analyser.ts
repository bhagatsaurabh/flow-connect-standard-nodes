import { Align, DisplayOptions, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect";
import { Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { Display, Label, Slider } from "flow-connect/ui";

export class WaveformAnalyser extends Node {
  fftSizeSlider: Slider;
  fftSizeLabel: Label;
  display: Display;

  analyser: AnalyserNode;

  private static DefaultState = { fftSize: 11 };

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  fftSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

  constructor() {
    super();
  }

  protected setupIO(_options: WaveformAnalyserOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: WaveformAnalyserOptions): void {
    const { width = 350, name = "Waveform Analyser", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...WaveformAnalyser.DefaultState, ...state };
    this.style = { ...DefaultWaveformAnalyserStyle(), ...style };

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
          clear: true,
          renderer: (...args) => this.customRenderer(args[0], args[1], args[2]),
        },
      ],
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
    ]);
  }
  customRenderer(
    context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    width: number,
    height: number
  ): boolean {
    let value,
      percent,
      offset,
      barWidth,
      frequencyBinCount = this.analyser.frequencyBinCount,
      waveformData = new Uint8Array(frequencyBinCount),
      orgHeight = height,
      i = 1;

    this.analyser.getByteTimeDomainData(waveformData);

    value = waveformData[0];
    percent = value / 256;
    height = orgHeight * percent;
    offset = orgHeight - height - 1;
    barWidth = width / frequencyBinCount;

    context.strokeStyle = (this.style as WaveformAnalyserStyle).waveColor ?? "#000";
    context.beginPath();
    context.moveTo(0, offset);
    for (; i < frequencyBinCount; i++) {
      value = waveformData[i];
      percent = value / 256;
      height = orgHeight * percent;
      offset = orgHeight - height - 1;
      barWidth = width / frequencyBinCount;
      context.lineTo(i * barWidth, offset);
    }
    context.stroke();

    return true;
  }
  setupListeners() {
    this.watch("fftSize", () => {
      const actualFFTSize = this.getFFTSize();
      this.fftSizeLabel.text = actualFFTSize;
      this.analyser.fftSize = actualFFTSize;
    });

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface WaveformAnalyserOptions extends NodeOptions {}

export interface WaveformAnalyserStyle extends NodeStyle {
  waveColor?: string;
}

const DefaultWaveformAnalyserStyle = (): WaveformAnalyserStyle => ({
  rowHeight: 10,
  spacing: 10,
  waveColor: "#000",
});
