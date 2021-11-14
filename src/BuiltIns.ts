// A base quantity is a physical quantity in a subset of a given system of quantities that is chosen by convention, where no quantity in the set can be expressed in terms of the others.
// export const baseQuantities = ['MASS', 'LENGTH', 'TIME', 'CURRENT', 'TEMPERATURE', 'LUMINOUS_INTENSITY', 'AMOUNT_OF_SUBSTANCE', 'ANGLE', 'BIT', 'SOLID_ANGLE']

import { UnitProps } from "./types"

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
export const systems = <const>{
  si: ['m', 'meter', 's', 'A', 'kg', 'K', 'mol', 'rad', 'b', 'F', 'C', 'S', 'V', 'J', 'N', 'Hz', 'ohm', 'H', 'cd', 'lm', 'lx', 'Wb', 'T', 'W', 'Pa', 'ohm', 'sr', 'm^2'],
  cgs: ['cm', 's', 'A', 'g', 'K', 'mol', 'rad', 'b', 'F', 'C', 'S', 'V', 'erg', 'dyn', 'Hz', 'ohm', 'H', 'cd', 'lm', 'lx', 'Wb', 'T', 'Pa', 'ohm', 'sr'],
  us: ['ft', 's', 'A', 'lbm', 'degF', 'mol', 'rad', 'b', 'F', 'C', 'S', 'V', 'BTU', 'lbf', 'Hz', 'ohm', 'H', 'cd', 'lm', 'lx', 'Wb', 'T', 'psi', 'ohm', 'sr', 'hp', 'mi', 'mile']
}

// Units may or may not use one of the prefix sets (SHORT, LONG, etc).
export const prefixes = {
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
  },
  SHORT_LONG: {} as { [s: string]: number },
  BINARY_SHORT: {} as { [s: string]: number },
  BINARY_LONG: {} as { [s: string]: number }
}

// Additional prefix sets
prefixes.SHORT_LONG = Object.assign({}, prefixes.SHORT, prefixes.LONG)
prefixes.BINARY_SHORT = Object.assign({}, prefixes.BINARY_SHORT_SI, prefixes.BINARY_SHORT_IEC)
prefixes.BINARY_LONG = Object.assign({}, prefixes.BINARY_LONG_SI, prefixes.BINARY_LONG_IEC)

