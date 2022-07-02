import { merge } from "webpack-merge";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import webpackCommon from "../../webpack.common.js";

export default merge(webpackCommon, {
  entry: {
    visual: "./src/index.ts",
  },
  output: {
    library: ["StandardNodes", "Visual"],
    path: path.resolve(dirname(fileURLToPath(import.meta.url)), "dist"),
  },
});
