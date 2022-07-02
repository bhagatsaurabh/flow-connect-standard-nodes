import TerserPlugin from "terser-webpack-plugin";
import ResolveTypeScriptPlugin from "resolve-typescript-plugin";

import * as core from "flow-connect/core";
import * as ui from "flow-connect/ui";
import * as common from "flow-connect/common";
import * as utils from "flow-connect/utils";
import * as flowConnect from "flow-connect";

const externalPackages = {
  "flow-connect/core": core,
  "flow-connect/common": common,
  "flow-connect/ui": ui,
  "flow-connect/utils": utils,
  "flow-connect": flowConnect,
};

export default {
  mode: "production",
  devtool: "source-map",
  performance: {
    hints: false,
    maxEntrypointSize: 249856,
    maxAssetSize: 249856,
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  resolve: {
    extensions: [".js"],
    plugins: [new ResolveTypeScriptPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  externals: [
    function ({ request }, callback) {
      if (/^flow-connect.*/gm.test(request)) {
        return callback(
          null,
          [`{${Object.keys(externalPackages[request]).join(",")}}`],
          "root"
        );
      }
      callback();
    },
  ],
  output: {
    filename: "[name].js",
    libraryTarget: "window",
    umdNamedDefine: true,
  },
};
