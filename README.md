# Webpack Ouput Backup Plugin

Webpack plugin to create backup of the output folder (output folder name + timestamp) before files are emitted.
Usefull if your build is corrupted and you want to roll back to what you had before the compilation.

## Install

**npm**
```
npm install --save-dev webpack-backup-output-plugin
```

**yarn**
```
yarn add --dev webpack-backup-output-plugin
```

## Usage

**ES6 Modules**
```js
import WebpackBackupOutputPlugin from 'webpack-backup-output-plugin';

// In the config
{
  ... other settings
  plugins: [
    new WebpackBackupOutputPlugin({ ... options ... })
  ]
}
```

**ES5**
```js
var WebpackBackupOutputPlugin = require('webpack-backup-output-plugin/index.es5').default;

// In the config
{
  ... other settings
  plugins: [
    new WebpackBackupOutputPlugin({ ... options ... })
  ]
}
```

## Options

* **removeOutputFolder**: [boolean]`default: true` Remove the output folder after backup
* **backupRoot**: [string]`default: process.cwd()` Folder where to put backups (relative to current work directory)
