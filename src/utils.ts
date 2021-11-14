import { TypeArithmetics, BaseUnit } from "./types"


/**
   * Normalize a value, based on an array of unit pieces
   * @private
   */
export function normalize<T>(baseUnits: BaseUnit<T>[], value: T, type: TypeArithmetics<T>): T {
  let unitValue, unitOffset, unitPower, unitPrefixValue

  if (value === null || value === undefined || baseUnits.length === 0) {
    return value
  } else if (isCompound(baseUnits)) {
    // units is a compound unit, so do not apply offsets.
    // For example, with J kg^-1 degC^-1 you would NOT want to apply the offset.
    let result: T = value

    for (let i = 0; i < baseUnits.length; i++) {
      unitValue = type.conv(baseUnits[i].unit.value)
      unitPrefixValue = type.conv(baseUnits[i].unit.prefixSet[baseUnits[i].prefix])
      unitPower = type.conv(baseUnits[i].power)
      result = type.mul(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower))
    }

    return result
  } else {
    // units is a single unit of power 1, like kg or degC
    unitValue = type.conv(baseUnits[0].unit.value)
    unitOffset = type.conv(baseUnits[0].unit.offset)
    unitPrefixValue = type.conv(baseUnits[0].unit.prefixSet[baseUnits[0].prefix])

    return type.mul(type.add(type.mul(value, unitPrefixValue), unitOffset), unitValue)
    // (value*unitPrefixValue+unitOffset)*unitValue
  }
}

/**
   * Denormalize a value, based on an array of atomic units
   * @param baseUnits Array of atomic units (as in, Unit.units)
   * @returns denormalized value
   * @private
   */
export function denormalize<T>(baseUnits: BaseUnit<T>[], value: T, type: TypeArithmetics<T>): T {
  let unitValue, unitOffset, unitPower, unitPrefixValue

  if (value === null || value === undefined || baseUnits.length === 0) {
    return value
  } else if (isCompound(baseUnits)) {
    // unit is a compound unit, so do not apply offsets.
    // For example, with J kg^-1 degC^-1 you would NOT want to apply the offset.
    let result = value

    for (let i = 0; i < baseUnits.length; i++) {
      unitValue = type.conv(baseUnits[i].unit.value)
      unitPrefixValue = type.conv(baseUnits[i].unit.prefixSet[baseUnits[i].prefix])
      unitPower = type.conv(baseUnits[i].power)
      result = type.div(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower))
    }

    return result
  } else {
    // unit is a single unit of power 1, like kg or degC

    unitValue = type.conv(baseUnits[0].unit.value)
    unitPrefixValue = type.conv(baseUnits[0].unit.prefixSet[baseUnits[0].prefix])
    unitOffset = type.conv(baseUnits[0].unit.offset)

    return type.div(type.sub(type.div(value, unitValue), unitOffset), unitPrefixValue)
    // (value/unitValue-unitOffset)/unitPrefixValue
  }
}

/**
   * Return whether the given array of unit pieces is compound (contains multiple units, such as m/s, or cm^2, but not N)
   * @param baseUnits Array of unit pieces
   * @returns True if the unit is compound
   * @private
   */
export function isCompound<T>(baseUnits: BaseUnit<T>[]): boolean {
  if (baseUnits.length === 0) {
    return false
  }
  return baseUnits.length > 1 || Math.abs(baseUnits[0].power - 1.0) > 1e-15
}
