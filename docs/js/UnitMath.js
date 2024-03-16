const ignoredCharacters = ' \t()*';
/**
 * Returns a new Parser.
 */
function createParser(options, findUnit) {
    // private variables and functions for the Unit parser
    let text, index, c;
    function skipIgnored() {
        while (c && ignoredCharacters.includes(c)) {
            next();
        }
    }
    function isDigitDot(c) {
        return ((c >= '0' && c <= '9') || c === '.');
    }
    function isDigit(c) {
        return ((c >= '0' && c <= '9'));
    }
    function next() {
        index++;
        c = text.charAt(index);
    }
    function revert(oldIndex) {
        index = oldIndex;
        c = text.charAt(index);
    }
    function parseNonFinite() {
        const nonFiniteStrings = ['NaN', 'Infinity', '-Infinity'];
        for (let nonFiniteString of nonFiniteStrings) {
            if (text.substr(index, nonFiniteString.length) === nonFiniteString) {
                index += nonFiniteString.length;
                c = text.charAt(index);
                return nonFiniteString;
            }
        }
        return null;
    }
    function parseNumber() {
        let number = '';
        let oldIndex;
        oldIndex = index;
        if (c === '+') {
            next();
        }
        else if (c === '-') {
            number += c;
            next();
        }
        if (!isDigitDot(c)) {
            // a + or - must be followed by a digit
            revert(oldIndex);
            return null;
        }
        // get number, can have a single dot
        if (c === '.') {
            number += c;
            next();
            if (!isDigit(c)) {
                // this is no legal number, it is just a dot
                revert(oldIndex);
                return null;
            }
        }
        else {
            while (isDigit(c)) {
                number += c;
                next();
            }
            if (c === '.') {
                number += c;
                next();
            }
        }
        while (isDigit(c)) {
            number += c;
            next();
        }
        // check for exponential notation like "2.3e-4" or "1.23e50"
        if (c === 'E' || c === 'e') {
            // The grammar branches here. This could either be part of an exponent or the start of a unit that begins with the letter e, such as "4exabytes"
            let tentativeNumber = '';
            const tentativeIndex = index;
            tentativeNumber += c;
            next();
            // @ts-ignore: Typescript does not realize that c has changed
            if (c === '+' || c === '-') {
                tentativeNumber += c;
                next();
            }
            // Scientific notation MUST be followed by an exponent (otherwise we assume it is not scientific notation)
            if (!isDigit(c)) {
                // The e or E must belong to something else, so return the number without the e or E.
                revert(tentativeIndex);
                return number;
            }
            // We can now safely say that this is scientific notation.
            number = number + tentativeNumber;
            while (isDigit(c)) {
                number += c;
                next();
            }
        }
        return number;
    }
    function parseUnit() {
        let unitName = '';
        // Alphanumeric characters only; matches [a-zA-Z0-9]
        let code = text.charCodeAt(index);
        while ((code >= 48 && code <= 57) ||
            (code >= 65 && code <= 90) ||
            (code >= 97 && code <= 122)) {
            unitName += c;
            next();
            code = text.charCodeAt(index);
        }
        // Must begin with [a-zA-Z]
        code = unitName.charCodeAt(0);
        if ((code >= 65 && code <= 90) ||
            (code >= 97 && code <= 122)) {
            return unitName;
        }
        else {
            return null;
        }
    }
    function parseCharacter(toFind) {
        if (c === toFind) {
            next();
            return toFind;
        }
        else {
            return null;
        }
    }
    /**
     * Parse a string and return the numeric value (or null) and an array of units with their powers.
     *
     * Throws an exception if the provided string does not contain a valid unit or
     * cannot be parsed.
     * @memberof Unit
     * @param {string} str        A string like "5.2 inch", "4e2 cm/s^2"
     * @return {Object} { value, unitArray }
     */
    function parse(str) {
        // console.log(`parse("${str}")`)
        text = str;
        index = -1;
        c = '';
        if (typeof text !== 'string') {
            throw new TypeError('Invalid argument in parse, string expected');
        }
        const unit = {
            type: 'Unit',
            value: null,
            unitList: [],
            dimension: {}
        };
        let powerMultiplierCurrent = 1;
        let expectingUnit = false;
        // A unit should follow this pattern:
        // [number|[-]Infinity|NaN] ...[ [*/] unit[^number] ]
        // unit[^number] ... [ [*/] unit[^number] ]
        // Rules:
        // number is any floating point number.
        // unit is any alphanumeric string beginning with an alpha. Units with names like e3 should be avoided because they look like the exponent of a floating point number!
        // The string may optionally begin with a number.
        // Each unit may optionally be followed by ^number.
        // Whitespace or a forward slash is recommended between consecutive units, although the following technically is parseable:
        //   2m^2kg/s^2
        // it is not good form. If a unit starts with e, then it could be confused as a floating point number:
        //   4erg
        next();
        skipIgnored();
        // Optional number or non-finite string at the start of the string
        const valueStr = parseNonFinite() || parseNumber();
        // console.log(`valueStr = "${valueStr}"`)
        if (valueStr) {
            unit.value = options.type.conv(valueStr);
            skipIgnored(); // Whitespace is not required here
            // handle multiplication or division right after the value, like '1/s'
            if (parseCharacter('/')) {
                powerMultiplierCurrent = -1;
                expectingUnit = true;
            }
        }
        while (true) {
            skipIgnored();
            // Parentheses are not allowed
            // if (c === '(' || c === ')') {
            //   throw new SyntaxError(`Unexpected "${c}" in "${text}" at index ${index}`)
            // }
            // Is there something here?
            let uStr;
            if (c) {
                const oldC = c;
                uStr = parseUnit();
                if (uStr === null) {
                    throw new SyntaxError('Unexpected "' + oldC + '" in "' + text + '" at index ' + index.toString());
                }
            }
            else {
                // End of input.
                break;
            }
            // Verify the unit exists and get the prefix (if any)
            const found = findUnit(uStr);
            if (found === null) {
                // Unit not found.
                throw new SyntaxError('Unit "' + uStr + '" not found.');
            }
            let power = powerMultiplierCurrent;
            // Is there a "^ number"?
            skipIgnored();
            if (parseCharacter('^')) {
                skipIgnored();
                const p = parseNumber();
                if (p === null) {
                    // No valid number found for the power!
                    throw new SyntaxError('In "' + str + '", "^" must be followed by a floating-point number');
                }
                power *= +p;
            }
            // Add the unit to the list
            unit.unitList.push({
                unit: found.unit,
                prefix: found.prefix,
                power: power
            });
            for (let dim of Object.keys(found.unit.dimension)) {
                unit.dimension[dim] = (unit.dimension[dim] || 0) + (found.unit.dimension[dim] || 0) * power;
            }
            skipIgnored();
            // "/" means we are expecting something to come next.
            // Is there a forward slash? If so, set powerMultiplierCurrent to -1. All remaining units will be in the denominator.
            expectingUnit = false;
            if (parseCharacter('/')) {
                if (powerMultiplierCurrent === -1) {
                    throw new SyntaxError(`Unexpected additional "/" in "${text}" at index ${index}`);
                }
                powerMultiplierCurrent = -1;
                expectingUnit = true;
            }
        }
        // Is there a trailing slash?
        if (expectingUnit) {
            throw new SyntaxError('Trailing characters: "' + str + '"');
        }
        return unit;
    }
    return parse;
}

/**
   * Normalize a value, based on an array of unit pieces
   * @private
   */
function normalize(unitList, value, type) {
    let unitValue, unitOffset, unitPower, unitPrefixValue;
    if (value === null || value === undefined || unitList.length === 0) {
        return value;
    }
    else if (isCompound(unitList)) {
        // units is a compound unit, so do not apply offsets.
        // For example, with J kg^-1 degC^-1 you would NOT want to apply the offset.
        let result = value;
        for (let i = 0; i < unitList.length; i++) {
            unitValue = type.conv(unitList[i].unit.value);
            unitPrefixValue = type.conv(unitList[i].unit.prefixGroup[unitList[i].prefix]);
            unitPower = type.conv(unitList[i].power);
            result = type.mul(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower));
        }
        return result;
    }
    else {
        // units is a single unit of power 1, like kg or degC
        unitValue = type.conv(unitList[0].unit.value);
        unitOffset = type.conv(unitList[0].unit.offset);
        unitPrefixValue = type.conv(unitList[0].unit.prefixGroup[unitList[0].prefix]);
        return type.mul(type.add(type.mul(value, unitPrefixValue), unitOffset), unitValue);
        // (value*unitPrefixValue+unitOffset)*unitValue
    }
}
/**
   * Denormalize a value, based on an array of atomic units
   * @param unitList Array of atomic units (as in, Unit.units)
   * @returns denormalized value
   * @private
   */
function denormalize(unitList, value, type) {
    let unitValue, unitOffset, unitPower, unitPrefixValue;
    if (value === null || value === undefined || unitList.length === 0) {
        return value;
    }
    else if (isCompound(unitList)) {
        // unit is a compound unit, so do not apply offsets.
        // For example, with J kg^-1 degC^-1 you would NOT want to apply the offset.
        let result = value;
        for (let i = 0; i < unitList.length; i++) {
            unitValue = type.conv(unitList[i].unit.value);
            unitPrefixValue = type.conv(unitList[i].unit.prefixGroup[unitList[i].prefix]);
            unitPower = type.conv(unitList[i].power);
            result = type.div(result, type.pow(type.mul(unitValue, unitPrefixValue), unitPower));
        }
        return result;
    }
    else {
        // unit is a single unit of power 1, like kg or degC
        unitValue = type.conv(unitList[0].unit.value);
        unitPrefixValue = type.conv(unitList[0].unit.prefixGroup[unitList[0].prefix]);
        unitOffset = type.conv(unitList[0].unit.offset);
        return type.div(type.sub(type.div(value, unitValue), unitOffset), unitPrefixValue);
        // (value/unitValue-unitOffset)/unitPrefixValue
    }
}
/**
   * Return whether the given array of unit pieces is compound (contains multiple units, such as m/s, or cm^2, but not N)
   * @param unitList Array of unit pieces
   * @returns True if the unit is compound
   * @private
   */
function isCompound(unitList) {
    if (unitList.length === 0) {
        return false;
    }
    return unitList.length > 1 || Math.abs(unitList[0].power - 1.0) > 1e-15;
}
/**
 * Return whether the given array of unit pieces is a base unit with single dimension such as kg or feet, but not m/s or N or J.
 * @param unitList Array of unit pieces
 * @returns True if the unit is base
 */
function isBase(unitList) {
    return unitList.length === 1
        && Math.abs(unitList[0].power - 1.0) < 1e-15
        && Object.keys(unitList[0].unit.dimension).length === 1
        && unitList[0].unit.dimension[Object.keys(unitList[0].unit.dimension)[0]] === 1;
}

