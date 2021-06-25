/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Base webpack config used across other specific configs
 */

const path = require('path');
const webpack = require('webpack');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const { dependencies: externals } = require('../../app/package.json');

const extensions = ['.js', '.jsx', '.json', '.ts', '.tsx'];

if (
    process.env.TARGET_NET &&
    !['stagenet', 'testnet'].includes(process.env.TARGET_NET)
) {
    throw new Error(
        `Unknown TARGET_NET. Only [stagenet,testnet] are allowed values. Given: ${process.env.TARGET_NET}`
    );
}

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
                include: /app/,
                loader: 'ts-loader',
            },
        ],
    },

    output: {
        path: path.join(__dirname, '..', 'app'),
        // https://github.com/webpack/webpack/issues/1114
        library: {
            name: 'output_library',
            type: 'commonjs2',
        },
        webassemblyModuleFilename: 'crypto.wasm',
    },

    /**
     * Determine the array of extensions that should be used to resolve modules.
     */
    resolve: {
        extensions,
        modules: [path.join(__dirname, '..', 'app'), 'node_modules'],
        plugins: [
            new TsconfigPathsPlugin({
                extensions,
            }),
        ],
    },

    optimization: {
        moduleIds: 'named',
        emitOnErrors: true,
    },

    experiments: {
        syncWebAssembly: true,
    },

    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
            TARGET_NET: '',
        }),
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, '.'),
        }),
        new webpack.NormalModuleReplacementPlugin(
            /\.\.\/migrations/,
            '../util/noop.js'
        ),
        new NodePolyfillPlugin(),
    ],
};
