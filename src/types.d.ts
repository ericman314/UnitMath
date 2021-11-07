
export interface TypeArithmetics {
  conv(a: any): number
  conv(a: number, b: number): number
  clone(a: number): number

  abs(a: number): number

  add(a: number, b: number): number
  sub(a: number, b: number): number
  mul(a: number, b: number): number
  div(a: number, b: number): number
  pow(a: number, b: number): number

  eq(a: number, b: number): boolean
  lt(a: number, b: number): boolean
  le(a: number, b: number): boolean
  ge(a: number, b: number): boolean
  gt(a: number, b: number): boolean

  format?(a: number, ...options: any[]): string

  round(a: number): number
  trunc(a: number): number
}

export interface AtomicUnit {
  unit: UnitPropsButCooler,
  prefix: string,
  power: number
}

// Is it correct to specify a default type here?
export interface Options {
  type?: TypeArithmetics
  definitions?: UnitDefinitions & { skipBuiltIns?: boolean }
  system?: string // TODO allow custom
  prefix?: 'never' | 'auto' | 'always'
  prefixMin?: number
  prefixMax?: number
  prefixesToChooseFrom?: 'common' | 'all'
  simplify?: 'never' | 'auto' | 'always'
  precision?: number
  parentheses?: boolean
  simplifyThreshold?: number
}

export interface UnitPrefixes {
  [prefixSet: string]: Record<string, number>
}

export interface UnitSystems {
  [system: string]: string[]
}


interface UnitPropsCommons {
  prefixes?: string
  basePrefix?: string
  commonPrefixes?: string[]
  aliases?: string[]
  offset?: number
}

export interface UnitPropsWithQuantity
  extends UnitPropsCommons {
  quantity?: string
  value: number
}

export interface UnitPropsStringValue
  extends UnitPropsCommons {
  quantity?: undefined
  value: string
}

export interface UnitPropsTupleValue
  extends UnitPropsCommons {
  quantity?: undefined
  value: [number, string]
}

export type UnitProps = UnitPropsStringValue | UnitPropsWithQuantity | UnitPropsTupleValue


export interface UnitPropsButCooler {
  name: string
  quantity?: string
  value: number
  dimension: Record<string, number>,
  prefixes: Record<string, number>
  basePrefix?: string
  commonPrefixes?: string[]
  aliases?: string[]
  offset: number
}

export interface UnitDefinitions {
  prefixes?: UnitPrefixes,
  systems?: UnitSystems,
  units: Record<string, UnitProps>
}

export interface UnitDefinitionsButCooler {
  prefixes: UnitPrefixes,
  systems: Record<string, any[]>,
  units: Record<string, UnitPropsButCooler>
  // quantities?: Record<string, string>
  // baseQuantities?: string[]
}


// Rename so Unit the type does not conflict with Unit the class? Is this interface even necessary? I don't know
export interface Unit {
  readonly type: 'Unit'

  value: number
  units: AtomicUnit[]
  dimension: Record<string, number>

  /** whether the prefix and the units are fixed */
  fixed: boolean

  // new (): Unit
  // new (str: string): Unit
  // new (value: V, unit: string): Unit


  /**
   * create a copy of this unit
   */
  clone(): Unit

  /**
   * Adds two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} other The unit to add to this one. If a string is supplied, it will be converted to a unit.
   * @returns {Unit} The result of adding this and the other unit.
   */
  add(other: Unit | string | number): Unit
  add(value: number, unit: string): Unit


  /**
   * Subtracts two units. Both units' dimensions must be equal.
   * @param {Unit|string|number} other The unit to subtract from this one. If a string is supplied, it will be converted to a unit.
   * @returns {Unit} The result of subtract this and the other unit.
   */
  sub(other: Unit | string | number): Unit
  sub(value: number, unit: string): Unit

  /**
   * Multiplies two units.
   * @param {Unit|string|number} other The unit to multiply to this one.
   * @returns {Unit} The result of multiplying this and the other unit.
   */
  mul(other: Unit | string | number): Unit
  mul(value: number, unit: string): Unit

  /**
   * Divides two units.
   * @param {Unit|string|number} other The unit to divide this unit by.
   * @returns {Unit} The result of dividing this by the other unit.
   */
  div(other: Unit | string | number): Unit
  div(value: number, unit: string): Unit


  /**
   * Calculate the power of a unit
   * @memberof Unit
   * @param {number|custom} p
   * @returns {Unit}      The result: this^p
   */
  pow(p: number): Unit

  /**
   * Takes the square root of a unit.
   * @memberof Unit
   * @returns {Unit} The square root of this unit.
   */
  sqrt(): Unit

  /**
   * Returns the absolute value of this unit.
   * @memberOf Unit
   * @returns {Unit} The absolute value of this unit.
   */
  abs(): Unit

  /**
   * Returns an array of units whose sum is equal to this unit, where each unit in the array is taken from the supplied string array.
   * @param {string[]} units A string array of units to split this unit into.
   * @returns {Unit[]} An array of units
   */
  split(units: (string | Unit)[]): Unit[]

  /**
   * Convert the unit to a specific unit.
   * @memberof Unit
   * @param {string | Unit} valuelessUnit   A unit without value. Can have prefix, like "cm". If omitted, a new unit is returned which is fixed (will not be auto-simplified)
   * @returns {Unit} Returns a clone of the unit with a fixed prefix and unit.
   */
  to(valuelessUnit?: string | Unit): Unit