// A base quantity is a physical quantity in a subset of a given system of quantities that is chosen by convention, where no quantity in the set can be expressed in terms of the others.
// export const baseQuantities = ['MASS', 'LENGTH', 'TIME', 'CURRENT', 'TEMPERATURE', 'LUMINOUS_INTENSITY', 'AMOUNT_OF_SUBSTANCE', 'ANGLE', 'BIT', 'SOLID_ANGLE']
// A derived quantity is a quantity in a system of quantities that is a defined in terms of the base quantities of that system.
// export const quantities = {
//   UNITLESS: '',
//   ABSEMENT: 'LENGTH TIME',
//   ACCELERATION: 'LENGTH TIME^-2',
//   ANGULAR_ACCELERATION: 'TIME^-2 ANGLE',
//   ANGULAR_MOMENTUM: 'MASS LENGTH^2 TIME^-1 ANGLE',
//   ANGULAR_VELOCITY: 'TIME^-1 ANGLE',
//   AREA: 'LENGTH^2',
//   AREA_DENSITY: 'MASS LENGTH^-2',
//   BIT_RATE: 'TIME^-1 BIT',
//   CAPACITANCE: 'MASS^-1 LENGTH^-2 TIME^4 CURRENT^2',
//   CURRENT_DENSITY: 'LENGTH^-2 CURRENT',
//   DYNAMIC_VISCOSITY: 'MASS LENGTH^-1 TIME^-1',
//   ELECTRIC_CHARGE: 'TIME CURRENT',
//   ELECTRIC_CHARGE_DENSITY: 'LENGTH^-3 TIME CURRENT',
//   ELECTRIC_DISPLACEMENT: 'LENGTH^-2 TIME CURRENT',
//   ELECTRIC_FIELD_STRENGTH: 'MASS LENGTH TIME^-3 CURRENT^-1',
//   ELECTRICAL_CONDUCTANCE: 'MASS^-1 LENGTH^-2 TIME^3 CURRENT^2',
//   ELECTRICAL_CONDUCTIVITY: 'MASS^-1 LENGTH^-3 TIME^3 CURRENT^2',
//   ELECTRIC_POTENTIAL: 'MASS LENGTH^2 TIME^-3 CURRENT^-1',
//   RESISTANCE: 'MASS LENGTH^2 TIME^-3 CURRENT^-2',
//   ELECTRICAL_RESISTIVITY: 'MASS LENGTH^3 TIME^-3 CURRENT^-2',
//   ENERGY: 'MASS LENGTH^2 TIME^-2',
//   ENTROPY: 'MASS LENGTH^2 TIME^-2 TEMPERATURE^-1',
//   FORCE: 'MASS LENGTH TIME^-2',
//   FREQUENCY: 'TIME^-1',
//   HEAT_CAPACITY: 'MASS LENGTH^2 TIME^-2 TEMPERATURE^-1',
//   HEAT_FLUX_DENSITY: 'MASS TIME^-3',
//   ILLUMINANCE: 'LENGTH^-2 LUMINOUS_INTENSITY',
//   IMPEDANCE: 'MASS LENGTH^2 TIME^-3 CURRENT^-2',
//   IMPULSE: 'MASS LENGTH TIME^-1',
//   INDUCTANCE: 'MASS LENGTH^2 TIME^-2 CURRENT^-2',
//   IRRADIANCE: 'MASS TIME^-3',
//   JERK: 'LENGTH TIME^-3',
//   KINEMATIC_VISCOSITY: 'LENGTH^2 TIME^-1',
//   LINEAR_DENSITY: 'MASS LENGTH^-1',
//   LUMINOUS_FLUX: 'LUMINOUS_INTENSITY SOLID_ANGLE',
//   MAGNETIC_FIELD_STRENGTH: 'LENGTH^-1 CURRENT',
//   MAGNETIC_FLUX: 'MASS LENGTH^2 TIME^-2 CURRENT^-1',
//   MAGNETIC_FLUX_DENSITY: 'MASS TIME^-2 CURRENT^-1',
//   MOLAR_CONCENTRATION: 'LENGTH^-3 AMOUNT_OF_SUBSTANCE',
//   MOLAR_ENERGY: 'MASS LENGTH^2 TIME^-2 AMOUNT_OF_SUBSTANCE^-1',
//   MOLAR_ENTROPY: 'MASS LENGTH^2 TIME^-2 TEMPERATURE^-1 AMOUNT_OF_SUBSTANCE^-1',
//   MOLAR_HEAT_CAPACITY: 'MASS LENGTH^2 TIME^-2 TEMPERATURE^-1 AMOUNT_OF_SUBSTANCE^-1',
//   MOMENT_OF_INERTIA: 'MASS LENGTH^2',
//   MOMENTUM: 'MASS LENGTH TIME^-1',
//   PERMEABILITY: 'MASS LENGTH TIME^-2 CURRENT^-2',
//   PERMITTIVITY: 'MASS^-1 LENGTH^-3 TIME^4 CURRENT^2 ',
//   POWER: 'MASS LENGTH^2 TIME^-3',
//   PRESSURE: 'MASS LENGTH^-1 TIME^-2',
//   RELUCTANCE: 'MASS^-1 LENGTH^-2 TIME^2 CURRENT^2',
//   SPECIFIC_ENERGY: 'LENGTH^2 TIME^-2',
//   SPECIFIC_HEAT_CAPACITY: 'LENGTH^2 TIME^-2 TEMPERATURE^-1',
//   SPECIFIC_VOLUME: 'MASS^-1 LENGTH^3',
//   SPIN: 'MASS LENGTH^2 TIME^-1',
//   SURFACE_TENSION: 'MASS TIME^-2',
//   TEMPERATURE_GRADIENT: 'LENGTH^-1 TEMPERATURE',
//   THERMAL_CONDUCTIVITY: 'MASS LENGTH TIME^-3 TEMPERATURE^-1',
//   TORQUE: 'MASS LENGTH^2 TIME^-2', // TODO: Should this have a radian in it somewhere?
//   VELOCITY: 'LENGTH TIME^-1',
//   VOLUME: 'LENGTH^3',
//   VOLUMETRIC_FLOW_RATE: 'LENGTH^3 TIME^-1'
// }
// // A unit system is a set of units that are by convention used with the unit system.
// // Units listed here will be treated as belonging to the specified system.
// // TODO: We need a better way to add all of the units which possibly might show up and need to be parsed.
const systems = {
    si: ['m', 'meter', 's', 'A', 'kg', 'K', 'mol', 'rad', 'b', 'F', 'C', 'S', 'V', 'J', 'N', 'Hz', 'ohm', 'H', 'cd', 'lm', 'lx', 'Wb', 'T', 'W', 'Pa', 'ohm', 'sr'],
    cgs: ['cm', 's', 'A', 'g', 'K', 'mol', 'rad', 'b', 'F', 'C', 'S', 'V', 'erg', 'dyn', 'Hz', 'ohm', 'H', 'cd', 'lm', 'lx', 'Wb', 'T', 'Pa', 'ohm', 'sr'],
    us: ['ft', 'mi', 'mile', 'in', 'inch', 's', 'A', 'lbm', 'degF', 'mol', 'rad', 'b', 'F', 'C', 'S', 'V', 'BTU', 'lbf', 'Hz', 'ohm', 'H', 'cd', 'lm', 'lx', 'Wb', 'T', 'psi', 'ohm', 'sr', 'hp']
};
// Units may or may not use one of the prefix groups (SHORT, LONG, etc).
const prefixes = {
    NONE: {
        '': 1
    },
    SHORT: {
        '': 1,
        'da': 1e1,
        'h': 1e2,
        'k': 1e3,
        'M': 1e6,
        'G': 1e9,
        'T': 1e12,
        'P': 1e15,
        'E': 1e18,
        'Z': 1e21,
        'Y': 1e24,
        'd': 1e-1,
        'c': 1e-2,
        'm': 1e-3,
        'u': 1e-6,
        'n': 1e-9,
        'p': 1e-12,
        'f': 1e-15,
        'a': 1e-18,
        'z': 1e-21,
        'y': 1e-24
    },
    LONG: {
        '': 1,
        'deca': 1e1,
        'hecto': 1e2,
        'kilo': 1e3,
        'mega': 1e6,
        'giga': 1e9,
        'tera': 1e12,
        'peta': 1e15,
        'exa': 1e18,
        'zetta': 1e21,
        'yotta': 1e24,
        'deci': 1e-1,
        'centi': 1e-2,
        'milli': 1e-3,
        'micro': 1e-6,
        'nano': 1e-9,
        'pico': 1e-12,
        'femto': 1e-15,
        'atto': 1e-18,
        'zepto': 1e-21,
        'yocto': 1e-24
    },
    BINARY_SHORT_SI: {
        '': 1,
        'k': 1e3,
        'M': 1e6,
        'G': 1e9,
        'T': 1e12,
        'P': 1e15,
        'E': 1e18,
        'Z': 1e21,
        'Y': 1e24
    },
    BINARY_SHORT_IEC: {
        '': 1,
        'Ki': 1024,
        'Mi': Math.pow(1024, 2),
        'Gi': Math.pow(1024, 3),
        'Ti': Math.pow(1024, 4),
        'Pi': Math.pow(1024, 5),
        'Ei': Math.pow(1024, 6),
        'Zi': Math.pow(1024, 7),
        'Yi': Math.pow(1024, 8)
    },
    BINARY_LONG_SI: {
        '': 1,
        'kilo': 1e3,
        'mega': 1e6,
        'giga': 1e9,
        'tera': 1e12,
        'peta': 1e15,
        'exa': 1e18,
        'zetta': 1e21,
        'yotta': 1e24
    },
    BINARY_LONG_IEC: {
        '': 1,
        'kibi': 1024,
        'mebi': Math.pow(1024, 2),
        'gibi': Math.pow(1024, 3),
        'tebi': Math.pow(1024, 4),
        'pebi': Math.pow(1024, 5),
        'exi': Math.pow(1024, 6),
        'zebi': Math.pow(1024, 7),
        'yobi': Math.pow(1024, 8)
    },
    BTU: {
        '': 1,
        'MM': 1e6
    },
    SHORT_LONG: {},
    BINARY_SHORT: {},
    BINARY_LONG: {}
};
// Additional prefix groups
prefixes.SHORT_LONG = Object.assign({}, prefixes.SHORT, prefixes.LONG);
prefixes.BINARY_SHORT = Object.assign({}, prefixes.BINARY_SHORT_SI, prefixes.BINARY_SHORT_IEC);
prefixes.BINARY_LONG = Object.assign({}, prefixes.BINARY_LONG_SI, prefixes.BINARY_LONG_IEC);
// Units are a set measure of a particular quantity. Below, each key of UNITS is a different unit. Each unit may be
// defined using a base quantity, such as LENGTH, or it may be defined in terms of other units. The unit may also
// include `prefixes`, which specify which prefix group will be used for parsing the unit, and `commonPrefixes`, which
// specifies which prefixes will be used when formatting that unit.
const units = {
    '': {
        quantity: 'UNITLESS',
        value: 1
    },
    // length
    m: {
        quantity: 'LENGTH',
        prefixGroup: 'SHORT',
        formatPrefixes: ['n', 'u', 'm', 'c', '', 'k'],
        value: 1
    },
    meter: {
        prefixGroup: 'LONG',
        formatPrefixes: ['nano', 'micro', 'milli', 'centi', '', 'kilo'],
        value: '1 m',
        aliases: ['meters']
    },
    inch: {
        value: '0.0254 meter',
        aliases: ['inches', 'in']
    },
    foot: {
        value: '12 inch',
        aliases: ['ft', 'feet']
    },
    yard: {
        value: '3 foot',
        aliases: ['yd', 'yards']
    },
    mile: {
        value: '5280 ft',
        aliases: ['mi', 'miles']
    },
    link: {
        value: '7.92 in',
        aliases: ['li', 'links']
    },
    rod: {
        value: '25 link',
        aliases: ['rd', 'rods']
    },
    chain: {
        value: '100 link',
        aliases: ['ch', 'chains']
    },
    angstrom: {
        value: '1e-10 m',
        aliases: ['angstroms']
    },
    mil: {
        value: '1e-3 inch'
    },
    // Area
    sqin: { value: '1 in^2' },
    sqft: { value: '1 ft^2' },
    sqyd: { value: '1 yd^2' },
    sqmi: { value: '1 mi^2' },
    sqrd: { value: '1 rod^2' },
    sqch: { value: '1 chain^2' },
    sqmil: { value: '1 mil^2' },
    acre: { value: '10 chain^2' },
    hectare: { value: '1e4 m^2' },
    // Volume
    L: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['n', 'u', 'm', ''],
        value: '1e-3 m^3',
        aliases: ['l', 'lt']
    },
    litre: {
        prefixGroup: 'LONG',
        formatPrefixes: ['nano', 'micro', 'milli', ''],
        value: '1 L',
        aliases: ['liter', 'liters', 'litres']
    },
    cuin: { value: '1 in^3' },
    cuft: { value: '1 ft^3' },
    cuyd: { value: '1 yd^3' },
    teaspoon: {
        value: '4.92892159375 mL',
        aliases: ['teaspoons', 'tsp']
    },
    tablespoon: {
        value: '3 teaspoon',
        aliases: ['tablespoons', 'tbsp']
    },
    drop: { value: '0.05 mL' },
    gtt: { value: '0.05 mL' },
    // Liquid volume
    minim: {
        value: '0.0125 teaspoon',
        aliases: ['minims']
    },
    fluidounce: {
        value: '0.125 cups',
        aliases: ['floz', 'fluidounces']
    },
    fluiddram: {
        value: '0.125 floz',
        aliases: ['fldr', 'fluiddrams']
    },
    cc: { value: '1 cm^3' },
    cup: {
        value: '236.5882365 mL',
        aliases: ['cp', 'cups']
    },
    pint: {
        value: '2 cup',
        aliases: ['pt', 'pints']
    },
    quart: {
        value: '4 cup',
        aliases: ['qt', 'quarts']
    },
    gallon: {
        value: '16 cup',
        aliases: ['gal', 'gallons']
    },
    oilbarrel: {
        value: '42 gal',
        aliases: ['obl', 'oilbarrels']
    },
    // Mass
    g: {
        quantity: 'MASS',
        prefixGroup: 'SHORT',
        formatPrefixes: ['n', 'u', 'm', '', 'k'],
        value: 0.001,
        basePrefix: 'k' // Treat as if 'kg' is the base unit, not 'g'
    },
    gram: {
        prefixGroup: 'LONG',
        formatPrefixes: ['nano', 'micro', 'milli', '', 'kilo'],
        value: '1 g'
    },
    poundmass: {
        value: '0.45359237 kg',
        aliases: ['lb', 'lbs', 'lbm', 'poundmasses']
    },
    ton: { value: '2000 lbm' },
    tonne: {
        prefixGroup: 'LONG',
        formatPrefixes: ['', 'kilo', 'mega', 'giga'],
        value: '1000 kg'
    },
    t: {
        prefixGroup: 'SHORT',
        // kt could be confused with knot (speed),
        value: '1 tonne'
    },
    grain: {
        value: '64.79891 mg',
        aliases: ['gr']
    },
    ounce: {
        value: '0.0625 lbm',
        aliases: ['oz', 'ounces']
    },
    dram: {
        value: '0.0625 oz',
        aliases: ['dr']
    },
    hundredweight: {
        value: '100 lbm',
        aliases: ['cwt', 'hundredweights']
    },
    stick: {
        value: '4 oz',
        aliases: ['sticks']
    },
    stone: { value: '14 lbm' },
    // Time
    s: {
        quantity: 'TIME',
        prefixGroup: 'SHORT',
        formatPrefixes: ['f', 'p', 'n', 'u', 'm', ''],
        value: 1,
        aliases: ['sec']
    },
    min: {
        value: '60 s',
        aliases: ['minute', 'minutes']
    },
    h: {
        value: '60 min',
        aliases: ['hr', 'hrs', 'hour', 'hours']
    },
    second: {
        prefixGroup: 'LONG',
        formatPrefixes: ['femto', 'pico', 'nano', 'micro', 'milli', ''],
        value: '1 s',
        aliases: ['seconds']
    },
    day: {
        value: '24 hr',
        aliases: ['days']
    },
    week: {
        value: '7 day',
        aliases: ['weeks']
    },
    month: {
        value: '30.4375 day',
        aliases: ['months']
    },
    year: {
        value: '365.25 day',
        aliases: ['years']
    },
    decade: {
        value: '10 year',
        aliases: ['decades']
    },
    century: {
        value: '100 year',
        aliases: ['centuries']
    },
    millennium: {
        value: '1000 year',
        aliases: ['millennia']
    },
    // Frequency
    hertz: {
        prefixGroup: 'LONG',
        formatPrefixes: ['', 'kilo', 'mega', 'giga', 'tera'],
        value: '1/s'
    },
    Hz: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['', 'k', 'M', 'G', 'T'],
        value: '1 hertz'
    },
    // Angle
    rad: {
        quantity: 'ANGLE',
        prefixGroup: 'SHORT',
        formatPrefixes: ['m', ''],
        value: 1
    },
    radian: {
        prefixGroup: 'LONG',
        formatPrefixes: ['milli', ''],
        value: '1 rad',
        aliases: ['radians']
    },
    sr: {
        quantity: 'SOLID_ANGLE',
        prefixGroup: 'SHORT',
        formatPrefixes: ['u', 'm', ''],
        value: 1
    },
    steradian: {
        prefixGroup: 'LONG',
        formatPrefixes: ['micro', 'milli', ''],
        value: '1 sr',
        aliases: ['steradians']
    },
    deg: {
        value: [Math.PI / 180, 'rad'],
        aliases: ['degree', 'degrees']
    },
    grad: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['c'],
        value: [Math.PI / 200, 'rad']
    },
    gradian: {
        prefixGroup: 'LONG',
        formatPrefixes: ['centi', ''],
        value: [Math.PI / 200, 'rad'],
        aliases: ['gradians']
    },
    cycle: {
        value: [2 * Math.PI, 'rad'],
        aliases: ['cycles']
    },
    arcmin: {
        value: '0.016666666666666666 deg',
        aliases: ['arcminute', 'arcminutes']
    },
    arcsec: {
        value: '0.016666666666666666 arcmin',
        aliases: ['arcsecond', 'arcseconds']
    },
    // Electric current
    A: {
        quantity: 'CURRENT',
        prefixGroup: 'SHORT',
        formatPrefixes: ['u', 'm', '', 'k'],
        value: 1
    },
    ampere: {
        prefixGroup: 'LONG',
        formatPrefixes: ['micro', 'milli', '', 'kilo'],
        value: '1 A',
        aliases: ['amperes']
    },
    // Temperature
    // K(C) = °C + 273.15
    // K(F) = (°F + 459.67) / 1.8
    // K(R) = °R / 1.8
    K: {
        quantity: 'TEMPERATURE',
        prefixGroup: 'SHORT',
        formatPrefixes: ['n', 'u', 'm', ''],
        value: 1
    },
    kelvin: {
        prefixGroup: 'LONG',
        formatPrefixes: ['nano', 'micro', 'milli', ''],
        value: '1 K'
    },
    degC: {
        value: '1 K',
        offset: 273.15,
        aliases: ['celsius']
    },
    degR: {
        value: [1 / 1.8, 'K'],
        aliases: ['rankine', 'R']
    },
    degF: {
        value: '1 R',
        offset: 459.67,
        aliases: ['fahrenheit']
    },
    // amount of substance
    mol: {
        quantity: 'AMOUNT_OF_SUBSTANCE',
        prefixGroup: 'SHORT',
        formatPrefixes: ['', 'k'],
        value: 1
    },
    mole: {
        prefixGroup: 'LONG',
        formatPrefixes: ['', 'kilo'],
        value: '1 mol',
        aliases: ['moles']
    },
    // luminous intensity
    cd: {
        quantity: 'LUMINOUS_INTENSITY',
        value: 1,
        prefixGroup: 'SHORT',
        formatPrefixes: ['', 'm']
    },
    candela: {
        value: '1 cd',
        prefixGroup: 'LONG',
        formatPrefixes: ['', 'milli']
    },
    // luminous flux
    lumen: {
        prefixGroup: 'LONG',
        value: '1 cd sr',
        aliases: ['lumens']
    },
    lm: {
        prefixGroup: 'SHORT',
        value: '1 lumen'
    },
    // illuminance
    lux: {
        prefixGroup: 'LONG',
        value: '1 cd/m^2'
    },
    lx: {
        prefixGroup: 'SHORT',
        value: '1 lux'
    },
    // Force
    N: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['u', 'm', '', 'k', 'M'],
        value: '1 kg m/s^2'
    },
    newton: {
        prefixGroup: 'LONG',
        formatPrefixes: ['micro', 'milli', '', 'kilo', 'mega'],
        value: '1 N',
        aliases: ['newtons']
    },
    dyn: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['m', 'k', 'M'],
        value: '1 g cm/s^2'
    },
    dyne: {
        prefixGroup: 'LONG',
        formatPrefixes: ['milli', 'kilo', 'mega'],
        value: '1 dyn'
    },
    lbf: {
        value: '4.4482216152605 N',
        aliases: ['poundforce']
    },
    kip: {
        value: '1000 lbf',
        aliases: ['kips']
    },
    // Energy
    J: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['m', '', 'k', 'M', 'G'],
        value: '1 N m'
    },
    joule: {
        prefixGroup: 'LONG',
        formatPrefixes: ['milli', '', 'kilo', 'mega', 'giga'],
        value: '1 J',
        aliases: ['joules']
    },
    erg: {
        value: '1 dyn cm'
    },
    Wh: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['k', 'M', 'G', 'T'],
        value: '1 W hr'
    },
    BTU: {
        prefixGroup: 'BTU',
        formatPrefixes: ['', 'MM'],
        value: '1055.05585262 J',
        aliases: ['BTUs']
    },
    eV: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['u', 'm', '', 'k', 'M', 'G'],
        value: '1.602176565e-19 J'
    },
    electronvolt: {
        prefixGroup: 'LONG',
        formatPrefixes: ['micro', 'milli', '', 'kilo', 'mega', 'giga'],
        value: '1 eV',
        aliases: ['electronvolts']
    },
    // Power
    W: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T', 'P'],
        value: '1 J/s'
    },
    watt: {
        prefixGroup: 'LONG',
        formatPrefixes: ['pico', 'nano', 'micro', 'milli', '', 'kilo', 'mega', 'tera', 'peta'],
        value: '1 W',
        aliases: ['watts']
    },
    hp: { value: '550 ft lbf / s' },
    // Electrical power units
    VA: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['', 'k'],
        value: '1 W'
    },
    // Pressure
    Pa: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['', 'k', 'M', 'G'],
        value: '1 N / m^2'
    },
    psi: {
        value: '1 lbf/in^2'
        // kpsi is sometimes used
    },
    atm: { value: '101325 Pa' },
    bar: {
        prefixGroup: 'SHORT_LONG',
        formatPrefixes: ['m', ''],
        value: '1e5 Pa'
    },
    torr: {
        prefixGroup: 'LONG',
        formatPrefixes: ['milli', ''],
        value: '133.32236842105263 Pa'
    },
    Torr: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['m', ''],
        value: '1 torr'
    },
    mmHg: {
        value: '133.322387415 Pa',
        aliases: ['mmhg']
    },
    inH2O: {
        value: '249.082 Pa',
        aliases: ['inh2o', 'inAq']
    },
    // Electric charge
    C: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['p', 'n', 'u', 'm', ''],
        value: '1 A s'
    },
    coulomb: {
        prefixGroup: 'LONG',
        formatPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
        value: '1 C',
        aliases: ['coulombs']
    },
    // Electric potential
    V: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['m', '', 'k', 'M'],
        value: '1 W/A'
    },
    volt: {
        prefixGroup: 'LONG',
        formatPrefixes: ['milli', '', 'kilo', 'mega'],
        value: '1 V',
        aliases: ['volts']
    },
    // Electric capacitance
    F: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['p', 'n', 'u', 'm', ''],
        value: '1 C/V'
    },
    farad: {
        prefixGroup: 'LONG',
        formatPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
        value: '1 F',
        aliases: ['farads']
    },
    // Electric resistance
    ohm: {
        prefixGroup: 'SHORT_LONG',
        formatPrefixes: ['', 'k', 'M'],
        value: '1 V/A',
        aliases: ['ohms']
    },
    /*
     * Unicode breaks in browsers if charset is not specified
     * TODO: Allow with config option?
    Ω: {
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k', 'M'],
      value: '1 ohm',
    },
    */
    // Electric inductance
    H: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['u', 'm', ''],
        value: '1 V s / A'
    },
    henry: {
        prefixGroup: 'LONG',
        formatPrefixes: ['micro', 'milli', ''],
        value: '1 H',
        aliases: ['henries']
    },
    // Electric conductance
    S: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['u', 'm', ''],
        value: '1 / ohm'
    },
    siemens: {
        prefixGroup: 'LONG',
        formatPrefixes: ['micro', 'milli', ''],
        value: '1 S'
    },
    // Magnetic flux
    Wb: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['n', 'u', 'm', ''],
        value: '1 V s'
    },
    weber: {
        prefixGroup: 'LONG',
        formatPrefixes: ['nano', 'micro', 'milli', ''],
        value: '1 Wb',
        aliases: ['webers']
    },
    // Magnetic flux density
    T: {
        prefixGroup: 'SHORT',
        formatPrefixes: ['n', 'u', 'm', ''],
        value: '1 N s / C m'
    },
    tesla: {
        prefixGroup: 'LONG',
        formatPrefixes: ['nano', 'micro', 'milli', ''],
        value: '1 T',
        aliases: ['teslas']
    },
    // Binary
    // TODO: Figure out how to do SI vs. IEC while formatting
    b: {
        quantity: 'BIT',
        prefixGroup: 'BINARY_SHORT',
        value: 1
    },
    bits: {
        prefixGroup: 'BINARY_LONG',
        value: '1 b',
        aliases: ['bit']
    },
    B: {
        prefixGroup: 'BINARY_SHORT',
        value: '8 b'
    },
    bytes: {
        prefixGroup: 'BINARY_LONG',
        value: '1 B',
        aliases: ['byte']
    }
};

