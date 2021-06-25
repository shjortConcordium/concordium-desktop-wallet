/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const { baseConfig, assetsConfig, stylesConfig } = require('./partials');
const CheckNodeEnv = require('../internals/scripts/CheckNodeEnv');
const DeleteSourceMaps = require('../internals/scripts/DeleteSourceMaps');
const { fromRoot } = require('./helpers/pathHelpers');

CheckNodeEnv('development');
DeleteSourceMaps();

module.exports = merge(baseConfig, assetsConfig, stylesConfig(true), {
    mode: 'production',
    target: 'electron-main',
    entry: [
        'core-js',
        'regenerator-runtime/runtime',
        fromRoot('./app/preload.js'),
    ],
    output: {
        path: fromRoot('./app'),
        filename: 'preload.dev.js',
    },
});
