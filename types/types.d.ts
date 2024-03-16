export declare const symIsDefaultFun: unique symbol;
export interface TypeArithmetics<T> {
    conv: {
        (a: any): T;
        [symIsDefaultFun]?: boolean;
    };
    clone: {
        (a: T): T;
        [symIsDefaultFun]?: boolean;
    };
    abs: {
        (a: T): T;
        [symIsDefaultFun]?: boolean;
    };
    add: {
        (a: T, b: T): T;
        [symIsDefaultFun]?: boolean;
    };
    sub: {
        (a: T, b: T): T;
        [symIsDefaultFun]?: boolean;
    };
    mul: {
        (a: T, b: T): T;
        [symIsDefaultFun]?: boolean;
    };
    div: {
        (a: T, b: T): T;
        [symIsDefaultFun]?: boolean;
    };
    pow: {
        (a: T, b: T): T;
        [symIsDefaultFun]?: boolean;
    };
    eq: {
        (a: T, b: T): boolean;
        [symIsDefaultFun]?: boolean;
    };
    lt: {
        (a: T, b: T): boolean;
        [symIsDefaultFun]?: boolean;
    };
    le: {
        (a: T, b: T): boolean;
        [symIsDefaultFun]?: boolean;
    };
    ge: {
        (a: T, b: T): boolean;
        [symIsDefaultFun]?: boolean;
    };
    gt: {
        (a: T, b: T): boolean;
        [symIsDefaultFun]?: boolean;
    };
    round: {
        (a: T): T;
        [symIsDefaultFun]?: boolean;
    };
    trunc: {
        (a: T): T;
        [symIsDefaultFun]?: boolean;
    };
}
export interface AtomicUnit<T> {
    unit: UnitPropsExtended<T>;
    prefix: string;
    power: number;
}
export interface FormatOptions<T> {
    precision?: number;
    parentheses?: boolean;
    formatter?: {
        (a: T): string;
        [symIsDefaultFun]?: boolean;
    };
}
export interface PrefixOptions<T> {
    autoPrefix?: boolean;
    prefixMin?: T;
    prefixMax?: T;
    formatPrefixDefault?: 'all' | 'none';
}
export interface SimplifyOptions<T> extends PrefixOptions<T> {
    system?: string;
}
export type RequiredOptions<T> = Required<FormatOptions<T>> & Required<SimplifyOptions<T>> & {
    type: TypeArithmetics<T>;
    definitions: Definitions & {
        skipBuiltIns?: boolean;
    };
};
export type Options<T> = FormatOptions<T> & SimplifyOptions<T> & {
    type?: Partial<TypeArithmetics<T>>;
    definitions?: Partial<NullableDefinitions> & {
        skipBuiltIns?: boolean;
    };
};
export interface PrefixGroups {
    [prefixGroup: string]: Record<string, number>;
}
export interface UnitSystems {
    [system: string]: string[];
}
interface UnitPropsCommons {
    prefixGroup?: string;
    basePrefix?: string;
    formatPrefixes?: string[];
    aliases?: string[];
    offset?: number;
}
export interface UnitPropsWithQuantity extends UnitPropsCommons {
    quantity: string;
    value: number;
}
export interface UnitPropsStringValue extends UnitPropsCommons {
    quantity?: undefined;
    value: string;
}
export interface UnitPropsTupleValue extends UnitPropsCommons {
    quantity?: undefined;
    value: [number, string];
}
export type UnitProps = UnitPropsStringValue | UnitPropsWithQuantity | UnitPropsTupleValue;
export interface UnitPropsExtended<T> {
    name: string;
    quantity?: string;
    value: T;
    dimension: Record<string, number>;
    prefixGroup: Record<string, number>;
    basePrefix?: string;
    formatPrefixes?: string[];
    aliases?: string[];
    offset: T;
}
export interface Definitions {
    prefixGroups: PrefixGroups;
    systems: UnitSystems;
    units: Record<string, UnitProps>;
}
export interface NullableDefinitions extends Omit<Definitions, 'units'> {
    units: Record<string, UnitProps | null | false | undefined>;
}
export interface DefinitionsExtended<T> {
    prefixGroups: PrefixGroups;
    systems: Record<string, ParsedUnit<T>[]>;
    units: Record<string, UnitPropsExtended<T>>;
}
export interface Unit<T> {
    readonly type: 'Unit';
    value: T | null;
    unitList: AtomicUnit<T>[];
    dimension: Record<string, number>;
    /** whether the prefix and the units are fixed */
    /**
     * create a copy of this unit
     */
    clone(): Unit<T>;
    /**
     * Adds two units. Both units' dimensions must be equal.
     * @param {Unit|string|T} other The unit to add to this one. If a string is supplied, it will be converted to a unit.
     * @returns {Unit} The result of adding this and the other unit.
     */
    add(other: Unit<T> | string | T): Unit<T>;
    add(value: T, unit: string): Unit<T>;
    /**
     * Subtracts two units. Both units' dimensions must be equal.
     * @param {Unit|string|T} other The unit to subtract from this one. If a string is supplied, it will be converted to a unit.
     * @returns {Unit} The result of subtract this and the other unit.
     */
    sub(other: Unit<T> | string | T): Unit<T>;
    sub(value: T, unit: string): Unit<T>;
    /**
     * Multiplies two units.
     * @param {Unit|string|T} other The unit to multiply to this one.
     * @returns {Unit} The result of multiplying this and the other unit.
     */
    mul(other: Unit<T> | string | T): Unit<T>;
    mul(value: T, unit: string): Unit<T>;
    /**
     * Divides two units.
     * @param {Unit|string|T} other The unit to divide this unit by.
     * @returns {Unit} The result of dividing this by the other unit.
     */
    div(other: Unit<T> | string | T): Unit<T>;
    div(value: T, unit: string): Unit<T>;
    /**
     * Calculate the power of a unit
     * @memberof Unit
     * @param {number|custom} p
     * @returns {Unit}      The result: this^p
     */
    pow(p: number): Unit<T>;
    /**
     * Takes the square root of a unit.
     * @memberof Unit
     * @returns {Unit} The square root of this unit.
     */
    sqrt(): Unit<T>;
    /**
     * Returns the absolute value of this unit.
     * @memberOf Unit
     * @returns {Unit} The absolute value of this unit.
     */
    abs(): Unit<T>;
    /**
     * Returns an array of units whose sum is equal to this unit, where each unit in the array is taken from the supplied string array.
     * @param {string[]} units A string array of units to split this unit into.
     * @returns {Unit[]} An array of units
     */
    split(units: (string | Unit<T>)[]): Unit<T>[];
    /**
     * Convert the unit to a specific unit.
     * @memberof Unit
     * @param {string | Unit} valuelessUnit   A unit without value. Can have prefix, like "cm".
     * @returns {Unit} Returns a clone of the unit converted to the specified unit.
     */
    to(valuelessUnit: string | Unit<T>): Unit<T>;
    /**
     * Fix the units and prevent them from being automatically simplified.
     * @memberof Unit
     * @returns {Unit} Returns a clone of the unit with a fixed prefix and unit.
     */
    /**
     * Convert the unit to base units.
     * @memberof Unit
     * @returns {Unit} Returns a clone of the unit in the base units.
     */
    toBaseUnits(): Unit<T>;
    /**
      Get the complexity of this unit, or in other words, the number of symbols used to format the unit.
      @memberof Unit
      @returns {number} The complexity or number of symbols used to format the unit.
     */
    getComplexity(): number;
    /**
     * Returns a new unit with the given value.
     * @param {number | string | custom} value
     * @returns A new unit with the given value.
     */
    setValue(value?: string | T | null): Unit<T>;
    /**
     * Returns this unit's value.
     * @returns The value of this unit.
     */
    getValue(): T | null;
    /**
     * Returns this unit's normalized value, which is the value it would have if it were to be converted to SI base units (or whatever base units are defined)
     * @returns The notmalized value of the unit.
     */
    getNormalizedValue(): T | null;
    /**
     * Returns a new unit with the given normalized value.
     * @param {number | string | custom} normalizedValue
     * @returns A new unit with the given normalized value.
     */
    setNormalizedValue(normalizedValue: string | T): Unit<T>;
    /**
     * Simplify this Unit's unit list and return a new Unit with the simplified list.
     * The returned Unit will contain a list of the "best" units for formatting.
     * @returns {Unit} A simplified unit if possible, or the original unit if it could not be simplified.
     */
    simplify(options?: SimplifyOptions<T> & PrefixOptions<T>): Unit<T>;
    /**
     * Choose the best prefix for the Unit.
     * @returns {Unit} A new unit that contains the "best" prefix, or, if no better prefix was found, returns the same unit unchanged.
     */
    applyBestPrefix(prefixOptions?: PrefixOptions<T>): Unit<T>;
    /**
     * Returns this unit without a value.
     * @memberof Unit
     * @returns {Unit} A new unit formed by removing the value from this unit.
     */
    getUnits(): Unit<T>;
    /**
     * Examines this unit's unitList to determine the most likely system this unit is currently expressed in.
     * @returns {string | null} The system this unit is most likely expressed in, or null if no likely system was recognized.
     */
    getInferredSystem(): string | null;
    /**
     * Returns whether the unit is compound (like m/s, cm^2) or not (kg, N, hogshead)
     * @memberof Unit
     * @returns True if the unit is compound
     */
    isCompound(): boolean;
    /**
     * Return whether the given array of unit pieces is a base unit with single dimension such as kg or feet, but not m/s or N or J.
     * @param unitList Array of unit pieces
     * @returns True if the unit is base
     */
    isBase(): boolean;
    /**
     * check if this unit matches the given quantity
     * @memberof Unit
     * @param {QUANTITY | string | undefined} quantity
     */
    /**
     * Check if this unit has a dimension equal to another unit
     * @param {Unit} other
     * @return {boolean} true if equal dimensions
     */
    equalsQuantity(other: Unit<T>): boolean;
    /**
     * Returns a string array of all the quantities that match this unit.
     * @return {string[]} The matching quantities, or an empty array if there are no matching quantities.
     */
    /**
     * Check if this unit equals another unit
     * @memberof Unit
     * @param {Unit} other
     * @return {boolean} true if both units are equal
     */
    equals(other: Unit<T> | string | T): boolean;
    /**
     * Compare this unit to another and return a value indicating whether this unit is less than, greater than, or equal to the other.
     * @param {Unit} other
     * @return {number} -1 if this unit is less than, 1 if this unit is greater than, and 0 if this unit is equal to the other unit.
     */
    compare(other: Unit<T> | string | T): -1 | 0 | 1;
    /**
     * Compare this unit to another and return whether this unit is less than the other.
     * @param {Unit} other
     * @return {boolean} true if this unit is less than the other.
     */
    lessThan(other: Unit<T> | string | T): boolean;
    /**
     * Compare this unit to another and return whether this unit is less than or equal to the other.
     * @param {Unit} other
     * @return {boolean} true if this unit is less than or equal the other.
     */
    lessThanOrEqual(other: Unit<T> | string | T): boolean;
    /**
     * Compare this unit to another and return whether this unit is greater than the other.
     * @param {Unit} other
     * @return {boolean} true if this unit is greater than the other.
     */
    greaterThan(other: Unit<T> | string | T): boolean;
    /**
     * Compare this unit to another and return whether this unit is greater than or equal to the other.
     * @param {Unit} other
     * @return {boolean} true if this unit is greater than or equal the other.
     */
    greaterThanOrEqual(other: Unit<T> | string | T): boolean;
    /**
     * Get a string representation of the Unit, with optional formatting options. Alias of `format`.
     * @memberof Unit
     * @param {Object} [opts]  Formatting options.
     * @return {string}
     */
    toString(formatOptions?: FormatOptions<T>, ...userArgs: any[]): string;
}
export interface UnitFactory<T> {
    (): Unit<T>;
    (str: string): Unit<T>;
    (value: number | T | string | null, unitString?: string): Unit<T>;
    config<U = number>(newOptions: Options<U>): UnitFactory<U>;
    getConfig(): Options<T>;
    definitions(): Definitions;
    add(a: Unit<T> | string | T, b: Unit<T> | string | T): Unit<T>;
    sub(a: Unit<T> | string | T, b: Unit<T> | string | T): Unit<T>;
    mul(a: Unit<T> | string | T, b: Unit<T> | string | T): Unit<T>;
    div(a: Unit<T> | string | T, b: Unit<T> | string | T): Unit<T>;
    pow(a: Unit<T> | string | T, b: number): Unit<T>;
    sqrt(a: Unit<T> | string | T): Unit<T>;
    abs(a: Unit<T> | string | T): Unit<T>;
    to(a: Unit<T> | string | T, valuelessUnit: Unit<T> | string): Unit<T>;
    toBaseUnits(a: Unit<T> | string | T): Unit<T>;
    exists(unit: string): boolean;
    _unitStore: UnitStore<T>;
}
export interface UnitStore<T> {
    parser(input: string): ParsedUnit<T>;
    originalDefinitions: Definitions;
    defs: DefinitionsExtended<T>;
    exists(name: string): boolean;
    findUnit(unitString: string): {
        unit: UnitPropsExtended<T>;
        prefix: string;
    } | null;
}
export interface ParsedUnit<T> {
    type: 'Unit';
    unitList: AtomicUnit<T>[];
    dimension: Record<string, number>;
    value: T | null;
}
export type FindUnitFn<T> = (unitString: string) => {
    unit: UnitPropsExtended<T>;
    prefix: string;
} | null;
export {};
