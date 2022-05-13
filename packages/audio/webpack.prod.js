const {merge} = require('webpack-merge');
const common = require('../../webpack.common.js');

module.exports = merge(common, {
  entry: {
    'audio': './src/index.ts',
  },
});