  /**
   * Convert the unit to SI units.
   * @memberof Unit
   * @returns {Unit} Returns a clone of the unit with a fixed prefix and unit.
   */
  toBaseUnits(): Unit

  /**
   * Returns a new unit with the given value.
   * @param {number | string | custom} value
   * @returns A new unit with the given value.
   */
  setValue(value?: string | number): Unit

  /**
   * Returns this unit's value.
   * @returns The value of this unit.
   */
  getValue(): number

  /**
   * Returns this unit's normalized value, which is the value it would have if it were to be converted to SI base units (or whatever base units are defined)
   * @returns The notmalized value of the unit.
   */
  getNormalizedValue(): number

  /**
   * Returns a new unit with the given normalized value.
   * @param {number | string | custom} normalizedValue
   * @returns A new unit with the given normalized value.
   */
  setNormalizedValue(normalizedValue: string | number): Unit

  /**
   * Simplify this Unit's unit list and return a new Unit with the simplified list.
   * The returned Unit will contain a list of the "best" units for formatting.
   * @returns {Unit} A simplified unit if possible, or the original unit if it could not be simplified.
   */
  simplify(): Unit

  /**
   * Returns this unit without a value.
   * @memberof Unit
   * @returns {Unit} A new unit formed by removing the value from this unit.
   */
  getUnits(): Unit

  /**
   * Returns whether the unit is compound (like m/s, cm^2) or not (kg, N, hogshead)
   * @memberof Unit
   * @returns True if the unit is compound
   */
  isCompound(): boolean

  /**
   * check if this unit matches the given quantity
   * @memberof Unit
   * @param {QUANTITY | string | undefined} quantity
   */
  // hasQuantity(quantity: any): boolean

  /**
   * Check if this unit has a dimension equal to another unit
   * @param {Unit} other
   * @return {boolean} true if equal dimensions
   */
  equalQuantity(other: Unit): boolean

  /**
   * Returns a string array of all the quantities that match this unit.
   * @return {string[]} The matching quantities, or an empty array if there are no matching quantities.
   */
  // getQuantities(): string[]

  /**
   * Check if this unit equals another unit
   * @memberof Unit
   * @param {Unit} other
   * @return {boolean} true if both units are equal
   */
  equals(other: Unit | string | number): boolean

  /**
   * Compare this unit to another and return a value indicating whether this unit is less than, greater than, or equal to the other.
   * @param {Unit} other
   * @return {number} -1 if this unit is less than, 1 if this unit is greater than, and 0 if this unit is equal to the other unit.
   */
  compare(other: Unit | string | number): -1 | 0 | 1

  /**
   * Compare this unit to another and return whether this unit is less than the other.
   * @param {Unit} other
   * @return {boolean} true if this unit is less than the other.
   */
  lessThan(other: Unit | string | number): boolean

  /**
   * Compare this unit to another and return whether this unit is less than or equal to the other.
   * @param {Unit} other
   * @return {boolean} true if this unit is less than or equal the other.
   */
  lessThanOrEqual(other: Unit | string | number): boolean

  /**
   * Compare this unit to another and return whether this unit is greater than the other.
   * @param {Unit} other
   * @return {boolean} true if this unit is greater than the other.
   */
  greaterThan(other: Unit | string | number): boolean

  /**
   * Compare this unit to another and return whether this unit is greater than or equal to the other.
   * @param {Unit} other
   * @return {boolean} true if this unit is greater than or equal the other.
   */
  greaterThanOrEqual(other: Unit | string | number): boolean

  /**
   * Get a string representation of the Unit, with optional formatting options. Alias of `format`.
   * @memberof Unit
   * @param {Object} [opts]  Formatting options.
   * @return {string}
   */
  toString(...opts: any[]): string

  /**
   * Returns a raw string representation of this Unit, without simplifying or rounding. Could be useful for debugging.
   */
  valueOf(): string

  /**
   * Get a string representation of the Unit, with optional formatting options.
   */
  format(...userOpts: any[]): string
}

export interface UnitFactory {
  (): Unit
  (value: number | string, unitString?: string): Unit
  config(newOptions: Options): UnitFactory
  config(): Options
  // getConfig(): Options
  definitions(): UnitDefinitions
  add(a: Unit | string | number, b: Unit | string | number): Unit
  sub(a: Unit | string | number, b: Unit | string | number): Unit
  mul(a: Unit | string | number, b: Unit | string | number): Unit
  div(a: Unit | string | number, b: Unit | string | number): Unit
  pow(a: Unit | string | number, b: number): Unit
  sqrt(a: Unit | string | number): Unit
  abs(a: Unit | string | number): Unit
  to(a: Unit | string | number, valuelessUnit: Unit | string): Unit
  toBaseUnits(a: Unit | string | number): Unit
  exists(unit: string): boolean
  _unitStore: UnitStore
}

export type TestFunction = {
  (string): string
  (number): number
}

export interface UnitStore {
  parser(input: string): ParsedUnit
  originalDefinitions: UnitDefinitions
  defs: UnitDefinitionsButCooler
  exists(name: string): boolean
  findUnit(unitString: string): { unit: UnitPropsButCooler, prefix: string } | null
}

export interface ParsedUnit {
  units?: AtomicUnit[]
  dimension?: Record<string, number>,
  value?: number
}

type findUnitFn = (unitString: string) => { unit: UnitPropsButCooler, prefix: string } | null
