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

### Namespace Functions

- `unit.config(options:object)` -- Configure a new unit namespace with the given options (see TODO: link)
- `unit.exists(singleUnitString:string)` -- Tests if the given unit, optionally with a prefix, exists.

### Configuring

UnitMath can be configured using various options. The factory method `config(options)` returns a ***new*** instance of UnitMath with the specified configuration options:

```js
const unit = require('unitmath').config(options)    // TODO: show simple example using actual options
```

The available options are:

- **format**: *Object*
  - **system**: *String* -- The unit system to use. Examples are `US` and `SI`.
- **extendType**: *Object* -- See below

TODO: List the options here

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

You can easily extend UnitMath to work with custom types by setting the `custom...` options. These replace the normal `+`, `-`, `*`, `/`, and other arithmetic operators used by UnitMath with functions you specify. For example, if you wrote an arbitrary-precision number library, and would like to use arbitrary-precision numbers with UnitMath:

```js
const apNumber = require('my-arbitrary-precision-number')
const unit = require('unitmath').config({
  customAdd: apNumber.add,
  customSub: apNumber.sub,
  customMul: apNumber.mul,
  customDiv: apNumber.div,
  customPow: apNumber.pow,
  customEq: apNumber.eq,
  customClone: apNumber,
  customConv: apNumber,
  customFormat: apNumber.toString
})

let apUnit = unit(apNumber(2.74518864784926316174649567946), 'm')
```

For best results, you should extend all of the `custom...` functions. If you try to use custom types without extending all of UnitMath's internal arithmetic functions, you might receive a `TypeError`. You still might be able to use some of UnitMath's methods, though.


When using custom types, UnitMath cannot implicitly convert strings to units. Therefore, you must use the two-argument `unit(value, unitString)` to construct units. This is because UnitMath's string parser only works with native `number` types. To see why this must be, consider the string `"1 / 2 kg"`, which the user of a fraction library may wish to parse. UnitMath's parser wouldn't know what to do with `1 / 2`, and the fraction library's parser might choke when it encounters `kg`. The proper way to create this unit would be `unit(fraction(1, 2), 'kg')`.

## API Reference



## Contributing

This is a community-supported project; all contributions are welcome. Please open an issue or submit a pull request.

## Acknowledgements

Many thanks to Jos de Jong (@josdejong), the original author of `Unit.js`, who suggested the idea of splitting the file off from [Math.js](https://mathjs.org/) and into its own library.

## License

UnitMath is released under the Apache-2.0 license.