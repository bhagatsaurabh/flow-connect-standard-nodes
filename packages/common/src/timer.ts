import { Flow, Vector, Node } from "flow-connect/core";
import { NodeCreatorOptions } from "flow-connect/common";
import { InputType } from "flow-connect/ui";

export class Timer extends Node {
  lastTrigger: number = Number.MIN_VALUE;

  static DefaultState: any = { delay: 1000, emitValue: null };

  constructor(flow: Flow, options: NodeCreatorOptions = {}) {
    super(flow, options.name || 'Timer', options.position || new Vector(50, 50), options.width || 120, [],
      [{ name: 'timer', dataType: 'event' }],
      {
        state: options.state ? { ...Timer.DefaultState, ...options.state } : Timer.DefaultState,
        style: options.style || { rowHeight: 10 },
        terminalStyle: options.terminalStyle || {}
      }
    );

    this.setupUI();

    flow.flowConnect.on('tickreset', () => this.lastTrigger = Number.MIN_VALUE);
    flow.flowConnect.on('tick', () => {
      let current = flow.flowConnect.time;
      if (current - this.lastTrigger >= this.state.delay) {
        this.outputs[0].emit(this.state.emitValue);
        this.lastTrigger = current;
      }
    });
  }

  setupUI() {
    this.ui.append(this.createInput({ propName: 'delay', height: 20, style: { type: InputType.Number } }));
  }
}
