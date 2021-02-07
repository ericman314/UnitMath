# UnitMath
UnitMath is a JavaScript library for unit conversion and arithmetic. 

[![Build Status](https://travis-ci.org/ericman314/UnitMath.svg?branch=master)](https://travis-ci.org/ericman314/UnitMath)
[![codecov](https://codecov.io/gh/ericman314/UnitMath/branch/master/graph/badge.svg)](https://codecov.io/gh/ericman314/UnitMath)

## Install

```
npm install unitmath
```

*UnitMath is still in the early stages of development. The following API may be incomplete, or refer to features that are not yet implemented.*

## Use

```js
const unit = require('unitmath')

unit('40 km').to('mile')  // 62.1371192237334 mile
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

// Two strings
let k = unit('45', 'W / m K')
```

Units can be simple (`4 kg`) or compound (`8.314 J/mol K`). They may also be valueless (`hour`). Below are more examples of creating units:

```js
unit('2in')
unit('60/s')
unit('8.314 kg m^2 / s^2 mol K')
unit('kW / kg K')
```

The string portion of a unit may contain one `"/"`. Any units appearing before the `/` will be in the numerator of the resulting unit, and any units appearing after the `/` will be in the denominator. Parentheses and `*`'s will be ignored.

### Converting Units

The `to` method converts one unit to another. The two units must be consistent, that is, have the same dimension.

```js
unit('40 mile').to('km') // 64.37376 km
unit('kg').to('lbm') // 2.20462262184878 lbm
```

The `simplify` method will attempt to convert the unit to a simpler form.

```js
unit('10 / s').simplify() // 10 Hz
unit('J / m').simplify() // N
```

The `split` method will convert one unit into an array of units like so:

```js
unit('10 km').split([ 'mi', 'ft', 'in' ]) // [ 6 mi, 1128 ft, 4.78740157486361 in ]
unit('51.4934 deg').split([ 'deg', 'arcmin', 'arcsec' ]) // [ 51 deg, 29 arcmin, 36.24 arcsec ]
```

### Arithmetic

Use the methods `add`, `sub`, `mul`, `div`, `pow`, `sqrt`, and others to perform arithmetic on units. Multiple operations can be chained together:

```js
let g = unit(9.8, 'm/s^2')
let h = unit(19.6, 'm')
h.mul(2).div(g).sqrt()   // 2 s
```

Strings and numbers are implicitly converted to units within a chained expression. When chaining operators, they will execute in order from left to right. This may not be the usual, mathematical order of operations:

```js
unit('3 ft').add('6 in').mul(2)   // 7 ft
```

All of the operators are also available on the `unit` namespace:

```js
unit.mul(unit.add('3 ft', '6 in'), 2)
```

Units are immutable, so every operation on a unit creates a new unit.

### Formatting

Use the `format` method to format a unit as a string. `toString` is an alias for `format`.

```js
unit('1 lb').to('kg').format() // '0.45359237 kg'
```

The `format` and `toString` methods accept several options; see [Configuring](#configuring).

You can also define custom formatters; see [Custom Formatter](#custom-formatter).

### Configuring

UnitMath can be configured using `unit.config(options)`. The function returns a *new* instance of UnitMath with the specified configuration options:

```js
const unit = require('unitmath').config({ system: 'us' })
```

To query the current configuration, call `unit.config()` with no arguments.

Some options can be passed directly to `format` without first invoking the `config()` method:

```js
unit('1 lb').to('kg').format({ prefix: 'always', prefixMin: 1, precision: 4 }) // '453.6 g'
```

These are the available options and their defaults:

- `parentheses` -- *Default:* `false`. When formatting a unit, group the numerator and/or denominator in parentheses if multiple units are present.

  ```js
  unit('45 W / m K').format({ parentheses: true }) // 45 W / (m K)
  ```

- `precision` -- *Default:* `15`. The number of significant figures to output when converting a unit to a string. Reducing this can help reduce the appearance of round-off errors. A value of 0 will disable rounding entirely.

  ```js
  unit('180 deg').to('rad').format({ precision: 6 }) // 3.14159 rad
  ```

- `prefix` -- *Default:* `'auto'`. When formatting a unit, this option will specify whether the `toString` and `format` methods are allowed to choose an appropriately sized prefix in case of very small or very large quantities. Possible values are `'auto'`, `'always'`, or `'never'`. If `'auto'` is chosen, then a prefix is always chosen unless the `unit` was constructed using the `to()` method.

- `prefixMin` -- *Default:* `0.1`. When choosing a prefix, the smallest formatted value of a `unit` that is allowed.

- `prefixMax` -- *Default:* `1000`. When choosing a prefix, the largest formatted value of a `unit` that is allowed.

- `prefixesToChooseFrom` -- *Default:* `'common'`. When choosing a prefix, whether to consider all allowed prefixes or just the common ones for that unit. Possible values are `'common'` and `'all'`.

- `simplify` -- *Default:* `'auto'`. Specifies if UnitMath should attempt to simplify the units before formatting as a string. Possible values are `'auto'`, `'always'`, or `'never'`. If `'auto'` or `'always'`, then `u.toString()` essentially becomes equivalent to `u.simplify().toString()`. The original `u` is never modified. When `'auto'` is used, simplification is skipped if the unit is valueless or was constructed using the `to()` method.

- `simplifyThreshold` -- *Default:* `2`. A factor that affects whether the `format` method will output the original unit or a simplified version. The original unit will always be output unless the 'complexity' of the unit is reduced by an amount equal to or greater than the `simplifyThreshold`. A lower value results in more units being simplified, while a higher number results in fewer units being simplified. The complexity of a unit is roughly equal to the number of 'symbols' that are required to write the unit.

  ```js
  unit('8 kg m / s^2').format() // 8 N
  unit('8 kg m / s^2').format({ simplifyThreshold: 6 })) // 8 kg m / s^2
  ```

- `system` -- *Default:* `'auto'`. The unit system to use when simplifying a `unit`. Available systems are `si`, `cgs`, `us`, and `auto`. When `system === 'auto'`, UnitMath will try to infer the unit system from the individual units that make up that `unit`.

  ```js
  unit = unit.config({ system: 'auto' })

  unit('150 lbf').div('10 in^2').toString()  // "15 psi"
  unit('400 N').div('10 cm^2').toString()  // "400 kPa"
  ```

  Specifying a unit system other than `'auto'` will force UnitMath to use the specified system. Use the `config` function to apply the system everywhere, or use the `format` function to apply to a single statement:

  ```js
  unit = unit.config({ system: 'us' })

  let a = unit('5 m').div('2 s')

  console.log(a.format()) // 8.202099737532809 ft / s
  console.log(a.format({ system: 'si'})) // 2.5 m / s

  ```

- `subsystem` -- *Default:* `'auto'` *Not yet implemented.* The subsystem, or technical field, etc., to use when simplifying a `unit`. It can provide additional hints about which units to use when there are multiple options within the same system. Available subsystems are `'mechanics'`, `'chemistry'`, `'electricity_and_magnetism'`, etc. When `subsystem === 'auto'`, UnitMath will try to infer the subsystem from the individual units that make up that `unit`:

  ```js
  // Proposed, but not yet implemented
  unit = unit.config({ subsystem: 'auto' })

  unit('240 V').mul('5 A').mul('1 hr').toString()  // "1.2 kWh"
  unit('4000 kg').mul('9.8 m/s^2').mul('100 m').toString()  // "3.92 MJ"
  ```

- `definitions`. An object that allows you to add to, modify, or remove the built-in units. See [User-Defined Units](#user-defined-units) for complete details.

  ```js
  unit = unit.config({
    definitions: {
      units: {
        furlong: '220 yards',
        fortnight: '2 weeks'
      }
    }
  })

  unit('6 furlongs/fortnight').to('m/s') // 0.000997857142857143 m / s
  ```

- `type`. An object that allows UnitMath to work with custom numeric types. See [Custom Types](#custom-types) for complete details and examples.

Because `unit.config(options)` returns a new instance of UnitMath, is is technically possible to perform operations between units created from different instances. The resulting behavior is undefined, however, so it is probably best to avoid doing this.

**Important:** `unit.config(options)` returns a *new* instance of the factory function, so you must assign the return value of `unit.config(options)` to some variable, otherwise the new options won't take effect:

```js
let unit = require('unitmath')

unit.config(options) // This has no effect
```

### Extending UnitMath

#### User-Defined Units

To create a user-defined unit, pass a `definitions` object to `unit.config()`:

  ```js
  unit = unit.config({
    definitions: {
      units: {
        lightyear: '9460730472580800 m'
      }
    }
  })

  unit('1 lightyear').to('mile') // 5878625373183.608 mile
  ```

The `definitions` contains two properties which allow additional customization of the unit system: `units` and `prefixes`.

**definitions.units**

This object contains the units that are made available by UnitMath. Each key in `definitions.units` becomes a new unit. The easiest way to define a unit is to provide a string representation in terms of other units:

```js
units: {
  minute: '60 seconds',
  newton: '1 kg m/s^2'
}
```

You can also supply an object for additional customization. These are all the options you can specify:

- `value`: (Required) The value of the unit. It can be a string or an array containing two items:

  ```js
  units: {
    minute: { value: '60 seconds' },
    newton: { value: '1 kg m/s^2' }
  }
  ```

  Or:

  ```js
  units: {
    minute: { value: [ 60, 'seconds' ] },
    newton: { value: [ 1, 'kg m/s^2' ] }
  }
  ```

- `quantity`: Specifying a `quantity` will create a _base unit_. This is required for units that are not defined in terms of other units, such as `meter` and `second`:

  ```js
  units: {
    seconds: { quantity: 'TIME', value: 1 }
  }
  ```

  Only use `quantity` to define _base units_. Do **not** use `quantity` to define a derived unit:

  ```js
  // Incorrect
  units: {
    meter: { quantity: 'LENGTH', value: 1 }
    square_meter: { quantity: 'LENGTH^2', value: 1 }
  }

  // Correct
  units: {
    meter: { quantity: 'LENGTH', value: 1 }
    square_meter: { value: '1 meter^2' }  
  }
  ```

- `prefixes` -- *Default:* `'NONE'`. Specifies which group of prefixes will be allowed when parsing the unit.

  ```js
  units: {
    // Will parse 'nanometer', 'micrometer', 'millimeter', 'kilometer', 'megameter', etc.
    meter: { prefixes: 'LONG', ... },

    // Will parse 'nm', 'um', 'mm', 'km', 'Mm', etc.
    m: { prefixes: 'SHORT', ... }
  }
  ```

- `commonPrefixes`: A string array that specifies which of the allowed prefixes will be used when formatting a unit. If this option is omitted, the unit will be formatted using the original prefix, or none at all.

  ```js
  units: {
    L: {
      prefixes: 'SHORT',
      // Will format only as 'nL', 'uL', 'mL', and 'L'.
      commonPrefixes: ['n', 'u', 'm', ''],
      value: '1e-3 m^3',
    },
    lumen: {
      prefixes: 'LONG',
      value: '1 cd sr'
      // commonPrefixes not given, so lumen will only be formatted as "lumen", but could be parsed as "millilumen", etc.
    },
  }
  ```

- `basePrefix`: Optional. The prefix to use for a _base unit_, if the base unit has one. This is necessary for units such as kilogram, which is a base unit but has a prefix.

  ```js
  units: {
    g: {
      quantity: 'MASS',
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', '', 'k'],
      value: 0.001,
      basePrefix: 'k' // Treat as if 'kg' is the base unit, not 'g'
    },
  }
  ```

- `aliases`: Shortcut to create additional units with identical definitions.

  ```js
  units: {
    meter: { ... , aliases: [ 'meters' ] }
  }
  ```

- `offset` -- *Default:* `0`: Used when the zero-value of this unit is different from the zero-value of the base unit.

  ```js
  units: {
    celsius: {
      value: '1 K',
      offset: 273.15
    }
  }
  ```

**definitions.prefixes**

The `definitions.prefixes` object is used to define strings and associated multipliers that are prefixed to units to change their value. For example, the `'k'` prefix in `km` multiplies the value of the `m` unit by 1000.

```js
prefixes: {
  NONE: { '': 1 },
  SHORT: {
    m: 0.001,
    '': 1,
    k: 1000
  },
  LONG: {
    milli: 0.001,
    '': 1,
    kilo: 1000
  }
}
```

**definitions.systems**

This object assigns one or more units to a number of systems. Each key in `definitions.systems` becomes a system. Each system lists all the units that should be associated with that system in an array. The units may include prefixes.

```js
systems: {
  si: ['m', 'kg', 's', 'N', 'J', 'm^3', 'm/s'],
  cgs: ['cm', 'g', 's', 'dyn', 'erg', 'cm^3', 'cm/s'],
  us: ['ft', 'lbm', 's', 'lbf', 'btu', 'gal', 'ft/s']
}
```

When UnitMath formats a unit, it will try to use one of the units from the specified system first. If the system does not contain a matching unit, it will choose from all available units.

**definitions.skipBuiltIns**

A boolean value indicating whether to skip creation of the built-in units. If `true`, only the user-defined units and quantities defined in `definitions` will be created.

#### Querying current unit definitions ####

You can view all the current definitions by calling `unit.definitions()`. This object contains all the built-in units, prefixes, unit systems, base quantities, and quantities. If you have configured UnitMath with additional definitions, these will also be included in the return value from `unit.definitions()`.

```js
unit.definitions()
```

Below is an abbreviated sample output from `unit.definitions()`. It can serve as a starting point to create your own definitions.

```js
{ 
  units: {
    '': { quantity: 'UNITLESS', value: 1 },
    meter: {
      quantity: 'LENGTH',
      prefixes: 'LONG',
      commonPrefixes: [ 'nano', 'micro', 'milli', 'centi', '', 'kilo' ],
      value: 1,
      aliases: [ 'meters' ]
    },
    m: {
      prefixes: 'SHORT',
      commonPrefixes: [ 'n', 'u', 'm', 'c', '', 'k' ],
      value: '1 meter'
    },
    inch: { value: '0.0254 meter', aliases: [ 'inches', 'in' ] },
    foot: { value: '12 inch', aliases: [ 'ft', 'feet' ] },
    yard: { value: '3 foot', aliases: [ 'yd', 'yards' ] },
    mile: { value: '5280 ft', aliases: [ 'mi', 'miles' ] },
    ... },
  prefixes: {
    NONE: { '': 1 },
    SHORT: {
      '': 1,
      da: 10,
      h: 100,
      k: 1000,
      ...
      d: 0.1,
      c: 0.01,
      m: 0.001,
      ... },
    ... },
  }
```

#### Custom Types

You can easily extend UnitMath to work with custom types. The `type` option is an object containing several key/value pairs, where each value is a function that replaces the normal `+`, `-`, `*`, `/`, and other arithmetic operators used internally by UnitMath.

Example using Decimal.js as the custom type:

```js
const Decimal = require('decimal.js')
const unit = require('unitmath').config({
  type: {
    clone: Decimal,
    conv: Decimal,
    add: (a, b) => a.add(b),
    sub: (a, b) => a.sub(b),
    mul: (a, b) => a.mul(b),
    div: (a, b) => a.div(b),
    pow: (a, b) => a.pow(b),
    eq: (a, b) => a.eq(b),
    lt: (a, b) => a.lt(b),
    le: (a, b) => a.lte(b),
    gt: (a, b) => a.gt(b),
    ge: (a, b) => a.gte(b),
    abs: (a) => a.abs(),
    round: (a) => a.round(),
    trunc: (a) => Decimal.trunc(a),
    format: a => a.toString()
  }
})

let u = unit('2.74518864784926316174649567946 m')
```

Below is a list of functions, their signatures, and when they are required.

Required always:
  - `clone: (a: T) => T`          
  - `conv: (a: number | string | T) => T` 
  - `add: (a: T, b: T) => T`     
  - `sub: (a: T, b: T) => T`     
  - `mul: (a: T, b: T) => T`     
  - `div: (a: T, b: T) => T`     
  - `pow: (a: T, b: number) => T`
  
Required for prefix = 'auto' or 'always':
  - `abs: (a: T) => T`
  - `lt: (a: T, b: T) => boolean`
  - `gt: (a: T, b: T) => boolean`
  - `le: (a: T, b: T) => boolean`
  - `ge: (a: T, b: T) => boolean`

Required for specific functions:
  - `eq: (a: T, b: T) => boolean` (Required for `equals` function)
  - `round: (a: T) => T` (Required for `split` function)
  - `trunc: (a: T) => T` (Required for `split` function)

Optional:
  - `format: (a: T, options: any) => string`

The `add`, `sub`, `mul`, `div`, and `pow` functions replace `+`, `-`, `*`, `/`, and `Math.pow`, respectively. The `clone` function should return a clone of your custom type (same value, different object). 

The `conv` function must, at a minimum, be capable of converting both strings and numbers into your custom type. If given a custom type, it should return it unchanged, or return a clone. Among other things, the `conv` function is used by UnitMath to convert the values of the built-in units to your custom type.

UnitMath will also use the `conv` function when constructing units from numbers and strings. If your custom type is representable using decimal or scientific notation (such as `6.022e+23`), you can include both the value and the units in a single string:

```js
// Supply a single string, and the numeric portion will be parsed using type.conv
unit('3.1415926535897932384626433832795 rad')
```

If your custom type cannot be represented in decimal or scientific notation, such as is the case with complex numbers and fractions, you will have to use the more generic two-argument constructor, supplying either two strings, a number and a string, or your custom type and a string:

```js
unit('1 / 2', 'kg') // Supply two strings

unit(0.5, 'kg') // Supply a number and a string

unit(Fraction(1, 2), 'kg') // Supply the value directly
```

The functions `clone`, `conv`, `add`, `sub`, `mul`, `div`, and `pow` are always required. Omitting any of these will cause the `config` method to throw an error. The other functions are conditionally required, and you will receive an error if you attempt something that depends on a function you haven't provided.

#### Custom Formatter

UnitMath will use your type's `toString` method when formatting a unit. You can use a different formatter by setting the `type.format` function. This works even if you are not using custom types. Any arguments you pass to the unit's `format` or `toString` method will also be passed to your custom `format` function:

```js
let unitFunny = require('../index.js').config({
  type: {
    format: (a, b, c) => b + a.toString().split('').reverse().join(c)
  }
})

unitFunny('3.14159 rad').toString('$', '_') // '$9_5_1_4_1_._3 rad'
```

## API Reference

### Factory Function

- `unit(value: number, unitString: string)`  
  `unit(value: number)`  
  `unit(valueAndUnitString: string)`  
  `unit()`  

  Creates a unit with the specified value and unit string. If `valueAndUnitString` is supplied, it must specify both the numeric portion and the units portion of the unit.

  ```js
  const unit = require('unitmath')
  unit(60, 'mile/hour') // 60 mile / hour
  unit(60) // 60
  unit('60 mile/hour') // 60 mile / hour
  unit('mile/hour') // mile / hour
  unit() // Empty unit
  ```

  The string used to specify the unit (`valueAndUnitString` or `unitString`) must be in the following format:

  ``` 
  [value][numerator][/denominator]

  numerator, denominator:
  unitPiece [unitPiece ...]

  unitPiece:
  [prefix]unit[^power]

  value, power:
  Any floating-point number

  ```

### Member Functions

- `#clone()`

  Returns a clone of this unit.

  ```js
  let a = unit('40 m/s') // 40 m / s
  let b = a.clone() // 40 m / s
  ```

- `#add(other: unit | string | number)`

  Adds this unit to another unit and returns a new unit. If a string or number is supplied as an argument, it is converted to a unit. Both units must have values and have matching dimensions.

  ```js
  let a = unit('20 kW')
  let b = unit('300 W')
  a.add(b) // 20.3 kW
  ```

- `#sub(other: unit | string | number)`

  Adds another unit from this unit and returns a new unit. If a string or number is supplied as an argument, it is converted to a unit. Both units must have values and have matching dimensions.

  ```js
  let a = unit('20 kW')
  let b = unit('300 W')
  a.sub(b) // 19.7 kW
  ```

- `#mul(other: unit | string | number)`

  Multipies this unit and another unit and returns a new unit. If a string or number is supplied as an argument, it is converted to a unit.

  ```js
  let a = unit('8 m')
  let b = unit('200 N')
  a.mul(b) // 16 kJ
  ```

- `#div(other: unit | string | number)`

  Divides this unit by another unit and returns a new unit. If a string or number is supplied as an argument, it is converted to a unit.

  ```js
  let a = unit('64 kJ')
  let b = unit('16 s')
  a.mul(b) // 4 kW
  ```

- `#pow(p: number)`

  Raises this unit to the power `p` and returns a new unit.

  ```js
  unit('10 m').pow(3) // 1000 m^3
  ```

- `#sqrt()`

  Returns the square root of this unit.

  ```js
  unit('1 heactare').sqrt() // 100 m
  ```

- `#abs()`

  Returns the absolute value of this unit. If the unit has an offset, such as `degC`, this is applied before taking the absolute value.

  ```js
  unit('-5 m / s').abs() // 5 m / s
  unit('300 degC').abs() // -246.3 degC
  ```

- `#to(target: unit | string)`  
  `#to()`

  Converts this unit to the specified target unit or string. The returned unit will be "fixed", so it will not be auto-simplified or auto-prefixed in `format()`. If `to()` is called on the unit with no arguments, then a "fixed" clone of the unit is returned.

  ```js
  let r = unit('10 kg / m^2 s^3 A^2')
  r.format() // 10 ohm
  r.to('kohm').format() // 0.01 kohm
  r.to().format() // 10 kg m^2 / s^3 A^2
  ```

- `#toBaseUnits()`

  Returns a new unit in the base representation.

  ```js
  unit('10 ft/s').toBaseUnits() // 3.048 m / s
  ```

- `getValue()`

  Returns the value of this unit, or `null` if the unit is valueless.

- `#setValue(x: number | string | custom)`

  Returns a copy of this unit but with its value replaced with the given value. Useful if you would like to perform your own operations on a unit's value. If supplied with no arguments, or `null`, will remove the value from the unit.

  ```js
  unit('10 m').setValue(20) // 20 m
  unit('m').setValue(20) // 20 m
  unit('10 ft').setValue(20) // 20 ft
  unit('10 ft').setValue() // ft
  ```

- `getNormalizedValue()`

  Returns the value of this unit if it were to be converted to SI base units (or whatever base units that are defined). Returns `null` if the unit is valueless.

- `setNormalizedValue()`

  Returns a copy of this unit but with its value replaced with the given normalized value.

- `#simplify()`

  Attempts to simplify the unit, and returns the simplified unit (or a clone of the original if unsuccessful). `simplify()` is called when a unit is being formatted as a string whenever the config option `simplify` is `'auto'` or `'always'`.

  ```js
  unit('10 N m').simplify() // 10 J
  ```

- `#split(Array(string | unit))`

  Converts this unit into an array of units, where the sum of the resulting units is equal to this unit, and where each of the resulting units is the result of truncating this unit to an integer, and then passing the remainder to the next unit, until the final unit, which takes up all the remainder.

  ```js
  unit('51.4934 deg').split([ 'deg', 'arcmin', 'arcsec' ]) // [ 51 deg, 29 arcmin, 36.24 arcsec ]
  ```

- `#getUnits()`

  Returns a clone of this unit with the value removed.

  ```js
  unit('8.314 J / mol K').getUnits() // J / mol K
  ```

- `#isCompound()`

  Returns true if this unit's unit list contains two or more units, or one unit with a power not equal to 1.

  ```js
  unit('34 kg').isCompound() // false
  unit('34 kg/s').isCompound() // true
  unit('34 kg^2').isCompound() // true
  unit('34 N').isCompound() // false
  unit('34 kg m / s^2').isCompound() // true
  ```

- `#getQuantities()`

  Returns a string array of all of this unit's matching quantities.

  ```js
  unit('5 m/s^2').getQuantities(), // ['ACCELERATION']
  unit('5 m^2').getQuantities(), // ['AREA']
  unit('5 kg m^2 / s^2').getQuantities(), // ['ENERGY', 'TORQUE']
  unit('5 A/m').getQuantities(), // ['MAGNETIC_FIELD_STRENGTH']
  unit('5 kg m s K A rad bits').getQuantities(), // []
  ```

- `#hasQuantity(quantity: string)`

  Returns true if this unit matches the given quantity.
  
  ```js
  unit('5 m/s^2').hasQuantity('ACCELERATION') // true
  ```

- `#equalQuantity(other: unit | string)`

  Returns true if this unit and another unit have equal quantities or dimensions.

  ```js
  unit('5 m/s^2').equalQuantity('4 ft/s^2')) // true
  ```

- `#equals(other: unit | string)`

  Returns true if the two units represent the same values.

  ```js
  unit('3 ft').equals('1 yard') // true
  ```

- `#compare(other: unit | string)`

  Returns a value indicating whether this unit is less than (-1), greater than (1), or equal to (0), another unit.

  ```js
  unit('30 min').compare('1 hour') // -1
  unit('60 min').compare('1 hour') // 0
  unit('90 min').compare('1 hour') // 1
  ```

- `#lessThan(other: unit | string)`

  Compares this and another unit and returns true if this unit is less than the other.

- `#lessThanOrEqual(other: unit | string)`

  Compares this and another unit and returns true if this unit is less than or equal to the other.

- `#greaterThan(other: unit | string)`

  Compares this and another unit and returns true if this unit is greater than the other.

- `#greaterThanOrEqual(other: unit | string)`

  Compares this and another unit and returns true if this unit is greater than or equal to the other.

- `#format(options)`  

  Formats this unit as a string. Formatting options can be supplied which will override the configured options. See [Configuring](#configuring) for a list of all options and their effects.

  If the `prefix` or `simplify` options are set to `'auto'` or `'always`', the `toString` and `format` methods will try to simplify the unit before outputting. This can be prevented by calling `.to()` on a unit with no parameters, which will return a new unit that will *not* be simplified automatically.

- `#toString(options)`

  Alias for `format(options)`

### Namespace Functions

- `config()`

  Returns the current configuration.

  ```js
  const unit = require('unitmath')
  unit.config()
  ```

- `config(options:object)`

  Configure a new unit namespace with the given options (see [Configuring](#configuring))

  ```js
  const unit = require('unitmath').config({ option1, option2, ... })
  ```

- `exists(singleUnitString:string)`

  Tests if the given unit, optionally with a prefix, exists.

  ```js
  const unit = require('unitmath')
  unit.exists('km') // true
  ```

- `unit.definitions()`

  Return the current unit definitions in effect. (User's own definitions can be queried through `unit.config().definitions`.)

- `unit.add(a: unit | string | number, b: unit | string | number)`

  Alias for `a.add(b)`.

  ```js
  unit.add('4 ft', '1 yd') // 7 ft
  ```

- `unit.sub(a: unit | string | number, b: unit | string | number)`

  Alias for `a.sub(b)`.

  ```js
  unit.sub('4 ft', '1 yd') // 1 ft
  ```

- `unit.mul(a: unit | string | number, b: unit | string | number)`

  Alias for `a.mul(b)`.

  ```js
  unit.mul('4 ft', '1 yd') // 12 ft^2
  ```

- `unit.div(a: unit | string | number, b: unit | string | number)`

  Alias for `a.div(b)`.

  ```js
  unit.div('4 ft', '1 yd') // 1.33333333333333
  ```

- `unit.pow(a: unit | string | number, b: number)`

  Alias for `a.pow(b)`.

  ```js
  unit.pow('4 ft', 2) // 16 ft^2
  ```

- `unit.sqrt(a: unit | string | number)`

  Alias for `a.sqrt()`.

  ```js
  unit.sqrt('16 ft^2') // 4 ft
  ```

- `unit.abs(a: unit | string | number)`

  Alias for `a.abs()`.

  ```js
  unit.abs('-5 m / s') // 5 m / s
  unit.abs('300 degC') // -246.3 degC
  ```

- `unit.to(a: unit | string | number, b: unit | string)`

  Alias for `a.to(b)`.

- `unit.toSI(a: unit | string | number)`

  Alias for `a.toSI()`.




## Contributing

This is a community-supported project; all contributions are welcome. Please open an issue or submit a pull request.

## Acknowledgements

Many thanks to Jos de Jong (@josdejong), the original author of `Unit.js`, who suggested the idea of splitting the file off from [Math.js](https://mathjs.org/) and into its own library.

### Contributors

- Harry Sarson (https://github.com/harrysarson)
- Nick Ewing (https://github.com/nickewing)

## License

UnitMath is released under the Apache-2.0 license.