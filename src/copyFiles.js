import nPath from 'path';
import fs from 'fs-extra';

import unixPath from './unixPath';

export default (toDir, files) => Promise.all(
  files.map((file) => {
    const filePath = nPath.relative(process.cwd(), file).replace(/^[.\\/]+/, '');
    const copyPath = unixPath(nPath.join(toDir, filePath));
    return fs.copy(file, copyPath);
  })
);
