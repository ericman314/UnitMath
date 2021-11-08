import { createUnitStore } from './UnitStore'
import { normalize, denormalize, isCompound as _isCompound } from './utils'
import { BaseUnit, FormatOptions, Options, ParsedUnit, PartialOptions, TypeArithmetics, Unit, UnitFactory, UnitProps, UnitPropsWithQuantity } from './types'

// TODO: Make things behave nicely when performing operations between units that exist in different namespaces (ahhhhh!)

// Note to self: We've had to remove a lot a functionality to get this to work. 
// - custom types
// For reference, see:
// https://github.com/ericman314/UnitMath/commit/adc4674c6b828912805a4160c48d5f557821c8e7.

// type n = number
const IS_DEFAULT_FUN = '_IS_UNITMATH_DEFAULT_FUNCTION'


export function isUnitPropsWithQuantity(unit: UnitProps): unit is UnitPropsWithQuantity {
  return unit && unit.quantity !== undefined
}

/**
 * Create a clone of the this unit factory function, but with the specified options.
 * @param {Object} options Configuration options to set on the new instance.
 * @returns {Function} A new instance of the unit factory function with the specified options.
 */
let _config = function _config(options: Options): UnitFactory {
  options = { ...options }

  // Check to make sure options are valid

  const validPrefix = ['never', 'auto', 'always']
  if (options.prefix && !validPrefix.includes(options.prefix)) {
    throw new Error(`Invalid option for prefix: '${options.prefix}'. Valid options are ${validPrefix.join(', ')}`)
  }

  const validSimplify = <const>['never', 'auto', 'always']
  if (options.simplify && !validSimplify.includes(options.simplify)) {
    throw new Error(`Invalid option for simplify: '${options.simplify}'. Valid options are ${validSimplify.join(', ')}`)
  }

  // options.system will be checked in createUnitStore

  // Check to see if all required options.type functions have been set
  const requiredTypeFns = <const> ['conv', 'clone', 'add', 'sub', 'mul', 'div', 'pow']
  let allRequiredTypeFnsPresent = true
  let oneRequiredTypeFnsPresent = false
  for (const fn of requiredTypeFns) {
    if (options.type?.[fn][IS_DEFAULT_FUN]) {
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
      const prefixRequiredTypeFns = <const> ['lt', 'gt', 'le', 'ge', 'abs']
      let allPrefixRequiredTypeFnsPresent = true
      for (const fn of prefixRequiredTypeFns) {
        if (options.type?.[fn][IS_DEFAULT_FUN]) {
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

  function unitmath(): Unit
  function unitmath(str: string): Unit
  function unitmath(value: number | null, unitString?: string): Unit
  function unitmath(value?: any, unitString?: any) {
    let unit = new _Unit(value, unitString)
    Object.freeze(unit)
    return unit
  }

  /**
   * The actual constructor for Unit. Creates a new Unit with the specified value and unit string.
   * @param {Number|String|*} value The `number` to assign to the unit, or a `string` representing the value and the unit string together.
   * @param {String} unitString The unit string, unless already included in the `value` parameter.
   * @returns {_Unit} The Unit given by the value and unit string.
   */
  class _Unit
    implements Unit {
    readonly type = 'Unit'

    public value: number | null
    public baseUnits: BaseUnit[]
    public dimension: Record<string, number>

    /** whether the prefix and the units are fixed */
    public fixed: boolean

    constructor()
    constructor(str: string)
    constructor(parsedUnit: ParsedUnit)
    constructor(value: number | null, unit: string)
    constructor(value?: number | null | string | ParsedUnit, unitString?: string) {
      let parseResult: ParsedUnit

      if (typeof value === 'undefined' && typeof unitString === 'undefined') {
        // No arguments
        parseResult = unitStore.parser('')
        parseResult.value = null
      } else if (typeof value === 'string' && typeof unitString === 'undefined') {
        // single string
        parseResult = unitStore.parser(value)
      } else if (_isParsedUnit(value)) {
        // value has already been parsed, it just hasn't been constructed into a Unit
        parseResult = value
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
      // console.log(require('util').inspect(parseResult, false, 4, true))

      this.dimension = _removeZeroDimensions(parseResult.dimension)
      this.baseUnits = _combineDuplicateUnits(parseResult.baseUnits)
      this.value = (parseResult.value === undefined || parseResult.value === null) ? null : denormalize(this.baseUnits, normalize(parseResult.baseUnits, parseResult.value, options.type), options.type)
      this.fixed = false
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
    add(other: Unit | string): Unit
    add(value: number, unit: string): Unit
    add(value?: any, unitString?: any) {
      const other = _convertParamToUnit(value, unitString)
      const unit = _add(this, other)
      Object.freeze(unit)
      return unit
    }

    /**
     * Subtracts two units. Both units' dimensions must be equal.
     * @param {Unit|string} other The unit to subtract from this one. If a string is supplied, it will be converted to a unit.
     * @returns {Unit} The result of subtract this and the other unit.
     */
    sub(other: Unit | string): Unit
    sub(value: number, unit: string): Unit
    sub(value?: any, unitString?: any) {
      const other = _convertParamToUnit(value, unitString)
      const unit = _sub(this, other)
      Object.freeze(unit)
      return unit
    }

    /**
     * Multiplies two units.
     * @param {Unit|string} other The unit to multiply to this one.
     * @returns {Unit} The result of multiplying this and the other unit.
     */
    mul(other: Unit | string): Unit
    mul(value: number, unit: string): Unit
    mul(value?: any, unitString?: any) {
      const other = _convertParamToUnit(value, unitString)
      const unit = _mul(this, other)
      Object.freeze(unit)
      return unit
    }

    /**
     * Divides two units.
     * @param {Unit|string} other The unit to divide this unit by.
     * @returns {Unit} The result of dividing this by the other unit.
     */
    div(other: Unit | string): Unit
    div(value: number, unit: string): Unit
    div(value?: any, unitString?: any) {
      const other = _convertParamToUnit(value, unitString)
      const unit = _div(this, other)
      Object.freeze(unit)
      return unit
    }

    /**
     * Calculate the power of a unit
     * @memberof Unit
     * @param {number|custom} p
     * @returns {Unit}      The result: this^p
     */
    pow(p: number) {
      const unit = _pow(this, p)
      Object.freeze(unit)
      return unit as Unit
    }

    /**
     * Takes the square root of a unit.
     * @memberof Unit
     * @returns {Unit} The square root of this unit.
     */
    sqrt() {
      const unit = _sqrt(this)
      Object.freeze(unit)
      return unit as Unit
    }

    /**
     * Returns the absolute value of this unit.
     * @memberOf Unit
     * @returns {Unit} The absolute value of this unit.
     */
    abs() {
      const unit = _abs(this)
      Object.freeze(unit)
      return unit as Unit
    }

    /**
     * Returns an array of units whose sum is equal to this unit, where each unit in the array is taken from the supplied string array.
     * @param {string[]} units A string array of units to split this unit into.
     * @returns {Unit[]} An array of units
     */
    split(units: string[]): Unit[] {
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
    to(valuelessUnit?: string | Unit): Unit {
      let unit: Unit
      if (typeof valuelessUnit === 'undefined') {
        // Special case. Just clone the unit and set as fixed.
        unit = _clone(this)
        unit.fixed = true
        Object.freeze(unit)
        return unit
      } else {
        if (typeof valuelessUnit !== 'string' && valuelessUnit.type !== 'Unit') {
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
    toBaseUnits(): Unit {
      let unit = _toBaseUnits(this)
      Object.freeze(unit)
      return unit
    }

    /**
     * Returns a new unit with the given value.
     * @param {number | string | custom} value
     * @returns A new unit with the given value.
     */
    setValue(value: string | number | null): Unit {
      let unit = _setValue(this, value)
      Object.freeze(unit)
      return unit
    }

    /**
     * Returns this unit's value.
     * @returns The value of this unit.
     */
    getValue() {
      return this.value
    }

    /**
     * Returns this unit's normalized value, which is the value it would have if it were to be converted to SI base units (or whatever base units are defined)
     * @returns The notmalized value of the unit.
     */
    getNormalizedValue() {
      return this.value === null ? null : normalize(this.baseUnits, this.value, options.type)
    }

    /**
     * Returns a new unit with the given normalized value.
     * @param {number | string | custom} normalizedValue
     * @returns A new unit with the given normalized value.
     */
    setNormalizedValue(normalizedValue: number) {
      let unit = _setValue(this, denormalize(this.baseUnits, normalizedValue, options.type))
      Object.freeze(unit)
      return unit
    }

    /**
     * Simplify this Unit's unit list and return a new Unit with the simplified list.
     * The returned Unit will contain a list of the "best" units for formatting.
     * @returns {Unit} A simplified unit if possible, or the original unit if it could not be simplified.
     */
    simplify(system?: string) {
      // console.log(this)
      const result = _clone(this)

      let systemStr: string = system ?? options.system
      if (systemStr === 'auto') {
        // If unit system is 'auto', then examine the existing units to infer which system is preferred.
        let identifiedSystems: Record<string, number> = {}
        for (let unit of this.baseUnits) {
          for (let system of Object.keys(unitStore.defs.systems)) {
            for (let systemUnit of unitStore.defs.systems[system]) {
              let systemUnitString = `${systemUnit.baseUnits[0].prefix}${systemUnit.baseUnits[0].unit.name}`
              let unitString = `${unit.prefix}${unit.unit.name}`
              if (systemUnit.baseUnits.length === 1 && systemUnitString === unitString) {
                identifiedSystems[system] = (identifiedSystems[system] || 0) + 1
              }
            }
          }
        }
        let ids = Object.keys(identifiedSystems)
        // TODO: No need to sort this, can just pick the best
        ids.sort((a, b) => identifiedSystems[a] < identifiedSystems[b] ? 1 : -1)
        // console.log(`Identified the following systems when examining unit ${result.clone().to().format()}`, ids.map(id => `${id}=${identifiedSystems[id]}`))
        systemStr = ids[0]
      }

      let unitsOfSystem = unitStore.defs.systems[systemStr] || []

      const proposedUnitList: BaseUnit[] = []

      let matchingUnit: Unit | ParsedUnit | undefined

      // Several methods to decide on the best unit for simplifying

      // 1. Search for a matching dimension in the given unit system
      if (!matchingUnit) {
        let matchingUnitsOfSystem: ParsedUnit[] = []
        for (let unit of unitsOfSystem) {
          if (this.equalQuantity(unit)) {
            matchingUnitsOfSystem.push(unit)
          }
        }

        // Default to the first matching unit of the system
        if (matchingUnitsOfSystem.length > 0) {
          matchingUnit = matchingUnitsOfSystem[0]
        }

        // If one of our current units matches one in the system, use that instead
        for (let baseUnit of this.baseUnits) {
          for (let systemUnit of matchingUnitsOfSystem) {
            let systemUnitString = `${systemUnit.baseUnits[0].prefix}${systemUnit.baseUnits[0].unit.name}`
            let unitString = `${baseUnit.prefix}${baseUnit.unit.name}`
            if (systemUnit.baseUnits.length === 1 && systemUnitString === unitString) {
              matchingUnit = systemUnit
              break
            }
          }
        }
      }

      // 2. Search for a matching unit in the current units
      if (!matchingUnit) {
        for (let baseUnit of this.baseUnits) {
          if (this.equalQuantity(baseUnit.unit.name)) {
            matchingUnit = new _Unit(baseUnit.unit.name)
            break
          }
        }
      }

      // 3. Search for a matching dimension in all units
      if (!matchingUnit) {
        for (let baseUnit of Object.keys(unitStore.defs.units)) {
          if (this.equalQuantity(baseUnit)) {
            matchingUnit = new _Unit(baseUnit)
            break
          }
        }
      }

      let ok = true
      if (matchingUnit) {
        // console.log(matchingUnit)
        proposedUnitList.push(...matchingUnit.baseUnits)
      } else {
        // Did not find a matching unit in the system
        // 4. Build a representation from the base units of all defined units
        for (let dim of Object.keys(result.dimension)) {
          if (Math.abs(result.dimension[dim] || 0) > 1e-12) {
            let found = false
            for (const unit of Object.values(unitStore.defs.units)) {
              if (unit.quantity === dim) {
                // TODO: Try to use a matching unit from the specified system, instead of the base unit that was just found
                proposedUnitList.push({
                  unit,
                  prefix: unit.basePrefix || '',
                  power: result.dimension[dim]
                })
                found = true
                break
              }
            }
            if (!found) ok = false
          }
        }
      }

      if (ok) {
        // Replace this baseUnit list with the proposed list
        result.baseUnits = proposedUnitList
        if (this.value !== null) {
          result.value = denormalize(result.baseUnits, normalize(this.baseUnits, this.value, options.type), options.type)
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
      return _isCompound(this.baseUnits)
    }

    /**
     * check if this unit matches the given quantity
     * @memberof Unit
     * @param {QUANTITY | string | undefined} quantity
     */
    // hasQuantity (quantity) {
    //   if (typeof quantity === 'string') {
    //     quantity = unitStore.defs.quantities[quantity]
    //   }
    //   if (!quantity) {
    //     return false
    //   }
    //   // Dimensions must be the same
    //   for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
    //     if (Math.abs((this.dimension[i] || 0) - (quantity[i] || 0)) > 1e-12) {
    //       return false
    //     }
    //   }
    //   return true
    // }

    /**
     * Check if this unit has a dimension equal to another unit
     * @param {Unit} other
     * @return {boolean} true if equal dimensions
     */
    equalQuantity(other: Unit | ParsedUnit | string | number) {
      other = _convertParamToUnit(other)
      // All dimensions must be the same
      for (let dim of Object.keys({ ...this.dimension, ...other.dimension })) {
        if (Math.abs((this.dimension[dim] || 0) - (other.dimension[dim] || 0)) > 1e-12) {
          return false
        }
      }
      return true
    }

    /**
     * Returns a string array of all the quantities that match this unit.
     * @return {string[]} The matching quantities, or an empty array if there are no matching quantities.
     */
    // getQuantities () {
    //   const result = []
    //   for (let d of Object.keys(unitStore.defs.quantities)) {
    //     if (this.hasQuantity(d)) {
    //       result.push(d)
    //     }
    //   }
    //   return result
    // }

    /**
     * Check if this unit equals another unit
     * @memberof Unit
     * @param {Unit} other
     * @return {boolean} true if both units are equal
     */
    equals(other: Unit) {
      if (!options.type.conv[IS_DEFAULT_FUN] && options.type.eq[IS_DEFAULT_FUN]) {
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
    compare(other: Unit | string | number) {
      if (!options.type.conv[IS_DEFAULT_FUN] && (options.type.gt[IS_DEFAULT_FUN] || options.type.lt[IS_DEFAULT_FUN])) {
        throw new Error(`When using custom types, compare requires a type.gt and a type.lt function`)
      }
      other = _convertParamToUnit(other)
      let { value1, value2 } = _comparePrepare(this, other, true)

      if (isNaN(value1)) {
        return 1
      } else if (isNaN(value2)) {
        return -1
      } else if (options.type.lt(value1, value2)) {
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
    lessThan(other: Unit | string | number) {
      if (!options.type.conv[IS_DEFAULT_FUN] && options.type.lt[IS_DEFAULT_FUN]) {
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
    lessThanOrEqual(other: Unit | string | number) {
      if (!options.type.conv[IS_DEFAULT_FUN] && options.type.le[IS_DEFAULT_FUN]) {
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
    greaterThan(other: Unit | string | number) {
      if (!options.type.conv[IS_DEFAULT_FUN] && options.type.gt[IS_DEFAULT_FUN]) {
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
    greaterThanOrEqual(other: Unit | string | number) {
      if (!options.type.conv[IS_DEFAULT_FUN] && options.type.ge[IS_DEFAULT_FUN]) {
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
    toString(formatOptions?: Partial<FormatOptions>, ...userArgs: any[]) {
      return this.format(formatOptions, ...userArgs)
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
     * @param {FormatOptions} formatOptions  Formatting options.
     * @param {any[]} userArgs Arguments to pass to a user-defined format function. Ignored if no format function has been configured
     * @return {string}
     */
    format(formatOptions?: Partial<FormatOptions>, ...userArgs: any[]) {
      let simp = this.clone()

      // A bit of clarification:
      // options is the original options
      // userOpts is a user-supplied argument
      // _opts is the original options, extended with opts if opts is an object

      let _opts = Object.assign({}, options)
      if (typeof formatOptions === 'object') {
        _opts = Object.assign(_opts, formatOptions)
      }


      if (_opts.simplify === 'always') {
        simp = simp.simplify(_opts.system)
      } else if (_opts.simplify === 'auto' && !this.fixed && this.value !== null) {
        let simp2 = simp.simplify(_opts.system)

        // Determine if the simplified unit is simpler

        let calcComplexity = (unitList: BaseUnit[]) => {
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
        if (calcComplexity(simp2.baseUnits) <= calcComplexity(simp.baseUnits) - _opts.simplifyThreshold) {
          simp = simp2
        }
      }

      if (_opts.prefix === 'always' || (_opts.prefix === 'auto' && !this.fixed)) {
        simp = _choosePrefix(simp, _opts)
      }

      let str = ''
      if (typeof simp.value === 'number' && options.type.format[IS_DEFAULT_FUN] && _opts.precision > 0) {
        // Use default formatter
        str += +simp.value.toPrecision(_opts.precision) // The extra + at the beginning removes trailing zeroes
      } else if (simp.value !== null) {
        // Use custom type's format method (which defaults to the toString(opts) method)
        str += options.type.format(simp.value, ...userArgs)
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

  // function _convertParamToUnit<V extends T | n>(other: Unit | string | n): Unit
  // function _convertParamToUnit<V extends T|n>(value: V, unit: string): Unit

  // function _convertParamToUnit<V extends T|n> (a?: any, b?: any): Unit {

  function _isUnit(a: any): a is Unit {
    return a?.type === 'Unit' && a.hasOwnProperty('clone')
  }

  function _isParsedUnit(a: any): a is ParsedUnit {
    return a?.type === 'Unit' && !a.hasOwnProperty('clone')
  }

  function _convertParamToUnit(other: Unit | ParsedUnit | string | number): Unit
  function _convertParamToUnit(value: number, unit: string): Unit

  function _convertParamToUnit(otherOrValue: Unit | ParsedUnit | string | number, unit?: string): Unit {
    if (_isUnit(otherOrValue)) {
      return otherOrValue
    } else if (_isParsedUnit(otherOrValue)) {
      let u = new _Unit(otherOrValue)
      return u
    } else if (typeof otherOrValue === 'string') {
      return unitmath(otherOrValue)
    } else {
      return unitmath(otherOrValue, unit)
    }
  }

  /**
   * Private function _clone
   * @param {Unit} unit
   */
  function _clone(unit: Unit): Unit {
    const result = new _Unit()
    result.value = unit.value === null ? null : options.type.clone(unit.value)
    result.dimension = { ...unit.dimension }
    if (unit.fixed) {
      result.fixed = unit.fixed
    }
    result.baseUnits = []
    for (let i = 0; i < unit.baseUnits.length; i++) {
      result.baseUnits[i] = {} as any
      result.baseUnits[i] = { ...unit.baseUnits[i] }
    }

    return result as Unit
  }

  /**
   * Private function _combineDuplicateUnits returns a new array of unit pieces where the duplicate units have been combined together. Units with zero power are also removed.
   * @param {BaseUnit[]} baseUnits Array of base units
   *
   * @returns {BaseUnit[]} A new array of unit pieces where the duplicates have been combined together and units with zero power have been removed.
   */
  function _combineDuplicateUnits(baseUnits: BaseUnit[]): BaseUnit[] {
    // Two-level deep copy of units
    let combinedBaseUnits = baseUnits.map(u => Object.assign({}, u))

    if (combinedBaseUnits.length >= 2) {
      // Combine duplicate units
      let foundUnits: Record<string, BaseUnit> = {}
      for (let i = 0; i < combinedBaseUnits.length; i++) {
        if (foundUnits.hasOwnProperty(combinedBaseUnits[i].unit.name)) {
          // Combine this unit with the other
          let firstUnit = foundUnits[combinedBaseUnits[i].unit.name]
          // console.log(`Found duplicate unit: ${result[i].unit.name}`)
          // console.log(firstUnit.power)
          // console.log(result[i].power)
          firstUnit.power += combinedBaseUnits[i].power
          combinedBaseUnits.splice(i, 1)
          i--
        } else {
          foundUnits[combinedBaseUnits[i].unit.name] = combinedBaseUnits[i]
        }
      }

      // Remove units that have zero power
      for (let i = 0; i < combinedBaseUnits.length; i++) {
        if (Math.abs(combinedBaseUnits[i].power) < 1e-15) {
          combinedBaseUnits.splice(i, 1)
          i--
        }
      }
    }

    return combinedBaseUnits
  }

  /**
   * Private function _removeZeroDimensions removes dimensions that have zero exponent
   * @param {object} dimensions The dimensions to process
   * @returns {object} A new object with the zero dimensions removed
   */
  function _removeZeroDimensions (dimensions: Record<string, number>): Record<string, number> {
    let result = { ...dimensions }
    for (let dim of Object.keys(result)) {
      if (Math.abs(result[dim]) < 1e-15) {
        delete result[dim]
      }
    }
    return result
  }

  function _comparePrepare(unit1: Unit, unit2: Unit, requireMatchingDimensions: boolean) {
    if (requireMatchingDimensions && !unit1.equalQuantity(unit2)) {
      throw new Error(`Cannot compare units ${unit1} and ${unit2}; dimensions do not match`)
    }
    let value1, value2
    if (unit1.value === null && unit2.value === null) {
      // If both units are valueless, get the normalized value of 1 to compare only the unit lists
      value1 = normalize(unit1.baseUnits, options.type.conv(1), options.type)
      value2 = normalize(unit2.baseUnits, options.type.conv(1), options.type)
    } else if (unit1.value !== null && unit2.value !== null) {
      // Both units have values
      value1 = normalize(unit1.baseUnits, unit1.value, options.type)
      value2 = normalize(unit2.baseUnits, unit2.value, options.type)
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
  function _add(unit1: Unit, unit2: Unit) {
    if (unit1.value === null || unit1.value === undefined || unit2.value === null || unit2.value === undefined) {
      throw new Error(`Cannot add ${unit1.toString()} and ${unit2.toString()}: both units must have values`)
    }
    if (!unit1.equalQuantity(unit2)) {
      throw new Error(`Cannot add ${unit1.toString()} and ${unit2.toString()}: dimensions do not match`)
    }
    const result = _clone(unit1)
    result.value = denormalize(unit1.baseUnits, options.type.add(normalize(unit1.baseUnits, unit1.value, options.type), normalize(unit2.baseUnits, unit2.value, options.type)), options.type)
    return result
  }

  /**
   * Private function _sub
   * @param {Unit} unit1 The first unit
   * @param {Unit} unit2 The second unit
   * @returns {Unit} The difference of the two units
   */
  function _sub(unit1: Unit, unit2: Unit): Unit {
    if (unit1.value === null || unit1.value === undefined || unit2.value === null || unit2.value === undefined) {
      throw new Error(`Cannot subtract ${unit1.toString()} and ${unit2.toString()}: both units must have values`)
    }
    if (!unit1.equalQuantity(unit2)) {
      throw new Error(`Cannot subtract ${unit1.toString()} and ${unit2.toString()}: dimensions do not match`)
    }
    const result = _clone(unit1)
    result.value = denormalize(unit1.baseUnits, options.type.sub(normalize(unit1.baseUnits, unit1.value, options.type), normalize(unit2.baseUnits, unit2.value, options.type)), options.type)
    return result
  }

  /**
   * Private function _mul
   * @param {Unit} unit1 The first unit
   * @param {Unit} unit2 The second unit
   * @returns {Unit} The product of the two units
   */
  function _mul(unit1: Unit, unit2: Unit) {
    const result = _clone(unit1)

    for (let dim of Object.keys({ ...unit1.dimension, ...unit2.dimension })) {
      result.dimension[dim] = (unit1.dimension[dim] || 0) + (unit2.dimension[dim] || 0)
      if (Math.abs(result.dimension[dim]) < 1e-15) delete result.dimension[dim]
    }

    // Append other's units list onto result
    for (let i = 0; i < unit2.baseUnits.length; i++) {
      // Make a deep copy
      const inverted = { ...unit2.baseUnits[i] }
      result.baseUnits.push(inverted)
    }

    result.baseUnits = _combineDuplicateUnits(result.baseUnits)
    result.dimension = _removeZeroDimensions(result.dimension)

    // If at least one operand has a value, then the result should also have a value
    if (unit1.value !== null || unit2.value !== null) {
      const val1 = unit1.value === null ? normalize(unit1.baseUnits, 1, options.type) : normalize(unit1.baseUnits, unit1.value, options.type)
      const val2 = unit2.value === null ? normalize(unit2.baseUnits, 1, options.type) : normalize(unit2.baseUnits, unit2.value, options.type)
      result.value = denormalize(result.baseUnits, options.type.mul(val1, val2), options.type)
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
  function _div(unit1: Unit, unit2: Unit) {
    const result = _clone(unit1)
    for (let dim of Object.keys({ ...unit1.dimension, ...unit2.dimension })) {
      result.dimension[dim] = (unit1.dimension[dim] || 0) - (unit2.dimension[dim] || 0)
      if (Math.abs(result.dimension[dim]) < 1e-15) delete result.dimension[dim]
    }

    // Invert and append other's units list onto result
    for (let i = 0; i < unit2.baseUnits.length; i++) {
      // Make a deep copy
      const inverted = { ...unit2.baseUnits[i] }
      inverted.power = -inverted.power
      result.baseUnits.push(inverted)
    }

    result.baseUnits = _combineDuplicateUnits(result.baseUnits)
    result.dimension = _removeZeroDimensions(result.dimension)

    // If at least one operand has a value, the result should have a value
    if (unit1.value !== null || unit2.value !== null) {
      const val1 = unit1.value === null ? normalize(unit1.baseUnits, 1, options.type) : normalize(unit1.baseUnits, unit1.value, options.type)
      const val2 = unit2.value === null ? normalize(unit2.baseUnits, 1, options.type) : normalize(unit2.baseUnits, unit2.value, options.type)
      result.value = denormalize(result.baseUnits, options.type.div(val1, val2), options.type)
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
  function _pow(unit: Unit, p: number) {
    // TODO: combineDuplicateUnits
    const result = _clone(unit)
    for (let dim of Object.keys(result.dimension)) {
      result.dimension[dim] = unit.dimension[dim] * p
    }

    // Adjust the power of each unit in the list
    for (let i = 0; i < result.baseUnits.length; i++) {
      result.baseUnits[i].power = result.baseUnits[i].power * p
    }

    if (result.value !== null) {
      result.value = options.type.pow(result.value, options.type.conv(p))
    } else {
      result.value = null
    }

    return result
  }

  function _sqrt(unit: Unit) {
    return _pow(unit, options.type.conv(0.5))
  }

  /**
     * Returns an array of units whose sum is equal to this unit, where each unit in the array is taken from the supplied string array.
     * @param {string[]} units A string array of units to split this unit into.
     * @returns {Unit[]} An array of units
     */
  function _split(unit: Unit, units: string[]): Unit[] {
    if (!options.type.conv[IS_DEFAULT_FUN] && (options.type.round[IS_DEFAULT_FUN] || options.type.trunc[IS_DEFAULT_FUN])) {
      throw new Error(`When using custom types, split requires a type.round and a type.trunc function`)
    }
    // We use the non-null assertion operator (!) a few times below, because we're pretty sure unit.value is not null
    if (unit.value === null) {
      throw new Error(`Cannot split ${unit.toString()}: unit has no value`)
    }
    let x = _clone(unit)

    const result: Unit[] = []
    for (let i = 0; i < units.length; i++) {
      // Convert x to the requested unit

      x = _to(x, _convertParamToUnit(units[i]))
      if (i === units.length - 1) break

      // Check to see if x.value is nearly equal to an integer,
      // since trunc can incorrectly round down if there is round-off error
      const xRounded = options.type.round(x.value!)
      let xFixed
      const isNearlyEqual = options.type.eq(xRounded, x.value!)
      if (isNearlyEqual) {
        xFixed = xRounded
      } else {
        xFixed = options.type.trunc(x.value!)
      }

      const y = new _Unit(xFixed, units[i].toString())
      result.push(y)
      x = _sub(x, y)
    }

    // This little bit fixes a bug where the remainder should be 0 but is a little bit off.
    // But instead of comparing x, the remainder, with zero--we will compare the sum of
    // all the parts so far with the original value. If they are nearly equal,
    // we set the remainder to 0.
    let testSum = options.type.conv(0)
    for (let i = 0; i < result.length; i++) {
      testSum = options.type.add(testSum, normalize(result[i].baseUnits, result[i].value!, options.type))
    }
    if (options.type.eq(testSum, normalize(unit.baseUnits, unit.value, options.type))) {
      x.value = options.type.conv(0)
    }

    result.push(x)

    return result
  }

  function _abs(unit: Unit) {
    const result = _clone(unit)
    if (result.value !== null) {
      result.value = denormalize(result.baseUnits, options.type.abs(normalize(result.baseUnits, result.value, options.type)), options.type)
    }
    return result
  }

  /**
   * Private function _to
   * @param {Unit} unit The unit to convert.
   * @param {Unit} valuelessUnit The valueless unit to convert it to.
   */
  function _to(unit: Unit, valuelessUnit: Unit) {
    let result: Unit
    const value = unit.value === null ? 1 : unit.value
    if (!unit.equalQuantity(valuelessUnit)) {
      throw new TypeError(`Cannot convert ${unit.toString()} to ${valuelessUnit}: dimensions do not match`)
    }
    if (valuelessUnit.value !== null) {
      throw new Error(`Cannot convert ${unit.toString()}: target unit must be valueless`)
    }
    result = _clone(valuelessUnit)
    result.value = denormalize(result.baseUnits, normalize(unit.baseUnits, value, options.type), options.type)
    result.fixed = true // Don't auto simplify
    return result
  }

  /**
   * Private function _choosePrefix
   * @param {Unit} unit The unit to choose the best prefix for.
   * @returns {Unit} A new unit that contains the "best" prefix, or, if no better prefix was found, returns the same unit unchanged.
   */
  function _choosePrefix(unit: Unit, formatOptions: FormatOptions) {
    let result = _clone(unit)
    let piece = result.baseUnits[0] // TODO: Someday this might choose the most "dominant" unit, or something, to prefix, rather than the first unit

    if (unit.baseUnits.length !== 1) {
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
    if (options.type.lt(options.type.abs(unit.value), options.type.conv(1e-50))) {
      // Unit is too small for the prefix to matter
      return unit
    }
    if (options.type.le(options.type.abs(unit.value), formatOptions.prefixMax) && options.type.ge(options.type.abs(unit.value), formatOptions.prefixMin)) {
      // Unit's value is already acceptable
      return unit
    }

    function calcValue(prefix: string) {
      return options.type.div(
        unit.value!, // We checked for null above
        options.type.pow(
          options.type.div(
            options.type.conv(piece.unit.prefixes[prefix]),
            options.type.conv(piece.unit.prefixes[piece.prefix])
          ),
          options.type.conv(piece.power)
        )
      )
    }

    // TODO: Test this for negative numbers. Are we doing type.abs everywhere we need to be?
    let unitValue = options.type.abs(unit.value)
    // console.log(`unitValue = ${unitValue}`)
    function calcScore(prefix: string) {
      let thisValue = options.type.abs(calcValue(prefix))
      // console.log(`Calculating score for ${prefix}; thisValue = ${thisValue}`)
      if (options.type.lt(thisValue, formatOptions.prefixMin)) {
        // prefix makes the value too small
        // console.log(`Prefix makes thisValue too small`)
        return options.type.div(options.type.conv(formatOptions.prefixMin), thisValue)
      }
      if (options.type.gt(thisValue, formatOptions.prefixMax)) {
        // prefix makes the value too large
        // console.log(`Prefix makes thisValue too large`)
        return options.type.div(thisValue, options.type.conv(formatOptions.prefixMax))
      }

      // The prefix is in range, but return a score that says how close it is to the original value.
      if (options.type.le(thisValue, unitValue)) {
        // console.log(`thisValue <= unitValue, score = ${-thisValue / unitValue} (${1-thisValue/unitValue})`)

        // return options.type.mul(options.type.div(thisValue, unitValue), options.type.conv(-1, unitValue))
        return options.type.sub(options.type.conv(1), options.type.div(thisValue, unitValue))
      } else {
        // console.log(`thisValue > unitValue, score = ${-unitValue / thisValue} (${1-unitValue/thisValue})`)
        // return options.type.mul(options.type.div(unitValue, thisValue), options.type.conv(-1, unitValue))
        return options.type.sub(options.type.conv(1), options.type.div(unitValue, thisValue))
      }
    }

    // We should be able to do this in one pass. Start on one end of the array, as determined by searchDirection, and search until 1) the prefix results in a value within the acceptable range, 2) or the values start getting worse.
    // Find the index to begin searching. This might be tricky because the unit could have a prefix that is *not* common.
    let bestPrefix = piece.prefix
    let bestScore = calcScore(bestPrefix)
    // console.log(`The score was ${bestScore}`)

    let prefixes
    if (formatOptions.prefixesToChooseFrom === 'all') {
      prefixes = Object.keys(piece.unit.prefixes)
    } else if (formatOptions.prefixesToChooseFrom === 'common') {
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

      if (options.type.lt(thisScore, bestScore)) {
        bestScore = thisScore
        bestPrefix = thisPrefix
      }
    }

    piece.prefix = bestPrefix
    result.value = denormalize(result.baseUnits, normalize(unit.baseUnits, unit.value, options.type), options.type)

    Object.freeze(result)
    return result
  }

  /**
   * Private function _toBaseUnits
   * @param {Unit} unit The unit to convert to SI.
   */
  function _toBaseUnits(unit: Unit): Unit {
    const result = _clone(unit)

    const proposedUnitList = []

    // Multiple units or units with powers are formatted like this:
    // 5 (kg m^2) / (s^3 mol)
    // Build an representation from the base units of the SI unit system

    for (let dim of Object.keys(result.dimension)) {
      if (Math.abs(result.dimension[dim] || 0) > 1e-12) {
        for (let unit of Object.keys(unitStore.defs.units)) {
          // console.log(unitStore.defs.units[unit])
          if (unitStore.defs.units[unit].quantity === dim) {
            proposedUnitList.push({
              unit: unitStore.defs.units[unit],
              prefix: unitStore.defs.units[unit].basePrefix || '',
              power: result.dimension[dim]
            })
            break
          }
        }
      }
    }

    // for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
    //   const baseDim = unitStore.defs.baseQuantities[i]
    //   if (Math.abs(result.dimension[i] || 0) > 1e-12) {
    //     if (unitStore.defs.unitSystems['si'].hasOwnProperty(baseDim)) {
    //       proposedUnitList.push({
    //         unit: unitStore.defs.unitSystems['si'][baseDim].unit,
    //         prefix: unitStore.defs.unitSystems['si'][baseDim].prefix,
    //         power: result.dimension[i]
    //       })
    //     } else {
    //       throw new Error(`Cannot express unit '${unit.format()}' in SI units. System 'si' does not contain a unit for base quantity '${baseDim}'`)
    //     }
    //   }
    // }

    // Replace this unit list with the proposed list
    result.baseUnits = proposedUnitList
    if (unit.value !== null) { result.value = denormalize(result.baseUnits, normalize(unit.baseUnits, unit.value, options.type), options.type) }
    result.fixed = true // Don't auto simplify
    return result
  }

  /** Private function _setValue
   * @param {Unit} unit The unit to set the value of
   * @param {string | number | custom} value The value to set
   * @returns {Unit} A new unit with the given value
   */
  function _setValue(unit: Unit, value: string | number | null): Unit {
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
  function _formatUnits(unit: Unit, opts: FormatOptions) {
    let strNum = ''
    let strDen = ''
    let nNum = 0
    let nDen = 0

    for (let i = 0; i < unit.baseUnits.length; i++) {
      if (unit.baseUnits[i].power > 0) {
        nNum++
        strNum += ' ' + unit.baseUnits[i].prefix + unit.baseUnits[i].unit.name
        if (Math.abs(unit.baseUnits[i].power - 1.0) > 1e-15) {
          strNum += '^' + unit.baseUnits[i].power
        }
      } else if (unit.baseUnits[i].power < 0) {
        nDen++
      }
    }

    if (nDen > 0) {
      for (let i = 0; i < unit.baseUnits.length; i++) {
        if (unit.baseUnits[i].power < 0) {
          if (nNum > 0) {
            strDen += ' ' + unit.baseUnits[i].prefix + unit.baseUnits[i].unit.name
            if (Math.abs(unit.baseUnits[i].power + 1.0) > 1e-15) {
              strDen += '^' + (-unit.baseUnits[i].power)
            }
          } else {
            strDen += ' ' + unit.baseUnits[i].prefix + unit.baseUnits[i].unit.name
            strDen += '^' + (unit.baseUnits[i].power)
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
   * @returns {Function} A new instance of the unit factory function with the specified options
   */
  function configFunction(): Options
  function configFunction(newOptions: PartialOptions): UnitFactory
  function configFunction(newOptions?: PartialOptions) {
    if (typeof (newOptions) === 'undefined') {
      return options
    }

    // Shallow copy existing config
    let retOptions = Object.assign({}, options, newOptions)

    // Shallow copy unit and type
    retOptions.definitions = Object.assign({}, options.definitions, newOptions.definitions)
    retOptions.type = Object.assign({}, options.type, newOptions.type)
    return _config(retOptions)
  }

  unitmath.config = configFunction

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
  unitmath.add = function add(a: Unit | string | number, b: Unit | string | number) {
    return _convertParamToUnit(a).add(b)
  }

  /**
   * Subtracts two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
   * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
   * @returns {Unit} The result of the subtract a - b.
   */
  unitmath.sub = function sub(a: Unit | string | number, b: Unit | string | number) {
    return _convertParamToUnit(a).sub(b)
  }

  /**
   * Multiplies two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
   * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
   * @returns {Unit} The result a * b.
   */
  unitmath.mul = function mul(a: Unit | string | number, b: Unit | string | number) {
    return _convertParamToUnit(a).mul(b)
  }

  /**
   * Divides two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
   * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
   * @returns {Unit} The result a / b.
   */
  unitmath.div = function div(a: Unit | string | number, b: Unit | string | number) {
    return _convertParamToUnit(a).div(b)
  }
  /**
   * Raises a unit to a power.
   * @param {Unit|string|number} a The unit.
   * @param {number} b The power.
   * @returns {Unit} The result of raising the unit a to the power b.
   */
  unitmath.pow = function pow(a: Unit | string | number, b: number) {
    return _convertParamToUnit(a).pow(b)
  }

  /**
  * Takes the square root of a unit.
  * @param {Unit|string|number} a The unit.
  * @returns {Unit} The square root of the unit a.
  */
  unitmath.sqrt = function sqrt(a: Unit | string | number) {
    return _convertParamToUnit(a).sqrt()
  }

  /**
   * Returns the absolute value of a unit.
   * @param {Unit|string|number} a The unit.
   * @returns {Unit} The absolute value of the unit a.
   */
  unitmath.abs = function abs(a: Unit | string | number) {
    return _convertParamToUnit(a).abs()
  }

  /**
  * Convert a unit.
  * @param {Unit|string|number} unit The unit to convert.
  * @param {Unit|string} valuelessUnit The valueless unit to convert the first unit to.
  * @returns {Unit} The result of converting the unit.
  */
  unitmath.to = function to(unit: Unit | string | number, valuelessUnit: Unit | string) {
    return _convertParamToUnit(unit).to(valuelessUnit)
  }

  /**
  * Convert a unit to base units.
  * @param {Unit|string|number} unit The unit to convert.
  * @returns {Unit} The result of converting the unit to base units.
  */
  unitmath.toBaseUnits = function toBaseUnits(unit: Unit | string | number) {
    return _convertParamToUnit(unit).toBaseUnits()
  }

  unitmath.exists = unitStore.exists

  // TODO: This is used only for testing, could there be another way rather than exposing it on the public namespace?
  unitmath._unitStore = unitStore
  Object.freeze(unitmath)

  return unitmath
}


// Define default arithmetic functions
let defaults: TypeArithmetics = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => a / b,
  pow: (a, b) => Math.pow(a, b),
  abs: (a) => Math.abs(a),
  eq: (a, b) => (a === b) || Math.abs(a - b) / Math.abs(a + b) < 1e-15,
  lt: (a, b) => a < b,
  gt: (a, b) => a > b,
  le: (a, b) => a <= b,
  ge: (a, b) => a >= b,
  round: (a) => Math.round(a),
  trunc: (a) => Math.trunc(a),
  conv: (a: number | string) => typeof a === 'string' ? parseFloat(a) : a,
  clone: (a) => a,
  format: (a) => a.toString()
}

// These are mostly to help warn the user if they forgot to override one or more of the default functions
for (const key of Object.keys(defaults) as (keyof TypeArithmetics)[]) {
  defaults[key][IS_DEFAULT_FUN] = true
}

// TODO: setting to say whether to format using only the common prefixes or all prefixes

const defaultOptions: Options = <const>{
  parentheses: false,
  precision: 15,
  prefix: 'auto',
  prefixMin: 0.1,
  prefixMax: 1000,
  prefixesToChooseFrom: 'common',
  simplify: 'auto',
  simplifyThreshold: 2,
  system: 'auto',
  // subsystem: 'auto',
  definitions: {
    skipBuiltIns: false,
    units: {},
    prefixes: {},
    systems: {}
  },
  type: defaults
}

const firstUnit = _config(defaultOptions)

export default firstUnit