/**
 * Creates a new unit store.
 */
function createUnitStore(options) {
    /* Units are defined by these objects:
     * defs.prefixes
     * defs.units
     */
    // TODO: Should we deep freeze the built-ins to prevent modification of the built-in units?
    const { skipBuiltIns } = options.definitions;
    // Merge the built-in units with the user's definitions
    let systems$1;
    if (skipBuiltIns) {
        systems$1 = { ...options.definitions.systems };
    }
    else {
        systems$1 = { ...systems };
        // Prepend the user's units onto the built-in ones, so that the user's will be chosen first
        for (let system of Object.keys(options.definitions.systems)) {
            if (systems$1.hasOwnProperty(system)) {
                systems$1[system] = [...options.definitions.systems[system], ...systems$1[system]];
            }
            else {
                systems$1[system] = [...options.definitions.systems[system]];
            }
        }
    }
    const originalDefinitions = {
        systems: systems$1,
        prefixGroups: {
            ...(skipBuiltIns ? {} : prefixes),
            ...options.definitions.prefixGroups
        },
        units: {
            ...(skipBuiltIns ? {} : units),
            ...options.definitions.units
        }
    };
    // These will contain copies we can mutate without affecting the originals
    const defs = {
        units: {},
        prefixGroups: { ...originalDefinitions.prefixGroups },
        systems: {}
    };
    // for (let system of Object.keys(originalDefinitions.systems)) {
    //   defs.systems[system] = originalDefinitions.systems[system].slice()
    // }
    /* All of the prefixes, units, and systems have now been defined.
     *
     * We will perform the following processing steps to prepare the UnitStore for use:
     *
     * - For each QUANTITY, parse its value and replace it with a dimension array, where each index of the array
     *   corresponds to the base quantity's index in defs.baseQuantities, and the value of each element is the power
     *   (exponent) of that base in the dimension.
     *
     * - Initialize the parser with an empty set of units.
     *
     * - Loop through the units. If the unit has a `quantity` property, initialize that unit with the quantity's
     *   dimension, and the given value property. If the unit does not, then parse the unit's value property (which is
     *   either a string or an two-element array) using the parser, and create the dimension and value from the resulting
     *   Unit. Create the unit with the name, dimension, value, offset, prefixes, and commonPrefixes properties. Convert
     *   the prefixes from a string to the associated object from the defs.prefixes object.
     *
     * - Some units will fail to be parsed if the defs.units object keys are not enumerated in the optimal order. Repeat
     *   the loop until all units have been converted.
     *
     * - Verify that each unit's commonPrefixes are contained in prefixes.
     *
     * - Loop through the defs.systems and convert the strings into valueless units.
     *
     * - Add the unit system names to each unit (as an array) for reverse lookup.
     *
     * - Clone units that have aliases. Shallow copies are acceptable since the resulting defs.units object will be
     *   deep-immutable.
     *
  */
    // Create a parser configured for these options, and also supply it with the findUnit function
    const parser = createParser(options, findUnit);
    // Loop through the units. If the unit has a `quantity` property, initialize that unit with the quantity's dimension,
    // and the given value property. If the unit does not, then parse the unit's value property (which is either a string
    // or a two-element array) using the parser, and create the dimension and value from the resulting Unit. Create the
    // unit with the name, dimension, value, offset, prefixes, and commonPrefixes properties. Convert the prefixes from a
    // string to the associated object from the defs.prefixes object.
    while (true) {
        let unitsAdded = 0;
        let unitsSkipped = [];
        let reasonsSkipped = [];
        for (const unitDefKey of Object.keys(originalDefinitions.units)) {
            if (defs.units.hasOwnProperty(unitDefKey))
                continue;
            const unitDef = originalDefinitions.units[unitDefKey];
            if (!unitDef)
                continue;
            // const unitDef = unitDef
            // uses unknown set of prefixes?
            if (typeof unitDef !== 'string' && unitDef.prefixGroup && !defs.prefixGroups.hasOwnProperty(unitDef.prefixGroup)) {
                throw new Error(`Unknown prefixes '${unitDef.prefixGroup}' for unit '${unitDefKey}'`);
            }
            let unitValue;
            let unitDimension;
            let unitQuantity;
            let skipThisUnit = false;
            if (isUnitPropsWithQuantity(unitDef)) {
                // Defining the unit based on a quantity.
                unitValue = options.type.conv(unitDef.value);
                unitDimension = { [unitDef.quantity]: 1 };
                unitQuantity = unitDef.quantity;
            }
            else {
                // Defining the unit based on other units.
                let parsed;
                try {
                    if (unitDef.hasOwnProperty('value')) {
                        if (unitDef && typeof unitDef.value === 'string') {
                            parsed = parser(unitDef.value);
                        }
                        else if (Array.isArray(unitDef.value) && unitDef.value.length === 2) {
                            parsed = parser(unitDef.value[1]);
                            parsed.value = options.type.conv(unitDef.value[0]);
                        }
                        else {
                            throw new TypeError(`Unit definition for '${unitDefKey}' must be an object with a value property where the value is a string or a two-element array.`);
                        }
                    }
                    else {
                        throw new TypeError(`Unit definition for '${unitDefKey}' must be an object with a value property where the value is a string or a two-element array.`);
                    }
                    if (parsed.value == null) {
                        throw new Error(`Parsing value for '${unitDefKey}' resulted in invalid value: ${parsed.value}`);
                    }
                    unitValue = normalize(parsed.unitList, parsed.value, options.type);
                    unitDimension = Object.freeze(parsed.dimension);
                }
                catch (ex) {
                    if (ex instanceof Error && /Unit.*not found/.test(ex.toString())) {
                        unitsSkipped.push(unitDefKey);
                        reasonsSkipped.push(ex.toString());
                        skipThisUnit = true;
                    }
                    else {
                        throw ex;
                    }
                }
            }
            if (!skipThisUnit) {
                // Add this units and its aliases (they are all the same except for the name)
                let unitAndAliases = [unitDefKey];
                if (unitDef.aliases) {
                    unitAndAliases.push(...unitDef.aliases);
                }
                unitAndAliases.forEach(newUnitName => {
                    if (defs.units.hasOwnProperty(newUnitName)) {
                        throw new Error(`Alias '${newUnitName}' would override an existing unit`);
                    }
                    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(newUnitName) && newUnitName !== '') {
                        throw new SyntaxError(`Unit name contains non-alphanumeric characters or begins with a number: '${newUnitName}'`);
                    }
                    const newUnit = {
                        name: newUnitName,
                        value: unitValue,
                        offset: options.type.conv(unitDef.offset ? unitDef.offset : 0),
                        dimension: unitDimension,
                        prefixGroup: (unitDef.prefixGroup && defs.prefixGroups[unitDef.prefixGroup]) || { '': 1 },
                        formatPrefixes: unitDef.formatPrefixes,
                        basePrefix: unitDef.basePrefix
                        // systems: []
                    };
                    if (unitQuantity)
                        newUnit.quantity = unitQuantity;
                    Object.freeze(newUnit);
                    defs.units[newUnitName] = newUnit;
                    unitsAdded++;
                });
            }
        }
        // console.log(`Added ${unitsAdded} units and skipped: ${unitsSkipped.join(', ')}`)
        if (unitsSkipped.length === 0)
            break;
        else if (unitsAdded === 0) {
            throw new Error(`Could not create the following units: ${unitsSkipped.join(', ')}. Reasons follow: ${reasonsSkipped.join(' ')}`);
        }
    }
    // Check to make sure config options has selected a unit system that exists.
    if (options.system !== 'auto') {
        if (!originalDefinitions.systems.hasOwnProperty(options.system)) {
            throw new Error(`Unknown unit system ${options.system}. Available systems are: auto, ${Object.keys(originalDefinitions.systems).join(', ')} `);
        }
    }
    // Replace unit system strings with valueless units
    for (let system of Object.keys(originalDefinitions.systems)) {
        let sys = originalDefinitions.systems[system];
        defs.systems[system] = [];
        for (let i = 0; i < sys.length; i++) {
            // Important! The unit below is not a real unit, but for now it is-close enough
            let unit = parser(sys[i]);
            unit.type = 'Unit';
            Object.freeze(unit);
            defs.systems[system][i] = unit;
        }
    }
    // Final setup for units
    for (let key of Object.keys(defs.units)) {
        const unit = defs.units[key];
        // Check that each commonPrefix is in prefixes
        if (unit.formatPrefixes) {
            for (let i = 0; i < unit.formatPrefixes.length; i++) {
                let s = unit.formatPrefixes[i];
                if (!unit.prefixGroup.hasOwnProperty(s)) {
                    throw new Error(`In unit ${unit.name}, common prefix ${s} was not found among the allowable prefixes`);
                }
            }
        }
    }
    /**
     * Tests whether the given string exists as a known unit. The unit may have a prefix.
     * @param {string} singleUnitString The name of the unit, with optional prefix.
     */
    function exists(singleUnitString) {
        return findUnit(singleUnitString) !== null;
    }
    /**
     * Find a unit from a string
     * @param {string} unitString              A string like 'cm' or 'inch'
     * @returns {Object | null} result  When found, an object with fields unit and
     *                                  prefix is returned. Else, null is returned.
     * @private
     */
    function findUnit(unitString) {
        if (typeof unitString !== 'string') {
            throw new TypeError(`parameter must be a string (${unitString} given)`);
        }
        // First, match units names exactly. For example, a user could define 'mm' as 10^-4 m, which is silly, but then we would want 'mm' to match the user-defined unit.
        if (defs.units.hasOwnProperty(unitString)) {
            const unit = defs.units[unitString];
            return {
                unit,
                prefix: ''
            };
        }
        for (const name of Object.keys(defs.units)) {
            if (unitString.substring(unitString.length - name.length, unitString.length) === name) {
                const unit = defs.units[name];
                const prefixLen = (unitString.length - name.length);
                const prefix = unitString.substring(0, prefixLen);
                if (unit.prefixGroup.hasOwnProperty(prefix)) {
                    // store unit, prefix, and value
                    // console.log(`findUnit(${unitString}): { unit.name: ${unit.name}, prefix: ${prefix} }`)
                    return {
                        unit,
                        prefix
                    };
                }
            }
        }
        return null;
    }
    Object.freeze(defs.prefixGroups);
    Object.freeze(defs.systems);
    Object.freeze(defs.units);
    return { originalDefinitions, defs, exists, findUnit, parser };
}
function isUnitPropsWithQuantity(unit) {
    return typeof unit !== 'string' && unit.quantity !== undefined;
}

