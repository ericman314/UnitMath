/*
 * Example program
 * Extends UnitMath with the decimal.js type
 */
const Decimal = require('decimal.js').set({ precision: 64 })

const unit = require('../index.js').config({
  type: {
    clone: Decimal,
    conv: Decimal,
    add: (a, b) => a.add(b),
    sub: (a, b) => a.sub(b),
    mul: (a, b) => a.mul(b),
    div: (a, b) => a.div(b),
    pow: (a, b) => a.pow(b),
    lt: (a, b) => a.lt(b),
    le: (a, b) => a.lte(b),
    gt: (a, b) => a.gt(b),
    ge: (a, b) => a.gte(b),
    abs: (a) => a.abs(),
    eq: (a, b) => a.eq(b)
  }
})

console.log(Decimal(1).dividedBy(3).toString())
console.log(unit('1 m').div('3 s').toString())
console.log(unit('10000 kg m').div('3 s^2').toString())
console.log(Decimal(1).dividedBy(3) instanceof Decimal)

console.log(unit('-1m^2').equals('1m^2'))
