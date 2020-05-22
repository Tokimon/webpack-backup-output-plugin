import nPath from 'path';
import fs from 'fs-extra';
import glob from 'globby';

import unixPath from './unixPath';



const onlyDirectories = (paths) => paths.filter((path) => fs.lstatSync(path).isDirectory());

const pathSort = (a, b) => {
  if (a === b) { return 0; }

  const A = a.split(/[/\\]/);
  const B = b.split(/[/\\]/);

  const ALen = A.length;
  const BLen = B.length;

  return ALen === BLen
    ? a > b ? -1 : 1
    : BLen - ALen;
};

export default async (path) => {
  const exp = unixPath(nPath.join(path, '**', '!(*.*)'));
  const paths = await glob(exp, { nodir: false });
  const dirs = onlyDirectories(paths).sort(pathSort);

  return dirs.reduce(
    (obj, dir) => {
      if (!fs.readdirSync(dir).length) {
        try {
          fs.removeSync(dir);
          obj.ok.push(dir);
        } catch (error) {
          obj.fail.push({
            message: `Failed to delete empty folder: ${dir}`,
            error
          });
        }
      }

      return obj;
    },
    { ok: [], fail: [] }
  );
};
