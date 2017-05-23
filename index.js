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

class BackupOutputPlugin {
  constructor(options) {
    this.options = Object.assign({
      removeOutputFolder: true,
      backupRoot: cwd
    }, options);

    this.options.backupRoot = relativeToCwd(this.options.backupRoot);
  }

  apply(compiler) {
    const options = this.options;
    let backupPath;
    let { backupRoot, removeOutputFolder } = options;

    compiler.plugin('emit', (compilation, cb) => {
      if(backupPath) { return cb(); }

      const outputPath = relativeToCwd(compiler.outputPath);
      const action = removeOutputFolder ? 'move' : 'copy';
      backupPath = nPath.resolve(backupRoot, `${outputPath}-${(new Date()).format('YYYY-MM-DD-HH-mm-ss')}`);

      fs.stat(outputPath)
        .then(() => fs[action](outputPath, backupPath))
        .then(() => {
          console.log(color.green('BACKUP CREATED'));
          cb();
        })
        .catch((err) => {
          displayError('Failed to CREATE backup', err);
          cb();
        });
    });
  }
}

export default BackupOutputPlugin;
