import fs from 'fs-extra';

export default (files) => Promise.all(files.map((file) => fs.remove(file)));
