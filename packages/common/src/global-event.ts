import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { GlobalEventType } from "flow-connect/common";
import { uuid } from "flow-connect/utils";
import { InputType, Input, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class GlobalEvent extends Node {
  eventInput: Input;
  globalEventName: string;
  globalEventType: GlobalEventType;
  eventId = -1;

  static DefaultState = { name: uuid() };

  constructor() {
    super();
  }

  protected setupIO(options: GlobalEventOptions): void {
    this.addTerminals([
      {
        type: options.globalEventType === GlobalEventType.Emitter ? TerminalType.IN : TerminalType.OUT,
        name: options.globalEventType === GlobalEventType.Emitter ? "emit" : "receive",
        dataType: "event",
      },
    ]);
  }

  protected created(options: GlobalEventOptions): void {
    this.globalEventName = options.globalEventName;
    this.globalEventType = options.globalEventType;

    const { width = 150, name = "Global Event", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...GlobalEvent.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process(): void {}

  setupUI() {
    this.eventInput = this.createUI("core/input", {
      propName: "name",
      height: 20,
      style: { type: InputType.Text, grow: 0.6 },
    });

    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "Event", style: { grow: 0.4 } }), this.eventInput],
        style: { spacing: 10 },
      })
    );
  }
  setupListeners() {
    if (this.globalEventType === GlobalEventType.Emitter) {
      this.inputs[0].on("event", (_, data) => this.flow.globalEvents.call(this.state.name, data));
    } else {
      this.eventId = this.flow.globalEvents.on(this.state.name, (data) => this.outputs[0].emit(data));
    }

    this.watch("name", (prevVal) => {
      this.flow.globalEvents.off(prevVal, this.eventId);
      this.eventId = this.flow.globalEvents.on(this.state.name, (data) => this.outputs[0].emit(data));
    });
  }
}

export interface GlobalEventOptions extends NodeOptions {
  globalEventType: GlobalEventType;
  globalEventName: string;
}
