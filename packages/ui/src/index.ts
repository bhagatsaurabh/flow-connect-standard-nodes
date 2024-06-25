import { FlowConnect } from "flow-connect";
import { Dial } from "./dial.js";

FlowConnect.register<"node">({ type: "node", name: "ui/dial" }, Dial);
