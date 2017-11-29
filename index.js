const nPath = require('path');
const fs = require('fs-extra');
const color = require('colors/safe');
const glob = require('globby');
const dateformat = require('dateformat');



const cwd = process.cwd();

const cleanPromises = {};
const backupPromises = {};
const filePromises = {};

const count = {};

let logs = [];
let errors = [];



const defaultSettings = {
  clean: true,
  backup: true,
  files: '**/*.*',
  backupRoot: '_webpack-backup'
};



class BackupOutputPlugin {
  constructor(options) {
    this.options = Object.assign(defaultSettings, options);
    this.instanceAdded();
  }

  globToId() {
    const { files: fileGlobs } = this.options;
    return typeof fileGlobs === 'string' ? fileGlobs : fileGlobs.join('-');
  }

  instanceAdded() {
    const id = this.globToId();

    if(!count[id]) {
      count[id] = { instance: 0, done: 0 };
    }

    count[id].instance++;
  }

  instanceDone() {
    const id = this.globToId();
    if(count[id]) { count[id].done++; }
  }

  getFiles() {
    const id = this.globToId();

    if(!filePromises[id]) {
      let { files: fileGlobs } = this.options;
      fileGlobs = (typeof fileGlobs === 'string' ? [fileGlobs] : fileGlobs)
        .map((file) => nPath.join(this.outputPath, file));

      filePromises[id] = glob(fileGlobs);
    }

    return filePromises[id];
  }

  removeEmptyDirectories() {
    return glob(nPath.join(this.outputPath, '**', '!(*.*)'), { nodir: false })
      .then((dirs) => dirs.filter((path) => fs.lstatSync(path).isDirectory()))
      .then((dirs) => {
        dirs.sort((a, b) => {
          if(a === b) { return 0; }

          const regex = /[/\\]/g;
          const A = a.match(regex);
          const B = b.match(regex);

          if(!A && B) { return 1; }
          if(A && !B) { return -1; }
          if(!A && !B) { return a > b ? -1 : 1; }

          const ALen = A.length;
          const BLen = B.length;

          if(ALen === BLen) { return a > b ? -1 : 1; }
          return BLen - ALen;
        });

        return dirs;
      })
      .then((dirs) => dirs.reduce((removed, dir) => {
        if(!fs.readdirSync(dir).length) {
          try {
            fs.removeSync(dir);
            removed.push(dir);
          } catch(error) {
            errors.push({ message: `Failed to delete empty folder: ${dir}`, error });
          }
        }

        return removed;
      }, []));
  }

  removeFiles(files) {
    const id = this.globToId();

    if(!cleanPromises[id]) {
      if(!files.length) {
        logs.push('No files in output folder to clean');
        cleanPromises[id] = Promise.resolve(files);
      } else {
        cleanPromises[id] = Promise.all(files.map((file) => fs.remove(file)))
          .then(() => this.removeEmptyDirectories())
          .then(() => {
            logs.push('Output folder cleaned');
            return files;
          })
          .catch((error) => {
            errors.push({
              message: 'Failed to delete one or more files',
              error
            });

            return files;
          });
      }
    }

    return cleanPromises[id];
  }

  backupFiles(files) {
    const { backupRoot } = this.options;
    const id = this.globToId();

    if(!backupPromises[id]) {
      const backupPath = nPath.join(cwd, backupRoot, dateformat(new Date(), 'yyyy-mm-dd-HH-MM'));

      if(!files.length) {
        logs.push('No files in output folder to backup');
        backupPromises[id] = Promise.resolve(files);
      } else {
        backupPromises[id] = Promise.all(
          files.map(
            (file) => {
              const copyPath = nPath.join(backupPath, nPath.relative(this.outputPath, file));
              return fs.copy(file, copyPath);
            }
          )
        )
          .then(() => {
            logs.push('Files successfully backed up');
            return files;
          })
          .catch((error) => {
            errors.push({
              message: 'Failed to backup one or more files',
              error
            });

            return files;
          });
      }
    }

    return backupPromises[id];
  }

  displayFeedback() {
    const id = this.globToId();
    const currCount = count[id];
    if(!currCount || currCount.instance > currCount.done) { return; }

    /* eslint-disable no-console */
    console.log('\n--- Backup Plugin ---');

    logs.forEach((message) => console.log(color.yellow('- ' + message)));

    errors.forEach(({ message, error }) => {
      console.log(color.red(message));
      console.error(error.message);
      error.stack && console.errors(error.stack);
    });

    console.log('---------------------\n');
    /* eslint-enable */

    logs = [];
    errors = [];
  }

  apply(compiler) {
    let outputPath = compiler.options.output.path;
    const { clean, backup } = this.options;

    this.outputPath = nPath.resolve(cwd, outputPath);

    compiler.plugin('run', (compilation, cb) => {
      logs = [];
      errors = [];

      // We do the backup while compiler is running to save some time
      this.prom = this.getFiles();

      if(backup) {
        this.prom = this.prom.then((files) => this.backupFiles(files));
      }

      cb();
    });

    compiler.plugin('emit', (compilation, cb) => {
      if(!this.prom) { return cb(); }


      // We do the cleaning at emit time, so we are sure that the build succeeded
      if(clean) {
        this.prom = this.prom.then((files) => this.removeFiles(files));
      }

      this.prom.then(() => cb());
    });

    compiler.plugin('done', () => {
      if(!this.prom) { return; }

      this.instanceDone();
      this.displayFeedback();
      this.prom = null;
    });
  }
}

export default BackupOutputPlugin;
