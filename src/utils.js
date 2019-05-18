
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
      unitValue = type.conv(unitPieces[i].unit.value)
      unitPrefixValue = type.conv(unitPieces[i].unit.prefixes[unitPieces[i].prefix])
      unitPower = type.conv(unitPieces[i].power)
      result = type.mul(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower))
    }

    return result
  } else {
    // units is a single unit of power 1, like kg or degC
    unitValue = type.conv(unitPieces[0].unit.value)
    unitOffset = type.conv(unitPieces[0].unit.offset)
    unitPrefixValue = type.conv(unitPieces[0].unit.prefixes[unitPieces[0].prefix])

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
      unitValue = type.conv(unitPieces[i].unit.value)
      unitPrefixValue = type.conv(unitPieces[i].unit.prefixes[unitPieces[i].prefix])
      unitPower = type.conv(unitPieces[i].power)
      result = type.div(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower))
    }

    return result
  } else {
    // unit is a single unit of power 1, like kg or degC

    unitValue = type.conv(unitPieces[0].unit.value)
    unitPrefixValue = type.conv(unitPieces[0].unit.prefixes[unitPieces[0].prefix])
    unitOffset = type.conv(unitPieces[0].unit.offset)

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
