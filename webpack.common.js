const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/app.ts',
    plugins: [
        new HtmlWebpackPlugin({//creates an index.html with script tag for app.js (bundled transpiled code for application) automatically
            favicon: "favicon.ico",
            template: 'index.html',// Loads a custom template (using lodash by default)
            title: 'Interactive Computer Graphics',//will be inserted at placeholder spot in generated html
          })
    ],
    module: {
        rules: [
            { test: /\.ts$/, use: 'awesome-typescript-loader' }
        ]
    },
    resolve: {
        //enables users to leave off the extension when importing: If multiple files share the same name but have different extensions, webpack will resolve the one with the extension listed first in the array and skip the rest
        extensions: ['.ts', '.js']
    }
};