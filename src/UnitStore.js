import createParser from './Parser.js'
import { normalize } from './utils.js'

/**
 * Creates a new unit store.
 * @param {Object} options
 */
export default function createUnitStore (options) {
  /* Units are defined by these objects:
   * PREFIXES
   * BASE_DIMENSIONS
   * DIMENSIONS
   * UNITS
   * UNIT_SYSTEMS
   */

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

  const DIMENSIONS = {
    UNITLESS: '',
    ABSEMENT: 'LENGTH TIME',
    ACCELERATION: 'LENGTH TIME^-2',
    ANGULAR_ACCELERATION: 'TIME^-2 ANGLE',
    ANGULAR_MOMENTUM: 'MASS LENGTH^2 TIME^-1 ANGLE',
    ANGULAR_VELOCITY: 'TIME^-1 ANGLE',
    AREA: 'LENGTH^2',
    AREA_DENSITY: 'MASS LENGTH^-2',
    BIT_RATE: 'TIME^-1 BIT',
    CAPACITANCE: 'MASS^-1 LENGTH^-2 TIME^4 CURRENT^2',
    CURRENT_DENSITY: 'LENGTH^-2 CURRENT',
    DYNAMIC_VISCOSITY: 'MASS LENGTH^-1 TIME^-1',
    ELECTRIC_CHARGE: 'TIME CURRENT',
    ELECTRIC_CHARGE_DENSITY: 'LENGTH^-3 TIME CURRENT',
    ELECTRIC_DISPLACEMENT: 'LENGTH^-2 TIME CURRENT',
    ELECTRIC_FIELD_STRENGTH: 'MASS LENGTH TIME^-3 CURRENT^-1',
    ELECTRICAL_CONDUCTANCE: 'MASS^-1 LENGTH^-2 TIME^3 CURRENT^2',
    ELECTRICAL_CONDUCTIVITY: 'MASS^-1 LENGTH^-3 TIME^3 CURRENT^2',
    ELECTRIC_POTENTIAL: 'MASS LENGTH^2 TIME^-3 CURRENT^-1',
    RESISTANCE: 'MASS LENGTH^2 TIME^-3 CURRENT^-2',
    ELECTRICAL_RESISTIVITY: 'MASS LENGTH^3 TIME^-3 CURRENT^-2',
    ENERGY: 'MASS LENGTH^2 TIME^-2',
    ENTROPY: 'MASS LENGTH^2 TIME^-2 TEMPERATURE^-1',
    FORCE: 'MASS LENGTH TIME^-2',
    FREQUENCY: 'TIME^-1',
    HEAT_CAPACITY: 'MASS LENGTH^2 TIME^-2 TEMPERATURE^-1',
    HEAT_FLUX_DENSITY: 'MASS TIME^-3',
    ILLUMINANCE: 'LENGTH^-2 LUMINOUS_INTENSITY',
    IMPEDANCE: 'MASS LENGTH^2 TIME^-3 CURRENT^-2',
    IMPULSE: 'MASS LENGTH TIME^-1',
    INDUCTANCE: 'MASS LENGTH^2 TIME^-2 CURRENT^-2',
    IRRADIANCE: 'MASS TIME^-3',
    JERK: 'LENGTH TIME^-3',
    KINEMATIC_VISCOSITY: 'LENGTH^2 TIME^-1',
    LINEAR_DENSITY: 'MASS LENGTH^-1',
    LUMINOUS_FLUX: 'LUMINOUS_INTENSITY SOLID_ANGLE^-1',
    MAGNETIC_FIELD_STRENGTH: 'LENGTH^-1 CURRENT',
    MAGNETIC_FLUX: 'MASS LENGTH^2 TIME^-2 CURRENT^-1',
    MAGNETIC_FLUX_DENSITY: 'MASS TIME^-2 CURRENT^-1',
    MOLAR_CONCENTRATION: 'LENGTH^-3 AMOUNT_OF_SUBSTANCE',
    MOLAR_ENERGY: 'MASS LENGTH^2 TIME^-2 AMOUNT_OF_SUBSTANCE^-1',
    MOLAR_ENTROPY: 'MASS LENGTH^2 TIME^-2 TEMPERATURE^-1 AMOUNT_OF_SUBSTANCE^-1',
    MOLAR_HEAT_CAPACITY: 'MASS LENGTH^2 TIME^-2 TEMPERATURE^-1 AMOUNT_OF_SUBSTANCE^-1',
    MOMENT_OF_INERTIA: 'MASS LENGTH^2',
    MOMENTUM: 'MASS LENGTH TIME^-1',
    PERMEABILITY: 'MASS LENGTH TIME^-2 CURRENT^-2',
    PERMITTIVITY: 'MASS^-1 LENGTH^-3 TIME^4 CURRENT^2 ',
    POWER: 'MASS LENGTH^2 TIME^-3',
    PRESSURE: 'MASS LENGTH^-1 TIME^-2',
    RELUCTANCE: 'MASS^-1 LENGTH^-2 TIME^2 CURRENT^2',
    SPECIFIC_ENERGY: 'LENGTH^2 TIME^-2',
    SPECIFIC_HEAT_CAPACITY: 'LENGTH^2 TIME^-2 TEMPERATURE^-1',
    SPECIFIC_VOLUME: 'MASS^-1 LENGTH^3',
    SPIN: 'MASS LENGTH^2 TIME^-1',
    SURFACE_TENSION: 'MASS TIME^-2',
    TEMPERATURE_GRADIENT: 'LENGTH^-1 TEMPERATURE',
    THERMAL_CONDUCTIVITY: 'MASS LENGTH TIME^-3 TEMPERATURE^-1',
    TORQUE: 'MASS LENGTH^2 TIME^-2', // TODO: Should this have a radian in it somewhere?
    VELOCITY: 'LENGTH TIME^-1',
    VOLUME: 'LENGTH^3',
    VOLUMETRIC_FLOW_RATE: 'LENGTH^3 TIME^-1'
  }

  /* eslint-disable no-multi-spaces, key-spacing, standard/array-bracket-even-spacing */
  // const DIMENSIONS = {
  //   UNITLESS:                { dimensions: [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   MASS:                    { dimensions: [ 1,  0,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   LENGTH:                  { dimensions: [ 0,  1,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   TIME:                    { dimensions: [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  0] },
  //   CURRENT:                 { dimensions: [ 0,  0,  0,  1,  0,  0,  0,  0,  0,  0] },
  //   TEMPERATURE:             { dimensions: [ 0,  0,  0,  0,  1,  0,  0,  0,  0,  0] },
  //   LUMINOUS_INTENSITY:      { dimensions: [ 0,  0,  0,  0,  0,  1,  0,  0,  0,  0] },
  //   AMOUNT_OF_SUBSTANCE:     { dimensions: [ 0,  0,  0,  0,  0,  0,  1,  0,  0,  0] },
  //   ANGLE:                   { dimensions: [ 0,  0,  0,  0,  0,  0,  0,  1,  0,  0] },
  //   BIT:                     { dimensions: [ 0,  0,  0,  0,  0,  0,  0,  0,  1,  0] },
  //   SOLID_ANGLE:             { dimensions: [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  1] },

  //   // Derived
  //   ABSEMENT:                { dimensions: [ 0,  1,  1,  0,  0,  0,  0,  0,  0,  0] },
  //   ACCELERATION:            { dimensions: [ 0,  1, -2,  0,  0,  0,  0,  0,  0,  0] },
  //   ANGULAR_ACCELERATION:    { dimensions: [ 0,  0, -2,  0,  0,  0,  0,  1,  0,  0] },
  //   ANGULAR_MOMENTUM:        { dimensions: [ 1,  2, -1,  0,  0,  0,  0,  1,  0,  0] },
  //   ANGULAR_VELOCITY:        { dimensions: [ 0,  0, -1,  0,  0,  0,  0,  1,  0,  0] },
  //   AREA:                    { dimensions: [ 0,  2,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   AREA_DENSITY:            { dimensions: [ 1, -2,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   BIT_RATE:                { dimensions: [ 0,  0, -1,  0,  0,  0,  0,  0,  1,  0] },
  //   CAPACITANCE:             { dimensions: [-1, -2,  4,  2,  0,  0,  0,  0,  0,  0] },
  //   CURRENT_DENSITY:         { dimensions: [ 0, -2,  0,  1,  0,  0,  0,  0,  0,  0] },
  //   DYNAMIC_VISCOSITY:       { dimensions: [ 1, -1, -1,  0,  0,  0,  0,  0,  0,  0] },
  //   ELECTRIC_CHARGE:         { dimensions: [ 0,  0,  1,  1,  0,  0,  0,  0,  0,  0] },
  //   ELECTRIC_CHARGE_DENSITY: { dimensions: [ 0, -3,  1,  1,  0,  0,  0,  0,  0,  0] },
  //   ELECTRIC_DISPLACEMENT:   { dimensions: [ 0, -2,  1,  1,  0,  0,  0,  0,  0,  0] },
  //   ELECTRIC_FIELD_STRENGTH: { dimensions: [ 1,  1, -3, -1,  0,  0,  0,  0,  0,  0] },
  //   ELECTRICAL_CONDUCTANCE:  { dimensions: [-1, -2,  3,  2,  0,  0,  0,  0,  0,  0] },
  //   ELECTRICAL_CONDUCTIVITY: { dimensions: [-1, -3,  3,  2,  0,  0,  0,  0,  0,  0] },
  //   ELECTRIC_POTENTIAL:      { dimensions: [ 1,  2, -3, -1,  0,  0,  0,  0,  0,  0] },
  //   RESISTANCE:              { dimensions: [ 1,  2, -3, -2,  0,  0,  0,  0,  0,  0] },
  //   ELECTRICAL_RESISTIVITY:  { dimensions: [ 1,  3, -3, -2,  0,  0,  0,  0,  0,  0] },
  //   ENERGY:                  { dimensions: [ 1,  2, -2,  0,  0,  0,  0,  0,  0,  0] },
  //   ENTROPY:                 { dimensions: [ 1,  2, -2,  0, -1,  0,  0,  0,  0,  0] },
  //   FORCE:                   { dimensions: [ 1,  1, -2,  0,  0,  0,  0,  0,  0,  0] },
  //   FREQUENCY:               { dimensions: [ 0,  0, -1,  0,  0,  0,  0,  0,  0,  0] },
  //   HEAT_CAPACITY:           { dimensions: [ 1,  2, -2,  0, -1,  0,  0,  0,  0,  0] },
  //   HEAT_FLUX_DENSITY:       { dimensions: [ 1,  0, -3,  0,  0,  0,  0,  0,  0,  0] },
  //   ILLUMINANCE:             { dimensions: [ 0, -2,  0,  0,  0,  1,  0,  0,  0,  0] },
  //   IMPEDANCE:               { dimensions: [ 1,  2, -3, -2,  0,  0,  0,  0,  0,  0] },
  //   IMPULSE:                 { dimensions: [ 1,  1, -1,  0,  0,  0,  0,  0,  0,  0] },
  //   INDUCTANCE:              { dimensions: [ 1,  2, -2, -2,  0,  0,  0,  0,  0,  0] },
  //   IRRADIANCE:              { dimensions: [ 1,  0, -3,  0,  0,  0,  0,  0,  0,  0] },
  //   JERK:                    { dimensions: [ 0,  1, -3,  0,  0,  0,  0,  0,  0,  0] },
  //   KINEMATIC_VISCOSITY:     { dimensions: [ 0,  2, -1,  0,  0,  0,  0,  0,  0,  0] },
  //   LINEAR_DENSITY:          { dimensions: [ 1, -1,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   LUMINOUS_FLUX:           { dimensions: [ 0,  0,  0,  0,  0,  1,  0,  0,  0,  1] },
  //   MAGNETIC_FIELD_STRENGTH: { dimensions: [ 0, -1,  0,  1,  0,  0,  0,  0,  0,  0] },
  //   MAGNETIC_FLUX:           { dimensions: [ 1,  2, -2, -1,  0,  0,  0,  0,  0,  0] },
  //   MAGNETIC_FLUX_DENSITY:   { dimensions: [ 1,  0, -2, -1,  0,  0,  0,  0,  0,  0] },
  //   MOLAR_CONCENTRATION:     { dimensions: [ 0, -3,  0,  0,  0,  0,  1,  0,  0,  0] },
  //   MOLAR_ENERGY:            { dimensions: [ 1,  2, -2,  0,  0,  0, -1,  0,  0,  0] },
  //   MOLAR_ENTROPY:           { dimensions: [ 1,  2, -2,  0, -1,  0, -1,  0,  0,  0] },
  //   MOLAR_HEAT_CAPACITY:     { dimensions: [ 1,  2, -2,  0, -1,  0, -1,  0,  0,  0] },
  //   MOMENT_OF_INERTIA:       { dimensions: [ 1,  2,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   MOMENTUM:                { dimensions: [ 1,  1, -1,  0,  0,  0,  0,  0,  0,  0] },
  //   PERMEABILITY:            { dimensions: [ 1,  1, -2, -2,  0,  0,  0,  0,  0,  0] },
  //   PERMITTIVITY:            { dimensions: [-1, -3,  4,  2,  0,  0,  0,  0,  0,  0] },
  //   POWER:                   { dimensions: [ 1,  2, -3,  0,  0,  0,  0,  0,  0,  0] },
  //   PRESSURE:                { dimensions: [ 1, -1, -2,  0,  0,  0,  0,  0,  0,  0] },
  //   RELUCTANCE:              { dimensions: [-1, -2,  2,  2,  0,  0,  0,  0,  0,  0] },
  //   SPECIFIC_ENERGY:         { dimensions: [ 0,  2, -2,  0,  0,  0,  0,  0,  0,  0] },
  //   SPECIFIC_HEAT_CAPACITY:  { dimensions: [ 0,  2, -2,  0, -1,  0,  0,  0,  0,  0] },
  //   SPECIFIC_VOLUME:         { dimensions: [-1,  3,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   SPIN:                    { dimensions: [ 1,  2, -1,  0,  0,  0,  0,  0,  0,  0] },
  //   SURFACE_TENSION:         { dimensions: [ 1,  0, -2,  0,  0,  0,  0,  0,  0,  0] },
  //   TEMPERATURE_GRADIENT:    { dimensions: [ 0, -1,  0,  0,  1,  0,  0,  0,  0,  0] },
  //   THERMAL_CONDUCTIVITY:    { dimensions: [ 1,  1, -3,  0, -1,  0,  0,  0,  0,  0] },
  //   TORQUE:                  { dimensions: [ 1,  2, -2,  0,  0,  0,  0,  0,  0,  0] },
  //   VELOCITY:                { dimensions: [ 0,  1, -1,  0,  0,  0,  0,  0,  0,  0] },
  //   VOLUME:                  { dimensions: [ 0,  3,  0,  0,  0,  0,  0,  0,  0,  0] },
  //   VOLUMETRIC_FLOW_RATE:    { dimensions: [ 0,  3, -1,  0,  0,  0,  0,  0,  0,  0] }
  // }

  /* eslint-enable no-multi-spaces, key-spacing, standard/array-bracket-even-spacing */

  const UNITS_DEFINITIONS = {
    '': {
      dimension: 'UNITLESS',
      value: 1
    },

    // length
    meter: {
      dimension: 'LENGTH',
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', 'centi', '', 'kilo'],
      value: 1,
      aliases: ['meters']
    },
    inch: {
      value: '0.0254 meter',
      aliases: ['inches', 'in']
    },
    foot: {
      value: '12 inch',
      aliases: ['ft']
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
    m: {
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', 'c', '', 'k'],
      value: '1 meter'
    },
    angstrom: {
      value: '1e-10 m',
      aliases: ['angstroms']
    },

    mil: {
      value: '1e-3 inch'
    },

    // Area
    m2: {
      prefixes: 'SQUARED',
      commonPrefixes: ['m', 'c', '', 'k'],
      value: '1 m^2'
    },
    sqin: '1 in^2',
    sqft: '1 ft^2',
    sqyd: '1 yd^2',
    sqmi: '1 mi^2',
    sqrd: '1 rod^2',
    sqch: '1 chain^2',
    sqmil: '1 mil^2',
    acre: '10 chain^2',
    hectare: '1e4 m^2',

    // Volume
    m3: {
      prefixes: 'CUBIC',
      commonPrefixes: ['m', 'c', '', 'k'],
      value: '1 m^3'
    },
    L: {
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', ''],
      value: '1e-3 m^3',
      aliases: ['l', 'lt']
    }, // litre
    litre: {
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: '1 L',
      aliases: ['liter', 'liters', 'litres']
    },
    cuin: '1 in^3',
    cuft: '1 ft^3',
    cuyd: '1 yd^3',
    teaspoon: {
      value: '5 mL',
      aliases: ['teaspoons', 'tsp']
    },
    tablespoon: {
      value: '3 teaspoon',
      aliases: ['tablespoons', 'tbsp']
    },
    // {name: 'cup', dimension: BASE_UNITS.VOLUME, prefixes: PREFIXES.NONE, value: 0.000240, offset: 0}, // 240 mL  // not possible, we have already another cup
    drop: '0.05 mL',
    gtt: '0.05 mL',

    // Liquid volume
    minim: {
      value: '0.0125 teaspoon',
      aliases: ['minims']
    },
    fluidounce: {
      value: '0.00002957353 mL',
      aliases: ['floz', 'fluidounces']
    },
    fluiddram: {
      value: '0.125 floz',
      aliases: ['fldr', 'fluiddrams']
    },
    cc: '1 cm^3',
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
      dimension: 'MASS',
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', '', 'k'],
      value: 0.001
    },
    gram: {
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', '', 'kilo'],
      value: '1 g'
    },

    poundmass: {
      value: '0.45359237 kg',
      aliases: ['lb', 'lbs', 'lbm', 'poundmasses']
    },
    ton: '2000 lbm',
    tonne: {
      prefixes: 'LONG',
      commonPrefixes: ['', 'kilo', 'mega', 'giga'],
      value: '1000 kg'
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
      alises: ['sticks']
    },
    stone: '14 lbm',

    // Time
    s: {
      dimension: 'TIME',
      prefixes: 'SHORT',
      commonPrefixes: ['f', 'p', 'n', 'u', 'm', ''],
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
      prefixes: 'LONG',
      commonPrefixes: ['femto', 'pico', 'nano', 'micro', 'milli', ''],
      value: '1 s',
      aliases: ['seconds']
    },
    day: {
      value: '24 hr',
      aliases: ['days']
    },
    week: {
      value: '7 day',
      alises: ['weeks']
    },
    month: {
      value: '30.4375 day', // 1/12th of Julian year
      aliases: ['months']
    },
    year: {
      value: '365.25 day', // Julian year
      aliases: ['year']
    },
    decade: {
      value: '10 year', // Julian decade
      aliases: ['decades']
    },
    century: {
      value: '100 year', // Julian century
      aliases: ['centuries']
    },
    millennium: {
      value: '1000 year', // Julian millennium
      aliases: ['millennia']
    },

    // Frequency
    hertz: {
      prefixes: 'LONG',
      commonPrefixes: ['', 'kilo', 'mega', 'giga', 'tera'],
      value: '1/s'
    },
    Hz: {
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k', 'M', 'G', 'T'],
      value: '1 hertz'
    },

    // Angle
    rad: {
      dimension: 'ANGLE',
      prefixes: 'SHORT',
      commonPrefixes: ['m', ''],
      value: 1
    },
    radian: {
      prefixes: 'LONG',
      commonPrefixes: ['milli', ''],
      value: '1 rad',
      aliases: ['radians']
    },
    sr: {
      dimension: 'SOLID_ANGLE',
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', ''],
      value: 1
    },
    steradian: {
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', ''],
      value: '1 sr',
      aliases: ['steradians']
    },
    deg: {
      value: [Math.PI / 180, 'rad'],
      aliases: ['degree', 'degrees']
    },
    grad: {
      prefixes: 'SHORT',
      commonPrefixes: ['c'],
      value: [Math.PI / 200, 'rad']
    },
    gradian: {
      prefixes: 'LONG',
      commonPrefixes: ['centi', ''],
      value: [Math.PI / 200, 'rad'],
      aliases: ['gradians']
    },
    cycle: {
      value: [2 * Math.pi, 'rad'],
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
      dimension: 'CURRENT',
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', '', 'k'],
      value: 1
    },
    ampere: {
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', '', 'kilo'],
      value: '1 A',
      aliases: ['amperes']
    },

    // Temperature
    // K(C) = °C + 273.15
    // K(F) = (°F + 459.67) / 1.8
    // K(R) = °R / 1.8
    K: {
      dimension: 'TEMPERATURE',
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', ''],
      value: 1
    },
    kelvin: {
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', ''],
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
      dimension: 'AMOUNT_OF_SUBSTANCE',
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k'],
      value: 1
    },
    mole: {
      prefixes: 'LONG',
      commonPrefixes: ['', 'kilo'],
      value: '1 mol',
      aliases: ['moles']
    },

    // luminous intensity
    cd: {
      dimension: 'LUMINOUS_INTENSITY',
      value: 1,
      aliases: ['candela']
    },

    // luminous flux
    lumen: {
      prefixes: 'LONG',
      value: '1 cd/sr',
      aliases: ['lumens']
    },
    lm: {
      prefixes: 'SHORT',
      value: '1 lumen'
    },

    // illuminance
    lux: {
      prefixes: 'LONG',
      value: '1 cd/m^2'
    },
    lx: {
      prefixes: 'SHORT',
      value: '1 lux'
    },

    // Force
    N: {
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', '', 'k', 'M'], // These could be debatable
      value: '1 kg m/s^2'
    },
    newton: {
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', '', 'kilo', 'mega'],
      value: '1 N',
      aliases: ['newtons']
    },
    dyn: {
      prefixes: 'SHORT',
      commonPrefixes: ['m', 'k', 'M'],
      value: '1 g cm/s^2'
    },
    dyne: {
      prefixes: 'LONG',
      commonPrefixes: ['milli', 'kilo', 'mega'],
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
      prefixes: 'SHORT',
      commonPrefixes: ['m', '', 'k', 'M', 'G'],
      value: '1 N m'
    },
    joule: {
      prefixes: 'LONG',
      commonPrefixes: ['milli', '', 'kilo', 'mega', 'giga'],
      value: '1 J',
      aliases: ['joules']
    },
    erg: {
      value: '1 dyn cm'
    },
    Wh: {
      prefixes: 'SHORT',
      commonPrefixes: ['k', 'M', 'G', 'T'],
      value: '1 W hr'
    },
    BTU: {
      prefixes: 'BTU',
      commonPrefixes: ['', 'MM'],
      value: '1055.05585262 J',
      aliases: ['BTUs']
    },
    eV: {
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', '', 'k', 'M', 'G'],
      value: '1.602176565e-19 J'
    },
    electronvolt: {
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', '', 'kilo', 'mega', 'giga'],
      value: '1 eV',
      aliases: ['electronvolts']
    },

    // Power
    W: {
      prefixes: 'SHORT',
      commonPrefixes: ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T', 'P'],
      value: '1 J/s'
    },
    watt: {
      prefixes: 'LONG',
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', '', 'kilo', 'mega', 'tera', 'peta'],
      value: '1 W',
      aliases: ['watts']
    },
    hp: '550 ft lbf / s',

    // Electrical power units
    VA: {
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k'],
      value: '1 W'
    },

    // Pressure
    Pa: {
      prefixes: 'SHORT',
      commonPrefixes: ['', 'k', 'M', 'G'], // 'h' is sometimes used but not often
      value: '1 N / m^2'
    },
    psi: {
      value: '1 lbf/in^2'
      // kpsi is sometimes used
    },
    atm: '101325 Pa',
    bar: {
      prefixes: 'SHORT_LONG',
      commonPrefixes: ['m', ''],
      value: '1e5 Pa'
    },
    torr: {
      prefixes: 'LONG',
      commonPrefixes: ['milli', ''],
      value: '133.32236842105263 Pa'
    },
    Torr: {
      prefixes: 'SHORT',
      commonPrefixes: ['m', ''],
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
      prefixes: 'SHORT',
      commonPrefixes: ['p', 'n', 'u', 'm', ''],
      value: '1 A s'
    },
    coulomb: {
      prefixes: 'LONG',
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
      value: '1 C',
      aliases: ['coulombs']
    },

    // Electric potential
    V: {
      prefixes: 'SHORT',
      commonPrefixes: ['m', '', 'k', 'M'],
      value: '1 W/A'
    },
    volt: {
      prefixes: 'LONG',
      commonPrefixes: ['milli', '', 'kilo', 'mega'],
      value: '1 V',
      aliases: ['volts']
    },
    // Electric capacitance
    F: {
      prefixes: 'SHORT',
      commonPrefixes: ['p', 'n', 'u', 'm', ''],
      value: '1 C/V'
    },
    farad: {
      prefixes: 'LONG',
      commonPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
      value: '1 F',
      aliases: ['farads']
    },

    // Electric resistance
    ohm: {
      prefixes: 'SHORT_LONG', // Both Mohm and megaohm are acceptable
      commonPrefixes: ['', 'k', 'M'],
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
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', ''],
      value: '1 V s / A'
    },
    henry: {
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', ''], // Just guessing here
      value: '1 H',
      aliases: ['henries']
    },
    // Electric conductance
    S: {
      prefixes: 'SHORT',
      commonPrefixes: ['u', 'm', ''],
      value: '1 / ohm'
    },
    siemens: {
      prefixes: 'LONG',
      commonPrefixes: ['micro', 'milli', ''],
      value: '1 S'
    },
    // Magnetic flux
    Wb: {
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', ''],
      value: '1 V s'
    },
    weber: {
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: '1 Wb',
      aliases: ['webers']
    },
    // Magnetic flux density
    T: {
      prefixes: 'SHORT',
      commonPrefixes: ['n', 'u', 'm', ''],
      value: '1 N s / C m'
    },
    tesla: {
      prefixes: 'LONG',
      commonPrefixes: ['nano', 'micro', 'milli', ''],
      value: '1 T',
      aliases: ['teslas']
    },

    // Binary
    // TODO: Figure out how to do SI vs. IEC while formatting
    b: {
      dimension: 'BIT',
      prefixes: 'BINARY_SHORT',
      value: 1
    },
    bits: {
      prefixes: 'BINARY_LONG',
      value: '1 b',
      aliases: ['bit']
    },
    B: {
      prefixes: 'BINARY_SHORT',
      value: '8 b'
    },
    bytes: {
      prefixes: 'BINARY_LONG',
      value: '1 B',
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

  /* All of the prefixes, bases, dimensions, units, and unit systems have now been defined.
   *
   * We will perform the following processing steps to prepare the UnitStore for use:
   *
   * - For each DIMENSION, parse its value and replace it with an object of form { key: String, dimension: array }, where `key` is the name of the dimension and each index of `dimension` corresponds to the base dimensions index in BASE_DIMENSIONS, and the value of each element is the power (exponent) of that base in the dimension.
   *
   * - Initialize the parser with an empty set of units.
   *
   * - Loop through the units. If the unit has a `base` property, initialize that unit with base's dimension, and the given value property, making sure no other units have the same base. If the unit does not, then parse the unit's value property (which is either a string or an two-element array) using the parser, and create the dimensions and value from the resulting Unit. Create the unit with the name, dimensions, value, offset, prefixes, and commonPrefixes properties. Convert the prefixes from a string to the associate object from the PREFIXES object.
   *
   * - Some units will fail to be parsed if the UNITS object keys are not enumerated in the optimal order. Repeat the loop until all units have been converted.
   *
   * - Verify that each unit's commonPrefixes are contained in prefixes.
   *
   * - Loop through the UNIT_SYSTEMS and converts the strings into unit/prefix pairs.
   *
   * - Add the unit system names to each unit (as an array) for reverse lookup.
   *
   * - Clone units that have aliases. Shallow copies are acceptable since the resulting UNITS object will be deep-immutable.
   *
*/

  // For each key in DIMENSION, replace the string value with an array, where each index of the array corresponds to the base dimension's index in BASE_DIMENSIONS, and the value of each element is the power (exponent) of that base in the dimension.
  // The dimension string must be a space-delimited list of base dimensions, optionally raised to a power.
  // Example:
  // Before: VELOCITY: 'LENGTH TIME^-1'
  // After: VELOCITY: [1, 0, -1, 0, 0, 0, 0, 0, 0, 0]

  for (let dim in DIMENSIONS) {
    const dimArr = BASE_DIMENSIONS.map(() => 0)
    let bases = DIMENSIONS[dim].split(' ')
    bases.forEach(base => {
      if (base === '') return
      let parts = base.split('^')
      let power = 1
      let idx = BASE_DIMENSIONS.indexOf(parts[0])
      if (idx < 0) {
        throw new Error(`Error processing dimension ${dim}: base dimension ${parts[0]} not found`)
      }
      if (parts[1]) {
        power = parseFloat(parts[1])
        if (isNaN(power)) {
          throw new Error(`Error processing dimension ${dim}: could not determine value of the exponent in string ${base}`)
        }
      }
      dimArr[idx] = power
    })
    DIMENSIONS[dim] = dimArr
  }

  // Also add the base dimensions into DIMENSIONS, for completeness
  BASE_DIMENSIONS.forEach((base, idx) => {
    const dimArr = BASE_DIMENSIONS.map(() => 0)
    dimArr[idx] = 1
    DIMENSIONS[base] = dimArr
  })

  // Prevent modification of the dimensions
  for (const dim in DIMENSIONS) { Object.freeze(DIMENSIONS[dim]) }
  // console.log(DIMENSIONS)

  // console.log(UNITS_DEFINITIONS)

  // Initialize an empty set of units.
  const UNITS = {}

  // Create a parser configured for these options, and also supply it with the findUnit function.
  const parser = createParser(options, findUnit)

  // console.log(parser)

  // Loop through the units. If the unit has a `base` property, initialize that unit with base's dimension, and the given value property, making sure no other units have the same base. If the unit does not, then parse the unit's value property (which is either a string or an two-element array) using the parser, and create the dimensions and value from the resulting Unit. Create the unit with the name, dimensions, value, offset, prefixes, and commonPrefixes properties. Convert the prefixes from a string to the associate object from the PREFIXES object.

  while (true) {
    let unitsAdded = 0
    let unitsSkipped = []
    for (const unitDefKey in UNITS_DEFINITIONS) {
      if (UNITS.hasOwnProperty(unitDefKey)) continue

      const unitDef = UNITS_DEFINITIONS[unitDefKey]

      const containsUnknownPrefix = unitDef.prefixes && !PREFIXES.hasOwnProperty(unitDef.prefixes)
      if (containsUnknownPrefix) {
        throw new Error(`Unknown prefixes ${unitDef.prefixes} for unit ${unitDefKey}`)
      }

      let unitAndAliases = [unitDefKey].concat(unitDef.aliases || [])

      if (unitDef.dimension) {
        // Defining the unit based on a dimension.
        if (!DIMENSIONS.hasOwnProperty(unitDef.dimension)) {
          throw new Error(`Unknown dimension specified for unit ${unitDefKey}: ${unitDef.dimension}`)
        }

        // Add this units and its aliases (they are all the same except for the name)
        unitAndAliases.forEach(newUnitName => {
          const newUnit = {
            name: newUnitName,
            value: unitDef.value,
            offset: unitDef.offset || 0,
            dimensions: DIMENSIONS[unitDef.dimension],
            prefixes: PREFIXES[unitDef.prefixes || 'NONE'],
            commonPrefixes: unitDef.commonPrefixes, // Default should be undefined
            systems: []
          }
          Object.freeze(newUnit)
          UNITS[newUnitName] = newUnit
          unitsAdded++
        })
      } else {
        // Defining the unit based on other units.
        let parsed
        try {
          if (unitDef.hasOwnProperty('value')) {
            if (typeof unitDef.value === 'string') {
              parsed = parser(unitDef.value)
            } else if (Array.isArray(unitDef.value)) {
              parsed = parser(unitDef.value[1])
              parsed.value = unitDef.value[0]
            }
          } else if (typeof unitDef === 'string') {
            parsed = parser(unitDef)
          } else {
            throw new TypeError(`Unit definition for '${unitDefKey}' must be a string, or it must be an object with a value property where the value is a string or a two-element array.`)
          }

          // Add this units and its aliases (they are all the same except for the name)
          unitAndAliases.forEach(newUnitName => {
            const newUnit = {
              name: newUnitName,
              value: normalize(parsed.units, parsed.value, options.type),
              offset: unitDef.offset || 0,
              dimensions: Object.freeze(parsed.dimensions),
              prefixes: PREFIXES[unitDef.prefixes || 'NONE'],
              commonPrefixes: unitDef.commonPrefixes, // Default should be undefined,
              systems: []
            }
            Object.freeze(newUnit)
            UNITS[newUnitName] = newUnit
            unitsAdded++
          })
        } catch (ex) {
          if (/Unit.*not found/.test(ex.toString())) {
            unitsSkipped.push(unitDefKey)
          } else {
            throw new Error(`Could not parse value '${unitDef.value}' of unit ${unitDefKey}: ${ex}`)
          }
        }
      }
    }

    // console.log(`Added ${unitsAdded} units and skipped: ${unitsSkipped.join(', ')}`)
    if (unitsSkipped.length === 0) break
    else if (unitsAdded === 0) {
      throw new Error(`Could not create the following units: ${unitsSkipped.join(', ')}. There is possibly a problem with the unit's definition.`)
    }
  }

  // Check to make sure config options has selected a unit system that exists.
  if (options.system !== 'auto') {
    if (!UNIT_SYSTEMS.hasOwnProperty(options.system)) {
      throw new Error(`Unknown unit system ${options.system}. Available systems are: auto, ${Object.keys(UNIT_SYSTEMS).join(', ')} `)
    }
  }

  // TODO: Check to make sure consistent units were chosen for each dimension in the unit systems

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
    // Check that each commonPrefix is in prefixes
    if (unit.commonPrefixes) {
      for (let i = 0; i < unit.commonPrefixes.length; i++) {
        let s = unit.commonPrefixes[i]
        if (!unit.prefixes.hasOwnProperty(s)) {
          throw new Error(`In unit ${unit.name}, common prefix ${s} was not found among the allowable prefixes`)
        }
      }
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
  return { PREFIXES, BASE_DIMENSIONS, DIMENSIONS, UNIT_SYSTEMS, UNITS, exists, findUnit, parser }
}
