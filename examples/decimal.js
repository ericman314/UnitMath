/* 
 * Example program
 * Extends UnitMath with the decimal.js type
 */
const Decimal = require('decimal.js').set({ precision: 64 })
const unit = require('../index.js').config({
  type: {
    add: (a, b) => Decimal.add(a, b ),
    sub: (a, b) => Decimal.sub(a, b),
    mul: (a, b) => Decimal.mul(a, b),
    div: (a, b) => Decimal.div(a, b),
    clone: a => Decimal(a)
  }
})

console.log(Decimal(1).dividedBy(3).toString())
console.log(unit('1 m').div('3 s').toString())
