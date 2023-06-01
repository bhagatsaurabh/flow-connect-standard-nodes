import { exists } from "flow-connect";
import { Terminal, TerminalType, Node, NodeOptions } from "flow-connect/core";
import { RadioGroup, Button } from "flow-connect/ui";

export class SyncData extends Node {
  syncTypeInput: RadioGroup;
  addButton: Button;

  eventIds: number[] = [];
  hold: Record<string, any> = {};

  static DefaultState = { syncType: "partial" };

  constructor() {
    super();
  }

  protected setupIO(options: SyncDataOptions): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "Data 1", dataType: "any" },
      { type: TerminalType.IN, name: "Data 2", dataType: "any" },
      { type: TerminalType.OUT, name: "synced", dataType: "any" },
    ]);

    if (exists(options.noOfInputs)) {
      for (let i = 0; i < options.noOfInputs - 2; i++) {
        this.addTerminal({ type: TerminalType.IN, dataType: "any", name: "Data " + (this.inputs.length + 1) });
      }
    }
  }

  protected created(options: SyncDataOptions): void {
    const { width = 160, name = "Sync Data", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...SyncData.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    const hold = [];
    for (let term of this.inputs) {
      if (this.hold.hasOwnProperty(term.id)) {
        hold.push(this.hold[term.id]);
      } else return;
    }

    if (this.state.syncType === "full") this.state.hold = {};
    this.outputs[0].emit(hold);
    for (let term of this.inputs) if (term.connectors.length > 0 && typeof term.getData() === "undefined") return;

    this.setOutputs(0, this.getInputs());
  }

  setupUI() {
    this.syncTypeInput = this.createUI("core/radio-group", {
      values: ["partial", "full"],
      selected: this.state.syncType,
      propName: "syncType",
      height: 20,
    });
    this.addButton = this.createUI("core/button", { text: "Add", input: true, output: true, height: 20 });

    this.ui.append([this.syncTypeInput, this.addButton]);
  }
  setupListeners() {
    this.addButton.on("click", () => {
      const newTerminal = this.addTerminal({
        type: TerminalType.IN,
        dataType: "any",
        name: "Data " + (this.inputs.length + 1),
      });
      this.eventIds.push(
        newTerminal.on("data", (inst, data) => {
          this.hold[inst.id] = data;
          this.process();
        })
      );
    });

    for (let terminal of this.inputs) {
      this.eventIds.push(
        terminal.on("data", (inst, data) => {
          this.hold[inst.id] = data;
          this.process();
        })
      );
    }
  }
}

export interface SyncDataOptions extends NodeOptions {
  noOfInputs: number;
}
