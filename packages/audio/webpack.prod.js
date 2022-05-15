import { merge } from 'webpack-merge';
import common from '../../webpack.common.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

export default merge(common, {
  entry: {
    'audio': './src/index.ts',
  },
  output: {
    path: path.resolve(dirname(fileURLToPath(import.meta.url)), 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  }
});
