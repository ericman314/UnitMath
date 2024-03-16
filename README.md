# UnitMath
UnitMath is a JavaScript library for unit conversion and arithmetic. 

[![Build Status](https://travis-ci.org/ericman314/UnitMath.svg?branch=master)](https://travis-ci.org/ericman314/UnitMath)
[![codecov](https://codecov.io/gh/ericman314/UnitMath/branch/master/graph/badge.svg)](https://codecov.io/gh/ericman314/UnitMath)

<!-- toc -->

- [Install](#install)
- [Getting Started](#getting-started)
- [Creating Units](#creating-units)
  * [Parsing Rules](#parsing-rules)
- [Unit Conversion](#unit-conversion)
- [Arithmetic](#arithmetic)
- [Simplify](#simplify)
- [Formatting](#formatting)
- [Configuring](#configuring)
  * [Querying the current configuration](#querying-the-current-configuration)
- [Extending UnitMath](#extending-unitmath)
  * [User-Defined Units](#user-defined-units)
  * [Querying current unit definitions](#querying-current-unit-definitions)
  * [Custom Types](#custom-types)
- [API Reference](#api-reference)
  * [Constructor](#constructor)
  * [Member Functions](#member-functions)
  * [Static Functions](#static-functions)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
  * [Contributors](#contributors)
- [License](#license)

<!-- tocstop -->

## Install

```
npm install unitmath
```

## Getting Started

```js
const unit = require('unitmath')

let a = unit('5 m').div('2 s')   // 2.5 m / s
let b = unit('40 km').to('mile')  // 24.8548476894934 mile
b.toString({ precision: 4 })          // "24.85 mile"
```

## Creating Units

To create a unit, call `unit` with either a single string, or a number and a string:

```js
// String
let a = unit('40 mile')
let b = unit('hour')

// Number and string
let g = unit(9.8, 'm/s^2')
let h = unit(19.6, 'm')
```

Units can be simple (`4 kg`) or compound (`8.314 J/mol K`). They may also be valueless (`hour`). 

### Parsing Rules

Parsing rules are different than typical JavaScript syntax. For instance:
  - The string may only contain one `"/"`. Units appearing before the `/` will be in the numerator of the resulting unit, and units appearing after the `/` will be in the denominator.
  - Parentheses `()` and asterisk `*` are ignored: multiplication is implicit.
  - Extra whitespace is allowed.
 
The following all form valid units:

```js
// These are valid:
unit("2 in")
unit("60/s")
unit("8.314 * kg * m^2 / (s^2 * mol * K)") 
unit("6.022e-23 mol^-1")
unit("kW / kg K")
unit("3.1415926535897932384626433832795 rad") 

// These are invalid:
unit("2 in + 3 in") // Unexpected "+" (Use .add() instead)
unit("60 / s / s") // Unexpected additional "/"
unit("0x123 kg") // Unit "x123" not found
```

The exact syntax is as follows:

``` 
[value][numerator][/denominator]

numerator, denominator:
atomicUnit [atomicUnit ...]

atomicUnit:
[prefix]unit[^power]

value, power:
Any floating-point number

unit, prefix:
Any built-in or user-defined unit or prefix

```


## Unit Conversion

The `to` method converts from one unit to another. The two units must have the same dimension.

```js
// Convert units
unit('40 km').to('mile') // 24.8548476894934 mile
unit('kg').to('lbm') // 2.20462262184878 lbm
unit(5000, 'kg').to('N s') // Cannot convert 5000 kg to N s: dimensions do not match
```

The `split` method will convert one unit into an array of units like so:

```js
// Split a unit into parts
unit('10 km').split([ 'mi', 'ft', 'in' ]) // [ 6 mi, 1128 ft, 4.78740157486361 in ]
unit('51.4934 deg').split([ 'deg', 'arcmin', 'arcsec' ]) // [ 51 deg, 29 arcmin, 36.24 arcsec ]
```

## Arithmetic

Use the methods `add`, `sub`, `mul`, `div`, `pow`, `sqrt`, and others to perform arithmetic on units. Multiple operations can be chained together:

```js
// Chain operations together
let g = unit(9.8, 'm/s^2')
let h = unit(19.6, 'm')
h.mul(2).div(g).sqrt()   // 2 s
```

Strings and numbers are implicitly converted to units within a chained expression. When chaining operators, they will execute in order from left to right. This may not be the usual, mathematical order of operations:

```js
// Strings are implicitly converted to units
unit('3 ft').add('6 in').mul(2)   // 7 ft
```

All of the operators are also available on the top-level `unit` object as static functions:

```js
// Using static functions
unit.mul(unit.add('3 ft', '6 in'), 2)   // 7 ft
```

Units are immutable, so every operation on a unit creates a new unit.

## Simplify

UnitMath has a `simplify` method that will attempt to simplify a unit:

```js
// Simplify units
unit('10 / s').simplify() // 10 Hz
unit('J / m').simplify() // N
```

Because units are immutable, `simplify` always returns a *new* unit with the simplified units. It does not modify the original unit.

In the `simplify` method, simplification is performed in two steps:
1. Attempting to simplify a compound unit into a single unit in the desired unit system
2. Choosing an appropriate prefix (if `options.autoPrefix` is true)

*Note: To choose the best prefix without automatically simplifying the Unit, use the `applyBestPrefix` method.*

Here are the options available for the `simplify` method:

<!--
- `simplifyThreshold` - *Default:* `2`. A setting that affects how aggressively compound units are simplified. A compound unit will only be simplified if its "complexity" is reduced by at least this much. The complexity of a unit is equal to the number of symbols that are required to output the unit. A lower value of `simplifyThreshold` results in more units being simplified, while a higher value results in fewer units being simplified. 

  ```js
  unit('8 kg m / s^2').simplify({ simplifyThreshold: 5 }) // 8 N
  unit('8 kg m / s^2').simplify({ simplifyThreshold: 6 }) // 8 kg m / s^2
  ```
-->

- `system` - *Default:* `'auto'`. The unit system to use when simplifying a `unit`. Available systems are `si`, `cgs`, `us`, and `auto`.

  ```js
  // Simplify units using a specific system
  unit('8 kg m / s^2').simplify({ system: 'si' }) // 8 N
  unit('8 kg m / s^2').simplify({ system: 'cgs' }) // 800 kdyn
  unit('8 kg m / s^2').simplify({ system: 'us' }) // 1.79847154479768 lbf
  ```

  When `system` is `'auto'` (the default), UnitMath will try to infer the unit system from the individual units that make up that `unit`. This is not guaranteed to succeed in all cases, so whenever possible, the system should be specified explicitly.

  ```js
  unit = unit.config({ system: 'auto' })

  // Automatically infer the unit system while simplifying
  unit('150 lbf').div('10 in^2').simplify()  // 15 psi
  unit('400 N').div('10 cm^2').simplify()  // 400 kPa
  ```

  Specifying a unit system other than `'auto'` will force UnitMath to use the specified system. Use the `config` function to apply the system everywhere, or pass a configuration object to `simplify` to apply to a single statement:

  ```js
  unit = unit.config({ system: 'us' })

  let a = unit('5 m').div('2 s')
  a.simplify() // 8.202099737532809 ft / s

  // Override the system for this statement
  a.simplify({ system: 'si'}) // 2.5 m / s
  ```

- `autoPrefix` - *Default:* `true`. This option specifies whether `simplify` will try to choose an appropriate prefix in case of very small or very large quantities. 
  
    ```js
    unit('1e-10 kg m / s^2').simplify() // 0.0001 uN
    unit('1e-10 kg m / s^2').simplify({ autoPrefix: false }) // 1e-10 N
    ```

- `prefixMin` and `prefixMax` - *Defaults:* `0.1` and `1000`. Sets the threshold for choosing a different prefix when `autoPrefix` is true.

  ```js
  unit('0.005 m').simplify() // 0.5 cm
  unit('0.005 m').simplify({ prefixMin: 0.001 }) // 0.005 m
  ```

- `formatPrefixDefault` - *Default:* `none`. By default, certain units are never assigned a new prefix (this is controlled by the `formatPrefixes` property of the unit definition.) By setting `formatPrefixDefault` to `"all"`, this behavior can be changed. 

  ```js
  unit('1000001 lumen').simplify() // 1000001 lumen
  unit('1000001 lumen').simplify({ formatPrefixDefault: 'all' }) // 1.000001 megalumen
  ```

## Formatting

Use `toString` to output a unit as a string:

```js
unit('1 lb').to('kg').toString() // "0.45359237 kg"
```

The `toString` method accepts a configuration object. The following options are available:

- `precision` - *Default:* `15`. The number of significant figures to output when converting a unit to a string. Reducing this can help reduce the appearance of round-off errors. Setting a value of 0 will disable rounding.

  ```js
  // Output a unit with a specific precision
  unit('180 deg').to('rad').toString({ precision: 6 }) // 3.14159 rad
  unit('1 lb').to('kg').toString({ precision: 4 }) // "0.4536 kg"
  ```

- `parentheses` - *Default:* `false`. When formatting a unit, group the numerator and/or denominator in parentheses if multiple units are present. This is useful when the resulting string will be used in a mathematical expression.

  ```js
  // Output a unit with parentheses
  unit('45 W / m K').toString({ parentheses: true }) // 45 W / (m K)
  ```

- `formatter`. Define a custom formatter for the _numeric_ portion of the unit. The formatter will be passed the numeric value of the unit. For example:

  ```js
  let unit = require('unitmath')

  // Custom formatter
  let formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  // Specify formatter in argument to toString
  unit('25000 / ton').toString({ formatter: formatter.format }) // "$25,000.00 ton^-1"

  // Specify formatter in config
  let unitMoney = unit.config({
    formatter: formatter.format
  })
  unitMoney('25000 / ton').toString() // "$25,000.00 ton^-1"
  ```

The `toString` method outputs a unit exactly as it is represented internally. It does _not_ automatically simplify a unit. This means you will usually want to call `simplify` before calling `toString`. How and when to simplify a unit is very subjective. UnitMath cannot anticipate all needs, so the user must explicitly call `simplify` when needed.

```js
// toString outputs units "as-is".
unit('10 / s').toString() // "10 s^-1"
unit('10 / s').simplify().toString() // "10 Hz"
```


  
## Configuring

UnitMath can be configured using `unit.config(options)`. The function returns a *new* instance of UnitMath with the specified configuration options.

```js
// Set the default unit system to "us"
const unit = require('unitmath').config({ system: 'us' })
```

Available options are:

- Any of the [simplify options](#simplify).

- Any of the [formatting options](#formatting).

- `type`. An object that allows UnitMath to work with custom numeric types. See [Custom Types](#custom-types) for complete details and examples.

- `definitions`. An object that allows you to add to, modify, or remove the built-in units. See [User-Defined Units](#user-defined-units) for complete details.

  ```js
  // Create a new configuration
  unit = unit.config({
    definitions: {
      units: {
        furlong: { value: '220 yards' },
        fortnight: { value: '2 weeks' }
      }
    },
    precision: 6
  })

  unit('6 furlong/fortnight').to('m/s') // 0.000997857 m / s
  ```



Because `unit.config(options)` returns a new instance of UnitMath, is is technically possible to perform operations between units created from different instances. The resulting behavior is undefined, however, so it is probably best to avoid doing this.

**Important:** `unit.config(options)` returns a *new* instance of the factory function, so you must assign the return value of `unit.config(options)` to some variable, otherwise the new options won't take effect:

```js
let unit = require('unitmath')

// Incorrect, has no effect!
unit.config(options)

// Correct
unit = unit.config(options) 
```

### Querying the current configuration

Call `unit.getConfig()` to return the current configuration.

```js
// Get the current configuration
unit.getConfig() // { system: 'si', ... }
```

## Extending UnitMath

### User-Defined Units

To create a user-defined unit, pass an object with a `definitions` property to `unit.config()`:

  ```js
  // Create a new configuration adding a user-defined unit
  unit = unit.config({
    definitions: {
      units: {
        lightyear: { value: '9460730472580800 m' }
      }
    }
  })

  unit('1 lightyear').to('mile') // 5878625373183.61 mile
  ```

The `definitions` object contains four properties which allow additional customization of the unit system: `units`, `prefixGroups`, `systems`, and `skipBuiltIns`.

**definitions.units**

This object contains the units that are made available by UnitMath. Each key in `definitions.units` becomes a new unit. The easiest way to define a unit is to provide a string representation in terms of other units:

```js
// Define new units in terms of existing ones
definitions: {
  units: {
    minute: { value: '60 seconds' },
    newton: { value: '1 kg m/s^2' }
  }
}
```

Here are all the options you can specify:

- `value`: (Required) The value of the unit. It can be a string or an array containing two items:

  ```js
  // value can be a string...
  definitions: {
    units: {
      minute: { value: '60 seconds' },
      newton: { value: '1 kg m/s^2' }
    }
  }

  // ...or an array.
  definitions: {
    units: {
      minute: { value: [ 60, 'seconds' ] },
      newton: { value: [ 1, 'kg m/s^2' ] }
    }
  }
  ```

- `quantity`: Specifying a `quantity` will create a new _base unit_. This is required for units that are not defined in terms of other units, such as `meter` and `second`. In this case, `value` will just be a number (or custom type):

  ```js
  // Specify `quantity` creates a new base unit
  definitions: {
    units: {
      seconds: { quantity: 'TIME', value: 1 }
    }
  }
  ```
  
  Only use `quantity` to define _base units_. Do **not** use `quantity` to define a derived unit:

  ```js
  // Incorrect
  definitions: {
    units: {
      meter: { quantity: 'LENGTH', value: 1 },
      squareMeter: { quantity: 'LENGTH^2', value: 1 }
    }
  }

  // Correct
  definitions: {
    units: {
      meter: { quantity: 'LENGTH', value: 1 },
      squareMeter: { value: '1 meter^2' }  
    }
  }
  ```

- `prefixGroup` - *Default:* `'NONE'`. Specifies which prefix group will be used when parsing and formatting the unit.

  ```js
  definitions: {
    units: {
      // Will parse 'nanometer', 'micrometer', 'millimeter', 'kilometer', 'megameter', etc.
      meter: { prefixGroup: 'LONG', ... },

      // Will parse 'nm', 'um', 'mm', 'km', 'Mm', etc.
      m: { prefixGroup: 'SHORT', ... }
    }
  }
  ```

- `formatPrefixes`: A string array that specifies individual items of the unit's prefix group which will be used when formatting a unit. If this option is omitted, the global option `formatPrefixDefault` determines whether the unit will be formatted using all prefixes in the prefix group, or none at all.

  ```js
  definitions: {
    units: {
      L: {
        value: '1e-3 m^3'
        // Parse any prefix in the 'SHORT' prefix group
        prefixGroup: 'SHORT',
        // Format only as 'nL', 'uL', 'mL', and 'L'.
        formatPrefixes: ['n', 'u', 'm', ''],
      },
      lumen: {
        value: '1 cd sr'
        // Parse any prefix in the 'LONG' prefix group
        prefixGroup: 'LONG',
        // formatPrefixes is not given, so lumen will be formatted 
        // only as "lumen" if formatPrefixDefault === false,
        // or formatted using any of the prefixes in the 'LONG' 
        // prefix group if formatPrefixDefault === true.
      }
    }
  }
  ```

- `basePrefix`: Optional. The prefix to use for a _base unit_, if the base unit has one. This is necessary for units such as kilogram, which is a base unit but has a prefix.

  ```js
  // Special case for base units with prefixes, such as kg
  definitions: {
    units: {
      g: {
        quantity: 'MASS',
        prefixGroup: 'SHORT',
        formatPrefixes: ['n', 'u', 'm', '', 'k'],
        value: 0.001,
        // Treat as if 'kg' is the base unit, not 'g'
        basePrefix: 'k'
      }
    }
  }
  ```

- `aliases`: Shortcut to create additional units with identical definitions.

  ```js
  // Create aliases for a unit
  definitions: {
    units: {
      meter: { ... , aliases: [ 'meters' ] }
    }
  }
  ```

- `offset` - *Default:* `0`: Used when the zero-value of this unit is different from the zero-value of the base unit.

  ```js
  // Special case for units with an offset from the base unit, like celsius
  definitions: {
    units: {
      celsius: {
        value: '1 K',
        offset: 273.15
      }
    }
  }
  ```

**definitions.prefixGroups**

The `definitions.prefixGroups` object is used to define strings and associated multipliers that are prefixed to units to change their value. For example, the `'k'` prefix in `km` multiplies the value of the `m` unit by 1000.

For example:

```js
// Define prefix groups
definitions: {
  prefixGroups: {
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
}
```

**definitions.systems**

This object assigns one or more units to a number of systems. Each key in `definitions.systems` becomes a system. For each system, list all the units that should be associated with that system in an array. The units may be single or compound (`m` or `m/s`) and may include prefixes.

Example:

```js
// Define unit systems
definitions: {
  systems: {
    si: ['m', 'kg', 's', 'N', 'J', 'm^3', 'm/s'],
    cgs: ['cm', 'g', 's', 'dyn', 'erg', 'cm^3', 'cm/s'],
    us: ['ft', 'lbm', 's', 'lbf', 'btu', 'gal', 'ft/s']
  }
}
```

When UnitMath formats a unit, it will try to use one of the units from the specified system.

**definitions.skipBuiltIns**

A boolean value indicating whether to skip the built-in units. If `true`, only the user-defined units, prefix groups, and systems that are explicitly included in `definitions` will be created.

```js
// Skip built-in units: only the user-defined units,
// prefix groups, and systems will be created
definitions: {
  skipBuiltIns: true
}
```

### Querying current unit definitions ###

You can view all the current definitions by calling `unit.definitions()`. This object contains all the units, prefix groups, and systems that you have configured, including the built-ins (unless `definitions.skipBuiltIns` is true).

```js
unit.definitions()
```

Below is an abbreviated sample output from `unit.definitions()`. It can serve as a starting point to create your own definitions.

```js
// Sample `definitions` config
{ 
  units: {
    '': { quantity: 'UNITLESS', value: 1 },
    meter: {
      quantity: 'LENGTH',
      prefixGroup: 'LONG',
      formatPrefixes: [ 'nano', 'micro', 'milli', 'centi', '', 'kilo' ],
      value: 1,
      aliases: [ 'meters' ]
    },
    m: {
      prefixGroup: 'SHORT',
      formatPrefixes: [ 'n', 'u', 'm', 'c', '', 'k' ],
      value: '1 meter'
    },
    inch: { value: '0.0254 meter', aliases: [ 'inches', 'in' ] },
    foot: { value: '12 inch', aliases: [ 'ft', 'feet' ] },
    yard: { value: '3 foot', aliases: [ 'yd', 'yards' ] },
    mile: { value: '5280 ft', aliases: [ 'mi', 'miles' ] },
    ...
  },
  prefixGroups: {
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
      ... 
    },
  },
  systems: {
    si: ['m', 'meter', 's', 'A', 'kg', ...],
    cgs: ['cm', 's', 'A', 'g', 'K', ...],
    us: ['ft', 's', 'A', 'lbm', 'degF', ...]
  }
}
```

### Custom Types ###

You can extend UnitMath to work with custom types. The `type` option is an object containing several properties, where each property value is a function that replaces the normal `+`, `-`, `*`, `/`, and other arithmetic operators used internally by UnitMath.

Example using Decimal.js as the custom type:

```js
// Configure UnitMath to use Decimal.js
const Decimal = require('decimal.js')
const unit = unit.config({
  type: {
    clone: (x) => new Decimal(x),
    conv: (x) => new Decimal(x),
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
    trunc: (a) => Decimal.trunc(a)
  }
})

let u = unit2('2.74518864784926316174649567946 m')
```

Below is a table of functions, their description, and when they are required:

Function | Description | Required?
---------|-------------|------------
`clone: (a: T) => T` | Create a new instance of the custom type. | Always
`conv: (a: number \| string \| T) => T` | Convert a number or string into the custom type. | Always
`add: (a: T, b: T) => T` | Add two custom types. | Always
`sub: (a: T, b: T) => T` | Subtract two custom types. | Always
`mul: (a: T, b: T) => T` | Multiply two custom types. | Always
`div: (a: T, b: T) => T` | Divide two custom types. | Always
`pow: (a: T, b: number) => T` | Raise a custom type to a power. | Always
`abs: (a: T) => T` | Return the absolute value of a custom type. | For autoPrefix: true
`lt: (a: T, b: T) => boolean` | Compare two custom types for less than. | For autoPrefix: true
`le: (a: T, b: T) => boolean` | Compare two custom types for less than or equal. | For autoPrefix: true
`gt: (a: T, b: T) => boolean` | Compare two custom types for greater than. | For autoPrefix: true
`ge: (a: T, b: T) => boolean` | Compare two custom types for greater than or equal. | For autoPrefix: true
`eq: (a: T, b: T) => boolean` | Compare two custom types for equality. | For the `equals` function
`round: (a: T) => T` | Round a custom type to the nearest integer. | For the `split` function
`trunc: (a: T) => T` | Truncate a custom type to the nearest integer. | For the `split` function


The `add`, `sub`, `mul`, `div`, and `pow` functions replace `+`, `-`, `*`, `/`, and `Math.pow`, respectively. The `clone` function should return a clone of your custom type (same value, different object). 

The `conv` function must, at a minimum, be capable of converting both strings and numbers into your custom type. If given a custom type, it should return it unchanged, or return a clone. Among other things, the `conv` function is used by UnitMath to convert the values of the built-in units to your custom type during initialization.

UnitMath will also use the `conv` function when constructing units from numbers and strings. If your custom type is representable using decimal or scientific notation (such as `6.022e+23`), you can include both the value and the units in a single string:

```js
// Supply a single string, and the numeric portion will be parsed using type.conv
unit('3.1415926535897932384626433832795 rad')
```

If your custom type cannot be represented in decimal or scientific notation, such as is the case with complex numbers and fractions, you will have to pass your custom type and the unit string separately:

```js
unit(Fraction(1, 2), 'kg')
```

The functions `clone`, `conv`, `add`, `sub`, `mul`, `div`, and `pow` are always required. Omitting any of these will cause the `config` method to throw an error. The other functions are conditionally required, and you will receive an error if you attempt something that depends on a function you haven't provided.

## API Reference ##

*In the function signatures below, the `T` type is the custom type you have provided, or `number` if you have not provided a custom type.*
### Constructor ###

- `unit(value: T, unitString: string): unit`  
  `unit(value: T): unit`  
  `unit(valueAndUnitString: string): unit`  
  `unit(): unit`  

  Creates a unit with the specified value and unit string. If `valueAndUnitString` is supplied, it must specify both the numeric portion and the units portion of the unit.

  ```js
  const unit = require('unitmath')
  unit(60, 'mile/hour') // 60 mile / hour
  unit(60) // 60
  unit('60 mile/hour') // 60 mile / hour
  unit('mile/hour') // mile / hour
  unit() // Empty unit
  ```

  `unit()` will parse the special strings `"NaN"`, `"Infinity"`, and `"-Infinity"` as the corresponding numeric values:

  ```js
  const unit = require('unitmath')
  unit('Infinity kg') // Infinity kg
  ```

  The string used to specify the unit (`valueAndUnitString` or `unitString`) must be in the following format:

  ``` 
  [value][numerator][/denominator]

  numerator, denominator:
  atomicUnit [atomicUnit ...]

  atomicUnit:
  [prefix]unit[^power]

  value:
  Any floating-point number, or the strings "NaN", "Infinity", or "-Infinity" (without the quotes).
  
  power:
  Any floating-point number

  ```

### Member Functions ###

- `add(other: unit | string | T) : unit`

  Adds another unit to this unit. If a string or number is supplied as an argument, it is converted to a unit. Both units must have values and have matching dimensions.
    
  ```js
  let a = unit('20 kW')
  let b = unit('300 W')
  let sum = a.add(b) // 20.3 kW
  ```

- `sub(other: unit | string | T) : unit`

  Subtract another unit from this unit. If a string or number is supplied as an argument, it is converted to a unit. Both units must have values and have matching dimensions.

  ```js
  let a = unit('4 ft')
  let b = unit('1 yd')
  let difference = a.sub(b) // 1 ft
  ```

- `mul(other: unit | string | T) : unit` 

  Multiplies this unit by another unit. If a string or number is supplied as an argument, it is converted to a unit.

  ```js
  let a = unit('8 m')
  let b = unit('200 N')
  let product = a.mul(b).simplify() // 1.6 kJ
  ```

- `div(other: unit | string | T) : unit`

  Divides this unit by another unit. If a string or number is supplied as an argument, it is converted to a unit.

  ```js
  let a = unit('64 kJ')
  let b = unit('16 s')
  let quotient = a.div(b).simplify() // 4 kW
  ```

- `pow(p: number)`

  Raises this unit to the power `p` and returns a new unit.

  ```js
  let result = unit('10 m').pow(3) // 1000 m^3
  ```

- `sqrt()`

  Returns the square root of this unit.

  ```js
  unit('1 hectare').sqrt().simplify() // 100 m
  ```

- `abs()`

  Returns the absolute value of this unit. If this unit has an offset, such as `degC`, this is applied before taking the absolute value.

  ```js
  unit('-5 m / s').abs() // 5 m / s
  unit('-293.15 degC').abs() // -253.15 degC
  ```

- `clone()`

  Clones this unit.

  ```js
  let unit = require('unitmath')

  let a = unit('40 m/s') // 40 m / s
  let b = a.clone() // 40 m / s
  ```

- `to(target: unit | string)`  

  Converts this unit to the specified target unit or string. The returned unit will be "fixed", so it will not be auto-simplified or auto-prefixed in `format()`. 

  ```js
  let r = unit('10 kg m^2 / s^3 A^2')
  r.simplify().toString() // 10 ohm
  r.to('kohm').toString() // 0.01 kohm
  ```

- `toBaseUnits()`

  Returns a new unit in the base representation.

  ```js
  unit('10 ft/s').toBaseUnits() // 3.048 m / s
  ```

- `getValue()`

  Returns the value of this unit, or `null` if the unit is valueless.

  ```js
  unit('70 mile/hour').getValue() // 70
  unit('km / hour').getValue() // null
  ```

- `setValue(x: number | string | custom)`

  Returns a copy of this unit but with its value replaced with the given value. Useful if you would like to perform your own operations on a unit's value. If supplied with no arguments, or `null`, will remove the value from the unit.

  ```js
  unit('10 m').setValue(20) // 20 m
  unit('m').setValue(20) // 20 m
  unit('10 ft').setValue(20) // 20 ft
  unit('10 ft').setValue() // ft
  ```

- `getNormalizedValue()`

  Returns the value of this unit if it were to be converted to SI base units (or whatever base units that are defined). Returns `null` if the unit is valueless.

  ```js
  unit('10 ft/s').getNormalizedValue() // 3.048
  ```

- `setNormalizedValue()`

  Returns a copy of this unit but with its value replaced with the given normalized value.

  ```js
  unit('ft / s').setNormalizedValue(3.048) // 10 ft / s
  ```

- `simplify()`

  Attempts to simplify this unit, and returns the simplified unit (or a clone of the original if unsuccessful). `simplify()` is called when a unit is being formatted as a string whenever the config option `simplify` is `'auto'` or `'always'`.

  ```js
  unit('10 N m').simplify() // 10 J
  ```

- `applyBestPrefix(PrefixOptions)`

  Chooses a prefix for this unit so that its value is between `prefixMin` and `prefixMax`, and returns a new unit with the prefix applied. If the value is already within the range, the unit is returned unchanged. The prefix is chosen from the unit's `formatPrefixes` property.

  ```js
  unit('0.0001 m').applyBestPrefix() // 0.1 mm
  unit('0.1 m').applyBestPrefix() // 10 cm
  unit('10000 m').applyBestPrefix() // 10 km
  ```

- `split(Array(string | unit))`

  Returns an array of units that result from splitting this unit into the given units. The sum of the resulting units is equal to this unit, and each of the returned units is the result of truncating this unit to an integer, and then passing the remainder to the next unit, until the final unit, which takes up all the remainder.

  ```js
  unit('51.4934 deg').split([ 'deg', 'arcmin', 'arcsec' ]) // [ 51 deg, 29 arcmin, 36.24 arcsec ]
  ```

- `getUnits()`

  Returns a clone of this unit with the value removed. Equivalent to `unit.setValue(null)`.

  ```js
  unit('8.314 J / mol K').getUnits() // J / mol K
  ```

- `isCompound()`

  Returns true if this unit's unit list contains two or more units, or one unit with a power not equal to 1.

  ```js
  unit('34 kg').isCompound() // false
  unit('34 kg/s').isCompound() // true
  unit('34 kg^2').isCompound() // true
  unit('34 N').isCompound() // false
  unit('34 kg m / s^2').isCompound() // true
  ```

- `isBase()`

  Returns true if this unit's unit list contains exactly one unit with a power equal to 1, and which is the of same dimension as one of the base dimensions length, time, mass, etc., or a user-defined base dimension.

  ```js

  unit = unit.config({ 
     definitions: {
      units: {
        myUnit: { quantity: 'MY_NEW_BASE', value: 1 },
        anotherUnit: { value: '4 myUnit' }
      }
    }
  })

  unit('34 kg').isBase() // true
  unit('34 kg/s').isBase() // false
  unit('34 kg^2').isBase() // false
  unit('34 N').isBase() // false
  unit('34 myUnit').isBase() // true
  unit('34 anotherUnit').isBase() // true
  ```

- `getInferredSystem()`

  Examines this unit's unitList to determine the most likely system this unit is expressed in.

  ```js
  unit('10 N m').getInferredSystem() // 'si'
  unit('10 J / m').getInferredSystem() // 'si'
  unit('10 m^3 Pa').getInferredSystem() // 'si'
  unit('10 dyne/cm').getInferredSystem() // 'cgs'
  unit('10 ft/s').getInferredSystem() // 'us'
  unit('10').getInferredSystem() // null
  ```

- `equalsQuantity(other: unit | string)`

  Returns true if this unit and another unit have equal quantities or dimensions.

  ```js
  unit('5 m/s^2').equalsQuantity('4 ft/s^2') // true
  ```

- `equals(other: unit | string)`

  Returns true if the two units represent the same values.

  ```js
  unit('3 ft').equals('1 yard') // true
  ```

- `compare(other: unit | string)`

  Returns a value indicating whether this unit is less than (-1), greater than (1), or equal to (0), another unit.

  ```js
  unit('30 min').compare('1 hour') // -1
  unit('60 min').compare('1 hour') // 0
  unit('90 min').compare('1 hour') // 1
  ```

- `lessThan(other: unit | string)`

  Compares this and another unit and returns true if this unit is less than the other.

  ```js
  unit('80 cm').lessThan('1 m') // true
  unit('100 cm').lessThan('1 m') // false
  unit('120 cm').lessThan('1 m') // false
  ```

- `lessThanOrEqual(other: unit | string)`

  Compares this and another unit and returns true if this unit is less than or equal to the other.

  ```js
  unit('80 cm').lessThanOrEqual('1 m') // true
  unit('100 cm').lessThanOrEqual('1 m') // true
  unit('120 cm').lessThanOrEqual('1 m') // false
  ```

- `greaterThan(other: unit | string)`

  Compares this and another unit and returns true if this unit is greater than the other.

  ```js
  unit('80 cm').greaterThan('1 m') // false
  unit('100 cm').greaterThan('1 m') // false
  unit('120 cm').greaterThan('1 m') // true
  ```

- `greaterThanOrEqual(other: unit | string)`

  Compares this and another unit and returns true if this unit is greater than or equal to the other.

  ```js
  unit('80 cm').greaterThanOrEqual('1 m') // false
  unit('100 cm').greaterThanOrEqual('1 m') // true
  unit('120 cm').greaterThanOrEqual('1 m') // true
  ```

- `toString(options)`

  Formats this unit as a string. Formatting options can be supplied which will override the configured options. See [Formatting](#formatting) for a list of all options and their effects.

### Static Functions ###

- `add(a: unit | string | T, b: unit | string | T) : unit`

  Adds two units. If a string or number is supplied as an argument, it is converted to a unit. Both units must have values and have matching dimensions.

  ```js
  let sum = unit.add('20 kW', '300 W') // 20.3 kW
  ```

- `sub(a: unit | string | T, b: unit | string | T) : unit`

  Subtract two units. If a string or number is supplied as an argument, it is converted to a unit. Both units must have values and have matching dimensions.

  ```js
  let difference = unit.sub('4 ft', '1 yd') // 1 ft
  ```

- `mul(a: unit | string | T, b: unit | string | T) : unit`

  Multiplies two units. If a string or number is supplied as an argument, it is converted to a unit.

  ```js
  let product = unit.mul('8 m/s', '200 N').simplify() // 1.6 kW
  ```

- `div(a: unit | string | T, b: unit | string | T) : unit`

  Divides two units. If a string or number is supplied as an argument, it is converted to a unit.

  ```js
  let quotient = unit.div('64 kJ', '16 s').simplify() // 4 kW
  ```

- `pow(a: unit | string | T, p: number) : unit`

  Raises a unit to the power `p` and returns a new unit.

  ```js
  let result = unit.pow('10 m', 3) // 1000 m^3
  ```

- `sqrt(a: unit | string | T) : unit`

  Returns the square root of a unit.

  ```js
  unit.sqrt('1 hectare').simplify() // 100 m
  ```

- `abs(a: unit | string | T) : unit`

  Returns the absolute value of a unit. If the unit has an offset, such as `degC`, this is applied before taking the absolute value.

  ```js
  unit.abs('-5 m / s') // 5 m / s
  unit.abs('300 degC') // -246.3 degC
  ```

- `to(a: unit | string | number, b: unit | string)`

  Converts a unit to the specified target unit or string. The returned unit will be "fixed", so it will not be auto-simplified or auto-prefixed in `format()`. 

  ```js
  unit.to('10 kg m^2 / s^3 A^2', 'kohm') // 0.01 kohm
  ```

- `config(options:object)`

  Configure a new unit namespace with the given options (see [Configuring](#configuring))

  ```js
  const unit = require('unitmath').config({ option1, option2, ... })
  ```

- `getConfig()`

    Returns the current configuration.

    ```js
    const unit = require('unitmath')
    unit.getConfig()
    ```
    
- `exists(singleUnitString:string)`

  Tests if the given unit, optionally with a prefix, exists.

  ```js
  const unit = require('unitmath')
  unit.exists('km') // true
  ```

- `definitions()`

  Return the current unit definitions in effect. (User's own definitions can be queried through `unit.getConfig().definitions`.)

## Contributing

This is a community-supported project; all contributions are welcome. Please open an issue or submit a pull request.

## Acknowledgements

Many thanks to Jos de Jong (@josdejong), the original author of `Unit.js`, who suggested the idea of splitting the file off from [Math.js](https://mathjs.org/) and into its own library.

### Contributors

- Harry Sarson (https://github.com/harrysarson)
- Nick Ewing (https://github.com/nickewing)
- Michal Grňo (https://github.com/m93a)
- Adriano Fantini (https://github.com/adrfantini)

## License

UnitMath is released under the Apache-2.0 license.