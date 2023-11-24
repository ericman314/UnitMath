# Changelog

## [1.0.2] - 2023-11-24

- Set `exports` in `package.json`, which fixes imports in Node and Deno when using `require` or `import()`

## [1.0.1] - 2023-10-21

_This is an attempt to correctly export types._

### Fixed

- Set `module` entry point in package.json to `es/UnitMath.js`
- Set `types` in package.json to `es/UnitMath.d.ts`

## [1.0.0] - 2023-02-20

V1 is a major rewrite of UnitMath in TypeScript. While most of the API remains the same, V1 does introduce several breaking changes from v0.8.7. See [Migrating to v1](migrating-to-v1.md) for details.

- `toString` no longer simplifies units. You must now explicitly call `simplify` for the unit to be simplified.
- Removed `simplify` and `simplifyThreshold` options.
- Removed `definitions.quantities` and `definitions.baseQuantities`.
- Renaned `definitions.unitSystems` to `definitions.systems`
- Renamed `definitions.prefixes` to `definitions.prefixGroups`
- Each system defined in `definitions.systems` is now just a string array of units assigned to that system.
- Removed `autoAddToSystem` option, since it is now much easier to add units to a system.
- Customer formatters no longer accept additional user arguments.

## [1.0.0-rc.2] - 2023-02-19
- `toString` no longer simplifies units. The user must now explicitly call `simplify` for the unit to be simplified.
- Removed `simplifyThreshold` option, since units are now only simplified when calling `simplify`.
- Many updates to the README.
- Many tests had to be altered to reflect the changes to `toString` and `simplify`.

## [0.8.7] - 2021-09-28
- Parse strings `NaN`, `Infinity`, and `-Infinity`

## [1.0.0-rc.1] - 2020-11-20
- Convert to TypeScript
- Removed concept of "quantities" and "base quantities"
- Simplified how systems are defined and used in formatting
- Simpler way to define units
- Renamed many variables and API functions to make their meaning less ambiguous
- Updated README.md

## [0.8.6] - 2020-07-13
- Standardized on US customary fluid volumes
- Corrected values for `teaspoon` and `fluidounce`

## [0.8.5] - 2019-11-23
- `compare` now handles NaNs consistently

## [0.8.4] - 2019-08-05
- Added `prefixesToChooseFrom` option
- Bugfix when auto-prefixing negative numbers

## [0.8.3] - 2019-06-04
- `split` now supports custom types

## [0.8.2] - 2019-06-01
- Fixed unit complexity calculation for deciding whether to simplify units
- Added undocumented second parameter to `conv` function, which could be removed at any time

## [0.8.1] - 2019-06-01
- Format function can now be used with number or custom types
- Now supports passing parameters to custom format function

## [0.8.0] - 2019-05-30
- Added `getValue`, `getNormalizedValue`, and `setNormalizedValue`
- Added format option for custom types

## [0.7.0] - 2019-05-28
- Added compare

## [0.6.0] - 2019-05-28
- Implement valueOf()
- Added lessThan, lessThanOrEqual, greaterThan, greaterThanOrEqual

## [0.5.0] - 2019-05-27
- Added setValue
- Fixed bug with custom type formatting
- Fixed candela unit definition

## [0.4.0] - 2019-05-26
- Added split
- Better support for parsing of custom types

## [0.3.0] - 2019-05-23
- Added abs
- Basic functionality with custom types (tested with Decimal.js, some features may not work)

## [0.2.1] - 2019-05-19
- Added numerous tests to improve test coverage
- Removed some unnecessary statements and branches
- Minor bug fixes
- Updated README

## [0.2.0] - 2019-05-18
- Major refactoring of UnitStore.js to simplify the units definitions
- Custom units now work with config options
- Added code coverage (but doesn't seem to be instrumenting all the files yet)

## [0.1.1] - 2019-05-09
- This patch actually includes the built files (I hope).

## [0.1.0] - 2019-05-08

- First public release of UnitMath.
- README is mostly up-to-date. Some of the API has not yet been implemented.