import { Align, TerminalType } from "flow-connect";
import { Node, NodeOptions } from "flow-connect/core";
import { Log, isEmpty } from "flow-connect/utils";

export class API extends Node {
  static DefaultState = { src: "" };

  constructor() {
    super();
  }

  protected setupIO(): void {
    this.addTerminals([
      { type: TerminalType.IN, name: "trigger", dataType: "event" },
      { type: TerminalType.OUT, name: "text", dataType: "string" },
      { type: TerminalType.OUT, name: "json", dataType: "any" },
      { type: TerminalType.OUT, name: "array-buffer", dataType: "array-buffer" },
    ]);
  }

  protected created(options: NodeOptions): void {
    const { width = 150, name = "API", style = {}, state = {} } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...API.DefaultState, ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process(): void {}

  setupUI() {
    this.ui.append(
      this.createUI("core/label", {
        text: "",
        propName: "src",
        input: true,
        output: true,
        style: { align: Align.Center },
      })
    );
  }
  setupListeners() {
    this.inputs[0].on("event", async () => {
      if (!this.state.src || this.state.src === "")
        Log.error("Prop 'src' of API Node is invalid, cannot make an API call");
      else {
        let response,
          outputs: Record<string, any> = {};
        if (this.outputs.map((terminal) => terminal.connectors.length).reduce((acc, curr) => acc + curr, 0) > 0) {
          response = await fetch(this.state.src);

          if (this.outputs[0].connectors.length > 0) outputs[this.outputs[0].name] = await response.text();
          else if (this.outputs[1].connectors.length > 0) outputs[this.outputs[1].name] = await response.json();
          else if (this.outputs[2].connectors.length > 0) {
            // If this is an audio connection then check the arrayBufferCache first
            if (this.outputs[2].connectors.map((connector) => connector.end.dataType).includes("audio")) {
              let cached = this.flow.flowConnect.getCache("array", this.state.src);
              if (!cached) {
                cached = await response.arrayBuffer();
                this.flow.flowConnect.setCache("array", this.state.src, cached);
              }
              outputs[this.outputs[2].name] = cached;
            } else {
              outputs[this.outputs[2].name] = await response.arrayBuffer();
            }
          }

          if (!isEmpty(outputs)) this.setOutputs(outputs);
        }
      }
    });
  }
}
