/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Base webpack config used across other specific configs
 */

const path = require('path');
const webpack = require('webpack');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const { dependencies: externals } = require('../app/package.json');

module.exports = {
    externals: [...Object.keys(externals || {})],

    module: {
        rules: [
            {
                test: /\.worker\.ts?$/,
                use: [
                    {
                        loader: 'worker-loader',
                        options: {
                            publicPath: './',
                        },
                    },
                ],
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
            },
        ],
    },

    output: {
        path: path.join(__dirname, '..', 'app'),
        // https://github.com/webpack/webpack/issues/1114
        libraryTarget: 'commonjs2',
        webassemblyModuleFilename: 'crypto.wasm',
    },

    /**
     * Determine the array of extensions that should be used to resolve modules.
     */
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    },

    optimization: {
        moduleIds: 'named',
        emitOnErrors: true,
    },

    experiments: {
        asyncWebAssembly: true,
    },

    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
        }),
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, '.'),
        }),
    ],
};
