import { TerminalType, Node, NodeOptions } from "flow-connect/core";
import { Button } from "flow-connect/ui";

export class ToArray extends Node {
  addButton: Button;

  constructor() {
    super();
  }

  protected setupIO(options: ToArrayOptions): void {
    this.addTerminals(
      options.noOfInputs && options.noOfInputs > 0
        ? new Array(options.noOfInputs)
            .fill(null)
            .map((_, index) => ({ type: TerminalType.IN, name: "In " + (index + 1), dataType: "any" }))
        : [{ type: TerminalType.IN, name: "In 1", dataType: "any" }]
    );
    this.addTerminal({ type: TerminalType.OUT, name: "out", dataType: "array" });
  }

  protected created(options: NodeOptions): void {
    const { width = 100, name = "To Array", style = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };

    this.setupUI();
    this.setupListeners();
  }

  protected process(inputs: any[]): void {
    this.setOutputs(0, [...inputs]);
  }

  setupUI() {
    this.addButton = this.createUI("core/button", { text: "Add", style: { grow: 0.5 } });
    this.ui.append(this.addButton);
  }
  setupListeners() {
    this.addButton.on("click", () =>
      this.addTerminal({ type: TerminalType.IN, dataType: "any", name: "In " + this.inputs.length + 1 })
    );
  }
}

export interface ToArrayOptions extends NodeOptions {
  noOfInputs: number;
}
