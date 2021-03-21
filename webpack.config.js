module.exports = {
    entry: './src/app.ts',
    output: {
        filename: 'app.js',
        //note: we don't need dist folder anymore, webpack will create some kind of virtual dist folder?
        //we also don't have to specify dist folder in index.html script tag?
        path: __dirname + '/dist',//dirname: global var supplied by node, when running webpack
        clean: true //only newly created files should remain in output folder
    },
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
        port: 5500
    }
};