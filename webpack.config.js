const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/app.ts',
    output: {
        filename: 'app.js',
        //note: we don't need dist folder anymore, webpack will create some kind of virtual dist folder?
        //we also don't have to specify dist folder in index.html script tag?
        path: __dirname + '/dist',//dirname: global var supplied by node, when running webpack
        clean: true //only newly created files should remain in output folder
    },
    plugins: [
        new HtmlWebpackPlugin({//creates an index.html with script tag for app.js (bundled transpiled code for application) automatically
            template: 'index.html',// Loads a custom template (using lodash by default)
            title: 'Interactive Computer Graphics',//will be inserted at placeholder spot in generated html
          })
    ],
    resolve: {
        //enables users to leave off the extension when importing: If multiple files share the same name but have different extensions, webpack will resolve the one with the extension listed first in the array and skip the rest
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'awesome-typescript-loader' }
        ]
    },
    devServer: {
        port: 5500,
        open: true// automatically opens new browser window when running dev server for first time
    }
};