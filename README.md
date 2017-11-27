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

* **clean**: [boolean=true] Remove the files in the output folder before emit
* **backup**: [boolean=true] Backup files in the output folder
* **files**: [string|string[]=`**/*.*`] Which files to backup and/or remove (glob expressions)
* **backupRoot**: [string|boolean='\_webpack-backup'] Folder where to put backups (relative to current work directory).

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
var WebpackBackupOutputPlugin = require('webpack-backup-output-plugin').default;

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
      clean: true, // Will cause the designated files in the output folder to be removed
      backup: false // Won't create the backup
    })
  ]
}
```

## Setup multi bundler config

Defining the plugin for several config that are run simultaneously is possible,
but you should make sure to define what type of file you want to handle in the
setup. But often you just want one config to handle the backup, so you just add
it to one config

#### Example of differntiated backups
```js
// Config 1
const config1 = {
  output: {
    path: `/public`,
    filename: '[name].js?[chunkhash]'
  },
  ... other settings ...
  plugins: [
    new WebpackBackupOutputPlugin({
      files: ['**/*.png', '*.js']
    })
  ]
}

// Config 2
const config2 = {
  output: {
    // Same output path is needed to have it wait for the backup to complete
    path: `/public`,
  },
  ... other settings ...
  plugins: [
    new WebpackBackupOutputPlugin({
      files: ['**/*.js']
    )
  ]
}

// Config 3 (not affected by the previous backups)
const config3 = {
  output: {
    // Having another path makes it ignorant to the previous
    // backups and only wait for its own backup to finish
    path: `/web`
  },
  ... other settings ...
  plugins: [
    new WebpackBackupOutputPlugin()
  ]
}

return [config1, config2, config3]
```
