const common = require('./webpack.common');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
    mode: "production",
    plugins: [
        new HtmlWebpackPlugin({//creates an index.html with script tag for app.js (bundled transpiled code for application) automatically
            favicon: "favicon.ico",
            template: 'index.html',// Loads a custom template (using lodash by default)
            title: 'Interactive Computer Graphics',//will be inserted at placeholder spot in generated html
          })
    ],
    output: {
        filename: 'app.[contenthash].js',
        //note: we don't need dist folder anymore, webpack will create some kind of virtual dist folder?
        //we also don't have to specify dist folder in index.html script tag?
        path: __dirname + '/dist',//dirname: global var supplied by node, when running webpack
        clean: true //only newly created files should remain in output folder
    }
});