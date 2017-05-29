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

      let prom = outputsBackedUp.get(outputPath);

      if(!prom) {
        const outputPathRelative = relativeToCwd(outputPath);

        if(typeof backupRoot !== 'string') {
          if(removeOutputFolder) {
            prom = fs.remove(outputPath)
              .then(() => console.log(color.yellow('OUTPUT FOLDER REMOVED'), ':', outputPath))
              .catch((err) => {
                displayError('Failed REMOVE output folder', err);
              });
          } else {
            prom = Promise.resolve();
          }
        } else {
          const action = removeOutputFolder ? 'move' : 'copy';
          const backupPath = nPath.resolve(
            relativeToCwd(backupRoot),
            `${outputPathRelative}-${(new Date()).format('YYYY-MM-DD-HH-mm-ss')}`
          );

          prom = fs.stat(outputPath)
            .then(() =>
              fs[action](outputPath, backupPath)
                .then(() => console.log(color.green('BACKUP CREATED'), ':', backupPath))
                .catch((err) => {
                  displayError('Failed to CREATE backup', err);
                })
            );
        }

        outputsBackedUp.set(outputPath, prom);
      }

      prom.then(() => cb());
    });
  }
}

export default BackupOutputPlugin;
