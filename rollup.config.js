import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'

const teserOptions = {
  compress: {
    pure_getters: true,
    unsafe: true,
    unsafe_comps: true
  }
}

const name = 'UnitMath'
const input = 'src/Unit.js'

export default [
  // UMD build
  {
    input,
    output: {
      name,
      file: 'dist/UnitMath.js',
      format: 'umd'
    },
    plugins: [babel()]
  },
  // minified UMD build
  {
    input,
    output: {
      file: 'dist/UnitMath.min.js',
      format: 'umd',
      indent: false,
      name
    },
    plugins: [
      babel(),
      terser(teserOptions)
    ]
  },
  // es build
  {
    input,
    output: {
      file: 'es/UnitMath.js',
      format: 'es'
    }
  },
  // minified es build
  {
    input,
    output: {
      file: 'es/UnitMath.min.js',
      format: 'es',
      indent: false
    },
    plugins: [ terser(teserOptions) ]
  }
]
