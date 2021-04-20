const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index/index.ts',
        bezier: './src/demos/bezier/bezier.ts',
        bary: './src/demos/bary/bary.ts'
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
            template: 'src/index/index.ejs',// Loads a custom template (using lodash by default)
            title: 'Interactive Computer Graphics',//will be inserted at placeholder spot in generated html,
            chunks: ['index']
        }),
        new HtmlWebpackPlugin({
            favicon: "favicon.ico",
            template: 'src/demos/demo.ejs',
            title: 'Bezier Curve Demo (Interactive Computer Graphics)',
            chunks: ['bezier'],
            filename: 'bezier-curve.html'// don't forget this! otherwise plugin would emit to index.html!
        }),
        new HtmlWebpackPlugin({
            favicon: "favicon.ico",
            template: 'src/demos/demo.ejs',
            title: 'Barycentric Coordinates Demo (Interactive Computer Graphics)',
            chunks: ['bary'],
            filename: 'barycentric-coordinates.html' // don't forget this! otherwise plugin would emit to index.html!
        })
    ],
    module: {
        rules: [
            { test: /\.ts$/, use: 'awesome-typescript-loader' },
            //getting imgs to work with my config was a shit ton of work, digging through lots of SO threads and GitHub issues
            //this finally helped me: https://stackoverflow.com/a/48242662/13727176
            {
                test: /\.(svg|png|jpg|jpeg|gif)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: "[name].[hash].[ext]",
                        outputPath: "imgs",
                        esModule: false //important, else [object Object] shows up instead of img URL
                    }
                }
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader", // 3. inject styles into DOM
                    "css-loader", // 2. turn CSS into CommonJS
                    "sass-loader" // 1. Turns Sass into CSS
                ]
            }
        ]
    },
    resolve: {
        //enables users to leave off the extension when importing: If multiple files share the same name but have different extensions, webpack will resolve the one with the extension listed first in the array and skip the rest
        extensions: ['.ts', '.js']
    }
};