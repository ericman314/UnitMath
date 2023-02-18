import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'

const terserOptions = {
  compress: {
    pure_getters: true,
    unsafe: true,
    unsafe_comps: true
  }
}

const babelOptions = {
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: 'usage',
      debug: true,
      corejs: 3
    }]
  ],
  ignore: [
    'node_modules'
  ]
}

const name = 'UnitMath'
const input = 'src/Unit.ts'

const config = defineConfig([
  // UMD build
  {
    input,
    output: {
      name,
      file: 'dist/UnitMath.js',
      format: 'umd'
    },
    plugins: [
      typescript(),
      babel(babelOptions),
      commonjs()
    ]
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
      typescript(),
      babel(babelOptions),
      commonjs(),
      terser(terserOptions)
    ]
  },
  // minified UMD build
  {
    input,
    output: {
      file: 'dist/UnitMath.min2.js',
      format: 'umd',
      indent: false,
      name
    },
    plugins: [
      typescript(),
      terser(terserOptions)
    ]
  },
  // es build
  {
    input,
    output: {
      file: 'es/UnitMath.js',
      format: 'es'
    },
    plugins: [
      typescript()
    ]
  },
  // d.ts build
  // TODO: Cannot quite figure out how to get this to work.
  // {
  //   input,
  //   output: {
  //     file: 'es/UnitMath.d.ts',
  //     format: 'es'
  //   },
  //   plugins: [
  //     typescript({
  //       compilerOptions: {
  //         declaration: true,
  //         emitDeclarationOnly: true,
  //         outFile: 'es/UnitMath.d.ts',
  //       }
  //     })
  //   ]
  // },
  // minified es build
  {
    input,
    output: {
      file: 'es/UnitMath.min.js',
      format: 'es',
      indent: false
    },
    plugins: [
      typescript(),
      terser(terserOptions)
    ]
  }
])

export default config