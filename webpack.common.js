import TerserPlugin from "terser-webpack-plugin";
import ResolveTypeScriptPlugin from "resolve-typescript-plugin";

export default {
  mode: 'production',
  devtool: 'source-map',
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
    extensions: ['.js'],
    plugins: [new ResolveTypeScriptPlugin()]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
