/* eslint-disable @typescript-eslint/no-var-requires */
// Check if the renderer and main bundles are built
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

const builder = require('electron-builder');

const targetNet = process.env.TARGET_NET;

let name;
let productName;
let appId;
if (targetNet) {
    name = `${process.env.npm_package_name}-${targetNet}`;
    productName = `${process.env.npm_package_productName} ${targetNet}`;
    appId = `${process.env.npm_package_build_appId}-${targetNet}`;
} else {
    name = process.env.npm_package_name;
    productName = process.env.npm_package_productName;
    appId = process.env.npm_package_build_appId;
}

builder.build({
    config: {
        extraMetadata: {
            name,
            productName,
        },
        appId,
    },
    publish: 'never',
});
