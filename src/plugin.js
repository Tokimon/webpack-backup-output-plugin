import cleaner from './cleaner';



const defaultSettings = {
  clean: true,
  backup: true,
  files: '**/*.*',
  backupRoot: '_webpack-backup'
};

const completeOptions = (options) => {
  options = Object.assign({}, defaultSettings, options);

  let { files } = options;
  if (typeof files === 'string') { files = [files]; }

  options.files = files;

  return options;
};



class BackupOutputPlugin {
  constructor(options) {
    this.name = 'Backup Output Plugin';
    this.options = completeOptions(options);
  }

  apply(compiler) {
    const {
      clean: shouldClean,
      backup: shouldBackup,
      files,
      backupRoot
    } = this.options;

    if (!shouldClean && !shouldBackup) { return; }

    const { done, clean, backup } = cleaner(
      compiler.options.output.path,
      files
    );

    let backupPromise;

    if (shouldBackup) {
      // We start the backup while compiler is running to save some time
      compiler.hooks.run.tap(this.name, () => {
        backupPromise = backup(backupRoot);
      });
    }

    // We do the cleaning at emit time, so we are sure that the build succeeded
    compiler.hooks.emit.tapPromise(this.name, () => {
      return shouldClean ? clean() : backupPromise;
    });

    compiler.hooks.done.tap(this.name, () => { done(); });
  }
}

export default BackupOutputPlugin;
