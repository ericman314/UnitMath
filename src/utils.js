
/**
   * Normalize a value, based on an array of unit pieces
   * @param {unit[]} unitPieces
   * @param {number | *} value
   * @param {object} type
   * @return {number | *} normalized value
   * @private
   */
export function normalize (unitPieces, value, type) {
  let unitValue, unitOffset, unitPower, unitPrefixValue

  if (value === null || value === undefined || unitPieces.length === 0) {
    return value
  } else if (isCompound(unitPieces)) {
    // units is a compound unit, so do not apply offsets.
    // For example, with J kg^-1 degC^-1 you would NOT want to apply the offset.
    let result = value

    for (let i = 0; i < unitPieces.length; i++) {
      unitValue = type.conv(unitPieces[i].unit.value, value)
      unitPrefixValue = type.conv(unitPieces[i].unit.prefixes[unitPieces[i].prefix], value)
      unitPower = type.conv(unitPieces[i].power, value)
      result = type.mul(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower))
    }

    return result
  } else {
    // units is a single unit of power 1, like kg or degC
    unitValue = type.conv(unitPieces[0].unit.value, value)
    unitOffset = type.conv(unitPieces[0].unit.offset, value)
    unitPrefixValue = type.conv(unitPieces[0].unit.prefixes[unitPieces[0].prefix], value)
    return type.mul(type.add(value, unitOffset), type.mul(unitValue, unitPrefixValue))
  }
}

/**
   * Denormalize a value, based on an array of atomic units
   * @param {unit[]} unitPieces Array of atomic units (as in, Unit.units)
   * @param {number} value
   * @param {object} type
   * @return {number} denormalized value
   * @private
   */
export function denormalize (unitPieces, value, type) {
  let unitValue, unitOffset, unitPower, unitPrefixValue

  if (value === null || value === undefined || unitPieces.length === 0) {
    return value
  } else if (isCompound(unitPieces)) {
    // unit is a compound unit, so do not apply offsets.
    // For example, with J kg^-1 degC^-1 you would NOT want to apply the offset.
    let result = value

    for (let i = 0; i < unitPieces.length; i++) {
      unitValue = type.conv(unitPieces[i].unit.value, value)
      unitPrefixValue = type.conv(unitPieces[i].unit.prefixes[unitPieces[i].prefix], value)
      unitPower = type.conv(unitPieces[i].power, value)
      result = type.div(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower))
    }

    return result
  } else {
    // unit is a single unit of power 1, like kg or degC

    unitValue = type.conv(unitPieces[0].unit.value, value)
    unitPrefixValue = type.conv(unitPieces[0].unit.prefixes[unitPieces[0].prefix], value)
    unitOffset = type.conv(unitPieces[0].unit.offset, value)

    return type.sub(type.div(type.div(value, unitValue), unitPrefixValue), unitOffset)
  }
}

/**
   * Return whether the given array of unit pieces is compound (contains multiple units, such as m/s, or cm^2, but not N)
   * @param {unit[]} units Array of unit pieces
   * @return {boolean} True if the unit is compound
   */
export function isCompound (units) {
  if (units.length === 0) {
    return false
  }
  return units.length > 1 || Math.abs(units[0].power - 1.0) > 1e-15
}

export function simplifyUnits(units, unitStore, options) {
    // console.log(this)
    // const result = _clone(this)

    let systemStr = options.system
    if (systemStr === 'auto') {
      // If unit system is 'auto', then examine the existing units to infer which system is preferred. Favor 'si', or the first available system, in the event of a tie.

      // TODO: Object key order might not be consistent across platforms
      let firstAvailableSystem = Object.keys(unitStore.defs.unitSystems)[0]
      let identifiedSystems = { [firstAvailableSystem]: 0.1 }
      for (let i = 0; i < units.length; i++) {
        units[i].unit.systems.forEach(sys => {
          identifiedSystems[sys] = (identifiedSystems[sys] || 0) + 1
        })
      }
      let ids = Object.keys(identifiedSystems)
      ids.sort((a, b) => identifiedSystems[a] < identifiedSystems[b] ? 1 : -1)
      // console.log(`Identified the following systems when examining unit ${result.to().format()}`, ids.map(id => `${id}=${identifiedSystems[id]}`))
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

    if (ok) {
      return proposedUnitList
    } else {
      return units
    }
}