const symIsDefaultFun = Symbol('_IS_UNITMATH_DEFAULT_FUNCTION');

/**
 * Create a clone of the this unit factory function, but with the specified options.
 * @param {Object} options Configuration options to set on the new instance.
 * @returns {Function} A new instance of the unit factory function with the specified options.
 */
let _config = function _config(options) {
    options = { ...options };
    // Check to make sure options are valid
    const validFormatPrefixDefault = ['all', 'none'];
    if (options.formatPrefixDefault && !validFormatPrefixDefault.includes(options.formatPrefixDefault)) {
        throw new Error(`Invalid option for formatPrefixDefault: '${options.formatPrefixDefault}'. Valid options are ${validFormatPrefixDefault.join(', ')}`);
    }
    // Check to see if all required options.type functions have been set
    const requiredTypeFns = ['conv', 'clone', 'add', 'sub', 'mul', 'div', 'pow'];
    let allRequiredTypeFnsPresent = true;
    let oneRequiredTypeFnsPresent = false;
    for (const fn of requiredTypeFns) {
        if (options.type?.[fn][symIsDefaultFun]) {
            allRequiredTypeFnsPresent = false;
        }
        else {
            oneRequiredTypeFnsPresent = true;
        }
    }
    if (oneRequiredTypeFnsPresent) {
        if (!allRequiredTypeFnsPresent) {
            throw new Error(`You must supply all required custom type functions: ${requiredTypeFns.join(', ')}`);
        }
        // Check type functions required for _choosePrefix
        if (options.autoPrefix) {
            const prefixRequiredTypeFns = ['lt', 'gt', 'le', 'ge', 'abs'];
            let allPrefixRequiredTypeFnsPresent = true;
            for (const fn of prefixRequiredTypeFns) {
                if (options.type?.[fn][symIsDefaultFun]) {
                    allPrefixRequiredTypeFnsPresent = false;
                }
            }
            if (!allPrefixRequiredTypeFnsPresent) {
                throw new Error(`The following custom type functions are required when prefix is true: ${prefixRequiredTypeFns.join(', ')}`);
            }
        }
    }
    Object.freeze(options);
    function unitmath(value, unitString) {
        let unit = new _Unit(value, unitString);
        Object.freeze(unit);
        return unit;
    }
    /**
     * The actual constructor for Unit. Creates a new Unit with the specified value and unit string.
     * @param {Number|String|*} value The `number` to assign to the unit, or a `string` representing the value and the unit string together.
     * @param {String} unitString The unit string, unless already included in the `value` parameter.
     * @returns {_Unit} The Unit given by the value and unit string.
     */
    class _Unit {
        type = 'Unit';
        value;
        unitList;
        dimension;
        /** whether the prefix and the units are fixed */
        fixed;
        constructor(value, unitString) {
            let parseResult;
            if (typeof value === 'undefined' && typeof unitString === 'undefined') {
                // No arguments
                parseResult = unitStore.parser('');
                parseResult.value = null;
            }
            else if (typeof value === 'string' && typeof unitString === 'undefined') {
                // single string
                parseResult = unitStore.parser(value);
            }
            else if (_isParsedUnit(value)) {
                // value has already been parsed, it just hasn't been constructed into a Unit
                parseResult = value;
            }
            else if (typeof unitString === 'string') {
                // number|string|custom, string
                parseResult = unitStore.parser(unitString);
                parseResult.value = (value == null) ? null : options.type.conv(value);
            }
            else if (typeof unitString === 'undefined') {
                // number|custom
                parseResult = unitStore.parser('');
                parseResult.value = (value == null) ? null : options.type.conv(value);
            }
            else {
                throw new TypeError('To construct a unit, you must supply a single string, two strings, a number and a string, or a custom type and a string.');
            }
            // console.log(require('util').inspect(parseResult, false, 4, true))
            this.dimension = _removeZeroDimensions(parseResult.dimension);
            this.unitList = _combineDuplicateUnits(parseResult.unitList);
            this.value = (parseResult.value === undefined || parseResult.value === null) ? null : denormalize(this.unitList, normalize(parseResult.unitList, parseResult.value, options.type), options.type);
            this.fixed = false;
        }
        // These are public methods available to each instance of a Unit. They each should return a frozen Unit.
        /**
         * create a copy of this unit
         * @memberof Unit
         * @return {Unit} Returns a cloned version of the unit
         */
        clone() {
            let unit = _clone(this);
            Object.freeze(unit);
            return unit;
        }
        add(value, unitString) {
            const other = _convertParamToUnit(value, unitString);
            const unit = _add(this, other);
            Object.freeze(unit);
            return unit;
        }
        sub(value, unitString) {
            const other = _convertParamToUnit(value, unitString);
            const unit = _sub(this, other);
            Object.freeze(unit);
            return unit;
        }
        mul(value, unitString) {
            const other = _convertParamToUnit(value, unitString);
            const unit = _mul(this, other);
            Object.freeze(unit);
            return unit;
        }
        div(value, unitString) {
            const other = _convertParamToUnit(value, unitString);
            const unit = _div(this, other);
            Object.freeze(unit);
            return unit;
        }
        /**
         * Calculate the power of a unit
         * @memberof Unit
         * @param {number|custom} p
         * @returns {Unit}      The result: this^p
         */
        pow(p) {
            const unit = _pow(this, p);
            Object.freeze(unit);
            return unit;
        }
        /**
         * Takes the square root of a unit.
         * @memberof Unit
         * @returns {Unit} The square root of this unit.
         */
        sqrt() {
            const unit = _sqrt(this);
            Object.freeze(unit);
            return unit;
        }
        /**
         * Returns the absolute value of this unit.
         * @memberOf Unit
         * @returns {Unit} The absolute value of this unit.
         */
        abs() {
            const unit = _abs(this);
            Object.freeze(unit);
            return unit;
        }
        /**
         * Returns an array of units whose sum is equal to this unit, where each unit in the array is taken from the supplied string array.
         * @param {string[]} units A string array of units to split this unit into.
         * @returns {Unit[]} An array of units
         */
        split(units) {
            let us = _split(this, units);
            for (let i = 0; i < us.length; i++) {
                Object.freeze(us[i]);
            }
            return us;
        }
        /**
         * Convert the unit to a specific unit.
         * @memberof Unit
         * @param {string | Unit} valuelessUnit   A unit without value. Can have prefix, like "cm".
         * @returns {Unit} Returns a clone of the unit converted to the specified unit.
         */
        to(valuelessUnit) {
            let unit;
            if (valuelessUnit == null) {
                throw new Error('to() requires a unit as a parameter');
            }
            else {
                if (typeof valuelessUnit !== 'string' && valuelessUnit.type !== 'Unit') {
                    throw new TypeError('Parameter must be a Unit or a string.');
                }
                valuelessUnit = _convertParamToUnit(valuelessUnit);
                unit = _to(this, valuelessUnit);
                Object.freeze(unit);
                return unit;
            }
        }
        /**
         * Fix the unit and prevents it from being automatically simplified.
         * @memberof Unit
         * @returns {Unit} Returns a clone of the unit with a fixed prefix and unit.
         */
        // fixUnits(): Unit<T> {
        //   const unit = _clone(this)
        //   unit.fixed = true
        //   Object.freeze(unit)
        //   return unit
        // }
        /**
         * Convert the unit to SI units.
         * @memberof Unit
         * @returns {Unit} Returns a clone of the unit with a fixed prefix and unit.
         */
        toBaseUnits() {
            let unit = _toBaseUnits(this);
            Object.freeze(unit);
            return unit;
        }
        getComplexity() {
            return _getComplexity(this.unitList);
        }
        /**
         * Returns a new unit with the given value.
         * @param {number | string | custom} value
         * @returns A new unit with the given value.
         */
        setValue(value) {
            let unit = _setValue(this, value);
            Object.freeze(unit);
            return unit;
        }
        /**
         * Returns this unit's value.
         * @returns The value of this unit.
         */
        getValue() {
            return this.value;
        }
        /**
         * Returns this unit's normalized value, which is the value it would have if it were to be converted to SI base units (or whatever base units are defined)
         * @returns The notmalized value of the unit.
         */
        getNormalizedValue() {
            return this.value === null ? null : normalize(this.unitList, this.value, options.type);
        }
        /**
         * Returns a new unit with the given normalized value.
         * @param {number | string | custom} normalizedValue
         * @returns A new unit with the given normalized value.
         */
        setNormalizedValue(normalizedValue) {
            let unit = _setValue(this, denormalize(this.unitList, normalizedValue, options.type));
            Object.freeze(unit);
            return unit;
        }
        /**
         * Examines this unit's unitList to determine the most likely system this unit is currently expressed in.
         * @returns {string | null} The system this unit is most likely expressed in, or null if no likely system was recognized.
         */
        getInferredSystem() {
            // If unit system is 'auto', then examine the existing units to infer which system is preferred.
            let systemStr = null;
            let identifiedSystems = {};
            for (let unit of this.unitList) {
                for (let system of Object.keys(unitStore.defs.systems)) {
                    for (let systemUnit of unitStore.defs.systems[system]) {
                        // if (!isBase(systemUnit.unitList)) {
                        //   continue
                        // }
                        let systemUnitString = `${systemUnit.unitList[0].prefix}${systemUnit.unitList[0].unit.name}`;
                        let unitString = `${unit.prefix}${unit.unit.name}`;
                        if (systemUnitString === unitString) {
                            identifiedSystems[system] = (identifiedSystems[system] || 0) + 1;
                        }
                        else if (unit.unit.name === systemUnit.unitList[0].unit.name) {
                            // Half credit if the prefixes don't match
                            identifiedSystems[system] = (identifiedSystems[system] || 0) + 0.5;
                        }
                    }
                }
            }
            let ids = Object.keys(identifiedSystems);
            // Pick the best identified ddsystem
            if (ids.length > 0) {
                let bestId = ids[0];
                let bestScore = identifiedSystems[ids[0]];
                for (let i = 1; i < ids.length; i++) {
                    if (identifiedSystems[ids[i]] > bestScore) {
                        bestId = ids[i];
                        bestScore = identifiedSystems[ids[i]];
                    }
                }
                systemStr = bestId;
            }
            return systemStr;
        }
        /**
         * Choose the best prefix for the Unit.
         * @returns A new unit that contains the "best" prefix, or, if no better prefix was found, returns the same unit unchanged.
         */
        applyBestPrefix(prefixOptions) {
            const extendedOptions = _withDefaults(prefixOptions);
            return _choosePrefix(this, extendedOptions);
        }
        /**
         * Simplify this Unit's unit list and return a new Unit with the simplified list.
         * The returned Unit will contain a list of the "best" units for formatting.
         * @returns {Unit} A simplified unit if possible, or the original unit if it could not be simplified.
         */
        simplify(simplifyOptions) {
            // console.log(this)
            let extendedOptions = _withDefaults(simplifyOptions);
            let systemStr = extendedOptions.system;
            if (systemStr === 'auto') {
                let inferredSystemStr = this.getInferredSystem();
                if (inferredSystemStr) {
                    systemStr = inferredSystemStr;
                }
                // console.log(`Identified the following systems when examining unit ${result.clone().to().toString()}`, ids.map(id => `${id}=${identifiedSystems[id]}`))
            }
            let unitsOfSystem = unitStore.defs.systems[systemStr] || [];
            const proposedUnitList = [];
            let matchingUnit;
            // Several methods to decide on the best unit for simplifying
            // 1. Search for a matching dimension in the given unit system
            // TODO: This doesn't seem to be working?
            let matchingUnitsOfSystem = [];
            for (let unit of unitsOfSystem) {
                if (this.equalsQuantity(unit)) {
                    matchingUnitsOfSystem.push(unit);
                }
            }
            // Default to the first matching unit of the system
            if (matchingUnitsOfSystem.length > 0) {
                matchingUnit = matchingUnitsOfSystem[0];
            }
            // If one of our current units matches one in the system, use that instead
            for (let baseUnit of this.unitList) {
                for (let systemUnit of matchingUnitsOfSystem) {
                    let systemUnitString = `${systemUnit.unitList[0].prefix}${systemUnit.unitList[0].unit.name}`;
                    let unitString = `${baseUnit.prefix}${baseUnit.unit.name}`;
                    if (systemUnit.unitList.length === 1 && systemUnitString === unitString) {
                        matchingUnit = systemUnit;
                        break;
                    }
                }
            }
            // 2. Search for a matching unit in the current units
            if (!matchingUnit) {
                for (let baseUnit of this.unitList) {
                    if (this.equalsQuantity(baseUnit.unit.name)) {
                        matchingUnit = new _Unit(baseUnit.unit.name);
                        break;
                    }
                }
            }
            // 3. Search for a matching dimension in all units
            // if (!matchingUnit) {
            //   for (let baseUnit of Object.keys(unitStore.defs.units)) {
            //     if (this.equalsQuantity(baseUnit)) {
            //       matchingUnit = new _Unit(baseUnit)
            //       break
            //     }
            //   }
            // }
            let ok = true;
            if (matchingUnit) {
                // console.log(matchingUnit)
                proposedUnitList.push(...matchingUnit.unitList);
            }
            else {
                // Did not find a matching unit in the system
                // 4, 5. Build a representation from the base units of all defined units
                for (let dim of Object.keys(this.dimension)) {
                    if (Math.abs(this.dimension[dim] || 0) > 1e-12) {
                        let found = false;
                        // 4. Look for a base unit in the system
                        for (let unit of unitsOfSystem) {
                            if (isBase(unit.unitList) && unit.dimension[dim] === 1) {
                                proposedUnitList.push({
                                    unit: unit.unitList[0].unit,
                                    prefix: unit.unitList[0].prefix,
                                    power: this.dimension[dim]
                                });
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            // 5. Look for a base unit in all units
                            for (const unit of Object.values(unitStore.defs.units)) {
                                if (unit.quantity === dim) {
                                    // TODO: Try to use a matching unit from the specified system, instead of the base unit that was just found
                                    proposedUnitList.push({
                                        unit,
                                        prefix: unit.basePrefix || '',
                                        power: this.dimension[dim]
                                    });
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found)
                            ok = false;
                    }
                }
            }
            let simplifiedUnit = _clone(this);
            if (ok) {
                // Replace this baseUnit list with the proposed list
                simplifiedUnit.unitList = proposedUnitList;
                if (this.value !== null) {
                    simplifiedUnit.value = denormalize(simplifiedUnit.unitList, normalize(this.unitList, this.value, options.type), options.type);
                }
                else {
                    simplifiedUnit.value = null;
                }
            }
            // Always simplify if the options system is not 'auto' and the inferred system is different
            // if (extendedOptions.simplify === 'always' || simplifyDueToDifferentSystem) {
            //   // Must simplify because extendedOptions.simplify is 'always' or the system is different
            //   simp = simp.simplify(extendedOptions.system)
            // } else if (extendedOptions.simplify === 'auto' && !this.fixed && this.value !== null) {
            //   let simp2 = simp.simplify(extendedOptions.system)
            //   // Determine if the simplified unit is simpler
            //   // Is the proposed unit list "simpler" than the existing one?
            //   if (simp2.getComplexity() <= simp.getComplexity() - extendedOptions.simplifyThreshold) {
            //     simp = simp2
            //   }
            // }
            if (extendedOptions.autoPrefix) {
                return _choosePrefix(simplifiedUnit, extendedOptions);
            }
            else {
                Object.freeze(simplifiedUnit);
                return simplifiedUnit;
            }
        }
        /**
         * Returns this unit without a value.
         * @memberof Unit
         * @returns {Unit} A new unit formed by removing the value from this unit.
         */
        getUnits() {
            let result = _clone(this);
            result.value = null;
            Object.freeze(result);
            return result;
        }
        /**
         * Returns whether the unit is compound (like m/s, cm^2) or not (kg, N, hogshead)
         * @memberof Unit
         * @returns True if the unit is compound
         */
        isCompound() {
            return isCompound(this.unitList);
        }
        /**
         * Return whether the given array of unit pieces is a base unit with single dimension such as kg or feet, but not m/s or N or J.
         * @param unitList Array of unit pieces
         * @returns True if the unit is base
         */
        isBase() {
            return isBase(this.unitList);
        }
        /**
         * check if this unit matches the given quantity
         * @memberof Unit
         * @param {QUANTITY | string | undefined} quantity
         */
        // hasQuantity (quantity) {
        //   if (typeof quantity === 'string') {
        //     quantity = unitStore.defs.quantities[quantity]
        //   }
        //   if (!quantity) {
        //     return false
        //   }
        //   // Dimensions must be the same
        //   for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
        //     if (Math.abs((this.dimension[i] || 0) - (quantity[i] || 0)) > 1e-12) {
        //       return false
        //     }
        //   }
        //   return true
        // }
        /**
         * Check if this unit has a dimension equal to another unit
         * @param {Unit} other
         * @return {boolean} true if equal dimensions
         */
        equalsQuantity(other) {
            other = _convertParamToUnit(other);
            // All dimensions must be the same
            for (let dim of Object.keys({ ...this.dimension, ...other.dimension })) {
                if (Math.abs((this.dimension[dim] || 0) - (other.dimension[dim] || 0)) > 1e-12) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Returns a string array of all the quantities that match this unit.
         * @return {string[]} The matching quantities, or an empty array if there are no matching quantities.
         */
        // getQuantities () {
        //   const result = []
        //   for (let d of Object.keys(unitStore.defs.quantities)) {
        //     if (this.hasQuantity(d)) {
        //       result.push(d)
        //     }
        //   }
        //   return result
        // }
        /**
         * Check if this unit equals another unit
         * @memberof Unit
         * @param {Unit} other
         * @return {boolean} true if both units are equal
         */
        equals(other) {
            if (!options.type.conv[symIsDefaultFun] && options.type.eq[symIsDefaultFun]) {
                throw new Error(`When using custom types, equals requires a type.eq function`);
            }
            other = _convertParamToUnit(other);
            if ((this.value === null) !== (other.value === null)) {
                // One has a value and the other does not, so they cannot be equal
                return false;
            }
            let { value1, value2 } = _comparePrepare(this, other, false);
            return this.equalsQuantity(other) && options.type.eq(value1, value2);
        }
        /**
         * Compare this unit to another and return a value indicating whether this unit is less than, greater than, or equal to the other.
         * @param {Unit} other
         * @return {number} -1 if this unit is less than, 1 if this unit is greater than, and 0 if this unit is equal to the other unit.
         */
        compare(other) {
            if (!options.type.conv[symIsDefaultFun] && (options.type.gt[symIsDefaultFun] || options.type.lt[symIsDefaultFun])) {
                throw new Error(`When using custom types, compare requires a type.gt and a type.lt function`);
            }
            other = _convertParamToUnit(other);
            let { value1, value2 } = _comparePrepare(this, other, true);
            if (typeof value1 === 'number' && isNaN(value1)) {
                return 1;
            }
            else if (typeof value2 === 'number' && isNaN(value2)) {
                return -1;
            }
            else if (options.type.lt(value1, value2)) {
                return -1;
            }
            else if (options.type.gt(value1, value2)) {
                return 1;
            }
            else {
                return 0;
            }
        }
        /**
         * Compare this unit to another and return whether this unit is less than the other.
         * @param {Unit} other
         * @return {boolean} true if this unit is less than the other.
         */
        lessThan(other) {
            if (!options.type.conv[symIsDefaultFun] && options.type.lt[symIsDefaultFun]) {
                throw new Error(`When using custom types, lessThan requires a type.lt function`);
            }
            other = _convertParamToUnit(other);
            let { value1, value2 } = _comparePrepare(this, other, true);
            return options.type.lt(value1, value2);
        }
        /**
         * Compare this unit to another and return whether this unit is less than or equal to the other.
         * @param {Unit} other
         * @return {boolean} true if this unit is less than or equal the other.
         */
        lessThanOrEqual(other) {
            if (!options.type.conv[symIsDefaultFun] && options.type.le[symIsDefaultFun]) {
                throw new Error(`When using custom types, lessThanOrEqual requires a type.le function`);
            }
            other = _convertParamToUnit(other);
            let { value1, value2 } = _comparePrepare(this, other, true);
            return options.type.le(value1, value2);
        }
        /**
         * Compare this unit to another and return whether this unit is greater than the other.
         * @param {Unit} other
         * @return {boolean} true if this unit is greater than the other.
         */
        greaterThan(other) {
            if (!options.type.conv[symIsDefaultFun] && options.type.gt[symIsDefaultFun]) {
                throw new Error(`When using custom types, greaterThan requires a type.gt function`);
            }
            other = _convertParamToUnit(other);
            let { value1, value2 } = _comparePrepare(this, other, true);
            return options.type.gt(value1, value2);
        }
        /**
         * Compare this unit to another and return whether this unit is greater than or equal to the other.
         * @param {Unit} other
         * @return {boolean} true if this unit is greater than or equal the other.
         */
        greaterThanOrEqual(other) {
            if (!options.type.conv[symIsDefaultFun] && options.type.ge[symIsDefaultFun]) {
                throw new Error(`When using custom types, greaterThanOrEqual requires a type.ge function`);
            }
            other = _convertParamToUnit(other);
            let { value1, value2 } = _comparePrepare(this, other, true);
            return options.type.ge(value1, value2);
        }
        /**
         * Returns a raw string representation of this Unit, without simplifying or rounding. Could be useful for debugging.
         */
        // valueOf() {
        //   return this.toString({
        //     precision: 0, // 0 means do not round
        //     simplify: 'never',
        //     prefix: 'never',
        //     parentheses: false
        //   })
        // }
        /**
         * Get a string representation of the Unit, with optional formatting options.
         * @memberof Unit
         * @param formatOptions Formatting options.
         * @return The formatted string.
         */
        toString(formatOptions) {
            let simp = this.clone();
            // A bit of clarification:
            // options is the original options
            // userOpts is a user-supplied argument
            // extendedOptions is the original options, extended with opts if opts is an object
            let extendedOptions = _withDefaults(formatOptions);
            let str = '';
            if (typeof simp.value === 'number' && extendedOptions.formatter[symIsDefaultFun] && extendedOptions.precision > 0) {
                // Use default formatter
                str += +simp.value.toPrecision(extendedOptions.precision); // The extra + at the beginning removes trailing zeroes
            }
            else if (simp.value !== null) {
                // Use custom format method (which defaults to the toString(opts) method)
                str += extendedOptions.formatter(simp.value);
            }
            const unitStr = _formatUnits(simp, extendedOptions);
            if (unitStr.length > 0 && str.length > 0) {
                str += ' ';
            }
            str += unitStr;
            return str;
        }
    }
    // END OF UNIT CLASS
    // These private functions do not freeze the units before returning, so that we can do mutations on the units before returning the final, frozen unit to the user.
    // TODO: Possible source of unhelpful error message and user confusion, if user supplies a type that is not a unit, not a string, and not a number, to a public API method that uses this function to convert input to a unit. Since there is no way to know whether a user might be using a custom type, or just sent the wrong type.
    /**
     * Converts the supplied parameter to a frozen unit, or, if a unit was supplied, returns it unchanged.
     * @param {any} param
     * @returns {Unit} The frozen unit that was converted from the input parameter, or the original unit.
     */
    // function _convertParamToUnit<V extends T | n>(other: Unit | string | n): Unit
    // function _convertParamToUnit<V extends T|n>(value: V, unit: string): Unit
    // function _convertParamToUnit<V extends T|n> (a?: any, b?: any): Unit {
    function _isUnit(a) {
        return a?.type === 'Unit' && a.clone;
    }
    function _isParsedUnit(a) {
        return a?.type === 'Unit' && !a.clone;
    }
    function _convertParamToUnit(otherOrValue, unit) {
        if (_isUnit(otherOrValue)) {
            return otherOrValue;
        }
        else if (_isParsedUnit(otherOrValue)) {
            let u = new _Unit(otherOrValue);
            return u;
        }
        else if (typeof otherOrValue === 'string') {
            return unitmath(otherOrValue);
        }
        else {
            return unitmath(otherOrValue, unit);
        }
    }
    function _getComplexity(unitList) {
        // Number of total units, each adds one symbol
        let comp = unitList.length;
        // Number of units in denominator and numerator
        let unitsDen = unitList.filter(a => a.power < 1e-14);
        let unitsNum = unitList.filter(a => a.power > 1e-14);
        // If there are no units in the numerator, then any units in the denominator will need a ^-1
        // Number of units in the numerator containing powers !== 1, i.e. kg^2, adds two symbols
        comp += unitsNum.filter(a => Math.abs(a.power - 1) > 1e-14).length * 2;
        // If there is at least one unit in the numerator and denominator, we will invert the denominator units' powers
        let denPowerInvert = unitsDen.length > 0 && unitsNum.length > 0 ? -1 : 1;
        // Number of units in the denominator containing inverted powers !== 1
        comp += unitsDen.filter(a => a.power < 0 && Math.abs(a.power * denPowerInvert - 1) > 1e-14).length * 2;
        // At least one unit in numerator and denominator, adds one symbol: '/'
        if (unitsDen.length > 0 && unitsNum.length > 0) {
            comp += 1;
        }
        return comp;
    }
    /**
     * Private function _clone
     * @param {Unit} unit
     */
    function _clone(unit) {
        const result = new _Unit();
        result.value = unit.value === null ? null : options.type.clone(unit.value);
        result.dimension = { ...unit.dimension };
        // if (unit.fixed) {
        //   result.fixed = unit.fixed
        // }
        result.unitList = [];
        for (let i = 0; i < unit.unitList.length; i++) {
            result.unitList[i] = {};
            result.unitList[i] = { ...unit.unitList[i] };
        }
        return result;
    }
    /**
     * Private function _combineDuplicateUnits returns a new array of unit pieces where the duplicate units have been combined together. Units with zero power are also removed.
     * @param {AtomicUnit[]} unitList Array of atomic units
     *
     * @returns {AtomicUnit[]} A new array of unit pieces where the duplicates have been combined together and units with zero power have been removed.
     */
    function _combineDuplicateUnits(unitList) {
        // Two-level deep copy of units
        let combinedUnitList = unitList.map(u => Object.assign({}, u));
        if (combinedUnitList.length >= 2) {
            // Combine duplicate units
            let foundUnits = {};
            for (let i = 0; i < combinedUnitList.length; i++) {
                if (foundUnits.hasOwnProperty(combinedUnitList[i].unit.name)) {
                    // Combine this unit with the other
                    let firstUnit = foundUnits[combinedUnitList[i].unit.name];
                    // console.log(`Found duplicate unit: ${result[i].unit.name}`)
                    // console.log(firstUnit.power)
                    // console.log(result[i].power)
                    firstUnit.power += combinedUnitList[i].power;
                    combinedUnitList.splice(i, 1);
                    i--;
                }
                else {
                    foundUnits[combinedUnitList[i].unit.name] = combinedUnitList[i];
                }
            }
            // Remove units that have zero power
            for (let i = 0; i < combinedUnitList.length; i++) {
                if (Math.abs(combinedUnitList[i].power) < 1e-15) {
                    combinedUnitList.splice(i, 1);
                    i--;
                }
            }
        }
        return combinedUnitList;
    }
    /**
     * Private function _removeZeroDimensions removes dimensions that have zero exponent
     * @param {object} dimensions The dimensions to process
     * @returns {object} A new object with the zero dimensions removed
     */
    function _removeZeroDimensions(dimensions) {
        let result = { ...dimensions };
        for (let dim of Object.keys(result)) {
            if (Math.abs(result[dim]) < 1e-15) {
                delete result[dim];
            }
        }
        return result;
    }
    function _comparePrepare(unit1, unit2, requireMatchingDimensions) {
        if (requireMatchingDimensions && !unit1.equalsQuantity(unit2)) {
            throw new Error(`Cannot compare units ${unit1} and ${unit2}; dimensions do not match`);
        }
        let value1, value2;
        if (unit1.value === null && unit2.value === null) {
            // If both units are valueless, get the normalized value of 1 to compare only the unit lists
            value1 = normalize(unit1.unitList, options.type.conv(1), options.type);
            value2 = normalize(unit2.unitList, options.type.conv(1), options.type);
        }
        else if (unit1.value !== null && unit2.value !== null) {
            // Both units have values
            value1 = normalize(unit1.unitList, unit1.value, options.type);
            value2 = normalize(unit2.unitList, unit2.value, options.type);
        }
        else {
            // One has a value and one does not. Not allowed.
            throw new Error(`Cannot compare units ${unit1} and ${unit2}; one has a value and the other does not`);
        }
        return { value1, value2 };
    }
    /**
     * Private function _add
     * @param {Unit} unit1 The first unit
     * @param {Unit} unit2 The second unit
     * @returns {Unit} The sum of the two units
     */
    function _add(unit1, unit2) {
        if (unit1.value === null || unit1.value === undefined || unit2.value === null || unit2.value === undefined) {
            throw new Error(`Cannot add ${unit1.toString()} and ${unit2.toString()}: both units must have values`);
        }
        if (!unit1.equalsQuantity(unit2)) {
            throw new Error(`Cannot add ${unit1.toString()} and ${unit2.toString()}: dimensions do not match`);
        }
        const result = _clone(unit1);
        result.value = denormalize(unit1.unitList, options.type.add(normalize(unit1.unitList, unit1.value, options.type), normalize(unit2.unitList, unit2.value, options.type)), options.type);
        return result;
    }
    /**
     * Private function _sub
     * @param {Unit} unit1 The first unit
     * @param {Unit} unit2 The second unit
     * @returns {Unit} The difference of the two units
     */
    function _sub(unit1, unit2) {
        if (unit1.value === null || unit1.value === undefined || unit2.value === null || unit2.value === undefined) {
            throw new Error(`Cannot subtract ${unit1.toString()} and ${unit2.toString()}: both units must have values`);
        }
        if (!unit1.equalsQuantity(unit2)) {
            throw new Error(`Cannot subtract ${unit1.toString()} and ${unit2.toString()}: dimensions do not match`);
        }
        const result = _clone(unit1);
        result.value = denormalize(unit1.unitList, options.type.sub(normalize(unit1.unitList, unit1.value, options.type), normalize(unit2.unitList, unit2.value, options.type)), options.type);
        return result;
    }
    /**
     * Private function _mul
     * @param {Unit} unit1 The first unit
     * @param {Unit} unit2 The second unit
     * @returns {Unit} The product of the two units
     */
    function _mul(unit1, unit2) {
        const result = _clone(unit1);
        for (let dim of Object.keys({ ...unit1.dimension, ...unit2.dimension })) {
            result.dimension[dim] = (unit1.dimension[dim] || 0) + (unit2.dimension[dim] || 0);
            if (Math.abs(result.dimension[dim]) < 1e-15)
                delete result.dimension[dim];
        }
        // Append other's units list onto result
        for (let i = 0; i < unit2.unitList.length; i++) {
            // Make a deep copy
            const inverted = { ...unit2.unitList[i] };
            result.unitList.push(inverted);
        }
        result.unitList = _combineDuplicateUnits(result.unitList);
        result.dimension = _removeZeroDimensions(result.dimension);
        // If at least one operand has a value, then the result should also have a value
        if (unit1.value !== null || unit2.value !== null) {
            let one = options.type.conv(1);
            const val1 = unit1.value === null ? normalize(unit1.unitList, one, options.type) : normalize(unit1.unitList, unit1.value, options.type);
            const val2 = unit2.value === null ? normalize(unit2.unitList, one, options.type) : normalize(unit2.unitList, unit2.value, options.type);
            result.value = denormalize(result.unitList, options.type.mul(val1, val2), options.type);
        }
        else {
            result.value = null;
        }
        return result;
    }
    /**
     * Private function _div
     * @param {Unit} unit1 The first unit
     * @param {Unit} unit2 The second unit
     */
    function _div(unit1, unit2) {
        const result = _clone(unit1);
        for (let dim of Object.keys({ ...unit1.dimension, ...unit2.dimension })) {
            result.dimension[dim] = (unit1.dimension[dim] || 0) - (unit2.dimension[dim] || 0);
            if (Math.abs(result.dimension[dim]) < 1e-15)
                delete result.dimension[dim];
        }
        // Invert and append other's units list onto result
        for (let i = 0; i < unit2.unitList.length; i++) {
            // Make a deep copy
            const inverted = { ...unit2.unitList[i] };
            inverted.power = -inverted.power;
            result.unitList.push(inverted);
        }
        result.unitList = _combineDuplicateUnits(result.unitList);
        result.dimension = _removeZeroDimensions(result.dimension);
        // If at least one operand has a value, the result should have a value
        if (unit1.value !== null || unit2.value !== null) {
            let one = options.type.conv(1);
            const val1 = unit1.value === null ? normalize(unit1.unitList, one, options.type) : normalize(unit1.unitList, unit1.value, options.type);
            const val2 = unit2.value === null ? normalize(unit2.unitList, one, options.type) : normalize(unit2.unitList, unit2.value, options.type);
            result.value = denormalize(result.unitList, options.type.div(val1, val2), options.type);
        }
        else {
            result.value = null;
        }
        return result;
    }
    /**
     * Private function _pow
     * @param {Unit} unit The unit
     * @param {number|custom} p The exponent
     */
    function _pow(unit, p) {
        // TODO: combineDuplicateUnits
        const result = _clone(unit);
        for (let dim of Object.keys(result.dimension)) {
            result.dimension[dim] = unit.dimension[dim] * p;
        }
        // Adjust the power of each unit in the list
        for (let i = 0; i < result.unitList.length; i++) {
            result.unitList[i].power = result.unitList[i].power * p;
        }
        if (result.value !== null) {
            result.value = options.type.pow(result.value, options.type.conv(p));
        }
        else {
            result.value = null;
        }
        return result;
    }
    function _sqrt(unit) {
        return _pow(unit, 0.5);
    }
    /**
       * Returns an array of units whose sum is equal to this unit, where each unit in the array is taken from the supplied string array.
       * @param {string[]} units A string array of units to split this unit into.
       * @returns {Unit[]} An array of units
       */
    function _split(unit, units) {
        if (!options.type.conv[symIsDefaultFun] && (options.type.round[symIsDefaultFun] || options.type.trunc[symIsDefaultFun])) {
            throw new Error(`When using custom types, split requires a type.round and a type.trunc function`);
        }
        // We use the non-null assertion operator (!) a few times below, because we're pretty sure unit.value is not null
        if (unit.value === null) {
            throw new Error(`Cannot split ${unit.toString()}: unit has no value`);
        }
        let x = _clone(unit);
        const result = [];
        for (let i = 0; i < units.length; i++) {
            // Convert x to the requested unit
            x = _to(x, _convertParamToUnit(units[i]));
            if (i === units.length - 1)
                break;
            // Check to see if x.value is nearly equal to an integer,
            // since trunc can incorrectly round down if there is round-off error
            const xRounded = options.type.round(x.value);
            let xFixed;
            const isNearlyEqual = options.type.eq(xRounded, x.value);
            if (isNearlyEqual) {
                xFixed = xRounded;
            }
            else {
                xFixed = options.type.trunc(x.value);
            }
            const y = new _Unit(xFixed, units[i].toString());
            result.push(y);
            x = _sub(x, y);
        }
        // This little bit fixes a bug where the remainder should be 0 but is a little bit off.
        // But instead of comparing x, the remainder, with zero--we will compare the sum of
        // all the parts so far with the original value. If they are nearly equal,
        // we set the remainder to 0.
        let testSum = options.type.conv(0);
        for (let i = 0; i < result.length; i++) {
            testSum = options.type.add(testSum, normalize(result[i].unitList, result[i].value, options.type));
        }
        if (options.type.eq(testSum, normalize(unit.unitList, unit.value, options.type))) {
            x.value = options.type.conv(0);
        }
        result.push(x);
        return result;
    }
    function _abs(unit) {
        const result = _clone(unit);
        if (result.value !== null) {
            result.value = denormalize(result.unitList, options.type.abs(normalize(result.unitList, result.value, options.type)), options.type);
        }
        return result;
    }
    /**
     * Private function _to
     * @param {Unit} unit The unit to convert.
     * @param {Unit} valuelessUnit The valueless unit to convert it to.
     */
    function _to(unit, valuelessUnit) {
        let result;
        const value = unit.value === null ? options.type.conv(1) : unit.value;
        if (!unit.equalsQuantity(valuelessUnit)) {
            throw new TypeError(`Cannot convert ${unit.toString()} to ${valuelessUnit}: dimensions do not match`);
        }
        if (valuelessUnit.value !== null) {
            throw new Error(`Cannot convert ${unit.toString()}: target unit must be valueless`);
        }
        result = _clone(valuelessUnit);
        result.value = denormalize(result.unitList, normalize(unit.unitList, value, options.type), options.type);
        return result;
    }
    /**
     * Private function _choosePrefix
     * @param {Unit} unit The unit to choose the best prefix for.
     * @returns {Unit} A new unit that contains the "best" prefix, or, if no better prefix was found, returns the same unit unchanged.
     */
    function _choosePrefix(unit, prefixOptions) {
        let result = _clone(unit);
        let piece = result.unitList[0]; // TODO: Someday this might choose the most "dominant" unit, or something, to prefix, rather than the first unit
        if (unit.unitList.length !== 1) {
            // TODO: Support for compound units
            return unit;
        }
        if (unit.value === null) {
            // Unit does not have a value
            return unit;
        }
        if (Math.abs(piece.power - Math.round(piece.power)) >= 1e-14) {
            // TODO: Support for non-integer powers
            return unit;
        }
        if (Math.abs(piece.power) < 1e-14) {
            // Unit has power of 0, so prefix will have no effect
            return unit;
        }
        if (options.type.lt(options.type.abs(unit.value), options.type.conv(1e-50))) {
            // Unit is too small for the prefix to matter
            return unit;
        }
        if (options.type.le(options.type.abs(unit.value), prefixOptions.prefixMax) && options.type.ge(options.type.abs(unit.value), prefixOptions.prefixMin)) {
            // Unit's value is already acceptable
            return unit;
        }
        function calcValue(prefix) {
            return options.type.div(unit.value, // We checked for null above
            options.type.pow(options.type.div(options.type.conv(piece.unit.prefixGroup[prefix]), options.type.conv(piece.unit.prefixGroup[piece.prefix])), options.type.conv(piece.power)));
        }
        // TODO: Test this for negative numbers. Are we doing type.abs everywhere we need to be?
        let unitValue = options.type.abs(unit.value);
        // console.log(`unitValue = ${unitValue}`)
        function calcScore(prefix) {
            let thisValue = options.type.abs(calcValue(prefix));
            // console.log(`Calculating score for ${prefix}; thisValue = ${thisValue}`)
            if (options.type.lt(thisValue, prefixOptions.prefixMin)) {
                // prefix makes the value too small
                // console.log(`Prefix makes thisValue too small`)
                return options.type.div(options.type.conv(prefixOptions.prefixMin), thisValue);
            }
            if (options.type.gt(thisValue, prefixOptions.prefixMax)) {
                // prefix makes the value too large
                // console.log(`Prefix makes thisValue too large`)
                return options.type.div(thisValue, options.type.conv(prefixOptions.prefixMax));
            }
            // The prefix is in range, but return a score that says how close it is to the original value.
            if (options.type.le(thisValue, unitValue)) {
                // console.log(`thisValue <= unitValue, score = ${-thisValue / unitValue} (${1-thisValue/unitValue})`)
                // return options.type.mul(options.type.div(thisValue, unitValue), options.type.conv(-1, unitValue))
                return options.type.sub(options.type.conv(1), options.type.div(thisValue, unitValue));
            }
            else {
                // console.log(`thisValue > unitValue, score = ${-unitValue / thisValue} (${1-unitValue/thisValue})`)
                // return options.type.mul(options.type.div(unitValue, thisValue), options.type.conv(-1, unitValue))
                return options.type.sub(options.type.conv(1), options.type.div(unitValue, thisValue));
            }
        }
        // We should be able to do this in one pass. Start on one end of the array, as determined by searchDirection, and search until 1) the prefix results in a value within the acceptable range, 2) or the values start getting worse.
        // Find the index to begin searching. This might be tricky because the unit could have a prefix that is *not* common.
        let bestPrefix = piece.prefix;
        let bestScore = calcScore(bestPrefix);
        // console.log(`The score was ${bestScore}`)
        let prefixes = piece.unit.formatPrefixes ?? (prefixOptions.formatPrefixDefault === 'all' ? Object.keys(piece.unit.prefixGroup) : undefined);
        if (!prefixes) {
            // Unit does not have any prefixes for formatting
            return unit;
        }
        for (let i = 0; i < prefixes.length; i++) {
            // What would the value of the unit be if this prefix were applied?
            let thisPrefix = prefixes[i];
            let thisScore = calcScore(thisPrefix);
            // console.log(`The score was ${thisScore}`)
            if (options.type.lt(thisScore, bestScore)) {
                bestScore = thisScore;
                bestPrefix = thisPrefix;
            }
        }
        piece.prefix = bestPrefix;
        result.value = denormalize(result.unitList, normalize(unit.unitList, unit.value, options.type), options.type);
        Object.freeze(result);
        return result;
    }
    /**
     * Private function _toBaseUnits
     * @param {Unit} unit The unit to convert to SI.
     */
    function _toBaseUnits(unit) {
        const result = _clone(unit);
        const proposedUnitList = [];
        // Multiple units or units with powers are formatted like this:
        // 5 (kg m^2) / (s^3 mol)
        // Build an representation from the base units of the SI unit system
        for (let dim of Object.keys(result.dimension)) {
            if (Math.abs(result.dimension[dim] || 0) > 1e-12) {
                for (let unit of Object.keys(unitStore.defs.units)) {
                    // console.log(unitStore.defs.units[unit])
                    if (unitStore.defs.units[unit].quantity === dim) {
                        proposedUnitList.push({
                            unit: unitStore.defs.units[unit],
                            prefix: unitStore.defs.units[unit].basePrefix || '',
                            power: result.dimension[dim]
                        });
                        break;
                    }
                }
            }
        }
        // for (let i = 0; i < unitStore.defs.baseQuantities.length; i++) {
        //   const baseDim = unitStore.defs.baseQuantities[i]
        //   if (Math.abs(result.dimension[i] || 0) > 1e-12) {
        //     if (unitStore.defs.unitSystems['si'].hasOwnProperty(baseDim)) {
        //       proposedUnitList.push({
        //         unit: unitStore.defs.unitSystems['si'][baseDim].unit,
        //         prefix: unitStore.defs.unitSystems['si'][baseDim].prefix,
        //         power: result.dimension[i]
        //       })
        //     } else {
        //       throw new Error(`Cannot express unit '${unit.toString()}' in SI units. System 'si' does not contain a unit for base quantity '${baseDim}'`)
        //     }
        //   }
        // }
        // Replace this unit list with the proposed list
        result.unitList = proposedUnitList;
        if (unit.value !== null) {
            result.value = denormalize(result.unitList, normalize(unit.unitList, unit.value, options.type), options.type);
        }
        // result.fixed = true // Don't auto simplify
        return result;
    }
    /** Private function _setValue
     * @param {Unit} unit The unit to set the value of
     * @param {string | number | custom} value The value to set
     * @returns {Unit} A new unit with the given value
     */
    function _setValue(unit, value) {
        let result = _clone(unit);
        if (typeof value === 'undefined' || value === null) {
            result.value = null;
        }
        else {
            result.value = options.type.conv(value);
        }
        return result;
    }
    /**
     * Get a string representation of the units of this Unit, without the value.
     * @return {string}
     */
    function _formatUnits(unit, opts) {
        let strNum = '';
        let strDen = '';
        let nNum = 0;
        let nDen = 0;
        for (let i = 0; i < unit.unitList.length; i++) {
            if (unit.unitList[i].power > 0) {
                nNum++;
                strNum += ' ' + unit.unitList[i].prefix + unit.unitList[i].unit.name;
                if (Math.abs(unit.unitList[i].power - 1.0) > 1e-15) {
                    strNum += '^' + unit.unitList[i].power;
                }
            }
            else if (unit.unitList[i].power < 0) {
                nDen++;
            }
        }
        if (nDen > 0) {
            for (let i = 0; i < unit.unitList.length; i++) {
                if (unit.unitList[i].power < 0) {
                    if (nNum > 0) {
                        strDen += ' ' + unit.unitList[i].prefix + unit.unitList[i].unit.name;
                        if (Math.abs(unit.unitList[i].power + 1.0) > 1e-15) {
                            strDen += '^' + (-unit.unitList[i].power);
                        }
                    }
                    else {
                        strDen += ' ' + unit.unitList[i].prefix + unit.unitList[i].unit.name;
                        strDen += '^' + (unit.unitList[i].power);
                    }
                }
            }
        }
        // Remove leading " "
        strNum = strNum.substr(1);
        strDen = strDen.substr(1);
        if (opts.parentheses) {
            // Add parans for better copy/paste back into evaluate, for example, or for better pretty print formatting
            if (nNum > 1 && nDen > 0) {
                strNum = '(' + strNum + ')';
            }
            if (nDen > 1 && nNum > 0) {
                strDen = '(' + strDen + ')';
            }
        }
        let str = strNum;
        if (nNum > 0 && nDen > 0) {
            str += ' / ';
        }
        str += strDen;
        return str;
    }
    /**
     * Extends the newOption argument with the default options set on the UnitMath namespace.
     */
    function _withDefaults(newOptions) {
        let extendedOptions = { ...options };
        if (typeof newOptions === 'object') {
            extendedOptions = Object.assign(extendedOptions, newOptions);
        }
        return extendedOptions;
    }
    let unitStore = createUnitStore(options);
    // Public functions available on the unitmath namespace
    /**
     * Create a clone of the this unit factory function, but with the specified options.
     * @param {Object} options Configuration options, in addition to those existing, to set on the new instance.
     * @returns {Function} A new instance of the unit factory function with the specified options
     */
    function configFunction(newOptions) {
        // Shallow copy existing config
        let retOptions = Object.assign({}, options, newOptions);
        // Shallow copy unit and type
        retOptions.definitions = Object.assign({}, options.definitions, newOptions.definitions);
        retOptions.type = Object.assign({}, options.type, newOptions.type);
        return _config(retOptions);
    }
    unitmath.config = configFunction;
    /**
     * Get the current configuration options for this unit factory function.
     * @returns The current configuration options
     */
    unitmath.getConfig = function getConfig() {
        return options;
    };
    unitmath.definitions = function definitions() {
        return unitStore.originalDefinitions;
    };
    /* Alternate API syntax */
    /**
     * Adds two units. Both units' dimensions must be equal.
     * @param {Unit|string|number} a The first unit to add. If a string or number is supplied, it will be converted to a unit.
     * @param {Unit|string|number} b The second unit to add. If a string or number is supplied, it will be converted to a unit.
     * @returns {Unit} The result of the addition a + b.
     */
    unitmath.add = function add(a, b) {
        return _convertParamToUnit(a).add(b);
    };
    /**
     * Subtracts two units. Both units' dimensions must be equal.
     * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
     * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
     * @returns {Unit} The result of the subtract a - b.
     */
    unitmath.sub = function sub(a, b) {
        return _convertParamToUnit(a).sub(b);
    };
    /**
     * Multiplies two units. Both units' dimensions must be equal.
     * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
     * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
     * @returns {Unit} The result a * b.
     */
    unitmath.mul = function mul(a, b) {
        return _convertParamToUnit(a).mul(b);
    };
    /**
     * Divides two units. Both units' dimensions must be equal.
     * @param {Unit|string|number} a The first unit. If a string or number is supplied, it will be converted to a unit.
     * @param {Unit|string|number} b The second unit. If a string or number is supplied, it will be converted to a unit.
     * @returns {Unit} The result a / b.
     */
    unitmath.div = function div(a, b) {
        return _convertParamToUnit(a).div(b);
    };
    /**
     * Raises a unit to a power.
     * @param {Unit|string|number} a The unit.
     * @param {number} b The power.
     * @returns {Unit} The result of raising the unit a to the power b.
     */
    unitmath.pow = function pow(a, b) {
        return _convertParamToUnit(a).pow(b);
    };
    /**
    * Takes the square root of a unit.
    * @param {Unit|string|number} a The unit.
    * @returns {Unit} The square root of the unit a.
    */
    unitmath.sqrt = function sqrt(a) {
        return _convertParamToUnit(a).sqrt();
    };
    /**
     * Returns the absolute value of a unit.
     * @param {Unit|string|number} a The unit.
     * @returns {Unit} The absolute value of the unit a.
     */
    unitmath.abs = function abs(a) {
        return _convertParamToUnit(a).abs();
    };
    /**
    * Convert a unit.
    * @param {Unit|string|number} unit The unit to convert.
    * @param {Unit|string} valuelessUnit The valueless unit to convert the first unit to.
    * @returns {Unit} The result of converting the unit.
    */
    unitmath.to = function to(unit, valuelessUnit) {
        return _convertParamToUnit(unit).to(valuelessUnit);
    };
    /**
    * Convert a unit to base units.
    * @param {Unit|string|number} unit The unit to convert.
    * @returns {Unit} The result of converting the unit to base units.
    */
    unitmath.toBaseUnits = function toBaseUnits(unit) {
        return _convertParamToUnit(unit).toBaseUnits();
    };
    unitmath.exists = unitStore.exists;
    // TODO: This is used only for testing, could there be another way rather than exposing it on the public namespace?
    unitmath._unitStore = unitStore;
    Object.freeze(unitmath);
    return unitmath;
};
// Define default arithmetic functions
let defaults = {
    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    mul: (a, b) => a * b,
    div: (a, b) => a / b,
    pow: (a, b) => Math.pow(a, b),
    abs: (a) => Math.abs(a),
    eq: (a, b) => (a === b) || Math.abs(a - b) / Math.abs(a + b) < 1e-15,
    lt: (a, b) => a < b,
    gt: (a, b) => a > b,
    le: (a, b) => a <= b,
    ge: (a, b) => a >= b,
    round: (a) => Math.round(a),
    trunc: (a) => Math.trunc(a),
    conv: (a) => typeof a === 'string' ? parseFloat(a) : a,
    clone: (a) => a
};
// These are mostly to help warn the user if they forgot to override one or more of the default functions
for (const key of Object.keys(defaults)) {
    defaults[key][symIsDefaultFun] = true;
}
const defaultFormatter = (a) => a.toString();
defaultFormatter[symIsDefaultFun] = true;
const defaultOptions = {
    parentheses: false,
    precision: 15,
    autoPrefix: true,
    prefixMin: 0.1,
    prefixMax: 1000,
    formatPrefixDefault: 'none',
    // simplifyThreshold: 2,
    system: 'auto',
    formatter: defaultFormatter,
    // subsystem: 'auto',
    definitions: {
        skipBuiltIns: false,
        units: {},
        prefixGroups: {},
        systems: {}
    },
    type: defaults
};
const firstUnit = _config(defaultOptions);

export { firstUnit as default };
