# Webpack Backup Ouput Plugin

Webpack plugin to create backup of the output folder (output folder name + timestamp) before files are emitted.
Useful if your build is corrupted and you want to roll back to what you had before the compilation.

It supports multi webpack config instances which are run simultaneously, which means that the other webpack compilations
won't emit files until the backup has been created.

**Note**
The backup will only be performed once for each launch, which means that the backup will only be performed upon starting up a watch build. For subsequent build the backup will not be performed.

**Warning**
If you have activated removal of the output folder, you NEED to activate the plugin for each build, otherwise the folder might be removed in the middle of files being emitted.

## Install

**npm**
```
npm install --save-dev webpack-backup-output-plugin
```

**yarn**
```
yarn add --dev webpack-backup-output-plugin
```

## Options

* **removeOutputFolder**: [boolean=true] Remove the output folder after backup
* **backupRoot**: [string|boolean=process.cwd()] Folder where to put backups (relative to current work directory),
if false is given, no backup will be made. True falls back to `process.cwd()`.

## Usage

#### ES6 Modules
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

#### ES5 (cjs)
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

#### Remove output folder without backup
```js
{
  plugins: [
    // Will result in a sort of "clean folder" (eg when in development)
    new WebpackBackupOutputPlugin({
      removeOutputFolder: true, // Will cause the output folder to be removed
      backupRoot: false // Won't create the backup
    })
  ]
}
```

## Setup multi bundler config

The plugin looks at the designated output folder (formed into a full path from the root of the current project) to determine if a backup (and possible remove) is going on before emitting files to this folder.

This however requires the plugin to be added to each config, and for the compilations to share the same NodeJS instance.

```js
// Config 1
const config1 = {
  output: {
    publicPath: `/public/`,
    filename: '[name].js?[chunkhash]'
  },
  ... other settings ...
  plugins: [
    new WebpackBackupOutputPlugin()
  ]
}

// Config 2
const config2 = {
  output: {
    // Same output is needed to have it wait for the backup to complete
    publicPath: `/public/`
  },
  ... other settings ...
  plugins: [
    new WebpackBackupOutputPlugin()
  ]
}

// Config 3 (not affected by the backup)
const config3 = {
  output: {
    // Having another public path makes it ignorant to
    // the previous backups and only wait for its own backup to finish
    publicPath: `/web/`
  },
  ... other settings ...
  plugins: [
    new WebpackBackupOutputPlugin()
  ]
}

return [config1, config2, config3]
```
