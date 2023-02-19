import { FindUnitFn, RequiredOptions, ParsedUnit } from "./types";
/**
 * Returns a new Parser.
 */
export declare function createParser<T>(options: RequiredOptions<T>, findUnit: FindUnitFn<T>): (str: string) => ParsedUnit<T>;