// Units are a set measure of a particular quantity. Below, each key of UNITS is a different unit. Each unit may be
// defined using a base quantity, such as LENGTH, or it may be defined in terms of other units. The unit may also
// include `prefixes`, which specify which prefix set will be used for parsing the unit, and `commonPrefixes`, which
// specifies which prefixes will be used when formatting that unit.
export const units: Record<string, UnitProps> = {
  '': {
    quantity: 'UNITLESS',
    value: 1
  },

  // length
  m: {
    quantity: 'LENGTH',
    prefixSet: 'SHORT',
    formatPrefixes: ['n', 'u', 'm', 'c', '', 'k'],
    value: 1
  },
  meter: {
    prefixSet: 'LONG',
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
  m2: {
    prefixSet: 'SQUARED',
    formatPrefixes: ['m', 'c', '', 'k'],
    value: '1 m^2'
  },
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
  m3: {
    prefixSet: 'CUBIC',
    formatPrefixes: ['m', 'c', '', 'k'],
    value: '1 m^3'
  },
  L: {
    prefixSet: 'SHORT',
    formatPrefixes: ['n', 'u', 'm', ''],
    value: '1e-3 m^3',
    aliases: ['l', 'lt']
  }, // litre
  litre: {
    prefixSet: 'LONG',
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
    prefixSet: 'SHORT',
    formatPrefixes: ['n', 'u', 'm', '', 'k'],
    value: 0.001,
    basePrefix: 'k' // Treat as if 'kg' is the base unit, not 'g'
  },
  gram: {
    prefixSet: 'LONG',
    formatPrefixes: ['nano', 'micro', 'milli', '', 'kilo'],
    value: '1 g'
  },

  poundmass: {
    value: '0.45359237 kg',
    aliases: ['lb', 'lbs', 'lbm', 'poundmasses']
  },
  ton: { value: '2000 lbm' },
  tonne: {
    prefixSet: 'LONG',
    formatPrefixes: ['', 'kilo', 'mega', 'giga'],
    value: '1000 kg'
  },
  t: {
    prefixSet: 'SHORT',
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
    prefixSet: 'SHORT',
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
    prefixSet: 'LONG',
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
    value: '30.4375 day', // 1/12th of Julian year
    aliases: ['months']
  },
  year: {
    value: '365.25 day', // Julian year
    aliases: ['years']
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
    prefixSet: 'LONG',
    formatPrefixes: ['', 'kilo', 'mega', 'giga', 'tera'],
    value: '1/s'
  },
  Hz: {
    prefixSet: 'SHORT',
    formatPrefixes: ['', 'k', 'M', 'G', 'T'],
    value: '1 hertz'
  },

  // Angle
  rad: {
    quantity: 'ANGLE',
    prefixSet: 'SHORT',
    formatPrefixes: ['m', ''],
    value: 1
  },
  radian: {
    prefixSet: 'LONG',
    formatPrefixes: ['milli', ''],
    value: '1 rad',
    aliases: ['radians']
  },
  sr: {
    quantity: 'SOLID_ANGLE',
    prefixSet: 'SHORT',
    formatPrefixes: ['u', 'm', ''],
    value: 1
  },
  steradian: {
    prefixSet: 'LONG',
    formatPrefixes: ['micro', 'milli', ''],
    value: '1 sr',
    aliases: ['steradians']
  },
  deg: {
    value: [Math.PI / 180, 'rad'],
    aliases: ['degree', 'degrees']
  },
  grad: {
    prefixSet: 'SHORT',
    formatPrefixes: ['c'],
    value: [Math.PI / 200, 'rad']
  },
  gradian: {
    prefixSet: 'LONG',
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
    prefixSet: 'SHORT',
    formatPrefixes: ['u', 'm', '', 'k'],
    value: 1
  },
  ampere: {
    prefixSet: 'LONG',
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
    prefixSet: 'SHORT',
    formatPrefixes: ['n', 'u', 'm', ''],
    value: 1
  },
  kelvin: {
    prefixSet: 'LONG',
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
    prefixSet: 'SHORT',
    formatPrefixes: ['', 'k'],
    value: 1
  },
  mole: {
    prefixSet: 'LONG',
    formatPrefixes: ['', 'kilo'],
    value: '1 mol',
    aliases: ['moles']
  },

  // luminous intensity
  cd: {
    quantity: 'LUMINOUS_INTENSITY',
    value: 1,
    prefixSet: 'SHORT',
    formatPrefixes: ['', 'm']
  },
  candela: {
    value: '1 cd',
    prefixSet: 'LONG',
    formatPrefixes: ['', 'milli']
  },

  // luminous flux
  lumen: {
    prefixSet: 'LONG',
    value: '1 cd sr',
    aliases: ['lumens']
  },
  lm: {
    prefixSet: 'SHORT',
    value: '1 lumen'
  },

  // illuminance
  lux: {
    prefixSet: 'LONG',
    value: '1 cd/m^2'
  },
  lx: {
    prefixSet: 'SHORT',
    value: '1 lux'
  },

  // Force
  N: {
    prefixSet: 'SHORT',
    formatPrefixes: ['u', 'm', '', 'k', 'M'], // These could be debatable
    value: '1 kg m/s^2'
  },
  newton: {
    prefixSet: 'LONG',
    formatPrefixes: ['micro', 'milli', '', 'kilo', 'mega'],
    value: '1 N',
    aliases: ['newtons']
  },
  dyn: {
    prefixSet: 'SHORT',
    formatPrefixes: ['m', 'k', 'M'],
    value: '1 g cm/s^2'
  },
  dyne: {
    prefixSet: 'LONG',
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
    prefixSet: 'SHORT',
    formatPrefixes: ['m', '', 'k', 'M', 'G'],
    value: '1 N m'
  },
  joule: {
    prefixSet: 'LONG',
    formatPrefixes: ['milli', '', 'kilo', 'mega', 'giga'],
    value: '1 J',
    aliases: ['joules']
  },
  erg: {
    value: '1 dyn cm'
  },
  Wh: {
    prefixSet: 'SHORT',
    formatPrefixes: ['k', 'M', 'G', 'T'],
    value: '1 W hr'
  },
  BTU: {
    prefixSet: 'BTU',
    formatPrefixes: ['', 'MM'],
    value: '1055.05585262 J',
    aliases: ['BTUs']
  },
  eV: {
    prefixSet: 'SHORT',
    formatPrefixes: ['u', 'm', '', 'k', 'M', 'G'],
    value: '1.602176565e-19 J'
  },
  electronvolt: {
    prefixSet: 'LONG',
    formatPrefixes: ['micro', 'milli', '', 'kilo', 'mega', 'giga'],
    value: '1 eV',
    aliases: ['electronvolts']
  },

  // Power
  W: {
    prefixSet: 'SHORT',
    formatPrefixes: ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T', 'P'],
    value: '1 J/s'
  },
  watt: {
    prefixSet: 'LONG',
    formatPrefixes: ['pico', 'nano', 'micro', 'milli', '', 'kilo', 'mega', 'tera', 'peta'],
    value: '1 W',
    aliases: ['watts']
  },
  hp: { value: '550 ft lbf / s' },

  // Electrical power units
  VA: {
    prefixSet: 'SHORT',
    formatPrefixes: ['', 'k'],
    value: '1 W'
  },

  // Pressure
  Pa: {
    prefixSet: 'SHORT',
    formatPrefixes: ['', 'k', 'M', 'G'], // 'h' is sometimes used but not often
    value: '1 N / m^2'
  },
  psi: {
    value: '1 lbf/in^2'
    // kpsi is sometimes used
  },
  atm: { value: '101325 Pa' },
  bar: {
    prefixSet: 'SHORT_LONG',
    formatPrefixes: ['m', ''],
    value: '1e5 Pa'
  },
  torr: {
    prefixSet: 'LONG',
    formatPrefixes: ['milli', ''],
    value: '133.32236842105263 Pa'
  },
  Torr: {
    prefixSet: 'SHORT',
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
    prefixSet: 'SHORT',
    formatPrefixes: ['p', 'n', 'u', 'm', ''],
    value: '1 A s'
  },
  coulomb: {
    prefixSet: 'LONG',
    formatPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
    value: '1 C',
    aliases: ['coulombs']
  },

  // Electric potential
  V: {
    prefixSet: 'SHORT',
    formatPrefixes: ['m', '', 'k', 'M'],
    value: '1 W/A'
  },
  volt: {
    prefixSet: 'LONG',
    formatPrefixes: ['milli', '', 'kilo', 'mega'],
    value: '1 V',
    aliases: ['volts']
  },
  // Electric capacitance
  F: {
    prefixSet: 'SHORT',
    formatPrefixes: ['p', 'n', 'u', 'm', ''],
    value: '1 C/V'
  },
  farad: {
    prefixSet: 'LONG',
    formatPrefixes: ['pico', 'nano', 'micro', 'milli', ''],
    value: '1 F',
    aliases: ['farads']
  },

  // Electric resistance
  ohm: {
    prefixSet: 'SHORT_LONG', // Both Mohm and megaohm are acceptable
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
    prefixSet: 'SHORT',
    formatPrefixes: ['u', 'm', ''],
    value: '1 V s / A'
  },
  henry: {
    prefixSet: 'LONG',
    formatPrefixes: ['micro', 'milli', ''], // Just guessing here
    value: '1 H',
    aliases: ['henries']
  },
  // Electric conductance
  S: {
    prefixSet: 'SHORT',
    formatPrefixes: ['u', 'm', ''],
    value: '1 / ohm'
  },
  siemens: {
    prefixSet: 'LONG',
    formatPrefixes: ['micro', 'milli', ''],
    value: '1 S'
  },
  // Magnetic flux
  Wb: {
    prefixSet: 'SHORT',
    formatPrefixes: ['n', 'u', 'm', ''],
    value: '1 V s'
  },
  weber: {
    prefixSet: 'LONG',
    formatPrefixes: ['nano', 'micro', 'milli', ''],
    value: '1 Wb',
    aliases: ['webers']
  },
  // Magnetic flux density
  T: {
    prefixSet: 'SHORT',
    formatPrefixes: ['n', 'u', 'm', ''],
    value: '1 N s / C m'
  },
  tesla: {
    prefixSet: 'LONG',
    formatPrefixes: ['nano', 'micro', 'milli', ''],
    value: '1 T',
    aliases: ['teslas']
  },

  // Binary
  // TODO: Figure out how to do SI vs. IEC while formatting
  b: {
    quantity: 'BIT',
    prefixSet: 'BINARY_SHORT',
    value: 1
  },
  bits: {
    prefixSet: 'BINARY_LONG',
    value: '1 b',
    aliases: ['bit']
  },
  B: {
    prefixSet: 'BINARY_SHORT',
    value: '8 b'
  },
  bytes: {
    prefixSet: 'BINARY_LONG',
    value: '1 B',
    aliases: ['byte']
  }
}
