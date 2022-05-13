const {merge} = require('webpack-merge');
const common = require('../../webpack.common.js');

module.exports = merge(common, {
  entry: {
    'net': './src/index.ts',
  },
});
