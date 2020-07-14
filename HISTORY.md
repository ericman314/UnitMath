# History

## 2020-07-13, v0.8.6
- Standardized on US customary fluid volumes
- Corrected values for `teaspoon` and `fluidounce`

## 2019-11-23, v0.8.5
- `compare` now handles NaNs consistently

## 2019-08-05, v0.8.4
- Added `prefixesToChooseFrom` option
- Bugfix when auto-prefixing negative numbers

## 2019-06-04, v0.8.3
- `split` now supports custom types

## 2019-06-01, v0.8.2
- Fixed unit complexity calculation for deciding whether to simplify units
- Added undocumented second parameter to `conv` function, which could be removed at any time

## 2019-06-01, v0.8.1
- Format function can now be used with number or custom types
- Now supports passing parameters to custom format function

## 2019-05-30, v0.8.0
- Added `getValue`, `getNormalizedValue`, and `setNormalizedValue`
- Added format option for custom types

## 2019-05-28, v0.7.0
- Added compare

## 2019-05-28, v0.6.0
- Implement valueOf()
- Added lessThan, lessThanOrEqual, greaterThan, greaterThanOrEqual

## 2019-05-27, v0.5.0
- Added setValue
- Fixed bug with custom type formatting
- Fixed candela unit definition

## 2019-05-26, v0.4.0
- Added split
- Better support for parsing of custom types

## 2019-05-23, v0.3.0
- Added abs
- Basic functionality with custom types (tested with Decimal.js, some features may not work)

## 2019-05-19, v0.2.1
- Added numerous tests to improve test coverage
- Removed some unnecessary statements and branches
- Minor bug fixes
- Updated README

## 2019-05-18, v0.2.0
- Major refactoring of UnitStore.js to simplify the units definitions
- Custom units now work with config options
- Added code coverage (but doesn't seem to be instrumenting all the files yet)

## 2019-05-09, v0.1.1
- This patch actually includes the built files (I hope).

## 2019-05-08, v0.1.0

- First public release of UnitMath.
- README is mostly up-to-date. Some of the API has not yet been implemented.