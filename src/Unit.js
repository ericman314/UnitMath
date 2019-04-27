
/* The export will be a function named unit.

unit's prototype will have some method properties, like add and mul.

There is also a function named config. It returns a _new_ function named unit, that has different prototype or something.

So when this module is loaded, it needs to run config once with default options.

*/

/* Will any of the configuration options affect parsing? They might. So we will also create a new parse function every time config is called. */

// Factory function _config returns a frozen unitmath namespace
let _config = function _config(options) {

  Object.freeze(options)

  // Factory function unitmath returns a new _unit (so that user does not have to use "new" keyword)
  let unitmath = function unitmath(value, unitStr) {
    return new _unit(value, unitStr)
  }

  // Constructor for instances of a unit
  let _unit = function _unit(value, unitStr) {
  
    if (!(this instanceof _unit)) {
      throw new Error('_unit constructor must be called with the new operator')
    }
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new TypeError('First parameter must be number or string')
    }
    if (unitStr !== undefined && typeof unitStr !== 'string') {
      throw new TypeError('Second parameter must be a string')
    }
  
    // console.log(`Inside the constructor: _unit(${value}, ${unitStr})`)
    
    this.type = 'Unit'
    this.value = value
    this.unitStr = unitStr
  
  }

  // These methods are available to each instance of a _unit
  _unit.prototype.add = function add(other) {
    // console.log(`You called prototype method add on ${this}`)
  }

  _unit.prototype.mul = function mul(other) {
    // console.log(`You called prototype method mul on ${this}`)
  }

  // Private methods that are scoped to this particular unitmath namespace
  let _parse = function _parse(str, options) {

  }

  // API allows user to call config to return a new unitmath namespace
  unitmath.config = function config(newOptions) {
    if (typeof(newOptions) === 'undefined') {
      return options
    }
    // TODO: Deep copy options, then assign newOptions to it
    let optionsDeepCopy = JSON.parse(JSON.stringify(options))   // This obviously will not work for options which are functions, like the extendType functions
    Object.assign(optionsDeepCopy, newOptions)
    return _config(optionsDeepCopy)
  }
  
  Object.freeze(unitmath)


  return unitmath

}

let defaultOptions = { levelOfAwesomeness: 11 }

let firstUnit = _config(defaultOptions, {}) 

export default firstUnit
