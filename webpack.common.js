const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index/index.ts',
        bezier: './src/demos/bezier/bezier.ts',
        bernstein: './src/demos/bernstein/bernstein.ts',
        bSpline: './src/demos/b-spline/b-spline.ts',
        bary: './src/demos/bary/bary.ts',
        nurbs: './src/demos/nurbs/nurbs.ts'
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
            filename: 'bezier-curve.html',// don't forget this! otherwise plugin would emit to index.html!
            chunks: ['bezier'],
            title: 'Bézier Curve Demo (Interactive Computer Graphics)',
            heading: 'Bézier Curves'
        }),
        new HtmlWebpackPlugin({
            favicon: "favicon.ico",
            template: 'src/demos/demo.ejs',
            filename: 'bezier-bernstein.html',// don't forget this! otherwise plugin would emit to index.html!
            chunks: ['bernstein'],
            title: 'Bézier Curves and Bernstein Polynomials Demo (Interactive Computer Graphics)',
            heading: 'Bézier Curves and Bernstein Polynomials',
        }),
        new HtmlWebpackPlugin({
            favicon: "favicon.ico",
            template: 'src/demos/demo.ejs',
            filename: 'b-spline.html',// don't forget this! otherwise plugin would emit to index.html!
            chunks: ['bSpline'],
            title: 'B-Spline Curve Demo (Interactive Computer Graphics)',
            heading: 'B-Spline Curves',
        }),
        new HtmlWebpackPlugin({
            favicon: "favicon.ico",
            template: 'src/demos/demo.ejs',
            chunks: ['bary'],
            filename: 'barycentric-coordinates.html', // don't forget this! otherwise plugin would emit to index.html!
            title: 'Barycentric Coordinates Demo (Interactive Computer Graphics)',
            heading: 'Barycentric Coordinates'
        }),
        new HtmlWebpackPlugin({
            favicon: "favicon.ico",
            template: 'src/demos/demo.ejs',
            chunks: ['nurbs'],
            filename: 'nurbs.html', // don't forget this! otherwise plugin would emit to index.html!
            title: 'NURBS Demo (Interactive Computer Graphics)',
            heading: 'NURBS'
        })
    ],
    module: {
        rules: [
            { 
                test: /\.ts$/,
                use: 'awesome-typescript-loader'
            },
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
                    {
                        loader: 'style-loader'//inject styles into DOM
                    },
                    {
                        loader: 'css-loader',//convert CSS -> CommonJS
                        options: {
                            modules: {
                                compileType: 'icss'//have to set this to allow :export syntax for exporting SCSS variables which can then be imported into TS, default 'module' apparently more modern (keyword: CSS modules)
                            }
                        }
                    },
                    {
                        loader: 'sass-loader'//1. Sass -> CSS
                    },
                ],
            }
        ]
    },
    resolve: {
        //enables users to leave off the extension when importing: If multiple files share the same name but have different extensions, webpack will resolve the one with the extension listed first in the array and skip the rest
        extensions: ['.ts', '.js']
    }
};