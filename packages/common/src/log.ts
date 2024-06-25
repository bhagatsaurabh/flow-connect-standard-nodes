import { TerminalType, Node, NodeOptions } from "flow-connect/core";
import { Log as Logger } from "flow-connect/utils";
import { Button, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class Log extends Node {
  addEventButton: Button;
  addDataButton: Button;

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "Log 1", dataType: "event" },
      { type: TerminalType.IN, name: "Log 2", dataType: "any" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 170, name = "Log", style = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };

    this.setupUI();
    this.setupListeners();
  }

  protected process(): void {}

  addNewTerminal(type: string) {
    const newTerminal = this.addTerminal({
      type: TerminalType.IN,
      dataType: type === "event" ? type : "any",
      name: "Log " + (this.inputs.length + 1),
    });

    newTerminal.on(type, (terminal, data) => Logger.log(terminal.name, data));
  }
  setupUI() {
    this.addEventButton = this.createUI("core/button", { text: "Add Event", style: { grow: 0.5 } });
    this.addDataButton = this.createUI("core/button", { text: "Add Data", style: { grow: 0.5 } });
    this.ui.append(
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.addEventButton, this.addDataButton],
        style: { spacing: 20 },
      })
    );
  }
  setupListeners() {
    this.inputs.forEach((term) => {
      if (term.dataType === "event") {
        term.on("event", (terminal, data) => Logger.log(terminal.name + ":", data));
      } else {
        term.on("data", (terminal, data) => Logger.log(terminal.name + ":", data));
      }
    });

    this.addEventButton.on("click", () => this.addNewTerminal("event"));
    this.addDataButton.on("click", () => this.addNewTerminal("data"));
  }
}
