import createParser from './Parser.js'
import { normalize } from './utils.js'
import * as builtIns from './BuiltIns.js'

/**
 * Creates a new unit store.
 * @param {Object} options
 */
export default function createUnitStore (options) {
  /* Units are defined by these objects:
   * defs.prefixes
   * defs.baseQuantities
   * defs.quantities
   * defs.units
   * defs.unitSystems
   */

  // Steps:
  // Import the BUILT_INS
  // Object.assign BUILT_INS, options.extras

  // TODO: Should we deep freeze the built-ins to prevent modification of the built-in units?

  const skip = options.definitions.skipBuiltIns

  // There are five objects that make of the definition
  const definitionKeys = ['units', 'prefixes', 'unitSystems', 'baseQuantities', 'quantities']

  // These will contain the built-in units extended with the user's definitions
  const originalDefinitions = {}

  // These will contain copies we can mutate without affecting the originals
  const defs = {}

  // TODO: Don't iterate over definitionKeys any more, it's just too complicated and each key has its own special rules
  definitionKeys.forEach(key => {
    if (Array.isArray(builtIns[key])) {
      originalDefinitions[key] = builtIns[key].concat(options.definitions[key] || [])
      defs[key] = originalDefinitions[key].slice()
    } else {
      if (key === 'unitSystems') {
        // We would like to extend unitSystem two levels deep
        originalDefinitions[key] = Object.assign({}, skip ? {} : builtIns[key])
        for (let subKey in options.definitions[key]) {
          originalDefinitions[key][subKey] = Object.assign({}, originalDefinitions[key][subKey] || {}, options.definitions[key][subKey])
        }
      } else {
        originalDefinitions[key] = Object.assign({}, skip ? {} : builtIns[key], options.definitions[key] || {})
      }

      // Omit units because there is additional processing we need to do before we add them to defs
      if (key !== 'units') {
        defs[key] = Object.assign({}, originalDefinitions[key])
      }
    }
  })

  // TODO: Check for duplicate base quantities

  /**
   * A unit system is a set of dimensionally independent base units plus a set of derived units, formed by multiplication and division of the base units, that are by convention used with the unit system.
   */

  // Add additional unit systems here.

  /* All of the prefixes, base quantities, quantities, units, and unit systems have now been defined.
   *
   * We will perform the following processing steps to prepare the UnitStore for use:
   *
   * - For each QUANTITY, parse its value and replace it with a dimension array, where each index of the array corresponds to the base quantity's index in defs.baseQuantities, and the value of each element is the power (exponent) of that base in the dimension.
   *
   * - Initialize the parser with an empty set of units.
   *
   * - Loop through the units. If the unit has a `quantity` property, initialize that unit with the quantity's dimension, and the given value property. If the unit does not, then parse the unit's value property (which is either a string or an two-element array) using the parser, and create the dimension and value from the resulting Unit. Create the unit with the name, dimension, value, offset, prefixes, and commonPrefixes properties. Convert the prefixes from a string to the associated object from the defs.prefixes object.
   *
   * - Some units will fail to be parsed if the defs.units object keys are not enumerated in the optimal order. Repeat the loop until all units have been converted.
   *
   * - Verify that each unit's commonPrefixes are contained in prefixes.
   *
   * - Loop through the defs.unitSystems and converts the strings into unit/prefix pairs.
   *
   * - Add the unit system names to each unit (as an array) for reverse lookup.
   *
   * - Clone units that have aliases. Shallow copies are acceptable since the resulting defs.units object will be deep-immutable.
   *
*/

  // For each key in defs.quantities, replace the string value with a dimension array, where each index of the array corresponds to the base quantity's index in defs.baseQuantities, and the value of each element is the power (exponent) of that base in the dimension.
  // The value must be a string, which is a space-delimited list of base quantities, each optionally raised to a power.
  // Example:
  // Before: VELOCITY: 'LENGTH TIME^-1'
  // After: VELOCITY: [1, 0, -1, 0, 0, 0, 0, 0, 0, 0]

  for (let quant in defs.quantities) {
    const dimArr = defs.baseQuantities.map(() => 0)
    let bases = defs.quantities[quant].split(' ')
    bases.forEach(base => {
      if (base === '') return
      let parts = base.split('^')
      let power = 1
      let idx = defs.baseQuantities.indexOf(parts[0])
      if (idx < 0) {
        throw new Error(`Error processing quantity ${quant}: base quantity ${parts[0]} not found`)
      }
      if (parts[1]) {
        power = parseFloat(parts[1])
        if (isNaN(power)) {
          throw new Error(`Error processing quantity ${quant}: could not determine value of the exponent in string ${base}`)
        }
      }
      dimArr[idx] = power
    })
    defs.quantities[quant] = dimArr
  }

  // Also add the base quantities into defs.quantities, for completeness
  defs.baseQuantities.forEach((base, idx) => {
    const dimArr = defs.baseQuantities.map(() => 0)
    dimArr[idx] = 1
    defs.quantities[base] = dimArr
  })

  // Prevent modification of the quantities
  for (const quant in defs.quantities) { Object.freeze(defs.quantities[quant]) }

  // Empty out the set of units.
  defs.units = {}

  // Create a parser configured for these options, and also supply it with the findUnit function and the number of base quantities.
  const parser = createParser(options, findUnit, defs.baseQuantities.length)

  // Loop through the units. If the unit has a `quantity` property, initialize that unit with the quantity's dimension, and the given value property. If the unit does not, then parse the unit's value property (which is either a string or an two-element array) using the parser, and create the dimension and value from the resulting Unit. Create the unit with the name, dimension, value, offset, prefixes, and commonPrefixes properties. Convert the prefixes from a string to the associated object from the defs.prefixes object.

  while (true) {
    let unitsAdded = 0
    let unitsSkipped = []
    let reasonsSkipped = []
    for (const unitDefKey in originalDefinitions.units) {
      if (defs.units.hasOwnProperty(unitDefKey)) continue

      const unitDef = originalDefinitions.units[unitDefKey]

      if (!unitDef) continue

      const containsUnknownPrefix = unitDef.prefixes && !defs.prefixes.hasOwnProperty(unitDef.prefixes)
      if (containsUnknownPrefix) {
        throw new Error(`Unknown prefixes '${unitDef.prefixes}' for unit '${unitDefKey}'`)
      }

      let unitValue; let unitDimension; let skipThisUnit = false

      if (unitDef.quantity) {
        // Defining the unit based on a quantity.
        if (!defs.quantities.hasOwnProperty(unitDef.quantity)) {
          throw new Error(`Unknown quantity specified for unit ${unitDefKey}: ${unitDef.quantity}`)
        }
        unitValue = unitDef.value
        unitDimension = defs.quantities[unitDef.quantity]
      } else {
        // Defining the unit based on other units.
        let parsed
        try {
          if (unitDef.hasOwnProperty('value')) {
            if (typeof unitDef.value === 'string') {
              parsed = parser(unitDef.value)
            } else if (Array.isArray(unitDef.value) && unitDef.value.length === 2) {
              parsed = parser(unitDef.value[1])
              parsed.value = unitDef.value[0]
            } else {
              throw new TypeError(`Unit definition for '${unitDefKey}' must be a string, or it must be an object with a value property where the value is a string or a two-element array.`)
            }
          } else if (typeof unitDef === 'string') {
            parsed = parser(unitDef)
          } else {
            throw new TypeError(`Unit definition for '${unitDefKey}' must be a string, or it must be an object with a value property where the value is a string or a two-element array.`)
          }
          unitValue = normalize(parsed.units, parsed.value, options.type)
          unitDimension = Object.freeze(parsed.dimension)
        } catch (ex) {
          if (/Unit.*not found/.test(ex.toString())) {
            unitsSkipped.push(unitDefKey)
            reasonsSkipped.push(ex.toString())
            skipThisUnit = true
          } else {
            throw new Error(`Could not parse value '${unitDef.value || unitDef}' of unit '${unitDefKey}': ${ex}`)
          }
        }
      }

      if (!skipThisUnit) {
        // Add this units and its aliases (they are all the same except for the name)
        let unitAndAliases = [unitDefKey].concat(unitDef.aliases || [])
        unitAndAliases.forEach(newUnitName => {
          if (defs.units.hasOwnProperty(newUnitName)) {
            throw new Error(`Alias '${newUnitName}' would override an existing unit`)
          }
          if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(newUnitName) && newUnitName !== '') {
            throw new SyntaxError(`Unit name contains non-alphanumeric characters or begins with a number: '${newUnitName}'`)
          }
          const newUnit = {
            name: newUnitName,
            value: unitValue,
            offset: unitDef.offset || 0,
            dimension: unitDimension,
            prefixes: defs.prefixes[unitDef.prefixes || 'NONE'],
            commonPrefixes: unitDef.commonPrefixes, // Default should be undefined
            systems: []
          }
          Object.freeze(newUnit)
          defs.units[newUnitName] = newUnit
          unitsAdded++
        })
      }
    }

    // console.log(`Added ${unitsAdded} units and skipped: ${unitsSkipped.join(', ')}`)
    if (unitsSkipped.length === 0) break
    else if (unitsAdded === 0) {
      throw new Error(`Could not create the following units: ${unitsSkipped.join(', ')}. Reasons follow: ${reasonsSkipped.join(' ')}`)
    }
  }

  // Check to make sure config options has selected a unit system that exists.
  if (options.system !== 'auto') {
    if (!defs.unitSystems.hasOwnProperty(options.system)) {
      throw new Error(`Unknown unit system ${options.system}. Available systems are: auto, ${Object.keys(defs.unitSystems).join(', ')} `)
    }
  }

  // Convert unit systems from strings to unit/prefix pairs
  for (let sysKey in defs.unitSystems) {
    // Clone the individual system before mutating its properties
    defs.unitSystems[sysKey] = Object.assign({}, defs.unitSystems[sysKey])
    let sys = defs.unitSystems[sysKey]
    for (let quantKey in sys) {
      if (!defs.quantities.hasOwnProperty(quantKey)) {
        throw new Error(`Unit system ${sysKey} mentions quantity ${quantKey}, which does not exist`)
      }
      let unitPrefixPair = findUnit(sys[quantKey])
      if (unitPrefixPair) {
        // Check to make this unit is consistent with this quantity in the unit system
        for (let i = 0; i < defs.quantities[quantKey].length; i++) {
          if (defs.quantities[quantKey][i] !== unitPrefixPair.unit.dimension[i]) {
            throw new Error(`In system '${sysKey}', quantity '${quantKey}' is inconsistent with unit '${sys[quantKey]}'`)
          }
        }

        sys[quantKey] = unitPrefixPair

        // Add the system's name to the unit (for reverse lookup) so we can infer unit systems just by inspecting the individual units
        unitPrefixPair.unit.systems.push(sysKey)
      } else {
        throw new Error(`Unknown unit '${sys[quantKey]}' for quantity '${quantKey}' in unit system '${sysKey}'`)
      }
    }
  }

  // Final setup for units
  for (let key in defs.units) {
    const unit = defs.units[key]
    // Check that each commonPrefix is in prefixes
    if (unit.commonPrefixes) {
      for (let i = 0; i < unit.commonPrefixes.length; i++) {
        let s = unit.commonPrefixes[i]
        if (!unit.prefixes.hasOwnProperty(s)) {
          throw new Error(`In unit ${unit.name}, common prefix ${s} was not found among the allowable prefixes`)
        }
      }
    }
  }

  /**
   * Tests whether the given string exists as a known unit. The unit may have a prefix.
   * @param {string} singleUnitString The name of the unit, with optional prefix.
   */
  function exists (singleUnitString) {
    return findUnit(singleUnitString) !== null
  }

  /**
   * Find a unit from a string
   * @param {string} unitString              A string like 'cm' or 'inch'
   * @returns {Object | null} result  When found, an object with fields unit and
   *                                  prefix is returned. Else, null is returned.
   * @private
   */
  function findUnit (unitString) {
    if (typeof unitString !== 'string') {
      throw new TypeError(`parameter must be a string (${unitString} given)`)
    }
    // First, match units names exactly. For example, a user could define 'mm' as 10^-4 m, which is silly, but then we would want 'mm' to match the user-defined unit.
    if (defs.units.hasOwnProperty(unitString)) {
      const unit = defs.units[unitString]
      return {
        unit,
        prefix: ''
      }
    }

    for (const name in defs.units) {
      if (defs.units.hasOwnProperty(name)) {
        if (unitString.substring(unitString.length - name.length, unitString.length) === name) {
          const unit = defs.units[name]
          const prefixLen = (unitString.length - name.length)
          const prefix = unitString.substring(0, prefixLen)
          if (unit.prefixes.hasOwnProperty(prefix)) {
            // store unit, prefix, and value
            // console.log(`findUnit(${unitString}): { unit.name: ${unit.name}, prefix: ${prefix} }`)
            return {
              unit,
              prefix
            }
          }
        }
      }
    }

    return null
  }

  Object.freeze(defs.prefixes)
  Object.freeze(defs.baseQuantities)
  Object.freeze(defs.quantities)
  Object.freeze(defs.unitSystems)
  Object.freeze(defs.units)

  return { originalDefinitions, defs, exists, findUnit, parser }
}
