const nPath = require('path');
const fs = require('fs-extra');
const color = require('colors/safe');

require('date-format-lite');

const cwd = process.cwd();

function displayError(message, err) {
  console.log(color.yellow(message));
  console.error(err.message);
  err.stack && console.error(err.stack);
}

function relativeToCwd(path) {
  return nPath.relative(cwd, nPath.normalize(path))
    .replace(/^([.][.]?[\\/])*/, '');
}

let outputsBackedUp = new Map();

class BackupOutputPlugin {
  constructor(options) {
    options = Object.assign({
      removeOutputFolder: true,
      backupRoot: '_webpack-backup'
    }, options);

    this.options = options;
  }

  apply(compiler) {
    let { backupRoot, removeOutputFolder } = this.options;

    compiler.plugin('emit', (compilation, cb) => {
      let { outputPath } = compiler;
      outputPath = outputPath.replace(/[/\\]+$/, '');

      let prom = outputsBackedUp.get(outputPath);

      if(!prom) {
        const outputPathRelative = relativeToCwd(outputPath);

        if(backupRoot === true) { backupRoot = ''; }

        if(typeof backupRoot !== 'string') {
          // If no "backupRoot" is given we either remove the fodler or just
          // continue without doing more

          if(removeOutputFolder) {
            // Remove folder
            prom = fs.remove(outputPath)
              .then(() => console.log(color.yellow('OUTPUT FOLDER REMOVED'), ':', outputPath))
              .catch((err) => {
                displayError('Failed REMOVE output folder', err);
              });
          } else {
            // Do nothing
            prom = Promise.resolve();
          }
        } else {
          // Create the backup

          const action = removeOutputFolder ? 'move' : 'copy';
          const backupPath = nPath.resolve(
            relativeToCwd(backupRoot),
            `${outputPathRelative}-${(new Date()).format('YYYY-MM-DD-hh-mm-ss')}`
          );

          prom = fs.stat(outputPath)
            .then(() =>
              fs[action](outputPath, backupPath)
                .then(() => console.log(color.green('BACKUP CREATED'), ':', backupPath))
                .catch((err) => {
                  displayError('Failed to CREATE backup', err);
                })
            )
            .catch(() => console.log(color.yellow('No output to backup')));
        }

        outputsBackedUp.set(outputPath, prom);
      }

      // No matter what we continue once the promise is done (might be straight away)
      prom.then(() => cb());
    });
  }
}

export default BackupOutputPlugin;
