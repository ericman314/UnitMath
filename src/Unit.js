import createUnitStore from './UnitStore.js'
import { normalize, denormalize, isCompound as _isCompound, simplifyUnits } from './utils.js'

// TODO: Make things behave nicely when performing operations between units that exist in different namespaces (ahhhhh!)

/**
 * Create a clone of the this unit factory function, but with the specified options.
 * @param {Object} options Configuration options to set on the new instance.
 * @returns {Function} A new instance of the unit factory function with the specified options.
 */
let _config = function _config (options) {
  options = Object.assign({}, options)

  // Check to make sure options are valid

  const validPrefix = ['never', 'auto', 'always']
  if (!validPrefix.includes(options.prefix)) {
    throw new Error(`Invalid option for prefix: '${options.prefix}'. Valid options are ${validPrefix.join(', ')}`)
  }

  const validSimplify = ['never', 'auto', 'always']
  if (!validSimplify.includes(options.simplify)) {
    throw new Error(`Invalid option for simplify: '${options.simplify}'. Valid options are ${validSimplify.join(', ')}`)
  }

  // options.system will be checked in createUnitStore

  // Check to see if all required options.type functions have been set
  const requiredTypeFns = ['conv', 'clone', 'add', 'sub', 'mul', 'div', 'pow']
  let allRequiredTypeFnsPresent = true
  let oneRequiredTypeFnsPresent = false
  for (const fn of requiredTypeFns) {
    if (options.type[fn]._IS_UNITMATH_DEFAULT_FUNCTION) {
      allRequiredTypeFnsPresent = false
    } else {
      oneRequiredTypeFnsPresent = true
    }
  }

  if (oneRequiredTypeFnsPresent) {
    if (!allRequiredTypeFnsPresent) {
      throw new Error(`You must supply all required custom type functions: ${requiredTypeFns.join(', ')}`)
    }

    // Check type functions required for _choosePrefix
    if (options.prefix !== 'never') {
      const prefixRequiredTypeFns = ['lt', 'gt', 'le', 'ge', 'abs']
      let allPrefixRequiredTypeFnsPresent = true
      for (const fn of prefixRequiredTypeFns) {
        if (options.type[fn]._IS_UNITMATH_DEFAULT_FUNCTION) {
          allPrefixRequiredTypeFnsPresent = false
        }
      }
      if (!allPrefixRequiredTypeFnsPresent) {
        throw new Error(`The following custom type functions are required when prefix is '${options.prefix}': ${prefixRequiredTypeFns.join(', ')}`)
      }
    }
  }

  Object.freeze(options)

  /**
   * Factory function unitmath returns a new Unit (so that user does not have to use "new" keyword, but we still benefit from using prototypes)
   * @param {Number|String|*} value The `number` to assign to the unit, or a `string` representing the value and the unit string together.
   * @param {String} unitString The unit string, unless already included in the `value` parameter.
   * @returns {Unit} The Unit given by the value and unit string.
   */
  function unitmath (value, unitString) {
    let unit = new Unit(value, unitString)
    Object.freeze(unit)
    return unit
  }

  /**
   * The actual constructor for Unit. Creates a new Unit with the specified value and unit string.
   * @param {Number|String|*} value The `number` to assign to the unit, or a `string` representing the value and the unit string together.
   * @param {String} unitString The unit string, unless already included in the `value` parameter.
   * @returns {Unit} The Unit given by the value and unit string.
   */
  class Unit {
    constructor (value, unitString) {
      let parseResult

      if (typeof value === 'undefined' && typeof unitString === 'undefined') {
        // No arguments
        parseResult = unitStore.parser('')
        parseResult.value = null
      } else if (typeof value === 'string' && typeof unitString === 'undefined') {
        // single string
        parseResult = unitStore.parser(value)
      } else if (typeof unitString === 'string') {
        // number|string|custom, string
        parseResult = unitStore.parser(unitString)
        parseResult.value = options.type.conv(value)
      } else if (typeof unitString === 'undefined') {
        // number|custom
        parseResult = unitStore.parser('')
        parseResult.value = options.type.conv(value)
      } else {
        throw new TypeError('To construct a unit, you must supply a single string, two strings, a number and a string, or a custom type and a string.')
      }
      this.type = 'Unit'
      this.dimension = parseResult.dimension
      this.units = _combineDuplicateUnits(parseResult.units)
      this.value = (parseResult.value === undefined || parseResult.value === null) ? null : denormalize(this.units, normalize(parseResult.units, parseResult.value, options.type), options.type)
    }

    // These are public methods available to each instance of a Unit. They each should return a frozen Unit.

    /**
     * create a copy of this unit
     * @memberof Unit
     * @return {Unit} Returns a cloned version of the unit
     */
    clone () {
      let unit = _clone(this)
      Object.freeze(unit)
      return unit
    }

    /**
     * Adds two units. Both units' dimensions must be equal.
     * @param {Unit|string} other The unit to add to this one. If a string is supplied, it will be converted to a unit.
     * @returns {Unit} The result of adding this and the other unit.
     */
    add (other) {
      other = _convertParamToUnit(other)
      let unit = _add(this, other)
      Object.freeze(unit)
      return unit
    }

    /**
     * Subtracts two units. Both units' dimensions must be equal.
     * @param {Unit|string} other The unit to subtract from this one. If a string is supplied, it will be converted to a unit.
     * @returns {Unit} The result of subtract this and the other unit.
     */
    sub (other) {
      other = _convertParamToUnit(other)
      let unit = _sub(this, other)
      Object.freeze(unit)
      return unit
    }

    /**
     * Multiplies two units.
     * @param {Unit|string} other The unit to multiply to this one.
     * @returns {Unit} The result of multiplying this and the other unit.
     */
    mul (other) {
      other = _convertParamToUnit(other)
      let unit = _mul(this, other)
      Object.freeze(unit)
      return unit
    }

    /**
     * Divides two units.
     * @param {Unit|string} other The unit to divide this unit by.
     * @returns {Unit} The result of dividing this by the other unit.
     */
    div (other) {
      other = _convertParamToUnit(other)
      let unit = _div(this, other)
      Object.freeze(unit)
      return unit
    }

    /**
     * Calculate the power of a unit
     * @memberof Unit
     * @param {number|custom} p
     * @returns {Unit}      The result: this^p
     */
    pow (p) {
      let unit = _pow(this, p)
      Object.freeze(unit)
      return unit
    }

    /**
     * Takes the square root of a unit.
     * @memberof Unit
     * @returns {Unit} The square root of this unit.
     */
    sqrt () {
      let unit = _sqrt(this)
      Object.freeze(unit)
      return unit
    }

    /**
     * Returns the absolute value of this unit.
     * @memberOf Unit
     * @returns {Unit} The absolute value of this unit.
     */
    abs () {
      let unit = _abs(this)
      Object.freeze(unit)
      return unit
    }

    /**
     * Returns an array of units whose sum is equal to this unit, where each unit in the array is taken from the supplied string array.
     * @param {string[]} units A string array of units to split this unit into.
     * @returns {Unit[]} An array of units
     */
    split (units) {
      let us = _split(this, units)
      for (let i = 0; i < us.length; i++) {
        Object.freeze(us[i])
      }
      return us
    }

    /**
     * Convert the unit to a specific unit.
     * @memberof Unit
     * @param {string | Unit} valuelessUnit   A unit without value. Can have prefix, like "cm". If omitted, a new unit is returned which is fixed (will not be auto-simplified)
     * @returns {Unit} Returns a clone of the unit with a fixed prefix and unit.
     */
    to (valuelessUnit) {
      let unit
      if (typeof valuelessUnit === 'undefined') {
        // Special case. Just clone the unit and set as fixed.
        unit = _clone(this)
        unit.fixed = true
        Object.freeze(unit)
        return unit
      } else {
        if (!(valuelessUnit.type === 'Unit') && typeof valuelessUnit !== 'string') {
          throw new TypeError('Parameter must be a Unit or a string.')
        }
        valuelessUnit = _convertParamToUnit(valuelessUnit)
        unit = _to(this, valuelessUnit)
        Object.freeze(unit)
        return unit
      }
    }

    /**
     * Convert the unit to SI units.
     * @memberof Unit
     * @returns {Unit} Returns a clone of the unit with a fixed prefix and unit.
     */
    toSI () {
      let unit = _toSI(this)
      Object.freeze(unit)
      return unit
    }

    /**
     * Returns a new unit with the given value.
     * @param {number | string | custom} value
     * @returns A new unit with the given value.
     */
    setValue (value) {
      let unit = _setValue(this, value)
      Object.freeze(unit)
      return unit
    }

    /**
     * Returns this unit's value.
     * @returns The value of this unit.
     */
    getValue () {
      return this.value
    }

    /**
     * Returns this unit's normalized value, which is the value it would have if it were to be converted to SI base units (or whatever base units are defined)
     * @returns The notmalized value of the unit.
     */
    getNormalizedValue () {
      return normalize(this.units, this.value, options.type)
    }

    /**
     * Returns a new unit with the given normalized value.
     * @param {number | string | custom} normalizedValue
     * @returns A new unit with the given normalized value.
     */
    setNormalizedValue (normalizedValue) {
      let unit = _setValue(this, denormalize(this.units, normalizedValue, options.type))
      Object.freeze(unit)
      return unit
    }

    /**
     * Simplify this Unit's unit list and return a new Unit with the simplified list.
     * The returned Unit will contain a list of the "best" units for formatting.
     * @returns {Unit} A simplified unit if possible, or the original unit if it could not be simplified.
     */
    simplify () {
      // console.log(this)
      const result = _clone(this)

      // let proposedUnitList = simplifyUnits(result.units, unitStore, options)

      
      let systemStr = options.system
      if (systemStr === 'auto') {
        // If unit system is 'auto', then examine the existing units to infer which system is preferred. Favor 'si', or the first available system, in the event of a tie.

        // TODO: Object key order might not be consistent across platforms
        let firstAvailableSystem = Object.keys(unitStore.defs.unitSystems)[0]
        let identifiedSystems = { [firstAvailableSystem]: 0.1 }
        for (let i = 0; i < this.units.length; i++) {
          this.units[i].unit.systems.forEach(sys => {
            identifiedSystems[sys] = (identifiedSystems[sys] || 0) + 1
          })
        }
        let ids = Object.keys(identifiedSystems)
        ids.sort((a, b) => identifiedSystems[a] < identifiedSystems[b] ? 1 : -1)
        console.log(`Identified the following systems when examining unit ${result.to().format()}`, ids.map(id => `${id}=${identifiedSystems[id]}`))
        systemStr = ids[0]
      }

      let system = unitStore.defs.unitSystems[systemStr]

      const proposedUnitList = []

      // Search for a matching dimension in the given unit system
      let matchingDim
      for (const key in system) {
        if (result.hasQuantity(key)) {
          // console.log(`Found a matching dimension in system ${systemStr}: ${result.to().format()} has a dimension of ${key}, unit is ${system[key].unit.name}`)
          matchingDim = key
          break
        }
      }

      let ok = true
      if (matchingDim) {
        // console.log(`Pushing onto proposed unit list: ${system[matchingDim].prefix}${system[matchingDim].unit.name}`)
        proposedUnitList.push({
          unit: system[matchingDim].unit,
          prefix: system[matchingDim].prefix,
          power: 1.0
        })
      } else {
        // Multiple units or units with powers are formatted like this:
        // 5 kg m^2 / s^3 mol
        // Build a representation from the base units of the current unit system
        for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
          const baseDim = unitStore.defs.baseQuantities[i]
          if (Math.abs(result.dimension[i] || 0) > 1e-12) {
            if (system.hasOwnProperty(baseDim)) {
              proposedUnitList.push({
                unit: system[baseDim].unit,
                prefix: system[baseDim].prefix,
                power: result.dimension[i]
              })
            } else {
              ok = false
            }
          }
        }
      }

      // TODO: Decide when to simplify in case that the system is different, as in, unit.config({ system: 'us' })('10 N')).toString()

      if (proposedUnitList) {
        // Replace this unit list with the proposed list
        result.units = proposedUnitList
        if (this.value !== null) {
          result.value = denormalize(result.units, normalize(this.units, this.value, options.type), options.type)
        } else {
          result.value = null
        }
      }

      Object.freeze(result)
      return result
    }

    /**
     * Returns this unit without a value.
     * @memberof Unit
     * @returns {Unit} A new unit formed by removing the value from this unit.
     */
    getUnits () {
      let result = _clone(this)
      result.value = null
      Object.freeze(result)
      return result
    }

    /**
     * Returns whether the unit is compound (like m/s, cm^2) or not (kg, N, hogshead)
     * @memberof Unit
     * @returns True if the unit is compound
     */
    isCompound () {
      return _isCompound(this.units)
    }

    /**
     * check if this unit matches the given quantity
     * @memberof Unit
     * @param {QUANTITY | string | undefined} quantity
     */
    hasQuantity (quantity) {
      if (typeof (quantity) === 'string') {
        quantity = unitStore.defs.quantities[quantity]
      }
      if (!quantity) {
        return false
      }
      // Dimensions must be the same
      for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
        if (Math.abs((this.dimension[i] || 0) - (quantity[i] || 0)) > 1e-12) {
          return false
        }
      }
      return true
    }

    /**
     * Check if this unit has a dimension equal to another unit
     * @param {Unit} other
     * @return {boolean} true if equal dimensions
     */
    equalQuantity (other) {
      other = _convertParamToUnit(other)
      // All dimensions must be the same
      for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
        if (Math.abs(this.dimension[i] - other.dimension[i]) > 1e-12) {
          return false
        }
      }
      return true
    }

    /**
     * Returns a string array of all the quantities that match this unit.
     * @return {string[]} The matching quantities, or an empty array if there are no matching quantities.
     */
    getQuantities () {
      const result = []
      for (let d in unitStore.defs.quantities) {
        if (this.hasQuantity(d)) {
          result.push(d)
        }
      }
      return result
    }

    /**
     * Check if this unit equals another unit
     * @memberof Unit
     * @param {Unit} other
     * @return {boolean} true if both units are equal
     */
    equals (other) {
      if (!options.type.conv._IS_UNITMATH_DEFAULT_FUNCTION && options.type.eq._IS_UNITMATH_DEFAULT_FUNCTION) {
        throw new Error(`When using custom types, equals requires a type.eq function`)
      }
      other = _convertParamToUnit(other)
      if ((this.value === null) !== (other.value === null)) {
        // One has a value and the other does not, so they cannot be equal
        return false
      }
      let { value1, value2 } = _comparePrepare(this, other, false)
      return this.equalQuantity(other) && options.type.eq(value1, value2)
    }

    /**
     * Compare this unit to another and return a value indicating whether this unit is less than, greater than, or equal to the other.
     * @param {Unit} other
     * @return {number} -1 if this unit is less than, 1 if this unit is greater than, and 0 if this unit is equal to the other unit.
     */
    compare (other) {
      if (!options.type.conv._IS_UNITMATH_DEFAULT_FUNCTION && (options.type.gt._IS_UNITMATH_DEFAULT_FUNCTION || options.type.lt._IS_UNITMATH_DEFAULT_FUNCTION)) {
        throw new Error(`When using custom types, compare requires a type.gt and a type.lt function`)
      }
      other = _convertParamToUnit(other)
      let { value1, value2 } = _comparePrepare(this, other, true)
      if (options.type.lt(value1, value2)) {
        return -1
      } else if (options.type.gt(value1, value2)) {
        return 1
      } else {
        return 0
      }
    }

    /**
     * Compare this unit to another and return whether this unit is less than the other.
     * @param {Unit} other
     * @return {boolean} true if this unit is less than the other.
     */
    lessThan (other) {
      if (!options.type.conv._IS_UNITMATH_DEFAULT_FUNCTION && options.type.lt._IS_UNITMATH_DEFAULT_FUNCTION) {
        throw new Error(`When using custom types, lessThan requires a type.lt function`)
      }
      other = _convertParamToUnit(other)
      let { value1, value2 } = _comparePrepare(this, other, true)
      return options.type.lt(value1, value2)
    }

    /**
     * Compare this unit to another and return whether this unit is less than or equal to the other.
     * @param {Unit} other
     * @return {boolean} true if this unit is less than or equal the other.
     */
    lessThanOrEqual (other) {
      if (!options.type.conv._IS_UNITMATH_DEFAULT_FUNCTION && options.type.le._IS_UNITMATH_DEFAULT_FUNCTION) {
        throw new Error(`When using custom types, lessThanOrEqual requires a type.le function`)
      }
      other = _convertParamToUnit(other)
      let { value1, value2 } = _comparePrepare(this, other, true)
      return options.type.le(value1, value2)
    }

    /**
     * Compare this unit to another and return whether this unit is greater than the other.
     * @param {Unit} other
     * @return {boolean} true if this unit is greater than the other.
     */
    greaterThan (other) {
      if (!options.type.conv._IS_UNITMATH_DEFAULT_FUNCTION && options.type.gt._IS_UNITMATH_DEFAULT_FUNCTION) {
        throw new Error(`When using custom types, greaterThan requires a type.gt function`)
      }
      other = _convertParamToUnit(other)
      let { value1, value2 } = _comparePrepare(this, other, true)
      return options.type.gt(value1, value2)
    }

    /**
     * Compare this unit to another and return whether this unit is greater than or equal to the other.
     * @param {Unit} other
     * @return {boolean} true if this unit is greater than or equal the other.
     */
    greaterThanOrEqual (other) {
      if (!options.type.conv._IS_UNITMATH_DEFAULT_FUNCTION && options.type.ge._IS_UNITMATH_DEFAULT_FUNCTION) {
        throw new Error(`When using custom types, greaterThanOrEqual requires a type.ge function`)
      }
      other = _convertParamToUnit(other)
      let { value1, value2 } = _comparePrepare(this, other, true)
      return options.type.ge(value1, value2)
    }

    /**
     * Get a string representation of the Unit, with optional formatting options. Alias of `format`.
     * @memberof Unit
     * @param {Object} [opts]  Formatting options.
     * @return {string}
     */
    toString (...opts) {
      return this.format(...opts)
    }

    /**
     * Returns a raw string representation of this Unit, without simplifying or rounding. Could be useful for debugging.
     */
    valueOf () {
      return this.format({
        precision: 0, // 0 means do not round
        simplify: 'never',
        prefix: 'never',
        parentheses: false
      })
    }

    /**
     * Get a string representation of the Unit, with optional formatting options.
     * @memberof Unit
     * @param {Object} [userOpts]  Formatting options.
     * @return {string}
     */
    format (...userOpts) {
      let simp = this.clone()

      // A bit of clarification:
      // options is the original options
      // userOpts is a user-supplied argument
      // _opts is the original options, extended with opts if opts is an object

      let _opts = Object.assign({}, options)
      if (typeof userOpts[0] === 'object') {
        _opts = Object.assign(_opts, userOpts[0])
      }

      if (_opts.simplify === 'always') {
        simp = simp.simplify()
      } else if (_opts.simplify === 'auto' && !this.fixed && this.value !== null) {
        let simp2 = simp.simplify()

        // Determine if the simplified unit is simpler

        let calcComplexity = (unitList) => {
          // Number of total units, each adds one symbol
          let comp = unitList.length

          // Number of units in denominator and numerator
          let nDen = unitList.filter(a => a.power < 1e-14).length
          let nNum = unitList.length - nDen

          // If there are no units in the numerator, then any units in the denominator will need a ^-1

          // Number of units in the numerator containing powers !== 1, i.e. kg^2, adds two symbols
          comp += unitList.filter(a => Math.abs(a.power - 1) > 1e-14).length * 2

          // If there is at least one unit in the numerator and denominator, we will invert the denominator units' powers
          let denPowerInvert = nDen > 0 && nNum > 0 ? -1 : 1

          // Number of units in the denominator containing inverted? powers !== 1
          comp += unitList.filter(a => a.power < 0 && Math.abs(a.power * denPowerInvert - 1) > 1e-14).length * 2

          // At least one unit in numerator and denominator, adds one symbol: '/'
          if (nNum > 0 && nDen > 0) {
            comp += 1
          }

          return comp
        }

        // TODO: Decide when to simplify in case that the system is different, as in, unit.config({ system: 'us' })('10 N')).toString()

        // Is the proposed unit list "simpler" than the existing one?
        if (calcComplexity(simp2.units) <= calcComplexity(simp.units) - _opts.simplifyThreshold) {
          simp = simp2
        }
      }

      if (_opts.prefix === 'always' || (_opts.prefix === 'auto' && !this.fixed)) {
        simp = _choosePrefix(simp, _opts)
      }

      let str = ''
      if (typeof simp.value === 'number' && _opts.type.format._IS_UNITMATH_DEFAULT_FUNCTION && _opts.precision > 0) {
        // Use default formatter
        str += +simp.value.toPrecision(_opts.precision) // The extra + at the beginning removes trailing zeroes
      } else if (simp.value !== null) {
        // Use custom type's format method (which defaults to the toString(opts) method)
        str += _opts.type.format(simp.value, ...userOpts)
      }
      const unitStr = _formatUnits(simp, _opts)
      if (unitStr.length > 0 && str.length > 0) {
        str += ' '
      }
      str += unitStr
      return str
    }
  }
  // END OF UNIT CLASS

  // These private functions do not freeze the units before returning, so that we can do mutations on the units before returning the final, frozen unit to the user.

  // TODO: Possible source of unhelpful error message and user confusion, if user supplies a type that is not a unit, not a string, and not a number, to a public API method that uses this function to convert input to a unit. Since there is no way to know whether a user might be using a custom type, or just sent the wrong type.
  /**
   * Converts the supplied parameter to a frozen unit, or, if a unit was supplied, returns it unchanged.
   * @param {any} param
   * @returns {Unit} The frozen unit that was converted from the input parameter, or the original unit.
   */
  function _convertParamToUnit (param) {
    if (param.type === 'Unit') {
      return param
    }
    return unitmath(param)
  }

  /**
   * Private function _clone
   * @param {Unit} unit
   */
  function _clone (unit) {
    const result = new Unit()
    result.value = unit.value === null ? null : options.type.clone(unit.value)
    result.dimension = unit.dimension.slice(0)
    if (unit.fixed) {
      result.fixed = unit.fixed
    }
    result.units = []
    for (let i = 0; i < unit.units.length; i++) {
      result.units[i] = {}
      for (const p in unit.units[i]) {
        if (unit.units[i].hasOwnProperty(p)) {
          result.units[i][p] = unit.units[i][p]
        }
      }
    }

    return result
  }

  /**
   * Private function _combineDuplicateUnits returns a new array of unit pieces where the duplicate units have been combined together. Units with zero power are also removed.
   * @param {unit[]} units Array of unit pieces
   * @returns {unit[]} A new array of unit pieces where the duplicates have been combined together and units with zero power have been removed.
   */
  function _combineDuplicateUnits (units) {
    // Two-level deep copy of units
    let result = units.map(u => Object.assign({}, u))

    if (result.length >= 2) {
      // Combine duplicate units
      let foundUnits = {}
      for (let i = 0; i < result.length; i++) {
        if (foundUnits.hasOwnProperty(result[i].unit.name)) {
          // Combine this unit with the other
          let firstUnit = foundUnits[result[i].unit.name]
          // console.log(`Found duplicate unit: ${result[i].unit.name}`)
          // console.log(firstUnit.power)
          // console.log(result[i].power)
          firstUnit.power += result[i].power
          result.splice(i, 1)
          i--
        } else {
          foundUnits[result[i].unit.name] = result[i]
        }
      }

      // Remove units that have zero power
      for (let i = 0; i < result.length; i++) {
        if (Math.abs(result[i].power) < 1e-15) {
          result.splice(i, 1)
          i--
        }
      }
    }

    return result
  }

  function _comparePrepare (unit1, unit2, requireMatchingDimensions) {
    if (requireMatchingDimensions && !unit1.equalQuantity(unit2)) {
      throw new Error(`Cannot compare units ${unit1} and ${unit2}; dimensions do not match`)
    }
    let value1, value2
    if (unit1.value === null && unit2.value === null) {
      // If both units are valueless, get the normalized value of 1 to compare only the unit lists
      value1 = normalize(unit1.units, options.type.conv(1, unit1.value), options.type)
      value2 = normalize(unit2.units, options.type.conv(1, unit2.value), options.type)
    } else if (unit1.value !== null && unit2.value !== null) {
      // Both units have values
      value1 = normalize(unit1.units, unit1.value, options.type)
      value2 = normalize(unit2.units, unit2.value, options.type)
    } else {
      // One has a value and one does not. Not allowed.
      throw new Error(`Cannot compare units ${unit1} and ${unit2}; one has a value and the other does not`)
    }
    return { value1, value2 }
  }

  /**
   * Private function _add
   * @param {Unit} unit1 The first unit
   * @param {Unit} unit2 The second unit
   * @returns {Unit} The sum of the two units
   */
  function _add (unit1, unit2) {
    if (unit1.value === null || unit1.value === undefined || unit2.value === null || unit2.value === undefined) {
      throw new Error(`Cannot add ${unit1.toString()} and ${unit2.toString()}: both units must have values`)
    }
    if (!unit1.equalQuantity(unit2)) {
      throw new Error(`Cannot add ${unit1.toString()} and ${unit2.toString()}: dimensions do not match`)
    }
    const result = _clone(unit1)
    result.value = denormalize(unit1.units, options.type.add(normalize(unit1.units, unit1.value, options.type), normalize(unit2.units, unit2.value, options.type)), options.type)
    return result
  }

  /**
   * Private function _sub
   * @param {Unit} unit1 The first unit
   * @param {Unit} unit2 The second unit
   * @returns {Unit} The difference of the two units
   */
  function _sub (unit1, unit2) {
    if (unit1.value === null || unit1.value === undefined || unit2.value === null || unit2.value === undefined) {
      throw new Error(`Cannot subtract ${unit1.toString()} and ${unit2.toString()}: both units must have values`)
    }
    if (!unit1.equalQuantity(unit2)) {
      throw new Error(`Cannot subtract ${unit1.toString()} and ${unit2.toString()}: dimensions do not match`)
    }
    const result = _clone(unit1)
    result.value = denormalize(unit1.units, options.type.sub(normalize(unit1.units, unit1.value, options.type), normalize(unit2.units, unit2.value, options.type)), options.type)
    return result
  }

  /**
   * Private function _mul
   * @param {Unit} unit1 The first unit
   * @param {Unit} unit2 The second unit
   * @returns {Unit} The product of the two units
   */
  function _mul (unit1, unit2) {
    const result = _clone(unit1)

    for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
      // dimension arrays may be of different lengths. Default to 0.
      result.dimension[i] = unit1.dimension[i] + unit2.dimension[i]
    }

    // Append other's units list onto result
    for (let i = 0; i < unit2.units.length; i++) {
      // Make a deep copy
      const inverted = {}
      for (const key in unit2.units[i]) {
        inverted[key] = unit2.units[i][key]
      }
      result.units.push(inverted)
    }

    result.units = _combineDuplicateUnits(result.units)

    // If at least one operand has a value, then the result should also have a value
    if (unit1.value !== null || unit2.value !== null) {
      const val1 = unit1.value === null ? normalize(unit1.units, 1, options.type) : normalize(unit1.units, unit1.value, options.type)
      const val2 = unit2.value === null ? normalize(unit2.units, 1, options.type) : normalize(unit2.units, unit2.value, options.type)
      result.value = denormalize(result.units, options.type.mul(val1, val2), options.type)
    } else {
      result.value = null
    }

    return result
  }

  /**
   * Private function _div
   * @param {Unit} unit1 The first unit
   * @param {Unit} unit2 The second unit
   */
  function _div (unit1, unit2) {
    const result = _clone(unit1)

    for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
      result.dimension[i] = unit1.dimension[i] - unit2.dimension[i]
    }

    // Invert and append other's units list onto result
    for (let i = 0; i < unit2.units.length; i++) {
      // Make a deep copy
      const inverted = {}
      for (const key in unit2.units[i]) {
        inverted[key] = unit2.units[i][key]
      }
      inverted.power = -inverted.power
      result.units.push(inverted)
    }

    result.units = _combineDuplicateUnits(result.units)

    // If at least one operand has a value, the result should have a value
    if (unit1.value !== null || unit2.value !== null) {
      const val1 = unit1.value === null ? normalize(unit1.units, 1, options.type) : normalize(unit1.units, unit1.value, options.type)
      const val2 = unit2.value === null ? normalize(unit2.units, 1, options.type) : normalize(unit2.units, unit2.value, options.type)
      result.value = denormalize(result.units, options.type.div(val1, val2), options.type)
    } else {
      result.value = null
    }

    return result
  }

  /**
   * Private function _pow
   * @param {Unit} unit The unit
   * @param {number|custom} p The exponent
   */
  function _pow (unit, p) {
    // TODO: combineDuplicateUnits
    const result = _clone(unit)
    for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
      result.dimension[i] = unit.dimension[i] * p
    }

    // Adjust the power of each unit in the list
    for (let i = 0; i < result.units.length; i++) {
      result.units[i].power = result.units[i].power * p
    }

    if (result.value !== null) {
      result.value = options.type.pow(result.value, options.type.conv(p, unit.value))
    } else {
      result.value = null
    }

    return result
  }

  function _sqrt (unit) {
    return _pow(unit, options.type.conv(0.5, unit.value))
  }

  /**
     * Returns an array of units whose sum is equal to this unit, where each unit in the array is taken from the supplied string array.
     * @param {string[]} units A string array of units to split this unit into.
     * @returns {Unit[]} An array of units
     */
  function _split (unit, units) {
    if (!options.type.conv._IS_UNITMATH_DEFAULT_FUNCTION && (options.type.round._IS_UNITMATH_DEFAULT_FUNCTION || options.type.trunc._IS_UNITMATH_DEFAULT_FUNCTION)) {
      throw new Error(`When using custom types, split requires a type.round and a type.trunc function`)
    }
    let x = _clone(unit)
    const result = []
    for (let i = 0; i < units.length; i++) {
      // Convert x to the requested unit

      x = _to(x, _convertParamToUnit(units[i]))
      if (i === units.length - 1) break

      // Check to see if x.value is nearly equal to an integer,
      // since trunc can incorrectly round down if there is round-off error
      const xRounded = options.type.round(x.value)
      let xFixed
      const isNearlyEqual = options.type.eq(xRounded, x.value)
      if (isNearlyEqual) {
        xFixed = xRounded
      } else {
        xFixed = options.type.trunc(x.value)
      }

      const y = new Unit(xFixed, units[i].toString())
      result.push(y)
      x = _sub(x, y)
    }

    // This little bit fixes a bug where the remainder should be 0 but is a little bit off.
    // But instead of comparing x, the remainder, with zero--we will compare the sum of
    // all the parts so far with the original value. If they are nearly equal,
    // we set the remainder to 0.
    let testSum = options.type.conv(0, unit.value)
    for (let i = 0; i < result.length; i++) {
      testSum = options.type.add(testSum, normalize(result[i].units, result[i].value, options.type))
    }
    if (options.type.eq(testSum, normalize(unit.units, unit.value, options.type))) {
      x.value = options.type.conv(0, unit.value)
    }

    result.push(x)

    return result
  }

  function _abs (unit) {
    const result = _clone(unit)
    result.value = denormalize(result.units, options.type.abs(normalize(result.units, result.value, options.type)), options.type)
    return result
  }

  /**
   * Private function _to
   * @param {Unit} unit The unit to convert.
   * @param {Unit} valuelessUnit The valueless unit to convert it to.
   */
  function _to (unit, valuelessUnit) {
    let result
    const value = unit.value === null ? 1 : unit.value
    if (!unit.equalQuantity(valuelessUnit)) {
      throw new TypeError(`Cannot convert ${unit.toString()} to ${valuelessUnit}: dimensions do not match`)
    }
    if (valuelessUnit.value !== null) {
      throw new Error(`Cannot convert ${unit.toString()}: target unit must be valueless`)
    }
    result = _clone(valuelessUnit)
    result.value = denormalize(result.units, normalize(unit.units, value, options.type), options.type)
    result.fixed = true // Don't auto simplify
    return result
  }

  /**
   * Private function _choosePrefix
   * @param {Unit} unit The unit to choose the best prefix for.
   * @returns {Unit} A new unit that contains the "best" prefix, or, if no better prefix was found, returns the same unit unchanged.
   */
  function _choosePrefix (unit, opts) {
    let result = _clone(unit)
    let piece = result.units[0] // TODO: Someday this might choose the most "dominant" unit, or something, to prefix, rather than the first unit

    if (unit.units.length !== 1) {
      // TODO: Support for compound units
      return unit
    }
    if (unit.value === null) {
      // Unit does not have a value
      return unit
    }
    if (Math.abs(piece.power - Math.round(piece.power)) >= 1e-14) {
      // TODO: Support for non-integer powers
      return unit
    }
    if (Math.abs(piece.power) < 1e-14) {
      // Unit has power of 0, so prefix will have no effect
      return unit
    }
    if (opts.type.lt(opts.type.abs(unit.value), opts.type.conv(1e-50, unit.value))) {
      // Unit is too small for the prefix to matter
      return unit
    }
    if (opts.type.le(opts.type.abs(unit.value), opts.prefixMax) && opts.type.ge(opts.type.abs(unit.value), opts.prefixMin)) {
      // Unit's value is already acceptable
      return unit
    }

    function calcValue (prefix) {
      return opts.type.div(
        unit.value,
        opts.type.pow(
          options.type.div(
            options.type.conv(piece.unit.prefixes[prefix], unit.value),
            options.type.conv(piece.unit.prefixes[piece.prefix], unit.value)
          ),
          options.type.conv(piece.power, unit.value)
        )
      )
    }

    // TODO: Test this for negative numbers. Are we doing type.abs everywhere we need to be?
    let unitValue = opts.type.abs(unit.value)
    // console.log(`unitValue = ${unitValue}`)
    function calcScore (prefix) {
      let thisValue = opts.type.abs(calcValue(prefix))
      // console.log(`Calculating score for ${prefix}; thisValue = ${thisValue}`)
      if (opts.type.lt(thisValue, opts.prefixMin)) {
        // prefix makes the value too small
        // console.log(`Prefix makes thisValue too small`)
        return opts.type.div(options.type.conv(opts.prefixMin, unitValue), thisValue)
      }
      if (opts.type.gt(thisValue, opts.prefixMax)) {
        // prefix makes the value too large
        // console.log(`Prefix makes thisValue too large`)
        return opts.type.div(thisValue, options.type.conv(opts.prefixMax, unitValue))
      }

      // The prefix is in range, but return a score that says how close it is to the original value.
      if (opts.type.le(thisValue, unitValue)) {
        // console.log(`thisValue <= unitValue, score = ${-thisValue / unitValue} (${1-thisValue/unitValue})`)

        // return opts.type.mul(opts.type.div(thisValue, unitValue), opts.type.conv(-1, unitValue))
        return opts.type.sub(opts.type.conv(1, unitValue), opts.type.div(thisValue, unitValue))
      } else {
        // console.log(`thisValue > unitValue, score = ${-unitValue / thisValue} (${1-unitValue/thisValue})`)
        // return opts.type.mul(opts.type.div(unitValue, thisValue), opts.type.conv(-1, unitValue))
        return opts.type.sub(opts.type.conv(1, unitValue), opts.type.div(unitValue, thisValue))
      }
    }

    // We should be able to do this in one pass. Start on one end of the array, as determined by searchDirection, and search until 1) the prefix results in a value within the acceptable range, 2) or the values start getting worse.
    // Find the index to begin searching. This might be tricky because the unit could have a prefix that is *not* common.
    let bestPrefix = piece.prefix
    let bestScore = calcScore(bestPrefix)
    // console.log(`The score was ${bestScore}`)

    let prefixes
    if (opts.prefixesToChooseFrom === 'all') {
      prefixes = Object.keys(piece.unit.prefixes)
    } else if (opts.prefixesToChooseFrom === 'common') {
      prefixes = piece.unit.commonPrefixes
    }

    if (!prefixes) {
      // Unit does not have any prefixes for formatting
      return unit
    }

    for (let i = 0; i < prefixes.length; i++) {
      // What would the value of the unit be if this prefix were applied?
      let thisPrefix = prefixes[i]
      let thisScore = calcScore(thisPrefix)
      // console.log(`The score was ${thisScore}`)

      if (opts.type.lt(thisScore, bestScore)) {
        bestScore = thisScore
        bestPrefix = thisPrefix
      }
    }

    piece.prefix = bestPrefix
    result.value = denormalize(result.units, normalize(unit.units, unit.value, opts.type), opts.type)

    Object.freeze(result)
    return result
  }

  /**
   * Private function _toSI
   * @param {Unit} unit The unit to convert to SI.
   */
  function _toSI (unit) {
    const result = _clone(unit)

    const proposedUnitList = []

    // Multiple units or units with powers are formatted like this:
    // 5 (kg m^2) / (s^3 mol)
    // Build an representation from the base units of the SI unit system
    for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
      const baseDim = unitStore.defs.baseQuantities[i]
      if (Math.abs(result.dimension[i] || 0) > 1e-12) {
        if (unitStore.defs.unitSystems['si'].hasOwnProperty(baseDim)) {
          proposedUnitList.push({
            unit: unitStore.defs.unitSystems['si'][baseDim].unit,
            prefix: unitStore.defs.unitSystems['si'][baseDim].prefix,
            power: result.dimension[i]
          })
        } else {
          throw new Error(`Cannot express unit '${unit.format()}' in SI units. System 'si' does not contain a unit for base quantity '${baseDim}'`)
        }
      }
    }

    // Replace this unit list with the proposed list
    result.units = proposedUnitList
    if (unit.value !== null) { result.value = denormalize(result.units, normalize(unit.units, unit.value, options.type), options.type) }
    result.fixed = true // Don't auto simplify
    return result
  }

  /** Private function _setValue
   * @param {Unit} unit The unit to set the value of
   * @param {string | number | custom} value The value to set
   * @returns {Unit} A new unit with the given value
   */
  function _setValue (unit, value) {
    let result = _clone(unit)
    if (typeof value === 'undefined' || value === null) {
      result.value = null
    } else {
      result.value = options.type.conv(value)
    }
    return result
  }

  /**
   * Get a string representation of the units of this Unit, without the value.
   * @return {string}
   */
  function _formatUnits (unit, opts) {
    let strNum = ''
    let strDen = ''
    let nNum = 0
    let nDen = 0

    for (let i = 0; i < unit.units.length; i++) {
      if (unit.units[i].power > 0) {
        nNum++
        strNum += ' ' + unit.units[i].prefix + unit.units[i].unit.name
        if (Math.abs(unit.units[i].power - 1.0) > 1e-15) {
          strNum += '^' + unit.units[i].power
        }
      } else if (unit.units[i].power < 0) {
        nDen++
      }
    }

    if (nDen > 0) {
      for (let i = 0; i < unit.units.length; i++) {
        if (unit.units[i].power < 0) {
          if (nNum > 0) {
            strDen += ' ' + unit.units[i].prefix + unit.units[i].unit.name
            if (Math.abs(unit.units[i].power + 1.0) > 1e-15) {
              strDen += '^' + (-unit.units[i].power)
            }
          } else {
            strDen += ' ' + unit.units[i].prefix + unit.units[i].unit.name
            strDen += '^' + (unit.units[i].power)
          }
        }
      }
    }

    // Remove leading " "
    strNum = strNum.substr(1)
    strDen = strDen.substr(1)

    if (opts.parentheses) {
      // Add parans for better copy/paste back into evaluate, for example, or for better pretty print formatting
      if (nNum > 1 && nDen > 0) {
        strNum = '(' + strNum + ')'
      }
      if (nDen > 1 && nNum > 0) {
        strDen = '(' + strDen + ')'
      }
    }

    let str = strNum
    if (nNum > 0 && nDen > 0) {
      str += ' / '
    }
    str += strDen

    return str
  }

  let unitStore = createUnitStore(options)

  // Public functions available on the unitmath namespace

  /**
   * Create a clone of the this unit factory function, but with the specified options.
   * @param {Object} options Configuration options, in addition to those existing, to set on the new instance.
   * @returns {Function} A new instance of the unit factory function with the specified options; or, if no arguments are given, the current options.
   */
  unitmath.config = function config (newOptions) {
    if (typeof (newOptions) === 'undefined') {
      return options
    }

    // Shallow copy existing config
    let retOptions = Object.assign({}, options)

    // Shallow copy new options (except unit and type)
    for (let key in newOptions) {
      if (key !== 'unit' && key !== 'type') {
        retOptions[key] = newOptions[key]
      }
    }

    // Shallow copy unit and type
    retOptions.definitions = Object.assign({}, options.definitions, newOptions.definitions)
    retOptions.type = Object.assign({}, options.type, newOptions.type)
    return _config(retOptions)
  }

  unitmath.definitions = function definitions () {
    return unitStore.originalDefinitions
  }

  /* Alternate API syntax */

  /**
   * Adds two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} a The first unit to add. If a string or number is supplied, it will be converted to a unit.
   * @param {Unit|string|number} b The second unit to add. If a string or number is supplied, it will be converted to a unit.
   * @returns {Unit} The result of the addition a + b.
   */
  unitmath.add = function add (a, b) {
    return _convertParamToUnit(a).add(b)
  }

  /**
   * Subtracts two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
   * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
   * @returns {Unit} The result of the subtract a - b.
   */
  unitmath.sub = function sub (a, b) {
    return _convertParamToUnit(a).sub(b)
  }

  /**
   * Multiplies two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
   * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
   * @returns {Unit} The result a * b.
   */
  unitmath.mul = function mul (a, b) {
    return _convertParamToUnit(a).mul(b)
  }

  /**
   * Divides two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
   * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
   * @returns {Unit} The result a / b.
   */
  unitmath.div = function div (a, b) {
    return _convertParamToUnit(a).div(b)
  }
  /**
   * Raises a unit to a power.
   * @param {Unit|string|number} a The unit.
   * @param {number} b The power.
   * @returns {Unit} The result of raising the unit a to the power b.
   */
  unitmath.pow = function pow (a, b) {
    return _convertParamToUnit(a).pow(b)
  }

  /**
  * Takes the square root of a unit.
  * @param {Unit|string|number} a The unit.
  * @returns {Unit} The square root of the unit a.
  */
  unitmath.sqrt = function sqrt (a) {
    return _convertParamToUnit(a).sqrt()
  }

  /**
   * Returns the absolute value of a unit.
   * @param {Unit|string|number} a The unit.
   * @returns {Unit} The absolute value of the unit a.
   */
  unitmath.abs = function abs (a) {
    return _convertParamToUnit(a).abs()
  }

  /**
  * Convert a unit.
  * @param {Unit|string|number} unit The unit to convert.
  * @param {Unit|string} valuelessUnit The valueless unit to convert the first unit to.
  * @returns {Unit} The result of converting the unit.
  */
  unitmath.to = function to (unit, valuelessUnit) {
    return _convertParamToUnit(unit).to(valuelessUnit)
  }

  /**
  * Convert a unit to SI.
  * @param {Unit|string|number} unit The unit to convert.
  * @returns {Unit} The result of converting the unit to SI.
  */
  unitmath.toSI = function toSI (unit) {
    return _convertParamToUnit(unit).toSI()
  }

  unitmath.exists = unitStore.exists

  // TODO: This is used only for testing, could there be another way rather than exposing it on the public namespace?
  unitmath._unitStore = unitStore

  Object.freeze(unitmath)

  return unitmath
}

