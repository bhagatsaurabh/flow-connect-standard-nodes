import { FlowConnect } from "flow-connect";
import { FunctionPlotter } from "./function-plotter.js";
import { LineChartMini } from "./line-chart-mini.js";

FlowConnect.register<"node">({ type: "node", name: "visual/function-plotter" }, FunctionPlotter);
FlowConnect.register<"node">({ type: "node", name: "visual/line-chart-mini" }, LineChartMini);
