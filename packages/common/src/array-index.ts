import { Node, NodeOptions, TerminalType } from "flow-connect/core";

export class ArrayIndex extends Node {
  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "data", dataType: "array" },
      { type: TerminalType.IN, name: "index", dataType: "number" },
      { type: TerminalType.OUT, name: "value", dataType: "any" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { style = {}, name = "Array Index", width = 120 } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
  }

  protected process(inputs: any[]): void {
    if (!inputs || !inputs[0] || typeof inputs[1] !== "number") return;
    this.setOutputs(0, inputs[0][inputs[1]]);
  }
}
