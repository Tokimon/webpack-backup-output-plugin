const nPath = require('path');
const fs = require('fs');
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

      fs.stat(outputPath, (err) => {
        if(err) { return; }

        fs[action](outputPath, backupPath, (err) => {
          err
            ? displayError('Failed to CREATE backup', err)
            : console.log(color.green('BACKUP CREATED'));

          cb();
        });
      });
    });
  }
}

export default BackupOutputPlugin;
