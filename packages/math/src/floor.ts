import { Node, NodeOptions, TerminalType } from "flow-connect/core";

export class Floor extends Node {
  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "x", dataType: "any" },
      { type: TerminalType.OUT, name: "|x|", dataType: "any" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 120, name = "Floor", style = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
  }

  protected process(inputs: any[]): void {
    if (typeof inputs[0] === "number") {
      this.setOutputs(0, Math.floor(inputs[0]));
    } else if (Array.isArray(inputs[0])) {
      this.setOutputs(
        0,
        inputs[0].map((item) => Math.floor(item))
      );
    }
  }
}
