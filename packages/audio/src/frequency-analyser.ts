import { Align, DisplayOptions, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect";
import { Flow, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { clamp } from "flow-connect/utils";
import { Slider, Display, Label, LabelOptions, UIEvent } from "flow-connect/ui";

export class FrequencyAnalyser extends Node {
  freqLabel: Label;
  fftSizeSlider: Slider;
  fftSizeLabel: Label;
  display: Display;

  analyser: AnalyserNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState = { fftSize: 11, currFreq: 0 };

  fftSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

  constructor(_flow: Flow, _options: FrequencyAnalyserOptions) {
    super();
  }

  protected setupIO(_options: FrequencyAnalyserOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "in", dataType: "audio" },
      { type: TerminalType.OUT, name: "out", dataType: "audio" },
    ]);
  }

  protected created(options: FrequencyAnalyserOptions): void {
    const { width = 350, name = "Frequency Analyser", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...FrequencyAnalyser.DefaultState, ...state };
    this.style = { ...DefaultFrequencyAnalyserStyle(), ...style };

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
    this.freqLabel = this.createUI<Label, LabelOptions>("core/label", { text: "Frequency:" });
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
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.freqLabel,
          this.createUI("core/label", {
            text: this.state.currFreq,
            propName: "currFreq",
            style: { precision: 0, grow: 1 },
          }),
        ],
        style: { spacing: 5 },
      }),
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
      hue,
      i = 0,
      frequencyBinCount = this.analyser.frequencyBinCount,
      frequencyData = new Uint8Array(frequencyBinCount),
      orgHeight = height,
      barWidth = width / frequencyBinCount;

    this.analyser.getByteFrequencyData(frequencyData);

    for (; i < frequencyBinCount; i++) {
      value = frequencyData[i];
      percent = value / 256;
      height = orgHeight * percent;
      offset = orgHeight - height - 1;
      hue = (i / frequencyBinCount) * 360;
      context.fillStyle = "hsl(" + hue + ", 100%, 50%)";
      context.fillRect(i * barWidth, offset, barWidth, height);
    }

    return true;
  }
  setupListeners() {
    this.watch("fftSize", (_oldVal, newVal) => {
      if (newVal < 5 || newVal > 15) this.state.fftSize = clamp(Math.round(newVal), 5, 15);
      let actualFFTSize = this.getFFTSize();
      this.fftSizeLabel.text = actualFFTSize;
      this.analyser.fftSize = actualFFTSize;
    });
    this.display.on("over", (event: UIEvent) => {
      this.state.currFreq =
        (Math.floor(
          (event.screenPos.subtract(this.display.position.transform(this.flow.flowConnect.transform)).x /
            this.display.displayConfigs[0].canvas.width) *
            this.analyser.frequencyBinCount
        ) *
          this.audioCtx.sampleRate) /
        (this.analyser.frequencyBinCount * 2);
    });
    this.display.on("exit", () => (this.state.currFreq = 0));

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface FrequencyAnalyserOptions extends NodeOptions {}

export interface FrequencyAnalyserStyle extends NodeStyle {}

const DefaultFrequencyAnalyserStyle = (): FrequencyAnalyserStyle => ({
  rowHeight: 10,
  spacing: 10,
});
