import { FlowConnect } from "flow-connect";
import { API } from "./api.js";

FlowConnect.register<"node">({ type: "node", name: "net/api" }, API);
