import { DataPersistenceProvider } from "flow-connect";
import { Vector, Node, NodeOptions, TerminalType, SerializedVector, SerializedNode } from "flow-connect/core";
import {
  Display,
  DisplayOptions,
  HorizontalLayout,
  HorizontalLayoutOptions,
  Toggle,
  UIEvent,
  UIWheelEvent,
} from "flow-connect/ui";

export class FunctionPlotter extends Node {
  displayHeight: number;
  display: Display;
  polarToggle: Toggle;
  plotStyle: PlotStyle = new Object();
  points: SerializedVector[] = [];

  static DefaultState: any = {
    polar: false,
    config: { gX: 3, gY: 3, xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 1.5 },
  };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.IN, name: "data", dataType: "any" }]);
  }

  protected created(options: FunctionPlotterOptions): void {
    const {
      width = 300,
      name = "Parametric Plotter",
      style = {},
      state = {},
      displayHeight = 200,
      plotStyle,
    } = options;

    this.plotStyle = plotStyle;
    this.displayHeight = displayHeight;
    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...FunctionPlotter.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process(inputs: any[]) {
    if (!inputs[0]) return;
    if (Array.isArray(inputs[0])) {
      if (this.state.polar) {
        this.points = [];
        for (let i of inputs[0]) {
          this.points.push({ x: i.x * Math.cos(i.y), y: i.x * Math.sin(i.y) });
        }
      } else {
        this.points = inputs[0];
      }
    } else {
      this.points.push(
        this.state.polar
          ? { x: inputs[0].x * Math.cos(inputs[0].y), y: inputs[0].x * Math.sin(inputs[0].y) }
          : inputs[0]
      );
    }
    this.functionRenderer(
      this.display.displayConfigs[1].context,
      this.display.displayConfigs[1].canvas.width,
      this.display.displayConfigs[1].canvas.height
    );
  }

  setupUI() {
    this.display = this.createUI<Display, DisplayOptions>("core/display", {
      clear: true,
      height: this.displayHeight,
      customRenderers: [
        { auto: true, renderer: (context, width, height) => this.gridRenderer(context, width, height) },
        { auto: false },
      ],
    });
    this.polarToggle = this.createUI("core/toggle", { propName: "polar", height: 10, style: { grow: 0.1 } });
    this.ui.append([
      this.display,
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Polar ?", style: { grow: 0.2 } }), this.polarToggle],
        style: { spacing: 5 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("polar", () => this.process(this.getInputs()));

    let dragStart: Vector = null;
    this.display.on("up", () => (dragStart = null));
    this.display.on("exit", () => (dragStart = null));
    this.display.on("down", (event: UIEvent) => {
      dragStart = event.screenPos.subtract(this.display.position.transform(this.flow.flowConnect.transform));
      dragStart.x = this.xPixToCoord(this.state.config, this.display.displayConfigs[0].canvas.width, dragStart.x);
      dragStart.y = this.yPixToCoord(this.state.config, this.display.displayConfigs[0].canvas.height, dragStart.y);
    });
    this.display.on("drag", (event: UIEvent) => {
      if (dragStart) {
        let curr = event.screenPos.subtract(this.display.position.transform(this.flow.flowConnect.transform));
        curr.x = this.xPixToCoord(this.state.config, this.display.displayConfigs[0].canvas.width, curr.x);
        curr.y = this.yPixToCoord(this.state.config, this.display.displayConfigs[0].canvas.height, curr.y);

        let delta = dragStart.subtract(curr);
        Object.assign(this.state.config, {
          xMin: this.state.config.xMin + delta.x,
          xMax: this.state.config.xMax + delta.x,
          yMin: this.state.config.yMin + delta.y,
          yMax: this.state.config.yMax + delta.y,
        });

        this.gridRenderer(
          this.display.displayConfigs[0].context,
          this.display.displayConfigs[0].canvas.width,
          this.display.displayConfigs[0].canvas.height
        );
        this.functionRenderer(
          this.display.displayConfigs[1].context,
          this.display.displayConfigs[1].canvas.width,
          this.display.displayConfigs[1].canvas.height
        );
      }
    });
    this.display.on("wheel", (event: UIWheelEvent) => {
      let cursor = event.screenPos.subtract(this.display.position.transform(this.flow.flowConnect.transform));
      cursor.x = this.xPixToCoord(this.state.config, this.display.displayConfigs[0].canvas.width, cursor.x);
      cursor.y = this.yPixToCoord(this.state.config, this.display.displayConfigs[0].canvas.height, cursor.y);

      Object.assign(this.state.config, {
        xMin: this.state.config.xMin - cursor.x,
        xMax: this.state.config.xMax - cursor.x,
        yMin: this.state.config.yMin - cursor.y,
        yMax: this.state.config.yMax - cursor.y,
      });
      if (!event.direction) {
        Object.assign(this.state.config, {
          xMin: this.state.config.xMin + this.state.config.xMin * 0.1,
          xMax: this.state.config.xMax + this.state.config.xMax * 0.1,
          yMin: this.state.config.yMin + this.state.config.yMin * 0.1,
          yMax: this.state.config.yMax + this.state.config.yMax * 0.1,
        });
      } else {
        Object.assign(this.state.config, {
          xMin: this.state.config.xMin - this.state.config.xMin * 0.1,
          xMax: this.state.config.xMax - this.state.config.xMax * 0.1,
          yMin: this.state.config.yMin - this.state.config.yMin * 0.1,
          yMax: this.state.config.yMax - this.state.config.yMax * 0.1,
        });
      }
      Object.assign(this.state.config, {
        xMin: this.state.config.xMin + cursor.x,
        xMax: this.state.config.xMax + cursor.x,
        yMin: this.state.config.yMin + cursor.y,
        yMax: this.state.config.yMax + cursor.y,
      });

      this.gridRenderer(
        this.display.displayConfigs[0].context,
        this.display.displayConfigs[0].canvas.width,
        this.display.displayConfigs[0].canvas.height
      );
      this.functionRenderer(
        this.display.displayConfigs[1].context,
        this.display.displayConfigs[1].canvas.width,
        this.display.displayConfigs[1].canvas.height
      );
    });
    this.flow.on("scale", () =>
      this.functionRenderer(
        this.display.displayConfigs[1].context,
        this.display.displayConfigs[1].canvas.width,
        this.display.displayConfigs[1].canvas.height
      )
    );

    this.inputsUI[0].on("event", () => (this.points = []));
  }

  gridRenderer(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number) {
    this.drawGrid(context, width, height);
    return false;
  }
  xCoordToPix(config: any, width: number, xCoord: number) {
    const xDiff = config.xMax - config.xMin;
    const xPixPerUnit = width / xDiff;
    return Math.round((xCoord - config.xMin) * xPixPerUnit);
  }
  yCoordToPix(config: any, height: number, yCoord: number) {
    const yDiff = config.yMax - config.yMin;
    const yPixPerUnit = height / yDiff;
    return Math.round(height - (yCoord - config.yMin) * yPixPerUnit);
  }
  xPixToCoord(config: any, width: number, xPix: number) {
    const xDiff = config.xMax - config.xMin;
    const xPixPerUnit = width / xDiff;
    return xPix / xPixPerUnit + config.xMin;
  }
  yPixToCoord(config: any, height: number, yPix: number) {
    const yDiff = config.yMax - config.yMin;
    const yPixPerUnit = height / yDiff;
    return -(yPix - height) / yPixPerUnit + config.yMin;
  }
  drawLine(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }
  getGridPointDist(min: number, max: number, factor: number) {
    const diff = max - min;
    let result = Math.pow(10.0, Math.ceil(Math.log(diff) / Math.log(10.0)) - 1);
    switch (Math.floor(diff / result)) {
      case 9:
        result /= 2;
        break;
      case 8:
        result /= 3;
        break;
      case 7:
        result /= 4;
        break;
      case 6:
        result /= 5;
        break;
      case 5:
        result /= 6;
        break;
      case 4:
        result /= 7;
        break;
      case 3:
        result /= 8;
        break;
      case 2:
        result /= 9;
        break;
      case 1:
        result /= 10;
        break;
    }
    result *= factor;
    return result;
  }
  drawGrid(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number) {
    context.clearRect(0, 0, width, height);
    const xDiff = this.state.config.xMax - this.state.config.xMin;
    const xPixPerUnit = width / xDiff;
    const yDiff = this.state.config.yMax - this.state.config.yMin;
    const yPixPerUnit = height / yDiff;
    const xF = this.getGridPointDist(this.state.config.xMin, this.state.config.xMax, this.state.config.gX);
    const yF = this.getGridPointDist(this.state.config.yMin, this.state.config.yMax, this.state.config.gY);
    this.plotStyle.axisColor = this.plotStyle.axisColor || "#000000";
    this.plotStyle.gridColor = this.plotStyle.gridColor || "#b0b0b0";

    let startValue = Math.ceil(this.state.config.xMin / xF) * xF;
    let number = Math.round(Math.floor(xDiff / xF)) + 1;
    let axisPosition;
    if (this.state.config.yMin < 0 && this.state.config.yMax > 0) {
      axisPosition = height + this.state.config.yMin * yPixPerUnit + 12;
    } else {
      axisPosition = height - 12;
    }
    context.strokeStyle = this.plotStyle.gridColor;
    for (let i = 0; i < number; i++) {
      if (Math.abs(startValue) < xF * 0.5) {
        context.strokeStyle = this.plotStyle.axisColor;
      }
      const position = Math.round((startValue - this.state.config.xMin) * xPixPerUnit);
      this.drawLine(context, position, 0, position, height);
      context.fillStyle = this.plotStyle.axisColor;
      const text = Math.round(startValue * 100) / 100;
      context.fillText(text + "", position + 4, axisPosition);
      context.strokeStyle = this.plotStyle.gridColor;
      startValue += xF;
    }

    startValue = Math.ceil(this.state.config.yMin / yF) * yF;
    number = Math.round(Math.floor(yDiff / yF)) + 1;
    if (this.state.config.xMin < 0 && this.state.config.xMax > 0) {
      axisPosition = -this.state.config.xMin * xPixPerUnit + 5;
    } else {
      axisPosition = 5;
    }
    context.strokeStyle = this.plotStyle.gridColor;
    for (let i = 0; i < number; i++) {
      if (Math.abs(startValue) < yF * 0.5) {
        context.strokeStyle = this.plotStyle.axisColor;
      }
      const position = height - Math.round((startValue - this.state.config.yMin) * yPixPerUnit);
      this.drawLine(context, 0, position, width, position);
      let axisVal = Math.round(startValue * 100) / 100;
      if (axisVal !== 0) {
        context.fillStyle = this.plotStyle.axisColor;
        const text = axisVal;
        context.fillText(text + "", axisPosition, position - 4);
      }
      context.strokeStyle = this.plotStyle.gridColor;
      startValue += yF;
    }
  }
  functionRenderer(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    if (this.points.length <= 0) return;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = this.plotStyle.plotColor || "#000";
    context.lineWidth = 2;
    context.beginPath();
    let startX = this.xCoordToPix(this.state.config, width, this.points[0].x);
    let startY = this.yCoordToPix(this.state.config, height, this.points[0].y);
    context.moveTo(startX, startY);
    for (let i = 1; i < this.points.length; i += 1) {
      const x = this.xCoordToPix(this.state.config, width, this.points[i].x);
      const y = this.yCoordToPix(this.state.config, height, this.points[i].y);
      context.lineTo(x, y);
    }
    context.stroke();
  }

  async serialize(persist?: DataPersistenceProvider): Promise<SerializedFunctionPlotterNode> {
    const serializedNode = (await super.serialize(persist)) as SerializedFunctionPlotterNode;

    serializedNode.displayHeight = this.displayHeight;

    return serializedNode;
  }
}

export interface PlotStyle {
  axisColor?: string;
  gridColor?: string;
  plotColor?: string;
}

export interface FunctionPlotterOptions extends NodeOptions {
  plotStyle: PlotStyle;
  displayHeight: number;
}

export interface SerializedFunctionPlotterNode extends SerializedNode {
  displayHeight: number;
}
