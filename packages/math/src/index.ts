import { FlowConnect } from "flow-connect";
import { Abs } from "./abs.js";
import { Average } from "./average.js";
import { Normalize } from "./normalize.js";
import { Clamp } from "./clamp.js";
import { Floor } from "./floor.js";
import { Ceil } from "./ceil.js";
import { Func } from "./func.js";

FlowConnect.register<"node">({ type: "node", name: "math/abs" }, Abs);
FlowConnect.register<"node">({ type: "node", name: "math/average" }, Average);
FlowConnect.register<"node">({ type: "node", name: "math/normalize" }, Normalize);
FlowConnect.register<"node">({ type: "node", name: "math/clamp" }, Clamp);
FlowConnect.register<"node">({ type: "node", name: "math/floor" }, Floor);
FlowConnect.register<"node">({ type: "node", name: "math/ceil" }, Ceil);
FlowConnect.register<"node">({ type: "node", name: "math/func" }, Func);
