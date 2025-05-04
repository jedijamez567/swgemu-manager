# Webpack Configuration Solution for Electron + React

This document explains the solution implemented to resolve the webpack configuration issue with Node.js core modules in the SWGEmu Config Editor application.

## Problem

When building the Electron + React application with Create React App (which uses webpack 5), we encountered the following error:

```
ERROR in ./node_modules/electron/index.js 1:11-24
Module not found: Error: Can't resolve 'fs' in '...electron'
ERROR in ./node_modules/electron/index.js 2:13-28
Module not found: Error: Can't resolve 'path' in '...electron'

BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
This is no longer the case. Verify if you need this module and configure a polyfill for it.
```

This occurred because webpack 5 no longer includes polyfills for Node.js core modules by default, and the Electron module requires Node.js modules like 'fs' and 'path'.

## Solution

We implemented a solution using `react-app-rewired` to customize the webpack configuration without ejecting from Create React App:

### 1. Install Required Packages

```bash
npm install --save-dev react-app-rewired node-polyfill-webpack-plugin path-browserify os-browserify crypto-browserify stream-browserify buffer
```

### 2. Create a config-overrides.js File

```javascript
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

module.exports = function override(config, env) {
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
```

### 3. Update package.json Scripts

Update the npm scripts in package.json to use react-app-rewired instead of react-scripts:

```json
"scripts": {
  "start": "concurrently \"cross-env BROWSER=none react-app-rewired start\" \"wait-on http://localhost:3000 && electron .\"",
  "react-start": "react-app-rewired start",
  "electron-start": "electron .",
  "build": "react-app-rewired build && electron-builder",
  "test": "react-app-rewired test",
  "eject": "react-scripts eject",
  "electron-pack": "electron-builder"
}
```

## How It Works

The solution works by:

1. **Externalizing Node.js Modules**: We tell webpack to not bundle 'electron', 'fs', and 'path' modules, and instead rely on the runtime versions provided by Node.js.

2. **Providing Polyfills for Browser Environment**: For other Node.js core modules that might be used, we provide browser-compatible polyfills.

3. **Context-Aware Module Resolution**: The DefinePlugin helps webpack determine whether a module is running in Node.js or browser context.

## Key Insights

- In an Electron application, there are two distinct execution contexts:
  - **Main Process**: A Node.js process that has full access to Node.js APIs.
  - **Renderer Process**: A browser environment where React runs and which doesn't have direct access to Node.js APIs.

- The issue arises when webpack tries to bundle Node.js modules into the renderer process code.

- Our solution ensures that:
  1. Code that needs Node.js modules like 'fs' and 'path' accesses them via IPC to the main process.
  2. Webpack doesn't try to bundle these modules into the renderer process code.
  3. Other Node.js modules have appropriate browser polyfills when needed.

## Future Maintenance

If you add new Node.js modules that are used in the Electron main process (public/electron.js), you may need to add them to the `externals` object in the config-overrides.js file.
