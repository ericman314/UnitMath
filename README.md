# UnitMath
UnitMath is a JavaScript library for unit conversion and arithmetic. 

[![Build Status](https://travis-ci.org/ericman314/UnitMath.svg?branch=master)](https://travis-ci.org/ericman314/UnitMath)

## Install

```
npm install unitmath
```

***The following API may only be partially implemented.***

## Use

```js
const unit = require('unitmath')

unit('5 m').div('2 s')   // 2.5 m / s
```

### Creating Units

To create a unit, use the `unit` factory function, passing either a single string, or a number and a string:

```js

// String
let a = unit('40 mile')
let b = unit('hour')

// Number and string
let g = unit(9.8, 'm/s^2')
let h = unit(19.6, 'm')
```

Units can be simple (`4 kg`) or compound (`8.314 J/mol K`). They may also be valueless (`hour`).

#### Parsing Units

When units are parsed from strings, they must be in the following format:

``` 
unit:
[value] [numerator] [/ denominator]


numerator, denominator:
[prefix]unit [^ power]

value, power:
Any valid floating point number
```

Example:

```js
unit('8.314 kg m^2 / s^2 mol K')
```

Parentheses are not allowed. Any units appearing before a `/` are in the numerator of the resulting unit, and any units appearing after the `/` are in the denominator. Any `*`'s will be ignored.

### Performing operations on units

#### Arithmetic

```js
a.div(b)    // 40 mile / hour
```

#### Conversion

```js
a.to('km')   // TODO: output

unit('10 kg').to('lbm')    // TODO: output

unit('kg').to('lbm').value   // TODO: output
```

Multiple operations can be chained together:

```js
h.mul(2).divide(g).sqrt()   // 2 s
```

Strings and numbers are implicitly converted to units within a chained expression:

```js
unit('3 ft').add('6 in').times(2)   // 7 ft
```

When chaining operators, JavaScript will execute the operators in order from left to right, so your "expression" may not follow the usual, mathematical order of operations.

All the operators are also available on the `unit` namespace; so if you love nested parentheses, we've got you covered:

```js
unit.times(unit.add('3 ft', '6 in'), 2)
```

Units are immutable, so every operation on a unit creates a new unit.

### Formatting

Use either the `toString` or `format` methods to format a unit as a string:

```js
// TODO: example
```

If the `prefix` or `simplify` options are set (which they are by default), the `toString` and `format` methods will try to simplify the unit before outputting. This can be prevented by calling `.to()` on a unit with no parameters, which will return a new unit that will *not* be simplified automatically.


### Configuring

UnitMath can be configured using `unit.config(options)`. The function returns a **new*** instance of UnitMath with the specified configuration options:

```js
const unit = require('unitmath').config(options)    // TODO: show simple example using actual options
```

These are the available options and their defaults:

- `parentheses: false`. When formatting a unit, group the numerator and/or denominator in parentheses if multiple units are present.

- `precision: 16`. The number of significant figures to output when converting a unit to a string. Reducing this can help reduce the appearance of round-off errors, which happen quite frequently when using a computer. (It is the author's belief that all attempts to eliminate round-off error eventually converge toward the strategy of carrying around extra digits during a calculation, and then hiding them before showing the answer to the user.)

- `prefix: 'auto'`. When formatting a unit, this option will specify whether the `toString` and `format` methods are allowed to choose an appropriately sized prefix in case of very small or very large quantities. Possible values are `'auto'`, `'always'`, or `'never'`. If `'auto'` is chosen, then a prefix is always chosen unless the `unit` was constructed using the `to()` method.

- `prefixMin: 0.1`. When choosing a prefix, the smallest formatted value of a `unit` that is allowed.

- `prefixMax: 1000`. When choosing a prefix, the largest formatted value of a `unit` that is allowed.

- `simplify: 'auto'`. Specifies if UnitMath should simplify units in the `toString` or `format` methods. Possible values are `'auto'`, `'always'`, or `'never'`. If `'auto'` or `'always'`, then `u.toString()` essentially becomes equivalent to `u.simplify(true).toString()`. The original `u` is never modified. When `'auto'` is used, simplification is skipped if the unit is valueless or was constructed using the `to()` method.

- `simplifyThreshold: 2`. A factor that affects whether a `unit` gets simplified. Simplification will not occur unless the 'complexity' of the resulting `unit` is reduced by an amount equal to or greater than the `simplifyThreshold`. A lower value results in more `unit`s being simplified, while a higher number results in fewer `unit`s being simplified. The complexity of a `unit` is roughly equal to the number of 'symbols' that are required to write the `unit`.

- `system: 'auto'`. The unit system to use when simplifying a `unit`. Available systems are `si`, `cgs`, `us`, and `auto`. When `system === 'auto'`, UnitMath will try to infer the unit system from the individual units that make up that `unit`.

  Example:

  ```js
  unit = unit.config({ system: 'auto' })

  unit('150 lbf').div('10 in^2').toString()  // "15 psi"
  unit('400 N').div('10 cm^2').toString()  // "400 kPa"
  ```

- `subsystem: 'auto'` *Not yet implemented.* The subsystem, or technical field, etc., to use when simplifying a `unit`. It can provide additional hints about which units to use when there are multiple options within the same system. Available subsystems are `'mechanics'`, `'chemistry'`, `'electricity_and_magnetism'`, etc. When `subsystem === 'auto'`, UnitMath will try to infer the subsystem from the individual units that make up that `unit`:

  Example:

  ```js
  unit = unit.config({ subsystem: 'auto' })

  unit('240 V').mul('5 A').mul('1 hr').toString()  // "1.2 kWh"
  unit('4000 kg').mul('9.8 m/s^2').mul('100 m').toString()  // "3.92 MJ"
  ```

- `unit`. An object that allows you to add to or modify the built-in units.
  
  TODO

- `type`. An object that allows UnitMath to work with custom numeric types. Each property of `type` is a function that accepts one or more parameters (most of which are of the custom numeric type). Below are all of the available functions, along with the required function signatures and return values, where `T` represents the custom numeric type:

  - `add: function(a:T, b:T): T`
  - `sub: function(a:T, b:T): T`
  - `mul: function(a:T, b:T): T`
  - `div: function(a:T, b:T): T`
  - `pow: function(a:T, b:number): T`
  - `abs: function(a:T): T`
  - `eq: function(a:T, b:T): boolean`
  - `lt: function(a:T, b:T): boolean`
  - `gt: function(a:T, b:T): boolean`
  - `le: function(a:T, b:T): boolean`
  - `ge: function(a:T, b:T): boolean`
  - `clone: function(a:T): T`
  - `conv: function(a:number): T`

  Example:

  ```js
  // TODO
  ```

Calling `unit.config()` with no arguments will return the currently set options.

Example:

```js
console.log(unit.config())
```

Output:

```js
{ parentheses: false,
  precision: 16,
  prefix: 'auto',
  prefixMin: 0.1,
  prefixMax: 1000,
  simplify: 'auto',
  simplifyThreshold: 2,
  system: 'auto',
  subsystem: 'auto',
  extraDefinitions: {
    skipBuiltIns: false,
    units: 
    prefixes:
    unitSystems:
    baseQuantities:
    quantities:
  },
  type:
   { add: [Function: defaultAdd],
     sub: [Function: defaultSub],
     mul: [Function: defaultMul],
     div: [Function: defaultDiv],
     pow: [Function: defaultPow],
     abs: [Function: defaultAbs],
     eq: [Function: defaultEq],
     lt: [Function: defaultLT],
     gt: [Function: defaultGT],
     le: [Function: defaultLE],
     ge: [Function: defaultGE],
     conv: [Function: defaultConv],
     clone: [Function: defaultClone] }

```

#### Advanced Configuration

You can use multiple configurations at the same time:

```js
const unit = require('unitmath').config(options)    // TODO: use actual options
const newUnit = unit.config(newOptions)

let x = unit('1 m')
let y = newUnit('1 m')

console.log(x.toString())     // TODO: output
console.log(y.toString())     // TODO: output
```

If units from different configurations are used in an expression, the result of the operation will inherit the options of the first unit:

```js
x.add(y)   // Inherits options of x (TODO: show example using actual output)
y.add(x)   // Inherits options of y
unit.add(x, y)      // Uses options of unit
newUnit.add(x, y)   // Uses options of newUnit
```

**Important:** `config(options)` returns a *new* instance of the factory function, so you must assign the return value of `unit.config(options)` to some variable, otherwise the new options won't take effect:

```js
let unit = require('unitmath')

// The next line has no effect
unit.config(options)
```

#### Extending UnitMath

You can easily extend UnitMath to work with custom types by setting the `type` options. These replace the normal `+`, `-`, `*`, `/`, and other arithmetic operators used by UnitMath with functions you specify. For example, if you wrote an arbitrary-precision number library, and would like to use arbitrary-precision numbers with UnitMath:

```js
const apNumber = require('my-arbitrary-precision-number')
const unit = require('unitmath').config({
  type: {
    add: apNumber.add,
    sub: apNumber.sub,
    mul: apNumber.mul,
    div: apNumber.div,
    pow: apNumber.pow,
    eq: apNumber.eq,
    clone: apNumber,
    conv: apNumber,
    format: apNumber.toString
  }
})

let apUnit = unit(apNumber(2.74518864784926316174649567946), 'm')
```

For best results, you should extend all of the `type` functions. If you try to use custom types without extending all of UnitMath's internal arithmetic functions, you might receive a `TypeError`. You still might be able to use some of UnitMath's methods, though.


When using custom types, UnitMath cannot implicitly convert strings to units. Therefore, you must use the two-argument `unit(value, unitString)` to construct units. This is because UnitMath's string parser only works with native `number` types. To see why this must be, consider the string `"1 / 2 kg"`, which the user of a fraction library may wish to parse. UnitMath's parser wouldn't know what to do with `1 / 2`, and the fraction library's parser might choke when it encounters `kg`. The proper way to create this unit would be `unit(fraction(1, 2), 'kg')`.

## API Reference

### Namespace Functions

- `unit.config()` -- Return the current configuration
- `unit.config(options:object)` -- Configure a new unit namespace with the given options (see TODO: link)
- `unit.exists(singleUnitString:string)` -- Tests if the given unit, optionally with a prefix, exists.
- `unit.definitions()` -- Return current unit definitions (user's own definitions can be queried through unit.config().definitions)

## Contributing

This is a community-supported project; all contributions are welcome. Please open an issue or submit a pull request.

## Acknowledgements

Many thanks to Jos de Jong (@josdejong), the original author of `Unit.js`, who suggested the idea of splitting the file off from [Math.js](https://mathjs.org/) and into its own library.

### Contributors

- Harry Sarson (https://github.com/harrysarson)

## License

UnitMath is released under the Apache-2.0 license.