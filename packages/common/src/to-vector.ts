import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { Log } from "flow-connect/utils";

export class ToVector extends Node {
  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "x", dataType: "any" },
      { type: TerminalType.IN, name: "y", dataType: "any" },
      { type: TerminalType.OUT, name: "vector", dataType: "any" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 100, name = "To Vector", style = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
  }

  protected process(inputs: any[]): void {
    if (typeof inputs[0] === "number" && typeof inputs[1] === "number") {
      this.setOutputs(0, { x: inputs[0], y: inputs[1] });
    } else if (Array.isArray(inputs[0]) && Array.isArray(inputs[1])) {
      let result = [];
      for (let i = 0; i < inputs[0].length; i++) {
        result.push({ x: inputs[0][i], y: inputs[1][i] });
      }
      this.setOutputs(0, result);
    } else {
      Log.error("Type mismatch: Inputs to standard node 'ToVector' should be of same type");
    }
  }
}
