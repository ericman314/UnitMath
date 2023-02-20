import { TypeArithmetics, AtomicUnit } from "./types";
/**
   * Normalize a value, based on an array of unit pieces
   * @private
   */
export declare function normalize<T>(unitList: AtomicUnit<T>[], value: T, type: TypeArithmetics<T>): T;
/**
   * Denormalize a value, based on an array of atomic units
   * @param unitList Array of atomic units (as in, Unit.units)
   * @returns denormalized value
   * @private
   */
export declare function denormalize<T>(unitList: AtomicUnit<T>[], value: T, type: TypeArithmetics<T>): T;
/**
   * Return whether the given array of unit pieces is compound (contains multiple units, such as m/s, or cm^2, but not N)
   * @param unitList Array of unit pieces
   * @returns True if the unit is compound
   * @private
   */
export declare function isCompound<T>(unitList: AtomicUnit<T>[]): boolean;
/**
 * Return whether the given array of unit pieces is a base unit with single dimension such as kg or feet, but not m/s or N or J.
 * @param unitList Array of unit pieces
 * @returns True if the unit is base
 */
export declare function isBase<T>(unitList: AtomicUnit<T>[]): boolean;
