import { exists } from "flow-connect";
import { Node, NodeOptions, TerminalType } from "flow-connect/core";
import { Select, SelectOptions } from "flow-connect/ui";

export class Compare extends Node {
  select: Select;

  static DefaultState = { value: "==" };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "x", dataType: "any" },
      { type: TerminalType.IN, name: "y", dataType: "any" },
      { type: TerminalType.OUT, name: "result", dataType: "boolean" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 150, name = "Compare", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...Compare.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process(inputs: any[]) {
    if (!exists(inputs[0]) || !exists(inputs[1])) return;

    let res;
    switch (this.state.value) {
      case "==": {
        res = inputs[0] == inputs[1];
        break;
      }
      case "===": {
        res = inputs[0] === inputs[1];
        break;
      }
      case "!=": {
        res = inputs[0] != inputs[1];
        break;
      }
      case "!==": {
        res = inputs[0] !== inputs[1];
        break;
      }
      case "<": {
        res = inputs[0] < inputs[1];
        break;
      }
      case "<=": {
        res = inputs[0] <= inputs[1];
        break;
      }
      case ">": {
        res = inputs[0] > inputs[1];
        break;
      }
      case ">=": {
        res = inputs[0] >= inputs[1];
        break;
      }
      case "&&": {
        res = inputs[0] && inputs[1];
        break;
      }
      case "||": {
        res = inputs[0] || inputs[1];
        break;
      }
      default:
        res = false;
    }
    this.setOutputs(0, res);
  }

  setupUI() {
    const select = this.createUI<Select, SelectOptions>("core/select", {
      values: ["==", "===", "!=", "!==", "<", "<=", ">", ">=", "&&", "||"],
      propName: "value",
      input: true,
      output: true,
      height: 15,
      style: { fontSize: "14px" },
    });

    this.ui.append(select);
  }
  setupListeners() {
    this.watch("value", () => this.process(this.getInputs()));
  }
}
