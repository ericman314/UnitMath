/**
 * Creates a new unit store.
 * @param {Object} options
 */
export default function createUnitStore (options) {
  const PREFIXES = {
    NONE: {
      '': { name: '', value: 1, scientific: true }
    },
    SHORT: {
      '': { name: '', value: 1, scientific: true },

      'da': { name: 'da', value: 1e1, scientific: false },
      'h': { name: 'h', value: 1e2, scientific: false },
      'k': { name: 'k', value: 1e3, scientific: true },
      'M': { name: 'M', value: 1e6, scientific: true },
      'G': { name: 'G', value: 1e9, scientific: true },
      'T': { name: 'T', value: 1e12, scientific: true },
      'P': { name: 'P', value: 1e15, scientific: true },
      'E': { name: 'E', value: 1e18, scientific: true },
      'Z': { name: 'Z', value: 1e21, scientific: true },
      'Y': { name: 'Y', value: 1e24, scientific: true },

      'd': { name: 'd', value: 1e-1, scientific: false },
      'c': { name: 'c', value: 1e-2, scientific: false },
      'm': { name: 'm', value: 1e-3, scientific: true },
      'u': { name: 'u', value: 1e-6, scientific: true },
      'n': { name: 'n', value: 1e-9, scientific: true },
      'p': { name: 'p', value: 1e-12, scientific: true },
      'f': { name: 'f', value: 1e-15, scientific: true },
      'a': { name: 'a', value: 1e-18, scientific: true },
      'z': { name: 'z', value: 1e-21, scientific: true },
      'y': { name: 'y', value: 1e-24, scientific: true }
    },
    LONG: {
      '': { name: '', value: 1, scientific: true },

      'deca': { name: 'deca', value: 1e1, scientific: false },
      'hecto': { name: 'hecto', value: 1e2, scientific: false },
      'kilo': { name: 'kilo', value: 1e3, scientific: true },
      'mega': { name: 'mega', value: 1e6, scientific: true },
      'giga': { name: 'giga', value: 1e9, scientific: true },
      'tera': { name: 'tera', value: 1e12, scientific: true },
      'peta': { name: 'peta', value: 1e15, scientific: true },
      'exa': { name: 'exa', value: 1e18, scientific: true },
      'zetta': { name: 'zetta', value: 1e21, scientific: true },
      'yotta': { name: 'yotta', value: 1e24, scientific: true },

      'deci': { name: 'deci', value: 1e-1, scientific: false },
      'centi': { name: 'centi', value: 1e-2, scientific: false },
      'milli': { name: 'milli', value: 1e-3, scientific: true },
      'micro': { name: 'micro', value: 1e-6, scientific: true },
      'nano': { name: 'nano', value: 1e-9, scientific: true },
      'pico': { name: 'pico', value: 1e-12, scientific: true },
      'femto': { name: 'femto', value: 1e-15, scientific: true },
      'atto': { name: 'atto', value: 1e-18, scientific: true },
      'zepto': { name: 'zepto', value: 1e-21, scientific: true },
      'yocto': { name: 'yocto', value: 1e-24, scientific: true }
    },
    SQUARED: {
      '': { name: '', value: 1, scientific: true },

      'da': { name: 'da', value: 1e2, scientific: false },
      'h': { name: 'h', value: 1e4, scientific: false },
      'k': { name: 'k', value: 1e6, scientific: true },
      'M': { name: 'M', value: 1e12, scientific: true },
      'G': { name: 'G', value: 1e18, scientific: true },
      'T': { name: 'T', value: 1e24, scientific: true },
      'P': { name: 'P', value: 1e30, scientific: true },
      'E': { name: 'E', value: 1e36, scientific: true },
      'Z': { name: 'Z', value: 1e42, scientific: true },
      'Y': { name: 'Y', value: 1e48, scientific: true },

      'd': { name: 'd', value: 1e-2, scientific: false },
      'c': { name: 'c', value: 1e-4, scientific: false },
      'm': { name: 'm', value: 1e-6, scientific: true },
      'u': { name: 'u', value: 1e-12, scientific: true },
      'n': { name: 'n', value: 1e-18, scientific: true },
      'p': { name: 'p', value: 1e-24, scientific: true },
      'f': { name: 'f', value: 1e-30, scientific: true },
      'a': { name: 'a', value: 1e-36, scientific: true },
      'z': { name: 'z', value: 1e-42, scientific: true },
      'y': { name: 'y', value: 1e-48, scientific: true }
    },
    CUBIC: {
      '': { name: '', value: 1, scientific: true },

      'da': { name: 'da', value: 1e3, scientific: false },
      'h': { name: 'h', value: 1e6, scientific: false },
      'k': { name: 'k', value: 1e9, scientific: true },
      'M': { name: 'M', value: 1e18, scientific: true },
      'G': { name: 'G', value: 1e27, scientific: true },
      'T': { name: 'T', value: 1e36, scientific: true },
      'P': { name: 'P', value: 1e45, scientific: true },
      'E': { name: 'E', value: 1e54, scientific: true },
      'Z': { name: 'Z', value: 1e63, scientific: true },
      'Y': { name: 'Y', value: 1e72, scientific: true },

      'd': { name: 'd', value: 1e-3, scientific: false },
      'c': { name: 'c', value: 1e-6, scientific: false },
      'm': { name: 'm', value: 1e-9, scientific: true },
      'u': { name: 'u', value: 1e-18, scientific: true },
      'n': { name: 'n', value: 1e-27, scientific: true },
      'p': { name: 'p', value: 1e-36, scientific: true },
      'f': { name: 'f', value: 1e-45, scientific: true },
      'a': { name: 'a', value: 1e-54, scientific: true },
      'z': { name: 'z', value: 1e-63, scientific: true },
      'y': { name: 'y', value: 1e-72, scientific: true }
    },
    BINARY_SHORT_SI: {
      '': { name: '', value: 1, scientific: true },
      'k': { name: 'k', value: 1e3, scientific: true },
      'M': { name: 'M', value: 1e6, scientific: true },
      'G': { name: 'G', value: 1e9, scientific: true },
      'T': { name: 'T', value: 1e12, scientific: true },
      'P': { name: 'P', value: 1e15, scientific: true },
      'E': { name: 'E', value: 1e18, scientific: true },
      'Z': { name: 'Z', value: 1e21, scientific: true },
      'Y': { name: 'Y', value: 1e24, scientific: true }
    },
    BINARY_SHORT_IEC: {
      '': { name: '', value: 1, scientific: true },
      'Ki': { name: 'Ki', value: 1024, scientific: true },
      'Mi': { name: 'Mi', value: Math.pow(1024, 2), scientific: true },
      'Gi': { name: 'Gi', value: Math.pow(1024, 3), scientific: true },
      'Ti': { name: 'Ti', value: Math.pow(1024, 4), scientific: true },
      'Pi': { name: 'Pi', value: Math.pow(1024, 5), scientific: true },
      'Ei': { name: 'Ei', value: Math.pow(1024, 6), scientific: true },
      'Zi': { name: 'Zi', value: Math.pow(1024, 7), scientific: true },
      'Yi': { name: 'Yi', value: Math.pow(1024, 8), scientific: true }
    },
    BINARY_LONG_SI: {
      '': { name: '', value: 1, scientific: true },
      'kilo': { name: 'kilo', value: 1e3, scientific: true },
      'mega': { name: 'mega', value: 1e6, scientific: true },
      'giga': { name: 'giga', value: 1e9, scientific: true },
      'tera': { name: 'tera', value: 1e12, scientific: true },
      'peta': { name: 'peta', value: 1e15, scientific: true },
      'exa': { name: 'exa', value: 1e18, scientific: true },
      'zetta': { name: 'zetta', value: 1e21, scientific: true },
      'yotta': { name: 'yotta', value: 1e24, scientific: true }
    },
    BINARY_LONG_IEC: {
      '': { name: '', value: 1, scientific: true },
      'kibi': { name: 'kibi', value: 1024, scientific: true },
      'mebi': { name: 'mebi', value: Math.pow(1024, 2), scientific: true },
      'gibi': { name: 'gibi', value: Math.pow(1024, 3), scientific: true },
      'tebi': { name: 'tebi', value: Math.pow(1024, 4), scientific: true },
      'pebi': { name: 'pebi', value: Math.pow(1024, 5), scientific: true },
      'exi': { name: 'exi', value: Math.pow(1024, 6), scientific: true },
      'zebi': { name: 'zebi', value: Math.pow(1024, 7), scientific: true },
      'yobi': { name: 'yobi', value: Math.pow(1024, 8), scientific: true }
    },
    BTU: {
      '': { name: '', value: 1, scientific: true },
      'MM': { name: 'MM', value: 1e6, scientific: true }
    }
  }

  PREFIXES.SHORTLONG = Object.assign(PREFIXES.SHORT, PREFIXES.LONG)
  PREFIXES.BINARY_SHORT = Object.assign(PREFIXES.BINARY_SHORT_SI, PREFIXES.BINARY_SHORT_IEC)
  PREFIXES.BINARY_LONG = Object.assign(PREFIXES.BINARY_LONG_SI, PREFIXES.BINARY_LONG_IEC)

  /* Internally, each unit is represented by a value and a dimension array. The elements of the dimensions array have the following meaning:
   * Index  Dimension
   * -----  ---------
   *   0    Length
   *   1    Mass
   *   2    Time
   *   3    Current
   *   4    Temperature
   *   5    Luminous intensity
   *   6    Amount of substance
   *   7    Angle
   *   8    Bit (digital)
   * For example, the unit "298.15 K" is a pure temperature and would have a value of 298.15 and a dimension array of [0, 0, 0, 0, 1, 0, 0, 0, 0]. The unit "1 cal / (gm °C)" can be written in terms of the 9 fundamental dimensions as [length^2] / ([time^2] * [temperature]), and would a value of (after conversion to SI) 4184.0 and a dimensions array of [2, 0, -2, 0, -1, 0, 0, 0, 0].
   *
   */

  const BASE_DIMENSIONS = ['MASS', 'LENGTH', 'TIME', 'CURRENT', 'TEMPERATURE', 'LUMINOUS_INTENSITY', 'AMOUNT_OF_SUBSTANCE', 'ANGLE', 'BIT', 'SOLID_ANGLE']

  /* eslint-disable no-multi-spaces, key-spacing, standard/array-bracket-even-spacing */
  const DIMENSIONS = {
    UNITLESS:                { dimensions: [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0] },
    MASS:                    { dimensions: [ 1,  0,  0,  0,  0,  0,  0,  0,  0,  0] },
    LENGTH:                  { dimensions: [ 0,  1,  0,  0,  0,  0,  0,  0,  0,  0] },
    TIME:                    { dimensions: [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  0] },
    CURRENT:                 { dimensions: [ 0,  0,  0,  1,  0,  0,  0,  0,  0,  0] },
    TEMPERATURE:             { dimensions: [ 0,  0,  0,  0,  1,  0,  0,  0,  0,  0] },
    LUMINOUS_INTENSITY:      { dimensions: [ 0,  0,  0,  0,  0,  1,  0,  0,  0,  0] },
    AMOUNT_OF_SUBSTANCE:     { dimensions: [ 0,  0,  0,  0,  0,  0,  1,  0,  0,  0] },
    ANGLE:                   { dimensions: [ 0,  0,  0,  0,  0,  0,  0,  1,  0,  0] },
    BIT:                     { dimensions: [ 0,  0,  0,  0,  0,  0,  0,  0,  1,  0] },
    SOLID_ANGLE:             { dimensions: [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  1] },

    // Derived
    ABSEMENT:                { dimensions: [ 0,  1,  1,  0,  0,  0,  0,  0,  0,  0] },
    ACCELERATION:            { dimensions: [ 0,  1, -2,  0,  0,  0,  0,  0,  0,  0] },
    ANGULAR_ACCELERATION:    { dimensions: [ 0,  0, -2,  0,  0,  0,  0,  1,  0,  0] },
    ANGULAR_MOMENTUM:        { dimensions: [ 1,  2, -1,  0,  0,  0,  0,  1,  0,  0] },
    ANGULAR_VELOCITY:        { dimensions: [ 0,  0, -1,  0,  0,  0,  0,  1,  0,  0] },
    AREA:                    { dimensions: [ 0,  2,  0,  0,  0,  0,  0,  0,  0,  0] },
    AREA_DENSITY:            { dimensions: [ 1, -2,  0,  0,  0,  0,  0,  0,  0,  0] },
    BIT_RATE:                { dimensions: [ 0,  0, -1,  0,  0,  0,  0,  0,  1,  0] },
    CAPACITANCE:             { dimensions: [-1, -2,  4,  2,  0,  0,  0,  0,  0,  0] },
    CURRENT_DENSITY:         { dimensions: [ 0, -2,  0,  1,  0,  0,  0,  0,  0,  0] },
    DYNAMIC_VISCOSITY:       { dimensions: [ 1, -1, -1,  0,  0,  0,  0,  0,  0,  0] },
    ELECTRIC_CHARGE:         { dimensions: [ 0,  0,  1,  1,  0,  0,  0,  0,  0,  0] },
    ELECTRIC_CHARGE_DENSITY: { dimensions: [ 0, -3,  1,  1,  0,  0,  0,  0,  0,  0] },
    ELECTRIC_DISPLACEMENT:   { dimensions: [ 0, -2,  1,  1,  0,  0,  0,  0,  0,  0] },
    ELECTRIC_FIELD_STRENGTH: { dimensions: [ 1,  1, -3, -1,  0,  0,  0,  0,  0,  0] },
    ELECTRICAL_CONDUCTANCE:  { dimensions: [-1, -2,  3,  2,  0,  0,  0,  0,  0,  0] },
    ELECTRICAL_CONDUCTIVITY: { dimensions: [-1, -3,  3,  2,  0,  0,  0,  0,  0,  0] },
    ELECTRIC_POTENTIAL:      { dimensions: [ 1,  2, -3, -1,  0,  0,  0,  0,  0,  0] },
    RESISTANCE:              { dimensions: [ 1,  2, -3, -2,  0,  0,  0,  0,  0,  0] },
    ELECTRICAL_RESISTIVITY:  { dimensions: [ 1,  3, -3, -2,  0,  0,  0,  0,  0,  0] },
    ENERGY:                  { dimensions: [ 1,  2, -2,  0,  0,  0,  0,  0,  0,  0] },
    ENTROPY:                 { dimensions: [ 1,  2, -2,  0, -1,  0,  0,  0,  0,  0] },
    FORCE:                   { dimensions: [ 1,  1, -2,  0,  0,  0,  0,  0,  0,  0] },
    FREQUENCY:               { dimensions: [ 0,  0, -1,  0,  0,  0,  0,  0,  0,  0] },
    HEAT_CAPACITY:           { dimensions: [ 1,  2, -2,  0, -1,  0,  0,  0,  0,  0] },
    HEAT_FLUX_DENSITY:       { dimensions: [ 1,  0, -3,  0,  0,  0,  0,  0,  0,  0] },
    ILLUMINANCE:             { dimensions: [ 0, -2,  0,  0,  0,  1,  0,  0,  0,  0] },
    IMPEDANCE:               { dimensions: [ 1,  2, -3, -2,  0,  0,  0,  0,  0,  0] },
    IMPULSE:                 { dimensions: [ 1,  1, -1,  0,  0,  0,  0,  0,  0,  0] },
    INDUCTANCE:              { dimensions: [ 1,  2, -2, -2,  0,  0,  0,  0,  0,  0] },
    IRRADIANCE:              { dimensions: [ 1,  0, -3,  0,  0,  0,  0,  0,  0,  0] },
    JERK:                    { dimensions: [ 0,  1, -3,  0,  0,  0,  0,  0,  0,  0] },
    KINEMATIC_VISCOSITY:     { dimensions: [ 0,  2, -1,  0,  0,  0,  0,  0,  0,  0] },
    LINEAR_DENSITY:          { dimensions: [ 1, -1,  0,  0,  0,  0,  0,  0,  0,  0] },
    LUMINOUS_FLUX:           { dimensions: [ 0,  0,  0,  0,  0,  1,  0,  0,  0,  1] },
    MAGNETIC_FIELD_STRENGTH: { dimensions: [ 0, -1,  0,  1,  0,  0,  0,  0,  0,  0] },
    MAGNETIC_FLUX:           { dimensions: [ 1,  2, -2, -1,  0,  0,  0,  0,  0,  0] },
    MAGNETIC_FLUX_DENSITY:   { dimensions: [ 1,  0, -2, -1,  0,  0,  0,  0,  0,  0] },
    MOLAR_CONCENTRATION:     { dimensions: [ 0, -3,  0,  0,  0,  0,  1,  0,  0,  0] },
    MOLAR_ENERGY:            { dimensions: [ 1,  2, -2,  0,  0,  0, -1,  0,  0,  0] },
    MOLAR_ENTROPY:           { dimensions: [ 1,  2, -2,  0, -1,  0, -1,  0,  0,  0] },
    MOLAR_HEAT_CAPACITY:     { dimensions: [ 1,  2, -2,  0, -1,  0, -1,  0,  0,  0] },
    MOMENT_OF_INERTIA:       { dimensions: [ 1,  2,  0,  0,  0,  0,  0,  0,  0,  0] },
    MOMENTUM:                { dimensions: [ 1,  1, -1,  0,  0,  0,  0,  0,  0,  0] },
    PERMEABILITY:            { dimensions: [ 1,  1, -2, -2,  0,  0,  0,  0,  0,  0] },
    PERMITTIVITY:            { dimensions: [-1, -3,  4,  2,  0,  0,  0,  0,  0,  0] },
    POWER:                   { dimensions: [ 1,  2, -3,  0,  0,  0,  0,  0,  0,  0] },
    PRESSURE:                { dimensions: [ 1, -1, -2,  0,  0,  0,  0,  0,  0,  0] },
    RELUCTANCE:              { dimensions: [-1, -2,  2,  2,  0,  0,  0,  0,  0,  0] },
    SPECIFIC_ENERGY:         { dimensions: [ 0,  2, -2,  0,  0,  0,  0,  0,  0,  0] },
    SPECIFIC_HEAT_CAPACITY:  { dimensions: [ 0,  2, -2,  0, -1,  0,  0,  0,  0,  0] },
    SPECIFIC_VOLUME:         { dimensions: [-1,  3,  0,  0,  0,  0,  0,  0,  0,  0] },
    SPIN:                    { dimensions: [ 1,  2, -1,  0,  0,  0,  0,  0,  0,  0] },
    SURFACE_TENSION:         { dimensions: [ 1,  0, -2,  0,  0,  0,  0,  0,  0,  0] },
    TEMPERATURE_GRADIENT:    { dimensions: [ 0, -1,  0,  0,  1,  0,  0,  0,  0,  0] },
    THERMAL_CONDUCTIVITY:    { dimensions: [ 1,  1, -3,  0, -1,  0,  0,  0,  0,  0] },
    TORQUE:                  { dimensions: [ 1,  2, -2,  0,  0,  0,  0,  0,  0,  0] },
    VELOCITY:                { dimensions: [ 0,  1, -1,  0,  0,  0,  0,  0,  0,  0] },
    VOLUME:                  { dimensions: [ 0,  3,  0,  0,  0,  0,  0,  0,  0,  0] },
    VOLUMETRIC_FLOW_RATE:    { dimensions: [ 0,  3, -1,  0,  0,  0,  0,  0,  0,  0] }
  }
  /* eslint-enable no-multi-spaces, key-spacing, standard/array-bracket-even-spacing */

  for (let key in DIMENSIONS) {
    DIMENSIONS[key].key = key
  }

  const UNITS = {
    // length
    meter: {
      name: 'meter',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['nano', 'micro', 'milli', 'centi', '', 'kilo'],
      value: 1
    },
    inch: {
      name: 'inch',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.0254
    },
    foot: {
      name: 'foot',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.3048
    },
    yard: {
      name: 'yard',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.9144
    },
    mile: {
      name: 'mile',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 1609.344
    },
    link: {
      name: 'link',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.201168
    },
    rod: {
      name: 'rod',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 5.0292
    },
    chain: {
      name: 'chain',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 20.1168
    },
    angstrom: {
      name: 'angstrom',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 1e-10
    },

    m: {
      name: 'm',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['n', 'u', 'm', 'c', '', 'k'],
      value: 1
    },
    'in': {
      name: 'in',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.0254
    },
    ft: {
      name: 'ft',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.3048
    },
    yd: {
      name: 'yd',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.9144
    },
    mi: {
      name: 'mi',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 1609.344
    },
    li: {
      name: 'li',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.201168
    },
    rd: {
      name: 'rd',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 5.029210
    },
    ch: {
      name: 'ch',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 20.1168
    },
    mil: {
      name: 'mil',
      base: DIMENSIONS.LENGTH,
      prefixes: PREFIXES.NONE,
      value: 0.0000254
    }, // 1/1000 inch

    // Area
    m2: {
      name: 'm2',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.SQUARED,
      commonPrefixes: ['m', 'c', '', 'k'],
      value: 1
    },
    sqin: {
      name: 'sqin',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 0.00064516
    }, // 645.16 mm2
    sqft: {
      name: 'sqft',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 0.09290304
    }, // 0.09290304 m2
    sqyd: {
      name: 'sqyd',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 0.83612736
    }, // 0.83612736 m2
    sqmi: {
      name: 'sqmi',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 2589988.110336
    }, // 2.589988110336 km2
    sqrd: {
      name: 'sqrd',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 25.29295
    }, // 25.29295 m2
    sqch: {
      name: 'sqch',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 404.6873
    }, // 404.6873 m2
    sqmil: {
      name: 'sqmil',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 6.4516e-10
    }, // 6.4516 * 10^-10 m2
    acre: {
      name: 'acre',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 4046.86
    }, // 4046.86 m2
    hectare: {
      name: 'hectare',
      base: DIMENSIONS.AREA,
      prefixes: PREFIXES.NONE,
      value: 10000
    }, // 10000 m2

    // Volume
    m3: {
      name: 'm3',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.CUBIC,
      commonPrefixes: ['m', 'c', '', 'k'],
      value: 1
    },
    L: {
      name: 'L',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 0.001
    }, // litre
    l: {
      name: 'l',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 0.001
    }, // litre
    litre: {
      name: 'litre',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: 0.001
    },
    cuin: {
      name: 'cuin',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 1.6387064e-5
    }, // 1.6387064e-5 m3
    cuft: {
      name: 'cuft',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.028316846592
    }, // 28.316 846 592 L
    cuyd: {
      name: 'cuyd',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.764554857984
    }, // 764.554 857 984 L
    teaspoon: {
      name: 'teaspoon',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.000005
    }, // 5 mL
    tablespoon: {
      name: 'tablespoon',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.000015
    }, // 15 mL
    // {name: 'cup', base: BASE_UNITS.VOLUME, prefixes: PREFIXES.NONE, value: 0.000240, offset: 0}, // 240 mL  // not possible, we have already another cup
    drop: {
      name: 'drop',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 5e-8
    }, // 0.05 mL = 5e-8 m3
    gtt: {
      name: 'gtt',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 5e-8
    }, // 0.05 mL = 5e-8 m3

    // Liquid volume
    minim: {
      name: 'minim',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.00000006161152
    }, // 0.06161152 mL
    fluiddram: {
      name: 'fluiddram',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0000036966911
    }, // 3.696691 mL
    fluidounce: {
      name: 'fluidounce',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.00002957353
    }, // 29.57353 mL
    gill: {
      name: 'gill',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0001182941
    }, // 118.2941 mL
    cc: {
      name: 'cc',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 1e-6
    }, // 1e-6 L
    cup: {
      name: 'cup',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0002365882
    }, // 236.5882 mL
    pint: {
      name: 'pint',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0004731765
    }, // 473.1765 mL
    quart: {
      name: 'quart',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0009463529
    }, // 946.3529 mL
    gallon: {
      name: 'gallon',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.003785412
    }, // 3.785412 L
    beerbarrel: {
      name: 'beerbarrel',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.1173478
    }, // 117.3478 L
    oilbarrel: {
      name: 'oilbarrel',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.1589873
    }, // 158.9873 L
    hogshead: {
      name: 'hogshead',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.2384810
    }, // 238.4810 L

    // {name: 'min', base: BASE_UNITS.VOLUME, prefixes: PREFIXES.NONE, value: 0.00000006161152, offset: 0}, // 0.06161152 mL // min is already in use as minute
    fldr: {
      name: 'fldr',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0000036966911
    }, // 3.696691 mL
    floz: {
      name: 'floz',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.00002957353
    }, // 29.57353 mL
    gi: {
      name: 'gi',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0001182941
    }, // 118.2941 mL
    cp: {
      name: 'cp',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0002365882
    }, // 236.5882 mL
    pt: {
      name: 'pt',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0004731765
    }, // 473.1765 mL
    qt: {
      name: 'qt',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.0009463529
    }, // 946.3529 mL
    gal: {
      name: 'gal',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.003785412
    }, // 3.785412 L
    bbl: {
      name: 'bbl',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.1173478
    }, // 117.3478 L
    obl: {
      name: 'obl',
      base: DIMENSIONS.VOLUME,
      prefixes: PREFIXES.NONE,
      value: 0.1589873
    }, // 158.9873 L
    // {name: 'hogshead', base: BASE_UNITS.VOLUME, prefixes: PREFIXES.NONE, value: 0.2384810, offset: 0}, // 238.4810 L // TODO: hh?

    // Mass
    g: {
      name: 'g',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['n', 'u', 'm', '', 'k'],
      value: 0.001
    },
    gram: {
      name: 'gram',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['nano', 'micro', 'milli', '', 'kilo'],
      value: 0.001
    },

    ton: {
      name: 'ton',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 907.18474
    },
    tonne: {
      name: 'tonne',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['', 'kilo', 'mega', 'giga'],
      value: 1000
    },

    grain: {
      name: 'grain',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 64.79891e-6
    },
    dram: {
      name: 'dram',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 1.7718451953125e-3
    },
    ounce: {
      name: 'ounce',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 28.349523125e-3
    },
    poundmass: {
      name: 'poundmass',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 453.59237e-3
    },
    hundredweight: {
      name: 'hundredweight',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 45.359237
    },
    stick: {
      name: 'stick',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 115e-3
    },
    stone: {
      name: 'stone',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 6.35029318
    },

    gr: {
      name: 'gr',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 64.79891e-6
    },
    dr: {
      name: 'dr',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 1.7718451953125e-3
    },
    oz: {
      name: 'oz',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 28.349523125e-3
    },
    lbm: {
      name: 'lbm',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 453.59237e-3
    },
    cwt: {
      name: 'cwt',
      base: DIMENSIONS.MASS,
      prefixes: PREFIXES.NONE,
      value: 45.359237
    },

    // Time
    s: {
      name: 's',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['f', 'p', 'n', 'u', 'm', ''],
      value: 1
    },
    min: {
      name: 'min',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 60
    },
    h: {
      name: 'h',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 3600
    },
    second: {
      name: 'second',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['femto', 'pico', 'nano', 'micro', 'milli', ''],
      value: 1
    },
    sec: {
      name: 'sec',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['femto', 'pico', 'nano', 'micro', 'milli', ''],
      value: 1
    },
    minute: {
      name: 'minute',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 60
    },
    hour: {
      name: 'hour',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 3600
    },
    day: {
      name: 'day',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 86400
    },
    week: {
      name: 'week',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 7 * 86400
    },
    month: {
      name: 'month',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 2629800 // 1/12th of Julian year
    },
    year: {
      name: 'year',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 31557600 // Julian year
    },
    decade: {
      name: 'decade',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 315576000 // Julian decade
    },
    century: {
      name: 'century',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 3155760000 // Julian century
    },
    millennium: {
      name: 'millennium',
      base: DIMENSIONS.TIME,
      prefixes: PREFIXES.NONE,
      value: 31557600000 // Julian millennium
    },

    // Frequency
    hertz: {
      name: 'Hertz',
      base: DIMENSIONS.FREQUENCY,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['', 'kilo', 'mega', 'giga', 'tera'],
      value: 1,
      offset: 0,
      reciprocal: true
    },
    Hz: {
      name: 'Hz',
      base: DIMENSIONS.FREQUENCY,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['', 'k', 'M', 'G', 'T'],
      value: 1,
      offset: 0,
      reciprocal: true
    },

    // Angle
    rad: {
      name: 'rad',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['m', ''],
      value: 1
    },
    radian: {
      name: 'radian',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['milli', ''],
      value: 1
    },
    sr: {
      name: 'sr',
      base: DIMENSIONS.SOLID_ANGLE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['u', 'm', ''],
      value: 1,
      offset: 0
    },
    steradian: {
      name: 'steradian',
      base: DIMENSIONS.SOLID_ANGLE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['micro', 'milli', ''],
      value: 1,
      offset: 0
    },
    deg: {
      name: 'deg',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.NONE, // Prefer arcminutes and arcseconds
      value: Math.PI / 180
    },
    degree: {
      name: 'degree',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.NONE,
      value: Math.PI / 180
    },
    grad: {
      name: 'grad',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['c'],
      value: Math.PI / 200
    },
    gradian: {
      name: 'gradian',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['centi', ''],
      value: Math.PI / 200
    },
    cycle: {
      name: 'cycle',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.NONE,
      value: 2 * Math.pi
    },
    // arcsec = rad / (3600 * (360 / 2 * pi)) = rad / 0.0000048481368110953599358991410235795
    arcsec: {
      name: 'arcsec',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.NONE,
      value: 0.05 / Math.pi
    },
    // arcmin = rad / (60 * (360 / 2 * pi)) = rad / 0.00029088820866572159615394846141477
    arcmin: {
      name: 'arcmin',
      base: DIMENSIONS.ANGLE,
      prefixes: PREFIXES.NONE,
      value: 3 / Math.pi
    },

    // Electric current
    A: {
      name: 'A',
      base: DIMENSIONS.CURRENT,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['u', 'm', '', 'k'],
      value: 1
    },
    ampere: {
      name: 'ampere',
      base: DIMENSIONS.CURRENT,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['micro', 'milli', '', 'kilo'],
      value: 1
    },

    // Temperature
    // K(C) = °C + 273.15
    // K(F) = (°F + 459.67) / 1.8
    // K(R) = °R / 1.8
    K: {
      name: 'K',
      base: DIMENSIONS.TEMPERATURE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 1
    },
    degC: {
      name: 'degC',
      base: DIMENSIONS.TEMPERATURE,
      prefixes: PREFIXES.NONE,
      value: 1,
      offset: 273.15
    },
    degF: {
      name: 'degF',
      base: DIMENSIONS.TEMPERATURE,
      prefixes: PREFIXES.NONE,
      value: 1 / 1.8,
      offset: 459.67
    },
    degR: {
      name: 'degR',
      base: DIMENSIONS.TEMPERATURE,
      prefixes: PREFIXES.NONE,
      value: 1 / 1.8
    },
    kelvin: {
      name: 'kelvin',
      base: DIMENSIONS.TEMPERATURE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: 1
    },
    celsius: {
      name: 'celsius',
      base: DIMENSIONS.TEMPERATURE,
      prefixes: PREFIXES.NONE,
      value: 1,
      offset: 273.15
    },
    fahrenheit: {
      name: 'fahrenheit',
      base: DIMENSIONS.TEMPERATURE,
      prefixes: PREFIXES.NONE,
      value: 1 / 1.8,
      offset: 459.67
    },
    rankine: {
      name: 'rankine',
      base: DIMENSIONS.TEMPERATURE,
      prefixes: PREFIXES.NONE,
      value: 1 / 1.8
    },

    // amount of substance
    mol: {
      name: 'mol',
      base: DIMENSIONS.AMOUNT_OF_SUBSTANCE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['', 'k'],
      value: 1
    },
    mole: {
      name: 'mole',
      base: DIMENSIONS.AMOUNT_OF_SUBSTANCE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['', 'kilo'],
      value: 1
    },

    // luminous intensity
    cd: {
      name: 'cd',
      base: DIMENSIONS.LUMINOUS_INTENSITY,
      prefixes: PREFIXES.NONE,
      value: 1
    },
    candela: {
      name: 'candela',
      base: DIMENSIONS.LUMINOUS_INTENSITY,
      prefixes: PREFIXES.NONE,
      value: 1
    },

    // luminous flux
    lumen: {
      name: 'lumen',
      base: DIMENSIONS.LUMINOUS_FLUX,
      prefixes: PREFIXES.LONG,
      value: 1
    },
    lm: {
      name: 'lm',
      base: DIMENSIONS.LUMINOUS_FLUX,
      prefixes: PREFIXES.SHORT,
      value: 1
    },

    // illuminance
    lux: {
      name: 'lux',
      base: DIMENSIONS.ILLUMINANCE,
      prefixes: PREFIXES.LONG,
      value: 1
    },
    lx: {
      name: 'lx',
      base: DIMENSIONS.ILLUMINANCE,
      prefixes: PREFIXES.SHORT,
      value: 1
    },

    // Force
    N: {
      name: 'N',
      base: DIMENSIONS.FORCE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['u', 'm', '', 'k', 'M'], // These could be debatable
      value: 1

    },
    newton: {
      name: 'newton',
      base: DIMENSIONS.FORCE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['micro', 'milli', '', 'kilo', 'mega'],
      value: 1
    },
    dyn: {
      name: 'dyn',
      base: DIMENSIONS.FORCE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['m', 'k', 'M'],
      value: 0.00001
    },
    dyne: {
      name: 'dyne',
      base: DIMENSIONS.FORCE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['milli', 'kilo', 'mega'],
      value: 0.00001
    },
    lbf: {
      name: 'lbf',
      base: DIMENSIONS.FORCE,
      prefixes: PREFIXES.NONE,
      value: 4.4482216152605
    },
    poundforce: {
      name: 'poundforce',
      base: DIMENSIONS.FORCE,
      prefixes: PREFIXES.NONE,
      value: 4.4482216152605
    },
    kip: {
      name: 'kip',
      base: DIMENSIONS.FORCE,
      prefixes: PREFIXES.NONE,
      value: 4448.2216
    },

    // Energy
    J: {
      name: 'J',
      base: DIMENSIONS.ENERGY,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['m', '', 'k', 'M', 'G'],
      value: 1
    },
    joule: {
      name: 'joule',
      base: DIMENSIONS.ENERGY,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['milli', '', 'kilo', 'mega', 'giga'],
      value: 1
    },
    erg: {
      name: 'erg',
      base: DIMENSIONS.ENERGY,
      prefixes: PREFIXES.NONE,
      value: 1e-7
    },
    Wh: {
      name: 'Wh',
      base: DIMENSIONS.ENERGY,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['k', 'M', 'G', 'T'],
      value: 3600
    },
    BTU: {
      name: 'BTU',
      base: DIMENSIONS.ENERGY,
      prefixes: PREFIXES.BTU,
      commonPrefixes: ['', 'MM'],
      value: 1055.05585262
    },
    eV: {
      name: 'eV',
      base: DIMENSIONS.ENERGY,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['u', 'm', '', 'k', 'M', 'G'],
      value: 1.602176565e-19
    },
    electronvolt: {
      name: 'electronvolt',
      base: DIMENSIONS.ENERGY,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['micro', 'milli', '', 'kilo', 'mega', 'giga'],
      value: 1.602176565e-19
    },

    // Power
    W: {
      name: 'W',
      base: DIMENSIONS.POWER,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T', 'P'],
      value: 1
    },
    watt: {
      name: 'watt',
      base: DIMENSIONS.POWER,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', '', 'kilo', 'mega', 'tera', 'peta'],
      value: 1
    },
    hp: {
      name: 'hp',
      base: DIMENSIONS.POWER,
      prefixes: PREFIXES.NONE,
      value: 745.6998715386
    },

    // Electrical power units
    VA: {
      name: 'VA',
      base: DIMENSIONS.POWER,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['', 'k'],
      value: 1
    },

    // Pressure
    Pa: {
      name: 'Pa',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['', 'k', 'M', 'G'], // 'h' is sometimes used but not often
      value: 1
    },
    psi: {
      name: 'psi',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.NONE, // kpsi is sometimes used
      value: 6894.757293168361
    },
    atm: {
      name: 'atm',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.NONE,
      value: 101325
    },
    bar: {
      name: 'bar',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.SHORTLONG,
      commonPrefixes: ['m', ''],
      value: 100000
    },
    torr: {
      name: 'torr',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['milli', ''],
      value: 133.322
    },
    Torr: {
      name: 'Torr',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['m', ''],
      value: 133.322
    },
    mmHg: {
      name: 'mmHg',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.NONE,
      value: 133.322
    },
    mmH2O: {
      name: 'mmH2O',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.NONE,
      value: 9.80665
    },
    cmH2O: {
      name: 'cmH2O',
      base: DIMENSIONS.PRESSURE,
      prefixes: PREFIXES.NONE,
      value: 98.0665
    },

    // Electric charge
    coulomb: {
      name: 'coulomb',
      base: DIMENSIONS.ELECTRIC_CHARGE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
      value: 1
    },
    C: {
      name: 'C',
      base: DIMENSIONS.ELECTRIC_CHARGE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['p', 'n', 'u', 'm', ''],
      value: 1
    },
    // Electric capacitance
    farad: {
      name: 'farad',
      base: DIMENSIONS.CAPACITANCE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
      value: 1
    },
    F: {
      name: 'F',
      base: DIMENSIONS.CAPACITANCE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['p', 'n', 'u', 'm', ''],
      value: 1
    },
    // Electric potential
    volt: {
      name: 'volt',
      base: DIMENSIONS.ELECTRIC_POTENTIAL,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['milli', '', 'kilo', 'mega'],
      value: 1
    },
    V: {
      name: 'V',
      base: DIMENSIONS.ELECTRIC_POTENTIAL,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['m', '', 'k', 'M'],
      value: 1
    },
    // Electric resistance
    ohm: {
      name: 'ohm',
      base: DIMENSIONS.RESISTANCE,
      prefixes: PREFIXES.SHORTLONG, // Both Mohm and megaohm are acceptable
      commonPrefixes: ['', 'k', 'M'],
      value: 1
    },
    /*
     * Unicode breaks in browsers if charset is not specified
     * TODO: Allow with config option?
    Ω: {
      name: 'Ω',
      base: BASE_UNITS.ELECTRIC_RESISTANCE,
      prefixes: PREFIXES.SHORT,
      value: 1,
          },
    */
    // Electric inductance
    henry: {
      name: 'henry',
      base: DIMENSIONS.INDUCTANCE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['micro', 'milli', ''], // Just guessing here
      value: 1
    },
    H: {
      name: 'H',
      base: DIMENSIONS.INDUCTANCE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['u', 'm', ''],
      value: 1
    },
    // Electric conductance
    siemens: {
      name: 'siemens',
      base: DIMENSIONS.ELECTRICAL_CONDUCTANCE,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['micro', 'milli', ''],
      value: 1
    },
    S: {
      name: 'S',
      base: DIMENSIONS.ELECTRICAL_CONDUCTANCE,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['u', 'm', ''],
      value: 1
    },
    // Magnetic flux
    weber: {
      name: 'weber',
      base: DIMENSIONS.MAGNETIC_FLUX,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: 1
    },
    Wb: {
      name: 'Wb',
      base: DIMENSIONS.MAGNETIC_FLUX,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 1
    },
    // Magnetic flux density
    tesla: {
      name: 'tesla',
      base: DIMENSIONS.MAGNETIC_FLUX_DENSITY,
      prefixes: PREFIXES.LONG,
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: 1
    },
    T: {
      name: 'T',
      base: DIMENSIONS.MAGNETIC_FLUX_DENSITY,
      prefixes: PREFIXES.SHORT,
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 1
    },

    // Binary
    // TODO: Figure out how to do SI vs. IEC while formatting
    b: {
      name: 'b',
      base: DIMENSIONS.BIT,
      prefixes: PREFIXES.BINARY_SHORT,
      value: 1
    },
    bits: {
      name: 'bits',
      base: DIMENSIONS.BIT,
      prefixes: PREFIXES.BINARY_LONG,
      value: 1
    },
    B: {
      name: 'B',
      base: DIMENSIONS.BIT,
      prefixes: PREFIXES.BINARY_SHORT,
      value: 8
    },
    bytes: {
      name: 'bytes',
      base: DIMENSIONS.BIT,
      prefixes: PREFIXES.BINARY_LONG,
      value: 8
    }
  }

  // Add additional units here.

  // aliases (formerly plurals)
  const ALIASES = {
    meters: 'meter',
    inches: 'inch',
    feet: 'foot',
    yards: 'yard',
    miles: 'mile',
    links: 'link',
    rods: 'rod',
    chains: 'chain',
    angstroms: 'angstrom',

    lt: 'l',
    litres: 'litre',
    liter: 'litre',
    liters: 'litre',
    teaspoons: 'teaspoon',
    tablespoons: 'tablespoon',
    minims: 'minim',
    fluiddrams: 'fluiddram',
    fluidounces: 'fluidounce',
    gills: 'gill',
    cups: 'cup',
    pints: 'pint',
    quarts: 'quart',
    gallons: 'gallon',
    beerbarrels: 'beerbarrel',
    oilbarrels: 'oilbarrel',
    hogsheads: 'hogshead',
    gtts: 'gtt',

    grams: 'gram',
    tons: 'ton',
    tonnes: 'tonne',
    grains: 'grain',
    drams: 'dram',
    ounces: 'ounce',
    poundmasses: 'poundmass',
    hundredweights: 'hundredweight',
    sticks: 'stick',
    lb: 'lbm',
    lbs: 'lbm',

    kips: 'kip',

    acres: 'acre',
    hectares: 'hectare',
    sqfeet: 'sqft',
    sqyard: 'sqyd',
    sqmile: 'sqmi',
    sqmiles: 'sqmi',

    mmhg: 'mmHg',
    mmh2o: 'mmH2O',
    cmh2o: 'cmH2O',

    seconds: 'second',
    secs: 'second',
    minutes: 'minute',
    mins: 'minute',
    hours: 'hour',
    hr: 'hour',
    hrs: 'hour',
    days: 'day',
    weeks: 'week',
    months: 'month',
    years: 'year',
    decades: 'decade',
    centuries: 'century',
    millennia: 'millennium',

    hertz: 'hertz',

    radians: 'radian',
    degrees: 'degree',
    gradians: 'gradian',
    cycles: 'cycle',
    arcsecond: 'arcsec',
    arcseconds: 'arcsec',
    arcminute: 'arcmin',
    arcminutes: 'arcmin',

    BTUs: 'BTU',
    watts: 'watt',
    joules: 'joule',

    amperes: 'ampere',
    coulombs: 'coulomb',
    volts: 'volt',
    ohms: 'ohm',
    farads: 'farad',
    webers: 'weber',
    teslas: 'tesla',
    electronvolts: 'electronvolt',
    moles: 'mole'

  }

  // Add additional aliases here.

  /**
   * A unit system is a set of dimensionally independent base dimensions plus a set of derived dimensions, formed by multiplication and division of the base dimensions, that are by convention used with the unit system.
   */

  const UNIT_SYSTEMS = {
    si: {
      AMOUNT_OF_SUBSTANCE: 'mol',
      ANGLE: 'rad',
      BIT: 'b',
      CAPACITANCE: 'F',
      CURRENT: 'A',
      ELECTRIC_CHARGE: 'C',
      ELECTRICAL_CONDUCTANCE: 'S',
      ELECTRIC_POTENTIAL: 'V',
      ENERGY: 'J',
      FORCE: 'N',
      FREQUENCY: 'Hz',
      IMPEDANCE: 'ohm',
      INDUCTANCE: 'H',
      LENGTH: 'm',
      LUMINOUS_INTENSITY: 'cd',
      LUMINOUS_FLUX: 'lm',
      ILLUMINANCE: 'lx',
      MAGNETIC_FLUX: 'Wb',
      MAGNETIC_FLUX_DENSITY: 'T',
      MASS: 'kg',
      POWER: 'W',
      PRESSURE: 'Pa',
      RESISTANCE: 'ohm',
      SOLID_ANGLE: 'sr',
      TEMPERATURE: 'K',
      TIME: 's'
    }
  }

  // Clone to create the other unit systems
  UNIT_SYSTEMS.cgs = JSON.parse(JSON.stringify(UNIT_SYSTEMS.si))
  UNIT_SYSTEMS.cgs.LENGTH = 'cm'
  UNIT_SYSTEMS.cgs.MASS = 'g'
  UNIT_SYSTEMS.cgs.FORCE = 'dyn'
  UNIT_SYSTEMS.cgs.ENERGY = 'erg'
  // there are wholly 4 unique cgs systems for electricity and magnetism,
  // so let's not worry about it unless somebody complains

  // These maybe are not canonical
  UNIT_SYSTEMS.us = JSON.parse(JSON.stringify(UNIT_SYSTEMS.si))
  UNIT_SYSTEMS.us.LENGTH = 'ft'
  UNIT_SYSTEMS.us.MASS = 'lbm'
  UNIT_SYSTEMS.us.TEMPERATURE = 'degF'
  UNIT_SYSTEMS.us.FORCE = 'lbf'
  UNIT_SYSTEMS.us.ENERGY = 'BTU'
  UNIT_SYSTEMS.us.POWER = 'hp'
  UNIT_SYSTEMS.us.PRESSURE = 'psi'

  // Add additional unit systems here.

  // Check to make sure config options has selected a unit system that exists.
  if (options.format.system !== 'auto') {
    if (!UNIT_SYSTEMS.hasOwnProperty(options.format.system)) {
      throw new Error(`Unknown unit system ${options.format.system}. Available systems are: auto, ${Object.keys(UNIT_SYSTEMS).join(', ')} `)
    }
  }

  // Convert unit systems from strings to unit/prefix pairs
  for (let sysKey in UNIT_SYSTEMS) {
    let sys = UNIT_SYSTEMS[sysKey]
    for (let dimKey in sys) {
      if (!DIMENSIONS.hasOwnProperty(dimKey)) {
        throw new Error(`Unit system ${sysKey} mentions dimension ${dimKey}, which does not exist`)
      }
      let unitPrefixPair = findUnit(sys[dimKey])
      if (unitPrefixPair) {
        sys[dimKey] = unitPrefixPair

        // Add the system's name to the unit (for reverse lookup) so we can infer unit systems just by inspecting the individual units
        if (!unitPrefixPair.unit.systems) {
          unitPrefixPair.unit.systems = []
        }
        unitPrefixPair.unit.systems.push(sysKey)
      } else {
        throw new Error(`Unknown unit ${sys[dimKey]} for dimension ${dimKey} in unit system ${sysKey}`)
      }
    }
  }

  // Final setup for units
  for (let key in UNITS) {
    const unit = UNITS[key]
    // Convert commonPrefix from string array to prefix array and sort the array
    if (unit.commonPrefixes) {
      for (let i = 0; i < unit.commonPrefixes.length; i++) {
        let s = unit.commonPrefixes[i]
        if (!unit.prefixes.hasOwnProperty(s)) {
          throw new Error(`In unit ${unit.name}, common prefix ${s} was not found among the allowable prefixes`)
        }
        unit.commonPrefixes[i] = unit.prefixes[s]
      }
      unit.commonPrefixes.sort((a, b) => a.value < b.value ? -1 : 1)
    }

    // Add dimensions to each built-in unit
    if (!unit.base) {
      throw new Error(`Cannot find dimension for unit ${unit.name}`)
    }
    unit.dimensions = unit.base.dimensions

    // Set other defaults for units
    if (typeof unit.offset === 'undefined') {
      unit.offset = 0
    }
  }

  // Create aliases
  for (const name in ALIASES) {
    if (ALIASES.hasOwnProperty(name)) {
      const unit = UNITS[ALIASES[name]]
      const alias = {}
      for (let key in unit) {
        if (unit.hasOwnProperty(key)) {
          alias[key] = unit[key]
        }
      }
      alias.name = name
      UNITS[name] = alias
    }
  }

  /**
   * Tests whether the given string exists as a known unit. The unit may have a prefix.
   * @param {string} singleUnitString The name of the unit, with optional prefix.
   */
  function exists (singleUnitString) {
    return findUnit(singleUnitString) !== null
  }

  /**
   * Find a unit from a string
   * @param {string} unitString              A string like 'cm' or 'inch'
   * @returns {Object | null} result  When found, an object with fields unit and
   *                                  prefix is returned. Else, null is returned.
   * @private
   */
  function findUnit (unitString) {
    // First, match units names exactly. For example, a user could define 'mm' as 10^-4 m, which is silly, but then we would want 'mm' to match the user-defined unit.
    if (UNITS.hasOwnProperty(unitString)) {
      const unit = UNITS[unitString]
      const prefix = unit.prefixes['']
      return {
        unit,
        prefix
      }
    }

    for (const name in UNITS) {
      if (UNITS.hasOwnProperty(name)) {
        if (unitString.substring(unitString.length - name.length, unitString.length) === name) {
          const unit = UNITS[name]
          const prefixLen = (unitString.length - name.length)
          const prefixName = unitString.substring(0, prefixLen)
          const prefix = unit.prefixes.hasOwnProperty(prefixName)
            ? unit.prefixes[prefixName]
            : undefined
          if (prefix !== undefined) {
            // store unit, prefix, and value
            return {
              unit,
              prefix
            }
          }
        }
      }
    }

    return null
  }

  Object.freeze(PREFIXES)
  Object.freeze(BASE_DIMENSIONS)
  Object.freeze(DIMENSIONS)
  Object.freeze(UNIT_SYSTEMS)
  Object.freeze(UNITS)

  // expose arrays with prefixes, dimensions, units, systems
  return { PREFIXES, BASE_DIMENSIONS, DIMENSIONS, UNIT_SYSTEMS, UNITS, exists, findUnit }
}
