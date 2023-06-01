import { Node, NodeOptions, TerminalType } from "flow-connect/core";

export class Property extends Node {
  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "object", dataType: "any" },
      { type: TerminalType.IN, name: "key", dataType: "string" },
      { type: TerminalType.OUT, name: "value", dataType: "any" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 130, name = "Property", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
  }

  protected process(inputs: any[]): void {
    if (!inputs[0]) return;
    this.setOutputs(0, inputs[0][inputs[1]]);
  }
}
