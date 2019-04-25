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

### Formatting

Use the `toString` method to format a unit as a string:

### Configuring

You can configure global options using `unit.config(options)`:

```js
unit.config(options)
```

You can also override global options for a single unit or chained operation:

```js
let x = unit('30 kW').config(options)    // Override global options for this unit only
```

Units are immutable, so every operation on a unit creates a new unit.