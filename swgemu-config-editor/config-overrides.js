const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  // Enable caching for faster rebuilds
  config.cache = {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  };

  // Tell webpack to not bundle certain Node.js modules and 
  // treat them as external dependencies
  config.externals = {
    ...config.externals,
    electron: 'require("electron")',
    'fs': 'require("fs")',
    'path': 'require("path")'
  };
  
  // Add polyfills for browser environment
  config.plugins.push(
    new NodePolyfillPlugin({
      excludeAliases: ['console', 'fs', 'path']
    })
  );

  // Provide fallbacks for other Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    os: require.resolve('os-browserify/browser'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/')
  };

  // Explicitly add a condition to check if modules are used in a Node.js context
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.type': JSON.stringify(process.type)
    })
  );

  return config;
};
