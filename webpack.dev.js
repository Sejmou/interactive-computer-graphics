const common = require('./webpack.common');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
    mode: 'development',
    devServer: {
        port: 5500,
        open: true// automatically opens new browser window when running dev server for first time
    }
});