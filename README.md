# unitmath
Unitmath is a JavaScript library for unit conversion and arithmetic. 

## Install

```
npm install unitmath
```

***The following is a proposed API only, it has not yet been implemented.***

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

### Performing operations on units

```js
a.div(b)    // 40 mile / hour
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

### Configuring

Unitmath can be configured using various options. The factory method `config(options)` returns a ***new*** instance of unitmath with the specified configuration options:

```js
const unit = require('unitmath').config(options)    // TODO: show simple example using actual options
```

The available options are:

- **format**: *Object*
  - **system**: *String* -- The unit system to use. Examples are `US` and `SI`.
- **extendType**: *Object* -- See below

TODO: List the options here

#### Advanced Configuration

You can have multiple configurations active in the same program:

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

**Important:** `config(options)` returns a *new* instance of the factory function, so you must assign the return value of `unit.config(options)` to some variable, or the new options won't take effect:

```js
let unit = require('unitmath')

unit = unit.config(options)
```

The following WILL NOT work as expected:

```js
const unit = require('unitmath')

unit.config(options)    // DOES NOT WORK
```

#### Extending unitmath

You can easily extend unitmath to work with data types other than `number` by setting the `extendType` option. This replaces the internal arithmetic functions used by unitmath with functions you specify. For example, if you wrote an arbitrary-precision number library, and would like to use arbitrary-precision numbers with unitmath:

```js
const apNumber = require('my-arbitrary-precision-number')
const unit = require('unitmath').config({
  extendType: {
    add: apNumber.add,
    mul: apNumber.mul,
    ...
  }
})

let apUnit = unit(apNumber(2.74518864784926316174649567946), 'm')
```

You must at least extend the `add`, `mul`, ... functions. If you try to use custom types without extending all of unitmath's internal arithmetic functions, you will probably receive a `TypeError`. 
