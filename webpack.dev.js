const common = require('./webpack.common');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
    mode: 'development',
    devServer: {
        port: 5500
    },
    devtool: 'inline-source-map',
    output: {
        filename: '[name].js'
    }
});