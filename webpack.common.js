const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        // index: './src/pages/index.ts',
        bezier: './src/pages/bezier/bezier.ts',
        bary: './src/pages/bary/bary.ts'
    },
    optimization: {
        splitChunks: {// this allows webpack to load dependencies (per default those from /node_modules, e.g. p5) only when we are on a site which needs them; probably an unnecessary optimization lol
            chunks: 'all',
            name: false
        }
    },
    plugins: [
        new HtmlWebpackPlugin({//creates an index.html with script tag for app.js (bundled transpiled code for application) automatically
            favicon: "favicon.ico",
            template: 'index.html',// Loads a custom template (using lodash by default)
            title: 'Interactive Computer Graphics',//will be inserted at placeholder spot in generated html,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            favicon: "favicon.ico",
            template: 'bezier-curve.html',
            title: 'Bezier Curve Demo (Interactive Computer Graphics)',
            chunks: ['bezier'],
            filename: 'bezier-curve.html'// don't forget this! otherwise plugin would emit to index.html!
        }),
        new HtmlWebpackPlugin({
            favicon: "favicon.ico",
            template: 'barycentric-coordinates.html',
            title: 'Barycentric Coordinates Demo (Interactive Computer Graphics)',
            chunks: ['bary'],
            filename: 'barycentric-coordinates.html' // don't forget this! otherwise plugin would emit to index.html!
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