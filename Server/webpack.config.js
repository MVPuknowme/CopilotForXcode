const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

/*
 * The folder structure of `dist` would be:
 * dist/
 *   ├── terminal/
 *   │   ├── terminal.js
 *   │   └── terminal.html
 *   └── diffView/
 *       ├── diffView.js
 *       ├── diffView.html
 *       └── css/
 *           └── style.css
*/
module.exports = {
    mode: 'production',
    entry: {
        // Add more entry points here
        terminal: './src/terminal/index.ts',
        diffView: './src/diffView/index.ts'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: '[name]/[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                /// MARK: - Terminal component files
                {
                    from: 'src/terminal/terminal.html',
                    to: 'terminal/terminal.html'
                },
                
                /// MARK: - DiffView component files
                {
                    from: 'src/diffView/diffView.html',
                    to: 'diffView/diffView.html'
                },
                {
                    from: 'src/diffView/css',
                    to: 'diffView/css'
                }
            ]
        }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                // Prevent extracting license comments to a separate file
                extractComments: false
            })
        ]
    }
};
