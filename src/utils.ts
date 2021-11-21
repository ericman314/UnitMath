import { TypeArithmetics, AtomicUnit } from "./types"


/**
   * Normalize a value, based on an array of unit pieces
   * @private
   */
export function normalize<T>(unitList: AtomicUnit<T>[], value: T, type: TypeArithmetics<T>): T {
  let unitValue, unitOffset, unitPower, unitPrefixValue

  if (value === null || value === undefined || unitList.length === 0) {
    return value
  } else if (isCompound(unitList)) {
    // units is a compound unit, so do not apply offsets.
    // For example, with J kg^-1 degC^-1 you would NOT want to apply the offset.
    let result: T = value

    for (let i = 0; i < unitList.length; i++) {
      unitValue = type.conv(unitList[i].unit.value)
      unitPrefixValue = type.conv(unitList[i].unit.prefixGroup[unitList[i].prefix])
      unitPower = type.conv(unitList[i].power)
      result = type.mul(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower))
    }

    return result
  } else {
    // units is a single unit of power 1, like kg or degC
    unitValue = type.conv(unitList[0].unit.value)
    unitOffset = type.conv(unitList[0].unit.offset)
    unitPrefixValue = type.conv(unitList[0].unit.prefixGroup[unitList[0].prefix])

    return type.mul(type.add(type.mul(value, unitPrefixValue), unitOffset), unitValue)
    // (value*unitPrefixValue+unitOffset)*unitValue
  }
}

/**
   * Denormalize a value, based on an array of atomic units
   * @param unitList Array of atomic units (as in, Unit.units)
   * @returns denormalized value
   * @private
   */
export function denormalize<T>(unitList: AtomicUnit<T>[], value: T, type: TypeArithmetics<T>): T {
  let unitValue, unitOffset, unitPower, unitPrefixValue

  if (value === null || value === undefined || unitList.length === 0) {
    return value
  } else if (isCompound(unitList)) {
    // unit is a compound unit, so do not apply offsets.
    // For example, with J kg^-1 degC^-1 you would NOT want to apply the offset.
    let result = value

    for (let i = 0; i < unitList.length; i++) {
      unitValue = type.conv(unitList[i].unit.value)
      unitPrefixValue = type.conv(unitList[i].unit.prefixGroup[unitList[i].prefix])
      unitPower = type.conv(unitList[i].power)
      result = type.div(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower))
    }

    return result
  } else {
    // unit is a single unit of power 1, like kg or degC

    unitValue = type.conv(unitList[0].unit.value)
    unitPrefixValue = type.conv(unitList[0].unit.prefixGroup[unitList[0].prefix])
    unitOffset = type.conv(unitList[0].unit.offset)

    return type.div(type.sub(type.div(value, unitValue), unitOffset), unitPrefixValue)
    // (value/unitValue-unitOffset)/unitPrefixValue
  }
}

/**
   * Return whether the given array of unit pieces is compound (contains multiple units, such as m/s, or cm^2, but not N)
   * @param unitList Array of unit pieces
   * @returns True if the unit is compound
   * @private
   */
export function isCompound<T>(unitList: AtomicUnit<T>[]): boolean {
  if (unitList.length === 0) {
    return false
  }
  return unitList.length > 1 || Math.abs(unitList[0].power - 1.0) > 1e-15
}
