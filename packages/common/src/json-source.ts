import { Flow, Vector, Node } from "flow-connect/core";
import { NodeCreatorOptions } from "flow-connect/common";
import { Log } from "flow-connect/utils";
import { InputType, Input } from "flow-connect/ui";

export class JsonSource extends Node {
  input: Input;

  constructor(flow: Flow, options: NodeCreatorOptions = {}) {
    super(flow, options.name || 'JSON Source', options.position || new Vector(50, 50), options.width || 150, [],
      [{ name: 'value', dataType: 'any' }],
      {
        state: options.state ? { ...options.state } : {},
        style: options.style || { rowHeight: 10 },
        terminalStyle: options.terminalStyle || {}
      }
    );

    this.setupUI();

    this.input.on('change', () => this.process());
    this.on('process', () => this.process());
  }

  process() {
    if (!this.input.value || this.input.value === '') return;
    try {
      let value = JSON.parse(this.input.value as string);
      this.setOutputs(0, value);
    } catch (error) {
      this.input.inputEl.style.backgroundColor = 'red';
      Log.error("StandardNode 'JsonSource' json parse error", error);
    }
  }
  setupUI() {
    this.input = this.createInput({ value: '', input: true, output: true, height: 20, style: { type: InputType.Text, grow: .7 } });
    this.ui.append(this.createHozLayout([
      this.createLabel('Value', { style: { grow: .3 } }),
      this.input
    ], { style: { spacing: 20 } }));
  }
}
