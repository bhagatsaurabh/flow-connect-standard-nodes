import { exists } from "flow-connect";
import { TerminalType, Node, NodeOptions } from "flow-connect/core";
import { Button } from "flow-connect/ui";

export class SyncEvent extends Node {
  addButton: Button;
  hold: Record<string, any> = {};

  constructor() {
    super();
  }

  protected setupIO(options: SyncEventOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "Event 1", dataType: "event" },
      { type: TerminalType.IN, name: "Event 2", dataType: "event" },
      { type: TerminalType.OUT, name: "synced", dataType: "event" },
    ]);

    if (exists(options.noOfEvents)) {
      for (let i = 0; i < options.noOfEvents - 2; i++) {
        this.addTerminal({ type: TerminalType.IN, dataType: "event", name: "Event " + (this.inputs.length + 1) });
      }
    }
  }

  protected created(options: NodeOptions): void {
    const { width = 160, name = "Sync Event", style = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    let hold = [];
    for (let term of this.inputs) {
      if (this.hold.hasOwnProperty(term.id)) {
        hold.push(this.hold[term.id]);
      } else return;
    }

    this.hold = {};
    this.outputs[0].emit(hold);
  }

  setupUI() {
    this.addButton = this.createUI("core/button", { text: "Add", input: true, output: true, height: 20 });
    this.ui.append(this.addButton);
  }
  setupListeners() {
    this.inputs.forEach((terminal) =>
      terminal.on("event", (inst, data) => {
        this.hold[inst.id] = data;
        this.process();
      })
    );

    this.addButton.on("click", () => {
      const newTerminal = this.addTerminal({
        type: TerminalType.IN,
        dataType: "event",
        name: "Event " + (this.inputs.length + 1),
      });
      newTerminal.on("event", (terminal, data) => {
        this.hold[terminal.id] = data;
        this.process();
      });
    });
  }
}

export interface SyncEventOptions extends NodeOptions {
  noOfEvents: number;
}
