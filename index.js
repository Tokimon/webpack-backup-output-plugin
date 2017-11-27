const nPath = require('path');
const fs = require('fs-extra');
const color = require('colors/safe');
const glob = require('globby');
const dateformat = require('dateformat');



const cwd = process.cwd();



function relativeToCwd(path) {
  return nPath.relative(cwd, nPath.normalize(path))
    .replace(/([.][.]?[\\/])*/, '');
}



const defaultSettings = {
  clean: true,
  backup: true,
  files: '**/*.*',
  backupRoot: '_webpack-backup'
};



class BackupOutputPlugin {
  constructor(options) {
    this.options = Object.assign(defaultSettings, options);
    this.logs = [];
    this.errors = [];
  }

  removeFiles(files) {
    return Promise.all(files.map((file) => fs.remove(file)))
      .then(() => {
        this.logs.push('Output folder cleaned');
        return files;
      })
      .catch((error) => {
        this.errors.push({
          message: 'Failed to delete one or more files',
          error
        });

        return files;
      });
  }

  backupFiles(files) {
    const { backupRoot } = this.options;
    const backupPath = nPath.join(cwd, backupRoot, dateformat(new Date(), 'yyyy-mm-dd-HH-MM'));

    return fs.stat(this.outputPath)
      .then(() =>
        Promise.all(
          files.map(
            (file) => {
              const copyPath = nPath.join(backupPath, nPath.relative(this.outputPath, file));
              return fs.copy(file, copyPath);
            }
          )
        )
          .then(() => {
            this.logs.push('Files successfully backed up');
            return files;
          })
          .catch((error) => {
            this.errors.push({
              message: 'Failed to backup one or more files',
              error
            });

            return files;
          })
      )
      .catch(() => {
        this.logs.push('No files in output folder to backup');
        return files;
      });
  }

  displayFeedback() {
    /* eslint-disable no-console */
    console.log('\n--- Backup Plugin ---');

    this.logs.forEach((message) => console.log(color.yellow('- ' + message)));

    this.errors.forEach(({ message, error }) => {
      console.log(color.red(message));
      console.error(error.message);
      error.stack && console.errors(error.stack);
    });

    console.log('---------------------\n');
    /* eslint-enable */
  }

  apply(compiler) {
    let outputPath = compiler.options.output.path;
    let { files: fileGlobs } = this.options;
    const { clean, backup } = this.options;

    this.outputPath = relativeToCwd(outputPath);

    fileGlobs = (typeof fileGlobs === 'string' ? [fileGlobs] : fileGlobs)
      .map((file) => nPath.join(this.outputPath, file));

    compiler.plugin('run', (compilation, cb) => {
      this.logs = [];
      this.errors = [];

      // We do the backup while compiler is running to save some time
      this.fileProm = glob(fileGlobs);

      if(backup) {
        this.fileProm = this.fileProm.then((files) => this.backupFiles(files));
      }

      cb();
    });

    compiler.plugin('emit', (compilation, cb) => {
      if(!this.fileProm) { return cb(); }

      // We do the cleaning at emit time, so we are sure that the build succeeded
      if(clean) {
        this.fileProm = this.fileProm.then((files) => this.removeFiles(files));
      }

      this.fileProm.then(() => {
        this.fileProm = null;
        cb();
      });
    });

    compiler.plugin('done', () => {
      this.displayFeedback();
    });
  }
}

export default BackupOutputPlugin;
