import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { Input, InputOptions, InputType } from "flow-connect/ui";

export class Timer extends Node {
  lastTrigger: number = Number.MIN_VALUE;

  static DefaultState: any = { delay: 1000, emitValue: null };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "timer", dataType: "event" }]);
  }

  protected created(options: NodeOptions): void {
    const { width = 120, name = "Timer", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...Timer.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process(): void {}

  setupUI() {
    this.ui.append(
      this.createUI<Input, InputOptions>("core/input", {
        propName: "delay",
        height: 20,
        style: { type: InputType.Number },
      })
    );
  }
  setupListeners() {
    this.flow.flowConnect.on("tickreset", () => (this.lastTrigger = Number.MIN_VALUE));
    this.flow.flowConnect.on("tick", () => {
      let current = this.flow.flowConnect.time;
      if (current - this.lastTrigger >= this.state.delay) {
        this.outputs[0].emit(this.state.emitValue);
        this.lastTrigger = current;
      }
    });
  }
}
