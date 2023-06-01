import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { List, ListNode } from "flow-connect/utils";
import { HorizontalLayout, HorizontalLayoutOptions, InputType } from "flow-connect/ui";

interface BufferedEvent {
  data: any;
  timeoutId: number;
  start: number;
  remaining?: number;
}

export class Delay extends Node {
  static DefaultState: any = { delay: 0, eventQueue: new List<BufferedEvent>((a, b) => a.timeoutId - b.timeoutId) };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "event", dataType: "event" },
      { type: TerminalType.OUT, name: "trigger", dataType: "event" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 130, name = "Delay", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...Delay.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process(): void {}

  triggerEvent(eventNode: ListNode<BufferedEvent>) {
    if (eventNode === this.state.eventQueue.head) {
      let bufferedEvent = this.state.eventQueue.removeFirst();
      this.outputs[0].emit(bufferedEvent.data);
    }
  }
  setupUI() {
    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/label", { text: "Delay", style: { grow: 0.3 } }),
          this.createUI("core/input", {
            propName: "delay",
            input: true,
            output: true,
            height: 20,
            style: { type: InputType.Number, grow: 0.7 },
          }),
        ],
        style: { spacing: 10 },
      })
    );
  }
  setupListeners() {
    this.state.eventQueue.on("removefirst", () => {
      while (
        this.state.eventQueue.head &&
        performance.now() - this.state.eventQueue.head.data.start >= this.state.delay
      ) {
        let bufferedEvent = this.state.eventQueue.removeFirst(false);
        this.outputs[0].emit(bufferedEvent.data);
      }
    });
    this.inputs[0].on("event", (_, data) => {
      let eventNode = new ListNode<BufferedEvent>();
      eventNode.data = {
        data,
        timeoutId: window.setTimeout(() => this.triggerEvent(eventNode), this.state.delay),
        start: performance.now(),
      };
      this.state.eventQueue.append(eventNode);
    });

    this.flow.on("start", () => {
      this.state.eventQueue.forEach((eventNode: ListNode<BufferedEvent>) => {
        eventNode.data.start = performance.now() + eventNode.data.remaining - this.state.delay;
        eventNode.data.timeoutId = window.setTimeout(() => this.triggerEvent(eventNode), eventNode.data.remaining);
      });
    });
    this.flow.on("stop", () => {
      this.state.eventQueue.forEach((eventNode: ListNode<BufferedEvent>) => {
        clearTimeout(eventNode.data.timeoutId);
        eventNode.data.remaining = performance.now() - eventNode.data.start;
      });
    });
  }
}
