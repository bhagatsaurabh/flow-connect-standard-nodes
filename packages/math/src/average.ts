import { Flow, Vector, Node, NodeOptions, TerminalType } from "flow-connect/core";

export class Average extends Node {
  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "n", dataType: "any" },
      { type: TerminalType.OUT, name: "μ", dataType: "any" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 120, name = "Average", style = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
  }

  protected process(inputs: any[]): void {
    if (Array.isArray(inputs[0])) {
      this.setOutputs(0, inputs[0].reduce((acc, curr) => acc + curr, 0) / inputs[0].length);
    }
  }
}
