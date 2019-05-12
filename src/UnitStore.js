/**
 * Creates a new unit store.
 * @param {Object} options
 */
export default function createUnitStore (options) {
  const PREFIXES = {
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
    SQUARED: {
      '': 1,

      'da': 1e2,
      'h': 1e4,
      'k': 1e6,
      'M': 1e12,
      'G': 1e18,
      'T': 1e24,
      'P': 1e30,
      'E': 1e36,
      'Z': 1e42,
      'Y': 1e48,

      'd': 1e-2,
      'c': 1e-4,
      'm': 1e-6,
      'u': 1e-12,
      'n': 1e-18,
      'p': 1e-24,
      'f': 1e-30,
      'a': 1e-36,
      'z': 1e-42,
      'y': 1e-48
    },
    CUBIC: {
      '': 1,

      'da': 1e3,
      'h': 1e6,
      'k': 1e9,
      'M': 1e18,
      'G': 1e27,
      'T': 1e36,
      'P': 1e45,
      'E': 1e54,
      'Z': 1e63,
      'Y': 1e72,

      'd': 1e-3,
      'c': 1e-6,
      'm': 1e-9,
      'u': 1e-18,
      'n': 1e-27,
      'p': 1e-36,
      'f': 1e-45,
      'a': 1e-54,
      'z': 1e-63,
      'y': 1e-72
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
    }
  }

  PREFIXES.SHORT_LONG = Object.assign({}, PREFIXES.SHORT, PREFIXES.LONG)
  PREFIXES.BINARY_SHORT = Object.assign({}, PREFIXES.BINARY_SHORT_SI, PREFIXES.BINARY_SHORT_IEC)
  PREFIXES.BINARY_LONG = Object.assign({}, PREFIXES.BINARY_LONG_SI, PREFIXES.BINARY_LONG_IEC)

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
      base: DIMENSIONS.LENGTH,
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', 'centi', '', 'kilo'],
      value: 1,
      aliases: ['meters']
    },
    inch: {
      base: DIMENSIONS.LENGTH,
      value: 0.0254,
      aliases: ['inches', 'in']
    },
    foot: {
      base: DIMENSIONS.LENGTH,
      value: 0.3048,
      aliases: ['ft']
    },
    yard: {
      base: DIMENSIONS.LENGTH,
      value: 0.9144,
      aliases: ['yd', 'yards']
    },
    mile: {
      base: DIMENSIONS.LENGTH,
      value: 1609.344,
      aliases: ['mi', 'miles']
    },
    link: {
      base: DIMENSIONS.LENGTH,
      value: 0.201168,
      aliases: ['li', 'links']
    },
    rod: {
      base: DIMENSIONS.LENGTH,
      value: 5.0292,
      aliases: ['rd', 'rods']
    },
    chain: {
      base: DIMENSIONS.LENGTH,
      value: 20.1168,
      aliases: ['ch', 'chains']
    },
    angstrom: {
      base: DIMENSIONS.LENGTH,
      value: 1e-10,
      aliases: ['angstroms']
    },

    m: {
      base: DIMENSIONS.LENGTH,
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', 'c', '', 'k'],
      value: 1
    },
    mil: {
      base: DIMENSIONS.LENGTH,
      value: 0.0000254
    }, // 1/1000 inch

    // Area
    m2: {
      base: DIMENSIONS.AREA,
      prefixes: 'SQUARED',
      commonPrefixes: ['m', 'c', '', 'k'],
      value: 1
    },
    sqin: {
      base: DIMENSIONS.AREA,
      value: 0.00064516
    }, // 645.16 mm2
    sqft: {
      base: DIMENSIONS.AREA,
      value: 0.09290304
    }, // 0.09290304 m2
    sqyd: {
      base: DIMENSIONS.AREA,
      value: 0.83612736
    }, // 0.83612736 m2
    sqmi: {
      base: DIMENSIONS.AREA,
      value: 2589988.110336
    }, // 2.589988110336 km2
    sqrd: {
      base: DIMENSIONS.AREA,
      value: 25.29295
    }, // 25.29295 m2
    sqch: {
      base: DIMENSIONS.AREA,
      value: 404.6873
    }, // 404.6873 m2
    sqmil: {
      base: DIMENSIONS.AREA,
      value: 6.4516e-10
    }, // 6.4516 * 10^-10 m2
    acre: {
      base: DIMENSIONS.AREA,
      value: 4046.86
    }, // 4046.86 m2
    hectare: {
      base: DIMENSIONS.AREA,
      value: 10000
    }, // 10000 m2

    // Volume
    m3: {
      base: DIMENSIONS.VOLUME,
      prefixes: 'CUBIC',
      commonPrefixes: ['m', 'c', '', 'k'],
      value: 1
    },
    L: {
      base: DIMENSIONS.VOLUME,
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 0.001,
      aliases: ['l', 'lt']
    }, // litre
    litre: {
      base: DIMENSIONS.VOLUME,
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: 0.001,
      aliases: ['liter', 'liters', 'litres']
    },
    cuin: {
      base: DIMENSIONS.VOLUME,
      value: 1.6387064e-5
    }, // 1.6387064e-5 m3
    cuft: {
      base: DIMENSIONS.VOLUME,
      value: 0.028316846592
    }, // 28.316 846 592 L
    cuyd: {
      base: DIMENSIONS.VOLUME,
      value: 0.764554857984
    }, // 764.554 857 984 L
    teaspoon: {
      base: DIMENSIONS.VOLUME,
      value: 0.000005,
      aliases: ['teaspoons']
    }, // 5 mL
    tablespoon: {
      base: DIMENSIONS.VOLUME,
      value: 0.000015,
      aliases: ['tablespoons']
    }, // 15 mL
    // {name: 'cup', base: BASE_UNITS.VOLUME, prefixes: PREFIXES.NONE, value: 0.000240, offset: 0}, // 240 mL  // not possible, we have already another cup
    drop: {
      base: DIMENSIONS.VOLUME,
      value: 5e-8
    }, // 0.05 mL = 5e-8 m3
    gtt: {
      base: DIMENSIONS.VOLUME,
      value: 5e-8
    }, // 0.05 mL = 5e-8 m3

    // Liquid volume
    minim: {
      base: DIMENSIONS.VOLUME,
      value: 0.00000006161152,
      aliases: ['minims']
    }, // 0.06161152 mL
    fluiddram: {
      base: DIMENSIONS.VOLUME,
      value: 0.0000036966911,
      aliases: ['fldr', 'fluiddrams']
    }, // 3.696691 mL
    fluidounce: {
      base: DIMENSIONS.VOLUME,
      value: 0.00002957353,
      aliases: ['floz', 'fluidounces']
    }, // 29.57353 mL
    gill: {
      base: DIMENSIONS.VOLUME,
      value: 0.0001182941,
      aliases: ['gi', 'gills']
    }, // 118.2941 mL
    cc: {
      base: DIMENSIONS.VOLUME,
      value: 1e-6
    }, // 1e-6 L
    cup: {
      base: DIMENSIONS.VOLUME,
      value: 0.0002365882,
      aliases: ['cp', 'cups']
    }, // 236.5882 mL
    pint: {
      base: DIMENSIONS.VOLUME,
      value: 0.0004731765,
      aliases: ['pt', 'pints']
    }, // 473.1765 mL
    quart: {
      base: DIMENSIONS.VOLUME,
      value: 0.0009463529,
      aliases: ['qt', 'quarts']
    }, // 946.3529 mL
    gallon: {
      base: DIMENSIONS.VOLUME,
      value: 0.003785412,
      aliases: ['gal', 'gallons']
    }, // 3.785412 L
    beerbarrel: {
      base: DIMENSIONS.VOLUME,
      value: 0.1173478,
      aliases: ['bbl', 'beerbarrels']
    }, // 117.3478 L
    oilbarrel: {
      base: DIMENSIONS.VOLUME,
      value: 0.1589873,
      aliases: ['obl', 'oilbarrels']
    }, // 158.9873 L
    hogshead: {
      base: DIMENSIONS.VOLUME,
      value: 0.2384810,
      aliases: ['hogsheads']
    }, // 238.4810 L

    // Mass
    g: {
      base: DIMENSIONS.MASS,
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', '', 'k'],
      value: 0.001
    },
    gram: {
      base: DIMENSIONS.MASS,
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', '', 'kilo'],
      value: 0.001
    },

    ton: {
      base: DIMENSIONS.MASS,
      value: 907.18474
    },
    tonne: {
      base: DIMENSIONS.MASS,
      prefixes: 'LONG',
      commonPrefixes: ['', 'kilo', 'mega', 'giga'],
      value: 1000
    },

    grain: {
      base: DIMENSIONS.MASS,
      value: 64.79891e-6,
      aliases: ['gr']
    },
    dram: {
      base: DIMENSIONS.MASS,
      value: 1.7718451953125e-3,
      aliases: ['dr']
    },
    ounce: {
      base: DIMENSIONS.MASS,
      value: 28.349523125e-3,
      aliases: ['oz', 'ounces']
    },
    poundmass: {
      base: DIMENSIONS.MASS,
      value: 453.59237e-3,
      aliases: ['lb', 'lbs', 'lbm', 'poundmasses']
    },
    hundredweight: {
      base: DIMENSIONS.MASS,
      value: 45.359237,
      aliases: ['cwt', 'hundredweights']
    },
    stick: {
      base: DIMENSIONS.MASS,
      value: 115e-3,
      alises: ['sticks']
    },
    stone: {
      base: DIMENSIONS.MASS,
      value: 6.35029318
    },

    // Time
    s: {
      base: DIMENSIONS.TIME,
      prefixes: 'SHORT',
      commonPrefixes: ['f', 'p', 'n', 'u', 'm', ''],
      value: 1,
      aliases: ['sec']
    },
    min: {
      base: DIMENSIONS.TIME,
      value: 60,
      aliases: ['minute', 'minutes']
    },
    h: {
      base: DIMENSIONS.TIME,
      value: 3600,
      aliases: ['hr', 'hrs', 'hour', 'hours']
    },
    second: {
      base: DIMENSIONS.TIME,
      prefixes: 'LONG',
      commonPrefixes: ['femto', 'pico', 'nano', 'micro', 'milli', ''],
      value: 1,
      aliases: ['seconds']
    },
    day: {
      base: DIMENSIONS.TIME,
      value: 86400,
      aliases: ['days']
    },
    week: {
      base: DIMENSIONS.TIME,
      value: 7 * 86400,
      alises: ['weeks']
    },
    month: {
      base: DIMENSIONS.TIME,
      value: 2629800, // 1/12th of Julian year
      aliases: ['months']
    },
    year: {
      base: DIMENSIONS.TIME,
      value: 31557600, // Julian year
      aliases: ['year']
    },
    decade: {
      base: DIMENSIONS.TIME,
      value: 315576000, // Julian decade
      aliases: ['decades']
    },
    century: {
      base: DIMENSIONS.TIME,
      value: 3155760000, // Julian century
      aliases: ['centuries']
    },
    millennium: {
      base: DIMENSIONS.TIME,
      value: 31557600000, // Julian millennium
      aliases: ['millennia']
    },

    // Frequency
    hertz: {
      base: DIMENSIONS.FREQUENCY,
      prefixes: 'LONG',
      commonPrefixes: ['', 'kilo', 'mega', 'giga', 'tera'],
      value: 1,
      offset: 0,
      reciprocal: true
    },
    Hz: {
      base: DIMENSIONS.FREQUENCY,
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k', 'M', 'G', 'T'],
      value: 1,
      offset: 0,
      reciprocal: true
    },

    // Angle
    rad: {
      base: DIMENSIONS.ANGLE,
      prefixes: 'SHORT',
      commonPrefixes: ['m', ''],
      value: 1
    },
    radian: {
      base: DIMENSIONS.ANGLE,
      prefixes: 'LONG',
      commonPrefixes: ['milli', ''],
      value: 1,
      aliases: ['radians']
    },
    sr: {
      base: DIMENSIONS.SOLID_ANGLE,
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', ''],
      value: 1,
      offset: 0
    },
    steradian: {
      base: DIMENSIONS.SOLID_ANGLE,
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', ''],
      value: 1,
      offset: 0,
      aliases: ['steradians']
    },
    deg: {
      base: DIMENSIONS.ANGLE,
      value: Math.PI / 180,
      aliases: ['degree', 'degrees']
    },
    grad: {
      base: DIMENSIONS.ANGLE,
      prefixes: 'SHORT',
      commonPrefixes: ['c'],
      value: Math.PI / 200
    },
    gradian: {
      base: DIMENSIONS.ANGLE,
      prefixes: 'LONG',
      commonPrefixes: ['centi', ''],
      value: Math.PI / 200,
      aliases: ['gradians']
    },
    cycle: {
      base: DIMENSIONS.ANGLE,
      value: 2 * Math.pi,
      aliases: ['cycles']
    },
    // arcsec = rad / (3600 * (360 / 2 * pi)) = rad / 0.0000048481368110953599358991410235795
    arcsec: {
      base: DIMENSIONS.ANGLE,
      value: 0.05 / Math.pi,
      aliases: ['arcsecond', 'arcseconds']
    },
    // arcmin = rad / (60 * (360 / 2 * pi)) = rad / 0.00029088820866572159615394846141477
    arcmin: {
      base: DIMENSIONS.ANGLE,
      value: 3 / Math.pi,
      aliases: ['arcminute', 'arcminutes']
    },

    // Electric current
    A: {
      base: DIMENSIONS.CURRENT,
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', '', 'k'],
      value: 1
    },
    ampere: {
      base: DIMENSIONS.CURRENT,
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', '', 'kilo'],
      value: 1,
      aliases: ['amperes']
    },

    // Temperature
    // K(C) = °C + 273.15
    // K(F) = (°F + 459.67) / 1.8
    // K(R) = °R / 1.8
    K: {
      base: DIMENSIONS.TEMPERATURE,
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 1
    },
    degC: {
      base: DIMENSIONS.TEMPERATURE,
      value: 1,
      offset: 273.15
    },
    degF: {
      base: DIMENSIONS.TEMPERATURE,
      value: 1 / 1.8,
      offset: 459.67
    },
    degR: {
      base: DIMENSIONS.TEMPERATURE,
      value: 1 / 1.8
    },
    kelvin: {
      base: DIMENSIONS.TEMPERATURE,
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: 1
    },
    celsius: {
      base: DIMENSIONS.TEMPERATURE,
      value: 1,
      offset: 273.15
    },
    fahrenheit: {
      base: DIMENSIONS.TEMPERATURE,
      value: 1 / 1.8,
      offset: 459.67
    },
    rankine: {
      base: DIMENSIONS.TEMPERATURE,
      value: 1 / 1.8
    },

    // amount of substance
    mol: {
      base: DIMENSIONS.AMOUNT_OF_SUBSTANCE,
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k'],
      value: 1
    },
    mole: {
      base: DIMENSIONS.AMOUNT_OF_SUBSTANCE,
      prefixes: 'LONG',
      commonPrefixes: ['', 'kilo'],
      value: 1,
      aliases: ['moles']
    },

    // luminous intensity
    cd: {
      base: DIMENSIONS.LUMINOUS_INTENSITY,
      value: 1
    },
    candela: {
      base: DIMENSIONS.LUMINOUS_INTENSITY,
      value: 1
    },

    // luminous flux
    lumen: {
      base: DIMENSIONS.LUMINOUS_FLUX,
      prefixes: 'LONG',
      value: 1,
      aliases: ['lumens']
    },
    lm: {
      base: DIMENSIONS.LUMINOUS_FLUX,
      prefixes: 'SHORT',
      value: 1
    },

    // illuminance
    lux: {
      base: DIMENSIONS.ILLUMINANCE,
      prefixes: 'LONG',
      value: 1
    },
    lx: {
      base: DIMENSIONS.ILLUMINANCE,
      prefixes: 'SHORT',
      value: 1
    },

    // Force
    N: {
      base: DIMENSIONS.FORCE,
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', '', 'k', 'M'], // These could be debatable
      value: 1

    },
    newton: {
      base: DIMENSIONS.FORCE,
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', '', 'kilo', 'mega'],
      value: 1,
      aliases: ['newtons']
    },
    dyn: {
      base: DIMENSIONS.FORCE,
      prefixes: 'SHORT',
      commonPrefixes: ['m', 'k', 'M'],
      value: 0.00001
    },
    dyne: {
      base: DIMENSIONS.FORCE,
      prefixes: 'LONG',
      commonPrefixes: ['milli', 'kilo', 'mega'],
      value: 0.00001
    },
    lbf: {
      base: DIMENSIONS.FORCE,
      value: 4.4482216152605
    },
    poundforce: {
      base: DIMENSIONS.FORCE,
      value: 4.4482216152605
    },
    kip: {
      base: DIMENSIONS.FORCE,
      value: 4448.2216,
      aliases: ['kips']
    },

    // Energy
    J: {
      base: DIMENSIONS.ENERGY,
      prefixes: 'SHORT',
      commonPrefixes: ['m', '', 'k', 'M', 'G'],
      value: 1
    },
    joule: {
      base: DIMENSIONS.ENERGY,
      prefixes: 'SHORT',
      commonPrefixes: ['milli', '', 'kilo', 'mega', 'giga'],
      value: 1,
      aliases: ['joules']
    },
    erg: {
      base: DIMENSIONS.ENERGY,
      value: 1e-7
    },
    Wh: {
      base: DIMENSIONS.ENERGY,
      prefixes: 'SHORT',
      commonPrefixes: ['k', 'M', 'G', 'T'],
      value: 3600
    },
    BTU: {
      base: DIMENSIONS.ENERGY,
      prefixes: 'BTU',
      commonPrefixes: ['', 'MM'],
      value: 1055.05585262,
      aliases: ['BTUs']
    },
    eV: {
      base: DIMENSIONS.ENERGY,
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', '', 'k', 'M', 'G'],
      value: 1.602176565e-19
    },
    electronvolt: {
      base: DIMENSIONS.ENERGY,
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', '', 'kilo', 'mega', 'giga'],
      value: 1.602176565e-19,
      aliases: ['electronvolts']
    },

    // Power
    W: {
      base: DIMENSIONS.POWER,
      prefixes: 'SHORT',
      commonPrefixes: ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T', 'P'],
      value: 1
    },
    watt: {
      base: DIMENSIONS.POWER,
      prefixes: 'LONG',
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', '', 'kilo', 'mega', 'tera', 'peta'],
      value: 1,
      aliases: ['watts']
    },
    hp: {
      base: DIMENSIONS.POWER,
      value: 745.6998715386
    },

    // Electrical power units
    VA: {
      base: DIMENSIONS.POWER,
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k'],
      value: 1
    },

    // Pressure
    Pa: {
      base: DIMENSIONS.PRESSURE,
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k', 'M', 'G'], // 'h' is sometimes used but not often
      value: 1
    },
    psi: {
      base: DIMENSIONS.PRESSURE,
      value: 6894.757293168361
      // kpsi is sometimes used
    },
    atm: {
      base: DIMENSIONS.PRESSURE,
      value: 101325
    },
    bar: {
      base: DIMENSIONS.PRESSURE,
      prefixes: 'SHORT_LONG',
      commonPrefixes: ['m', ''],
      value: 100000
    },
    torr: {
      base: DIMENSIONS.PRESSURE,
      prefixes: 'LONG',
      commonPrefixes: ['milli', ''],
      value: 133.322
    },
    Torr: {
      base: DIMENSIONS.PRESSURE,
      prefixes: 'SHORT',
      commonPrefixes: ['m', ''],
      value: 133.322
    },
    mmHg: {
      base: DIMENSIONS.PRESSURE,
      value: 133.322,
      aliases: ['mmhg']
    },
    mmH2O: {
      base: DIMENSIONS.PRESSURE,
      value: 9.80665,
      aliases: ['mmh2o']
    },
    cmH2O: {
      base: DIMENSIONS.PRESSURE,
      value: 98.0665,
      aliases: ['cmh2o']
    },

    // Electric charge
    coulomb: {
      base: DIMENSIONS.ELECTRIC_CHARGE,
      prefixes: 'LONG',
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
      value: 1,
      aliases: ['coulombs']
    },
    C: {
      base: DIMENSIONS.ELECTRIC_CHARGE,
      prefixes: 'SHORT',
      commonPrefixes: ['p', 'n', 'u', 'm', ''],
      value: 1
    },
    // Electric capacitance
    farad: {
      base: DIMENSIONS.CAPACITANCE,
      prefixes: 'LONG',
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
      value: 1,
      aliases: ['farads']
    },
    F: {
      base: DIMENSIONS.CAPACITANCE,
      prefixes: 'SHORT',
      commonPrefixes: ['p', 'n', 'u', 'm', ''],
      value: 1
    },
    // Electric potential
    volt: {
      base: DIMENSIONS.ELECTRIC_POTENTIAL,
      prefixes: 'LONG',
      commonPrefixes: ['milli', '', 'kilo', 'mega'],
      value: 1,
      aliases: ['volts']
    },
    V: {
      base: DIMENSIONS.ELECTRIC_POTENTIAL,
      prefixes: 'SHORT',
      commonPrefixes: ['m', '', 'k', 'M'],
      value: 1
    },
    // Electric resistance
    ohm: {
      base: DIMENSIONS.RESISTANCE,
      prefixes: 'SHORT_LONG', // Both Mohm and megaohm are acceptable
      commonPrefixes: ['', 'k', 'M'],
      value: 1,
      aliases: ['ohms']
    },
    /*
     * Unicode breaks in browsers if charset is not specified
     * TODO: Allow with config option?
    Ω: {
      base: BASE_UNITS.ELECTRIC_RESISTANCE,
      prefixes: 'SHORT',
      value: 1,
          },
    */
    // Electric inductance
    henry: {
      base: DIMENSIONS.INDUCTANCE,
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', ''], // Just guessing here
      value: 1,
      aliases: ['henries']
    },
    H: {
      base: DIMENSIONS.INDUCTANCE,
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', ''],
      value: 1
    },
    // Electric conductance
    siemens: {
      base: DIMENSIONS.ELECTRICAL_CONDUCTANCE,
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', ''],
      value: 1
    },
    S: {
      base: DIMENSIONS.ELECTRICAL_CONDUCTANCE,
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', ''],
      value: 1
    },
    // Magnetic flux
    weber: {
      base: DIMENSIONS.MAGNETIC_FLUX,
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: 1,
      aliases: ['webers']
    },
    Wb: {
      base: DIMENSIONS.MAGNETIC_FLUX,
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 1
    },
    // Magnetic flux density
    tesla: {
      base: DIMENSIONS.MAGNETIC_FLUX_DENSITY,
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: 1,
      aliases: ['teslas']
    },
    T: {
      base: DIMENSIONS.MAGNETIC_FLUX_DENSITY,
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 1
    },

    // Binary
    // TODO: Figure out how to do SI vs. IEC while formatting
    b: {
      base: DIMENSIONS.BIT,
      prefixes: 'BINARY_SHORT',
      value: 1
    },
    bits: {
      base: DIMENSIONS.BIT,
      prefixes: 'BINARY_LONG',
      value: 1,
      aliases: ['bit']
    },
    B: {
      base: DIMENSIONS.BIT,
      prefixes: 'BINARY_SHORT',
      value: 8
    },
    bytes: {
      base: DIMENSIONS.BIT,
      prefixes: 'BINARY_LONG',
      value: 8,
      aliases: ['byte']
    }
  }

  // Add additional units here.

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
  if (options.system !== 'auto') {
    if (!UNIT_SYSTEMS.hasOwnProperty(options.system)) {
      throw new Error(`Unknown unit system ${options.system}. Available systems are: auto, ${Object.keys(UNIT_SYSTEMS).join(', ')} `)
    }
  }

  // Create aliases
  let keyArr = Object.keys(UNITS)
  for (let i = 0; i < keyArr.length; i++) {
    const unit = UNITS[keyArr[i]]
    const aliases = unit.aliases
    if (aliases) {
      if (aliases.forEach) {
        delete unit.aliases
        aliases.forEach(alias => {
          UNITS[alias] = Object.assign({}, unit)
        // TODO: clone systems and other objects?
        })
      } else {
        throw new Error(`aliases property for unit '${keyArr[i]}' must be an array`)
      }
    }
  }

  // Add unit's name to object
  for (let key in UNITS) {
    UNITS[key].name = key
  }

  // Convert prefixes from string to object
  for (let key in UNITS) {
    const unit = UNITS[key]
    if (unit.prefixes) {
      if (PREFIXES.hasOwnProperty(unit.prefixes)) {
        unit.prefixes = PREFIXES[unit.prefixes]
      } else {
        throw new Error(`Unknown prefixes ${unit.prefixes} for unit ${key}`)
      }
    } else {
      unit.prefixes = PREFIXES['NONE']
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
      // for (let i = 0; i < unit.commonPrefixes.length; i++) {
      //   let s = unit.commonPrefixes[i]
      //   if (!unit.prefixes.hasOwnProperty(s)) {
      //     throw new Error(`In unit ${unit.name}, common prefix ${s} was not found among the allowable prefixes`)
      //   }
      //   unit.commonPrefixes[i] = unit.prefixes[s]
      // }
      // unit.commonPrefixes.sort((a, b) => a.value < b.value ? -1 : 1)
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
      return {
        unit,
        prefix: ''
      }
    }

    for (const name in UNITS) {
      if (UNITS.hasOwnProperty(name)) {
        if (unitString.substring(unitString.length - name.length, unitString.length) === name) {
          const unit = UNITS[name]
          const prefixLen = (unitString.length - name.length)
          const prefix = unitString.substring(0, prefixLen)
          if (unit.prefixes.hasOwnProperty(prefix)) {
            // store unit, prefix, and value
            // console.log(`findUnit(${unitString}): { unit.name: ${unit.name}, prefix: ${prefix} }`)
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
