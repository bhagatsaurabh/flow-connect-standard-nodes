import { TerminalType, Node, NodeOptions } from "flow-connect/core";
import { Evaluator, Token, TokenType, Parser, Log } from "flow-connect/utils";
import { InputType, Input, Button, HorizontalLayout, HorizontalLayoutOptions } from "flow-connect/ui";

export class Func extends Node {
  addVarButton: Button;
  evaluator: Evaluator = new Evaluator({});

  static DefaultState = (exp: string) => ({ newVar: "y", expression: exp || "a*sin(a^2)+cos(a*tan(a))" });

  constructor() {
    super();
  }

  protected setupIO(options: FuncOptions): void {
    this.parseExpression(options.expression || "a*sin(a^2)+cos(a*tan(a))");
    this.addTerminals([{ type: TerminalType.OUT, name: "𝒇", dataType: "any" }]);
  }

  protected created(options: FuncOptions): void {
    const { width = 200, name = "Function", style = {}, state = {}, expression } = options;

    this.width = width;
    this.name = name;
    this.style = { rowHeight: 10, ...style };
    this.state = { ...Func.DefaultState(expression), ...state };

    this.setupUI();
    this.setupListeners();
  }

  protected process() {
    let bulkEvalIterations = -1;
    this.evaluator.variables = {};
    for (let inTerminal of this.inputs) {
      let data = inTerminal.getData();

      // Some checks to determine if the intention is to pass variables with array values to this function
      // Which should mean its a bulk evaluation (t=[2,5,6,8...], f(t)=cos(t)  ==>  f(t)=[cos(2),cos(5),cos(6),cos(8)...])
      if (Array.isArray(data)) {
        let expr = this.state.expression;
        let regex = new RegExp("([a-z]+)\\(" + inTerminal.name + "\\)", "g");
        expr = expr.replace(/\s+/g, "");
        let matches = [...expr.matchAll(regex)];
        let result = matches
          .map((match) => !Evaluator.multiargFunctions.includes(match[1]))
          .reduce((acc, curr) => (acc = acc && curr), true);

        if (result) bulkEvalIterations = Math.max(bulkEvalIterations, data.length);
      }

      this.evaluator.variables[inTerminal.name] = typeof data !== "undefined" && data !== null ? data : 0;
    }
    try {
      let result: number[] | number;
      if (bulkEvalIterations !== -1) {
        let resultArr = [];
        for (let i = 0; i < bulkEvalIterations; i += 1) {
          resultArr.push(this.evaluator.evaluate(this.state.expression, i));
        }
        result = resultArr;
      } else {
        result = this.evaluator.evaluate(this.state.expression);
      }
      this.setOutputs(0, result);
    } catch (error) {
      Log.error("Error while evaluating the expression: ", this.state.expression, error);
    }
  }

  parseExpression(expression: string) {
    const vars = new Set<string>();
    const parser = new Parser();
    let tokens: Token[];
    try {
      tokens = parser.parse(expression);
    } catch (error) {
      Log.error("Error while parsing expression: ", expression, error);
      return;
    }
    try {
      tokens.forEach((token) => {
        if (token.type === TokenType.Variable) {
          if ((token.value as string).length > 1)
            throw new Error("Only single character variables are allowed: " + token.value);
          else vars.add(token.value as string);
        }
      });
    } catch (error) {
      Log.error(error);
      return;
    }

    vars.forEach((variable) => this.addTerminal({ type: TerminalType.IN, dataType: "any", name: variable }));
  }
  lowerCase(input: Input) {
    if (/[A-Z]/g.test(input.inputEl.value)) input.inputEl.value = input.inputEl.value.toLowerCase();
  }
  setupUI() {
    let exprInput = this.createUI("core/input", {
      propName: "expression",
      input: true,
      output: true,
      height: 20,
      style: { type: InputType.Text, grow: 0.9 },
    });
    exprInput.on("input", this.lowerCase);
    this.addVarButton = this.createUI("core/button", { text: "Add", height: 20, style: { grow: 0.4 } });
    this.ui.append([
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [this.createUI("core/label", { text: "𝒇", style: { grow: 0.1 } }), exprInput],
        style: { spacing: 10 },
      }),
      this.createUI<HorizontalLayout, HorizontalLayoutOptions>("core/x-layout", {
        childs: [
          this.createUI("core/input", {
            propName: "newVar",
            height: 20,
            style: { type: InputType.Text, maxLength: 1, grow: 0.6 },
          }),
          this.addVarButton,
        ],
        style: { spacing: 10 },
      }),
    ]);
  }
  setupListeners() {
    this.watch("expression", () => this.process());
    this.addVarButton.on("click", () => {
      if (!this.state.newVar || this.state.newVar.trim() === "") return;
      if (this.inputs.map((input) => input.name).includes(this.state.newVar.trim().toLowerCase())) {
        Log.error("Variable", this.state.newVar.trim(), "already exists");
        return;
      }
      this.addTerminal({ type: TerminalType.IN, dataType: "any", name: this.state.newVar.trim() });
    });
  }
}

export interface FuncOptions extends NodeOptions {
  expression?: string;
}
