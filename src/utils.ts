import { DataType } from "./Unit"

type Unit = any //!FIXME

/**
   * Normalize a value, based on an array of unit pieces
   * @private
   */
export function normalize (unitPieces: Unit[], value: number, type: DataType) {
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

    return type.mul(type.add(type.mul(value, unitPrefixValue), unitOffset), unitValue)
    // (value*unitPrefixValue+unitOffset)*unitValue
  }
}

/**
   * Denormalize a value, based on an array of atomic units
   * @param unitPieces Array of atomic units (as in, Unit.units)
   * @returns denormalized value
   * @private
   */
export function denormalize (unitPieces: Unit[], value: number, type: DataType): number {
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

    return type.div(type.sub(type.div(value, unitValue), unitOffset), unitPrefixValue)
    // (value/unitValue-unitOffset)/unitPrefixValue
  }
}

/**
   * Return whether the given array of unit pieces is compound (contains multiple units, such as m/s, or cm^2, but not N)
   * @param nits Array of unit pieces
   * @returns True if the unit is compound
   * @private
   */
export function isCompound (units: Unit[]): boolean {
  if (units.length === 0) {
    return false
  }
  return units.length > 1 || Math.abs(units[0].power - 1.0) > 1e-15
}