// Define default arithmetic functions
let defaults = {}
defaults.add = (a, b) => a + b
defaults.sub = (a, b) => a - b
defaults.mul = (a, b) => a * b
defaults.div = (a, b) => a / b
defaults.pow = (a, b) => Math.pow(a, b)
defaults.abs = (a) => Math.abs(a)
defaults.eq = (a, b) => (a === b) || Math.abs(a - b) / Math.abs(a + b) < 1e-15
defaults.lt = (a, b) => a < b
defaults.gt = (a, b) => a > b
defaults.le = (a, b) => a <= b
defaults.ge = (a, b) => a >= b
defaults.round = (a) => Math.round(a)
defaults.trunc = (a) => Math.trunc(a)
defaults.conv = (a) => typeof a === 'string' ? parseFloat(a) : a
defaults.clone = (a) => a
defaults.format = (a) => a.toString()

// These are mostly to help warn the user if they forgot to override one or more of the default functions
for (const key in defaults) {
  defaults[key]._IS_UNITMATH_DEFAULT_FUNCTION = true
}

// TODO: setting to say whether to format using only the common prefixes or all prefixes

let defaultOptions = {
  parentheses: false,
  precision: 15,
  prefix: 'auto',
  prefixMin: 0.1,
  prefixMax: 1000,
  prefixesToChooseFrom: 'common',
  simplify: 'auto',
  simplifyThreshold: 2,
  system: 'auto',
  subsystem: 'auto',
  definitions: {
    skipBuiltIns: false,
    units: {},
    prefixes: {},
    baseQuantities: [],
    quantities: {},
    unitSystems: {}
  },
  type: defaults
}

let firstUnit = _config(defaultOptions, {})

export default firstUnit
