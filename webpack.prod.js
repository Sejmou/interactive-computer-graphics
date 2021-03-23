const common = require('./webpack.common');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
    mode: "production",
    output: {
        filename: 'app.[contenthash].js',
        //note: we don't need dist folder anymore, webpack will create some kind of virtual dist folder?
        //we also don't have to specify dist folder in index.html script tag?
        path: __dirname + '/dist',//dirname: global var supplied by node, when running webpack
        clean: true //only newly created files should remain in output folder
    }
});