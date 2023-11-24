# Changelog

## [1.0.2] - 2023-11-24

- Set `exports` in `package.json`, which fixes imports in Node and Deno when using `require` or `import()`

## [1.0.1] - 2023-10-21

_This is an attempt to correctly export types._

### Fixed

- Set `module` entry point in package.json to `es/UnitMath.js`
- Set `types` in package.json to `es/UnitMath.d.ts`
