const common = require('./webpack.common');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
    mode: "production",
    output: {
        filename: '[name].[contenthash].js',
        //we don't have to specify dist folder in index.html script tag - webpack adds correct import automatically

        //define the path the bundled .js-files should be copied to;
        //__dirname: global var supplied by node when running webpack -> resolves to the path where node is run from (e.g. path to this project's root folder)
        path: __dirname + '/dist',
        
        clean: true //only newly created files should remain in output folder (wipe previous content of folder)
    }
});