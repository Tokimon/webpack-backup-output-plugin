import nPath from 'path';
import glob from 'globby';
import dateformat from 'date-fns/format';
import color from 'colors/safe';
import boxen from 'boxen';

import removeFiles from './removeFiles';
import removeEmptyDirs from './removeEmptyDirs';
import copyFiles from './copyFiles';
import unixPath from './unixPath';



/**
 * instances: {
 *   total: Number,
 *   completed: Number
 *   [path]: {
 *     globs: String[],
 *     files: Array | Error,
 *     clean: True | 0 | error,
 *     backup: True | 0 | Error
 *     backupPath: String
 *   }
 * }
 */



const instances = { completed: 0, total: 0, paths: {} };



function getInstance(outputPath) {
  return instances.paths[outputPath];
}

function loadFiles(outputPath, globs) {
  return glob(globs.map(
    (file) => unixPath(nPath.join(outputPath, file))
  ));
}

function addInstance(outputPath, globs) {
  if (!getInstance(outputPath)) {
    instances.paths[outputPath] = {
      globs,
      files: loadFiles(outputPath, globs),
      clean: null,
      backup: null
    };
  }

  instances.total++;
}

function instanceDone() {
  const { total } = instances;
  total > 0 && ++instances.completed >= total && log();
}

function globReport(status) {
  switch (status) {
    case true: return color.green('Success');
    case 0: return color.gray('Empty');
    default: return color.red('Fail');
  }
}

function log() {
  const message = Object.entries(instances.paths)
    .reduce((m, [path, entry]) => {
      const { clean, backup, backupPath } = entry;

      m.push('\n' + color.gray(path) + '\n');

      if (backup !== null) {
        m.push(
          color.yellow('Backup:') + ' ' +
          globReport(backup) + ' ' +
          color.gray(`(${backupPath})`)
        );
      }

      if (clean !== null) {
        m.push(color.yellow('Clean:') + ' ' + globReport(clean));
      }

      return m;
    }, [color.yellow('Backup Plugin Report')]);

  console.log(boxen(
    message.join('\n'),
    {
      margin: 1,
      padding: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      dimBorder: true
    }
  ));


  /* eslint-disable no-console */
  // errors.forEach(({ message, error }) => {
  //   console.log(color.red(message));
  //   console.error(error.message);
  //   if (error.stack) { console.errors(error.stack); }
  // });
  /* eslint-enable */
}



async function cleanFiles(outputPath) {
  const instance = getInstance(outputPath);
  const { files, backup, clean } = instance;
  if (clean !== null) { return; }

  const paths = await files;

  if (!paths.length) {
    instance.clean = 0;
    return;
  }

  if (backup) { await backup; }

  try {
    await removeFiles(paths);
    await removeEmptyDirs(outputPath);

    instance.clean = true;
  } catch (error) {
    instance.clean = error;
  }
}

async function backupFiles(outputPath, backupPath) {
  const instance = getInstance(outputPath);
  const { files, backup } = instance;
  if (backup !== null) { return; }

  const paths = await files;

  if (!paths.length) {
    instance.backup = 0;
    return;
  }

  const toPath = nPath.resolve(
    backupPath,
    dateformat(new Date(), 'yyyy-MM-dd-HH-mm')
  );

  try {
    await copyFiles(toPath, paths);

    instance.backup = true;
    instance.backupPath = toPath;
  } catch (error) {
    instance.backup = error;
  }
}



export default (outputPath, globs) => {
  outputPath = unixPath(nPath.resolve(outputPath));

  addInstance(outputPath, globs);

  return {
    done() {
      instanceDone();
    },

    clean() {
      return cleanFiles(outputPath);
    },

    backup(rootPath) {
      return backupFiles(outputPath, rootPath);
    }
  };
};
