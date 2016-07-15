var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: ['./scripts/main.js'],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'appBundle.js'
    },
    module: {
        loaders: [
            {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract("style-loader", "css-loader")
        },
        {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
        },{
            loader: 'babel-loader',
            exclude: /node_modules/,
            test: /\.js$/,
            query: {
                presets: ['es2015', 'react', 'stage-0'],
            }
        }]
    },
    plugins: [
        new ExtractTextPlugin("main.css", {
            allChunks: true
        })
    ]
};