import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

const config = {
  input: 'src/plugin.js',
  output: {
    file: 'index.js',
    format: 'cjs'
  },
  plugins: [
    babel({ babelHelpers: 'bundled' }),
    terser()
  ],
  external: ['path', 'globby', 'date-fns/format', 'fs-extra', 'colors/safe', 'boxen']
};

export default config;
