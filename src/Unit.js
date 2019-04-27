
/* The export will be a function named unit.

unit's prototype will have some method properties, like add and mul.

There is also a function named config. It returns a _new_ function named unit, that has different prototype or something.

So when this module is loaded, it needs to run config once with default options.

*/

/* Will any of the configuration options affect parsing? They might. So we will also create a new parse function every time config is called. */

/**
 * Create a clone of the this unit factory function, but with the specified options.
 * @param {Object} options Configuration options to set on the new instance.
 * @returns {Function} A new instance of the unit factory function with the specified options.
 */
let _config = function _config(options) {

  options = Object.assign({}, options)
  Object.freeze(options)

  /**
   * Factory function unitmath returns a new Unit (so that user does not have to use "new" keyword, but we still benefit from using prototypes)
   * @param {Number|String|*} value The `number` to assign to the unit, or a `string` representing the value and the unit string together.
   * @param {String} unitString The unit string, unless already included in the `value` parameter.
   * @returns {Unit} The Unit given by the value and unit string.
   */
  function unitmath(value, unitString) {
    return new Unit(value, unitString)
  }

  /**
   * The actual constructor for Unit. Creates a new Unit with the specified value and unit string.
   * @param {Number|String|*} value The `number` to assign to the unit, or a `string` representing the value and the unit string together.
   * @param {String} unitString The unit string, unless already included in the `value` parameter.
   * @returns {Unit} The Unit given by the value and unit string.
   */
  function Unit(value, unitString) {
  
    if (!(this instanceof Unit)) {
      throw new Error('_unit constructor must be called with the new operator')
    }
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new TypeError('First parameter must be number or string')
    }
    if (unitString !== undefined && typeof unitString !== 'string') {
      throw new TypeError('Second parameter must be a string')
    }
  
    // console.log(`Inside the constructor: _unit(${value}, ${unitString})`)
    
    // TODO: parse it
    this.type = 'Unit'
    this.value = value
    this.unitString = unitString
  
  }

  // These methods are available to each instance of a _unit
  Unit.prototype.add = function add(other) {
    // console.log(`You called prototype method add on ${this}`)
  }

  Unit.prototype.mul = function mul(other) {
    // console.log(`You called prototype method mul on ${this}`)
  }

  // Private methods that are scoped to this particular unitmath namespace
  let _parse = function _parse(str, options) {

  }

  /**
   * Create a clone of the this unit factory function, but with the specified options.
   * @param {Object} options Configuration options, in addition to those existing, to set on the new instance.
   * @returns {Function} A new instance of the unit factory function with the specified options.
   */
  unitmath.config = function config(newOptions) {
    if (typeof(newOptions) === 'undefined') {
      return options
    }
    // TODO: Deep copy options, then assign newOptions to it

    let retOptions = Object.assign({}, options, newOptions)
    return _config(retOptions)
  }
  
  Object.freeze(unitmath)


  return unitmath

}

let defaultOptions = { levelOfAwesomeness: 11 }

let firstUnit = _config(defaultOptions, {}) 

export default firstUnit
