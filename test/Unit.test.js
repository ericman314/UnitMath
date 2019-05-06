import assert from 'assert'
import approx from '../src/approx'
import unit from '../src/Unit'

// TODO: Bring in any other tests that use units from math.js

// TODO: Implement implicit conversion of strings to units in add, sub, mul, etc.

// TODO: Remove once uses of `math`, and `Unit` are removed or these values
//       are imported.
/* global math, Unit */

describe('unitmath', () => {
  describe('unitmath namespace', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof unit, 'function')
    })

    it('should return a unit', () => {
      assert.strictEqual(unit(1, 'm').type, 'Unit')
    })

    it('should have a config method', () => {
      assert.strictEqual(typeof unit.config, 'function')
    })

    it('should be frozen', () => {
      assert.throws(() => { unit.config = 42 })
      assert.throws(() => { unit.foo = 42 })
    })

    it('should have the correct default config options', () => {
      let optionsToCheckEquality = {
        parentheses: false,
        precision: 16,
        prefix: 'auto',
        prefixMin: 0.1,
        prefixMax: 1000,
        simplify: true,
        simplifyThreshold: 2,
        system: 'auto',
        subsystem: 'auto'
      }
      let actualOptions = unit.config()
      for (let key in optionsToCheckEquality) {
        assert.strictEqual(optionsToCheckEquality[key], actualOptions[key], `config option ${key} has the wrong default value`)
      }

      let optionsToCheckExistence = [
        'customAdd',
        'customSub',
        'customMul',
        'customDiv',
        'customPow',
        'customEq',
        'customConv',
        'customClone'
      ]
      optionsToCheckExistence.forEach(key => { assert(actualOptions.hasOwnProperty(key), `${key} does not exist`) })
    })
  })

  describe('config', () => {
    it('should return current config when called with no arguments', () => {
      assert.strictEqual(typeof unit.config(), 'object')
    })

    it('should clone the options argument', () => {
      let options = { prefix: 'always' }
      let newUnit = unit.config(options)
      assert.notStrictEqual(options, newUnit.config())
    })

    it('should freeze the options', () => {
      let newUnit = unit.config({})
      let options = newUnit.config()
      assert.throws(() => { options.prefix = 'always' })
    })

    it('should set new config options', () => {
      let newUnit = unit.config({ prefix: 'always' })
      assert.strictEqual(unit.config().prefix, 'auto')
      assert.strictEqual(newUnit.config().prefix, 'always')
    })

    describe('newly returned namespace', () => {
      it('should be a new unitmath namespace', () => {
        let newUnit = unit.config({})
        assert.notStrictEqual(unit, newUnit)
      })
      it('should create unit instances in a separate prototype chain', () => {
        let newUnit = unit.config({})
        assert.notStrictEqual(unit(1, 'm').add, newUnit(1, 'm').add)
      })
      it('should have a clone of the config options from the first namespace', () => {
        let newUnit = unit.config({})
        assert.notStrictEqual(unit.config(), newUnit.config())
      })
    })
  })

  describe('unit instance', () => {
    it('should have prototype methods add, mul, etc.', () => {
      let u1 = unit(1, 'm')
      let u2 = unit(2, 'kg')
      let fns = ['add', 'mul']
      fns.forEach(fn => {
        assert.strictEqual(typeof u1[fn], 'function')
      })
      assert.strictEqual(u1.add, u2.add)
    })

    it('should be frozen', () => {
      assert(Object.isFrozen(unit(1, 'm')))
    })
  })

  describe('factory function', function () {
    it('should create unit correctly', function () {
      let unit1 = unit()
      assert.strictEqual(unit1.value, null)
      assert.strictEqual(unit1.units.length, 0)

      unit1 = unit(5000, 'cm')
      assert.strictEqual(unit1.value, 5000)
      assert.strictEqual(unit1.units[0].unit.name, 'm')

      unit1 = unit(5, 'kg')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')

      unit1 = unit('kg')
      assert.strictEqual(unit1.value, null)
      assert.strictEqual(unit1.units[0].unit.name, 'g')

      unit1 = unit('10 Hz')
      assert.strictEqual(unit1.value, 10)
      assert.strictEqual(unit1.units[0].unit.name, 'Hz')

      unit1 = unit(9.81, 'kg m/s^2')
      assert.strictEqual(unit1.value, 9.81)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[1].unit.name, 'm')
      assert.strictEqual(unit1.units[2].unit.name, 's')

      unit1 = unit('9.81 kg m/s^2')
      assert.strictEqual(unit1.value, 9.81)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[1].unit.name, 'm')
      assert.strictEqual(unit1.units[2].unit.name, 's')
    })

    it('should combine duplicate units', () => {
      assert.deepStrictEqual(unit('3 kg kg'), unit('3 kg^2'))
      assert.deepStrictEqual(unit('3 kg/kg'), unit('3'))
      assert.deepStrictEqual(unit('3 kg m / s s'), unit('3 kg m / s^2'))
      assert.deepStrictEqual(unit('3 m cm'), unit('0.03 m^2'))
      approx.deepEqual(unit('3 cm m / s minute'), unit('300 cm^2 / s minute'))
    })

    it('should ignore properties on Object.prototype', function () {
      Object.prototype.foo = unit._unitStore.UNITS['meter'] // eslint-disable-line no-extend-native

      assert.throws(function () { console.log(unit(1, 'foo')) }, /Unit "foo" not found/)

      delete Object.prototype.foo
    })

    it('should throw an error if called with wrong type of arguments', function () {
      assert.throws(function () { console.log(unit(0, 'bla')) })
      assert.throws(function () { console.log(unit(0, 3)) })
    })
  })

  describe('exists', function () {
    it('should return true if the string contains unit plus a prefix', function () {
      assert.strictEqual(unit.exists('cm'), true)
      assert.strictEqual(unit.exists('inch'), true)
      assert.strictEqual(unit.exists('kb'), true)
      assert.strictEqual(unit.exists('bla'), false)
      assert.strictEqual(unit.exists('5cm'), false)
    })
  })

  describe('getDimension', function () {
    it('should return the DIMENSION matching this unit', () => {
      assert.deepStrictEqual(unit(5, 'kg m s K A rad bits')._getDimension(), [])
      assert.deepStrictEqual(unit(5)._getDimension(), ['UNITLESS'])
      assert.deepStrictEqual(unit(5, 'm s')._getDimension(), ['ABSEMENT'])
      assert.deepStrictEqual(unit(5, 'm/s^2')._getDimension(), ['ACCELERATION'])
      assert.deepStrictEqual(unit(5, 'deg')._getDimension(), ['ANGLE'])
      assert.deepStrictEqual(unit(5, 'rad/s^2')._getDimension(), ['ANGULAR_ACCELERATION'])
      assert.deepStrictEqual(unit(5, '5 kg m^2 rad/s')._getDimension(), ['ANGULAR_MOMENTUM'])
      assert.deepStrictEqual(unit(5, '5 rad/s')._getDimension(), ['ANGULAR_VELOCITY'])
      assert.deepStrictEqual(unit(5, 'mol')._getDimension(), ['AMOUNT_OF_SUBSTANCE'])
      assert.deepStrictEqual(unit(5, 'm^2')._getDimension(), ['AREA'])
      assert.deepStrictEqual(unit(5, 'kg/m^2')._getDimension(), ['AREA_DENSITY'])
      assert.deepStrictEqual(unit(5, 'kb')._getDimension(), ['BIT'])
      assert.deepStrictEqual(unit(5, 'Gb/s')._getDimension(), ['BIT_RATE'])
      assert.deepStrictEqual(unit(5, 'C/V')._getDimension(), ['CAPACITANCE'])
      assert.deepStrictEqual(unit(5, 'A/m^2')._getDimension(), ['CURRENT_DENSITY'])
      assert.deepStrictEqual(unit(5, 'A')._getDimension(), ['CURRENT'])
      assert.deepStrictEqual(unit(5, 'Pa s')._getDimension(), ['DYNAMIC_VISCOSITY'])
      assert.deepStrictEqual(unit(5, 'C')._getDimension(), ['ELECTRIC_CHARGE'])
      assert.deepStrictEqual(unit(5, 'C/m^3')._getDimension(), ['ELECTRIC_CHARGE_DENSITY'])
      assert.deepStrictEqual(unit(5, 'C/m^2')._getDimension(), ['ELECTRIC_DISPLACEMENT'])
      assert.deepStrictEqual(unit(5, 'V/m')._getDimension(), ['ELECTRIC_FIELD_STRENGTH'])
      assert.deepStrictEqual(unit(5, 'siemens')._getDimension(), ['ELECTRICAL_CONDUCTANCE'])
      assert.deepStrictEqual(unit(5, 'siemens/m')._getDimension(), ['ELECTRICAL_CONDUCTIVITY'])
      assert.deepStrictEqual(unit(5, 'V')._getDimension(), ['ELECTRIC_POTENTIAL'])
      assert.deepStrictEqual(unit(5, 'ohm')._getDimension(), ['RESISTANCE', 'IMPEDANCE'])
      assert.deepStrictEqual(unit(5, 'ohm m')._getDimension(), ['ELECTRICAL_RESISTIVITY'])
      assert.deepStrictEqual(unit(5, 'kg m^2 / s^2')._getDimension(), ['ENERGY', 'TORQUE'])
      assert.deepStrictEqual(unit(5, 'J / K')._getDimension(), ['ENTROPY', 'HEAT_CAPACITY'])
      assert.deepStrictEqual(unit(5, 'kg m / s^2')._getDimension(), ['FORCE'])
      assert.deepStrictEqual(unit(5, 's^-1')._getDimension(), ['FREQUENCY'])
      assert.deepStrictEqual(unit(5, 'W/m^2')._getDimension(), ['HEAT_FLUX_DENSITY', 'IRRADIANCE'])
      assert.deepStrictEqual(unit(5, 'N s')._getDimension(), ['IMPULSE', 'MOMENTUM'])
      assert.deepStrictEqual(unit(5, 'henry')._getDimension(), ['INDUCTANCE'])
      assert.deepStrictEqual(unit(5, 'm/s^3')._getDimension(), ['JERK'])
      assert.deepStrictEqual(unit(5, 'm^2/s')._getDimension(), ['KINEMATIC_VISCOSITY'])
      assert.deepStrictEqual(unit(5, 'cm')._getDimension(), ['LENGTH'])
      assert.deepStrictEqual(unit(5, 'kg/m')._getDimension(), ['LINEAR_DENSITY'])
      assert.deepStrictEqual(unit(5, 'candela')._getDimension(), ['LUMINOUS_INTENSITY'])
      assert.deepStrictEqual(unit(5, 'A/m')._getDimension(), ['MAGNETIC_FIELD_STRENGTH'])
      assert.deepStrictEqual(unit(5, 'tesla m^2')._getDimension(), ['MAGNETIC_FLUX'])
      assert.deepStrictEqual(unit(5, 'tesla')._getDimension(), ['MAGNETIC_FLUX_DENSITY'])
      assert.deepStrictEqual(unit(5, 'lbm')._getDimension(), ['MASS'])
      assert.deepStrictEqual(unit(5, 'mol/m^3')._getDimension(), ['MOLAR_CONCENTRATION'])
      assert.deepStrictEqual(unit(5, 'J/mol')._getDimension(), ['MOLAR_ENERGY'])
      assert.deepStrictEqual(unit(5, 'J/mol K')._getDimension(), ['MOLAR_ENTROPY', 'MOLAR_HEAT_CAPACITY'])
      assert.deepStrictEqual(unit(5, 'H/m')._getDimension(), ['PERMEABILITY'])
      assert.deepStrictEqual(unit(5, 'F/m')._getDimension(), ['PERMITTIVITY'])
      assert.deepStrictEqual(unit(5, 'kg m^2 / s^3')._getDimension(), ['POWER'])
      assert.deepStrictEqual(unit(5, 'kg / m s^2')._getDimension(), ['PRESSURE'])
      assert.deepStrictEqual(unit(5, 'H^-1')._getDimension(), ['RELUCTANCE'])
      assert.deepStrictEqual(unit(5, 'H^-1')._getDimension(), ['RELUCTANCE'])
      assert.deepStrictEqual(unit(5, 'J/kg')._getDimension(), ['SPECIFIC_ENERGY'])
      assert.deepStrictEqual(unit(5, 'J/kg K')._getDimension(), ['SPECIFIC_HEAT_CAPACITY'])
      assert.deepStrictEqual(unit(5, 'm^3/kg')._getDimension(), ['SPECIFIC_VOLUME'])
      assert.deepStrictEqual(unit(5, 'kg m^2/s')._getDimension(), ['SPIN'])
      assert.deepStrictEqual(unit(5, 'J/m^2')._getDimension(), ['SURFACE_TENSION'])
      assert.deepStrictEqual(unit(5, 'K')._getDimension(), ['TEMPERATURE'])
      assert.deepStrictEqual(unit(5, 'K/m')._getDimension(), ['TEMPERATURE_GRADIENT'])
      assert.deepStrictEqual(unit(5, 'W/m K')._getDimension(), ['THERMAL_CONDUCTIVITY'])
      assert.deepStrictEqual(unit(5, 'day')._getDimension(), ['TIME'])
      assert.deepStrictEqual(unit(5, 'm/s')._getDimension(), ['VELOCITY'])
      assert.deepStrictEqual(unit(5, 'm^3')._getDimension(), ['VOLUME'])
      assert.deepStrictEqual(unit(5, 'm^3/s')._getDimension(), ['VOLUMETRIC_FLOW_RATE'])
    })
  })

  describe('hasDimension', function () {
    it('should test whether a unit has a certain dimension', function () {
      assert.strictEqual(unit(5, 'cm')._hasDimension('ANGLE'), false)
      assert.strictEqual(unit(5, 'cm')._hasDimension('LENGTH'), true)
      assert.strictEqual(unit(5, 'kg m / s ^ 2')._hasDimension('FORCE'), true)
    })
  })

  describe('equalDimension', function () {
    it('should test whether two units have the same dimension', function () {
      assert.strictEqual(unit(5, 'cm')._equalDimension(unit(10, 'm')), true)
      assert.strictEqual(unit(5, 'cm')._equalDimension(unit(10, 'kg')), false)
      assert.strictEqual(unit(5, 'N')._equalDimension(unit(10, 'kg m / s ^ 2')), true)
      assert.strictEqual(unit(8.314, 'J / mol K')._equalDimension(unit(0.02366, 'ft^3 psi / mol degF')), true)
    })
  })

  describe('equals', function () {
    it('should test whether two units are equal', function () {
      assert.strictEqual(unit(100, 'cm').equals(unit(1, 'm')), true)
      assert.strictEqual(unit(100, 'cm').equals(unit(2, 'm')), false)
      assert.strictEqual(unit(100, 'cm').equals(unit(1, 'kg')), false)
      assert.strictEqual(unit(100, 'ft lbf').equals(unit(1200, 'in lbf')), true)
      assert.strictEqual(unit(100, 'N').equals(unit(100, 'kg m / s ^ 2')), true)
      assert.strictEqual(unit(100, 'N').equals(unit(100, 'kg m / s')), false)
      assert.strictEqual(unit(100, 'Hz').equals(unit(100, 's ^ -1')), true)
    })

    it('should convert parameter to a unit', () => {
      assert(unit(100, 'cm').equals('1 m'))
      assert(unit('3 kg / kg').equals(3))
    })
  })

  describe('clone', function () {
    it('should clone a unit', function () {
      const u1 = unit(100, 'cm')
      const u2 = u1.clone()
      assert.notStrictEqual(u1, u2)
      assert.deepStrictEqual(u1, u2)

      const u7 = unit(8.314, 'kg m^2 / s^2 K mol')
      const u8 = u7.clone()
      assert.notStrictEqual(u7, u8)
      assert.deepStrictEqual(u7, u8)
    })

    it('should freeze the returned unit', () => {
      assert(Object.isFrozen(unit(100, 'cm').clone()))
    })
  })

  describe('to', function () {
    it('should convert a unit using a target unit string', function () {
      const u1 = unit(5000, 'in')
      assert.strictEqual(u1.value, 5000)
      assert.strictEqual(u1.units[0].unit.name, 'in')
      assert.strictEqual(u1.units[0].prefix.name, '')

      const u2 = u1.to('cm')
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 12700)
      assert.strictEqual(u2.units[0].unit.name, 'm')
      assert.strictEqual(u2.units[0].prefix.name, 'c')

      const u3 = unit(299792.458, 'km/s')
      assert.strictEqual(u3.value, 299792.458)
      assert.strictEqual(u3.units[0].unit.name, 'm')
      assert.strictEqual(u3.units[1].unit.name, 's')
      assert.strictEqual(u3.units[0].prefix.name, 'k')

      const u4 = u3.to('m/s')
      assert.notStrictEqual(u3, u4) // u4 must be a clone
      assert.strictEqual(u4.value, 299792458)
      assert.strictEqual(u4.units[0].unit.name, 'm')
      assert.strictEqual(u4.units[1].unit.name, 's')
      assert.strictEqual(u4.units[0].prefix.name, '')
    })

    it('should convert a unit using a target unit', function () {
      const u1 = unit(5000, 'in')
      assert.strictEqual(u1.value, 5000)
      assert.strictEqual(u1.units[0].unit.name, 'in')
      assert.strictEqual(u1.units[0].prefix.name, '')

      const u2 = u1.to(unit('cm'))
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 12700)
      assert.strictEqual(u2.units[0].unit.name, 'm')
      assert.strictEqual(u2.units[0].prefix.name, 'c')

      const u3 = unit(299792.458, 'km/s')
      assert.strictEqual(u3.value, 299792.458)
      assert.strictEqual(u3.units[0].unit.name, 'm')
      assert.strictEqual(u3.units[1].unit.name, 's')
      assert.strictEqual(u3.units[0].prefix.name, 'k')

      const u4 = u3.to(unit('m/s'))
      assert.notStrictEqual(u3, u4) // u4 must be a clone
      assert.strictEqual(u4.value, 299792458)
      assert.strictEqual(u4.units[0].unit.name, 'm')
      assert.strictEqual(u4.units[1].unit.name, 's')
      assert.strictEqual(u4.units[0].prefix.name, '')
    })

    it('should convert a valueless unit', function () {
      const u1 = unit(null, 'm')
      assert.strictEqual(u1.value, null)
      assert.strictEqual(u1.units[0].unit.name, 'm')
      assert.strictEqual(u1.units[0].prefix.name, '')

      const u2 = u1.to(unit(null, 'cm'))
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 100) // u2 must have a value
      assert.strictEqual(u2.units[0].unit.name, 'm')
      assert.strictEqual(u2.units[0].prefix.name, 'c')

      const u3 = unit(null, 'm/s')
      assert.strictEqual(u3.value, null)
      assert.strictEqual(u3.units[0].unit.name, 'm')
      assert.strictEqual(u3.units[1].unit.name, 's')
      assert.strictEqual(u3.units[0].prefix.name, '')

      const u4 = u3.to(unit(null, 'cm/s'))
      assert.notStrictEqual(u3, u4) // u4 must be a clone
      assert.strictEqual(u4.value, 100) // u4 must have a value
      assert.strictEqual(u4.units[0].unit.name, 'm')
      assert.strictEqual(u4.units[1].unit.name, 's')
      assert.strictEqual(u4.units[0].prefix.name, 'c')
    })

    it('should convert a binary prefixes (1)', function () {
      const u1 = unit(1, 'Kib')
      assert.strictEqual(u1.value, 1)
      assert.strictEqual(u1.units[0].unit.name, 'b')
      assert.strictEqual(u1.units[0].prefix.name, 'Ki')

      const u2 = u1.to(unit(null, 'b'))
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 1024) // u2 must have a value
      assert.strictEqual(u2.units[0].unit.name, 'b')
      assert.strictEqual(u2.units[0].prefix.name, '')

      const u3 = unit(1, 'Kib/s')
      assert.strictEqual(u3.value, 1)
      assert.strictEqual(u3.units[0].unit.name, 'b')
      assert.strictEqual(u3.units[1].unit.name, 's')
      assert.strictEqual(u3.units[0].prefix.name, 'Ki')

      const u4 = u3.to(unit(null, 'b/s'))
      assert.notStrictEqual(u3, u4) // u4 must be a clone
      assert.strictEqual(u4.value, 1024) // u4 must have a value
      assert.strictEqual(u4.units[0].unit.name, 'b')
      assert.strictEqual(u4.units[1].unit.name, 's')
      assert.strictEqual(u4.units[0].prefix.name, '')
    })

    it('should convert a binary prefixes (2)', function () {
      const u1 = unit(1, 'kb')
      assert.strictEqual(u1.value, 1)
      assert.strictEqual(u1.units[0].unit.name, 'b')
      assert.strictEqual(u1.units[0].prefix.name, 'k')

      const u2 = u1.to(unit(null, 'b'))
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 1000) // u2 must have a value
      assert.strictEqual(u2.units[0].unit.name, 'b')
      assert.strictEqual(u2.units[0].prefix.name, '')
    })

    it('should throw an error when converting to an incompatible unit', function () {
      const u1 = unit(5000, 'cm')
      assert.throws(function () { u1.to('kg') }, /dimensions do not match/)
      const u2 = unit(5000, 'N s')
      assert.throws(function () { u2.to('kg^5 / s') }, /dimensions do not match/)
    })

    it('should throw an error when converting to a unit having a value', function () {
      const u1 = unit(5000, 'cm')
      assert.throws(function () { u1.to(unit(4, 'm')) }, /unit must be valueless/)
    })

    it('should throw an error when converting to an unsupported type of argument', function () {
      const u1 = unit(5000, 'cm')
      assert.throws(function () { u1.to(new Date()) }, /Parameter must be a Unit or a string./)
    })
  })

  describe('getUnits', () => {
    it('should return the units only of a unit', () => {
      assert.deepStrictEqual(unit('42 kg / m s^2').getUnits(), unit('kg / m s^2'))
    })
  })

  describe('toString', function () {
    it('should convert to string when no extra simplification is requested', () => {
      assert.strictEqual(unit(5000, 'cm').to().toString(), '5000 cm')
      assert.strictEqual(unit(5, 'kg').to().toString(), '5 kg')
      assert.strictEqual(unit(2 / 3, 'm').to().toString(), '0.6666666666666666 m')
      assert.strictEqual(unit(5, 'N').to().toString(), '5 N')
      assert.strictEqual(unit(5, 'kg^1.0e0 m^1.0e0 s^-2.0e0').to().toString(), '5 kg m / s^2')
      assert.strictEqual(unit(5, 's^-2').to().toString(), '5 s^-2')
      assert.strictEqual(unit(5, 'm / s ^ 2').to().toString(), '5 m / s^2')
      assert.strictEqual(unit(null, 'kg m^2 / s^2 mol').to().toString(), 'kg m^2 / s^2 mol')
      assert.strictEqual(unit(10, 'hertz').to().toString(), '10 hertz')
      assert.strictEqual(unit('3.14 rad').to().toString(), '3.14 rad')
      assert.strictEqual(unit('J / mol K').to().toString(), 'J / mol K')
      assert.strictEqual(unit(2).to().toString(), '2')
      assert.strictEqual(unit().to().toString(), '')
    })

    it('should convert to string properly', function () {
      assert.strictEqual(unit(5, 'kg').toString(), '5 kg')
      assert.strictEqual(unit(2 / 3, 'm').toString(), '0.6666666666666666 m')
      assert.strictEqual(unit(5, 'N').toString(), '5 N')
      assert.strictEqual(unit(5, 'kg^1.0e0 m^1.0e0 s^-2.0e0').toString(), '5 kg m / s^2')
      assert.strictEqual(unit(5, 's^-2').toString(), '5 s^-2')
      assert.strictEqual(unit(5, 'm / s ^ 2').toString(), '5 m / s^2')
      assert.strictEqual(unit(null, 'kg m^2 / s^2 mol').toString(), 'kg m^2 / s^2 mol')
      assert.strictEqual(unit(10, 'hertz').toString(), '10 hertz')
    })

    it('should render with the best prefix', function () {
      assert.strictEqual(unit(0.000001, 'm').format(8), '1 um')
      assert.strictEqual(unit(0.00001, 'm').format(8), '10 um')
      assert.strictEqual(unit(0.0001, 'm').format(8), '0.1 mm')
      assert.strictEqual(unit(0.0005, 'm').format(8), '0.5 mm')
      assert.strictEqual(unit(0.0006, 'm').toString(), '0.6 mm')
      assert.strictEqual(unit(0.001, 'm').toString(), '0.1 cm')
      assert.strictEqual(unit(0.01, 'm').toString(), '1 cm')
      assert.strictEqual(unit(100000, 'm').toString(), '100 km')
      assert.strictEqual(unit(300000, 'm').toString(), '300 km')
      assert.strictEqual(unit(500000, 'm').toString(), '500 km')
      assert.strictEqual(unit(600000, 'm').toString(), '600 km')
      assert.strictEqual(unit(1000000, 'm').toString(), '1000 km')
      assert.strictEqual(unit(10000000, 'm').toString(), '10000 km')
      assert.strictEqual(unit(2000, 'ohm').toString(), '2 kohm')
    })

    it('should keep the original prefix when in range', function () {
      assert.strictEqual(unit(0.0999, 'm').toString(), '9.99 cm')
      assert.strictEqual(unit(0.1, 'm').toString(), '0.1 m')
      assert.strictEqual(unit(0.5, 'm').toString(), '0.5 m')
      assert.strictEqual(unit(0.6, 'm').toString(), '0.6 m')
      assert.strictEqual(unit(1, 'm').toString(), '1 m')
      assert.strictEqual(unit(10, 'm').toString(), '10 m')
      assert.strictEqual(unit(100, 'm').toString(), '100 m')
      assert.strictEqual(unit(300, 'm').toString(), '300 m')
      assert.strictEqual(unit(500, 'm').toString(), '500 m')
      assert.strictEqual(unit(600, 'm').toString(), '600 m')
      assert.strictEqual(unit(1000, 'm').toString(), '1000 m')
      assert.strictEqual(unit(1001, 'm').toString(), '1.001 km')
    })

    it('should render best prefix for a single unit raised to integral power', function () {
      assert.strictEqual(unit(3.2e7, 'm^2').toString(), '32 km^2')
      assert.strictEqual(unit(3.2e-7, 'm^2').toString(), '0.32 mm^2')
      assert.strictEqual(unit(15000, 'm^-1').toString(), '150 cm^-1')
      assert.strictEqual(unit(3e-9, 'm^-2').toString(), '0.003 km^-2')
      assert.strictEqual(unit(3e-9, 'm^-1.5').toString(), '3e-9 m^-1.5')
      assert.strictEqual(unit(2, 'kg^0').toString(), '2')
    })

    it('should not render best prefix if "fixed" by the `to` method', function () {
      const u = unit(5e-3, 'm')
      assert.strictEqual(u.toString(), '0.5 cm')
      const v = u.to()
      assert.strictEqual(v.toString(), '0.005 m')
    })
  })

  describe('simplify', function () {
    it('should not simplify units fixed by the to() method', function () {
      const unit1 = unit(10, 'kg m/s^2').to()
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[1].unit.name, 'm')
      assert.strictEqual(unit1.units[2].unit.name, 's')
      assert.strictEqual(unit1.toString(), '10 kg m / s^2')
    })

    it('should only simplify units with values', function () {
      let unit1 = unit(null, 'kg m mol / s^2 mol')
      assert.strictEqual(unit1.toString(), 'kg m / s^2')
      unit1 = unit1.mul(1)
      assert.strictEqual(unit1.toString(), '1 N')
    })

    it('should simplify units when they cancel out', function () {
      const unit1 = unit(2, 'Hz')
      const unit2 = unit(2, 's')
      const unit3 = unit1.mul(unit2)
      assert.strictEqual(unit3.toString(), '4')
      assert.strictEqual(unit3.units.length, 0)

      const nounit = unit('40m').mul('40N').div('40J')
      assert.strictEqual(nounit.toString(), '40')
      assert.strictEqual(nounit.units.length, 0)

    })

    it('should simplify units according to chosen unit system', function () {

      let unit1 = unit.config({system: 'us'})('10 N')
      assert.strictEqual(unit1.toString(), '2.248089430997105 lbf')
      assert.strictEqual(unit1.units[0].unit.name, 'lbf')

      let unit2 = unit.config({system: 'cgs'})('10 N')
      assert.strictEqual(unit2.toString(), '1 Mdyn')
      assert.strictEqual(unit2.units[0].unit.name, 'dyn')
    })

    it('should correctly simplify units when unit system is "auto"', function () {
      const unit1 = unit(5, 'lbf min / s')
      assert.strictEqual(unit1.simplify().toString(), '300 lbf')
    })

    it.skip('should simplify user-defined units when unit system is "auto"', function () {
      Unit.setUnitSystem('auto')
      Unit.createUnit({ 'USD': '' })
      Unit.createUnit({ 'EUR': '1.15 USD' })
      assert.strictEqual(math.evaluate('10 EUR/hour * 2 hours').toString(), '20 EUR')
    })
  })

  describe.skip('valueOf', function () {
    it('should return string representation when calling valueOf', function () {
      assert.strictEqual(unit(5000, 'cm').valueOf(), '50 m')
      assert.strictEqual(unit(5, 'kg').valueOf(), '5 kg')
      assert.strictEqual(unit(2 / 3, 'm').valueOf(), '0.6666666666666666 m')
      assert.strictEqual(unit(5, 'N').valueOf(), '5 N')
      assert.strictEqual(unit(5, 'kg^1.0e0 m^1.0e0 s^-2.0e0').valueOf(), '5 (kg m) / s^2')
      assert.strictEqual(unit(5, 's^-2').valueOf(), '5 s^-2')
    })
  })

  describe.skip('json', function () {
    it('toJSON', function () {
      assert.deepStrictEqual(unit(5, 'cm').toJSON(),
        { 'mathjs': 'Unit', value: 5, unit: 'cm', fixPrefix: false })
      assert.deepStrictEqual(unit(5, 'cm').to('mm').toJSON(),
        { 'mathjs': 'Unit', value: 50, unit: 'mm', fixPrefix: true })
      assert.deepStrictEqual(unit(5, 'kN').to('kg m s ^ -2').toJSON(),
        { 'mathjs': 'Unit', value: 5000, unit: '(kg m) / s^2', fixPrefix: true })
    })

    it('fromJSON', function () {
      const u1 = unit(5, 'cm')
      const u2 = Unit.fromJSON({ 'mathjs': 'Unit', value: 5, unit: 'cm', fixPrefix: false })
      assert.ok(u2 instanceof Unit)
      assert.deepStrictEqual(u2, u1)

      const u3 = unit(5, 'cm').to('mm')
      const u4 = Unit.fromJSON({ 'mathjs': 'Unit', value: 50, unit: 'mm', fixPrefix: true })
      assert.ok(u4 instanceof Unit)
      assert.deepStrictEqual(u4, u3)

      const u5 = unit(5, 'kN').to('kg m/s^2')
      const u6 = Unit.fromJSON({ 'mathjs': 'Unit', value: 5000, unit: 'kg m s^-2', fixPrefix: true })
      assert.ok(u6 instanceof Unit)
      assert.deepStrictEqual(u5, u6)
    })

    it('toJSON -> fromJSON should recover an "equal" unit', function () {
      const unit1 = Unit.parse('1.23(m/(s/(kg mol)/(lbm/h)K))')
      const unit2 = Unit.fromJSON(unit1.toJSON())
      assert.strictEqual(unit1.equals(unit2), true)
    })
  })

  describe.skip('format', function () {
    it('should format units with given precision', function () {
      assert.strictEqual(unit(2 / 3, 'm').format(3), '0.667 m')
      assert.strictEqual(unit(2 / 3, 'm').format(4), '0.6667 m')
      assert.strictEqual(unit(2 / 3, 'm').format(), '0.6666666666666666 m')
    })

    it('should format a unit without value', function () {
      assert.strictEqual(unit(null, 'cm').format(), 'cm')
      assert.strictEqual(unit(null, 'm').format(), 'm')
      assert.strictEqual(unit(null, 'kg m/s').format(), '(kg m) / s')
    })

    it('should format a unit with fixed prefix and without value', function () {
      assert.strictEqual(unit(null, 'km').to('cm').format(), '1e+5 cm')
      assert.strictEqual(unit(null, 'inch').to('cm').format(), '2.54 cm')
      assert.strictEqual(unit(null, 'N/m^2').to('lbf/inch^2').format(5), '1.4504e-4 lbf / inch^2')
    })

    it('should ignore properties in Object.prototype when finding the best prefix', function () {
      Object.prototype.foo = 'bar' // eslint-disable-line no-extend-native

      assert.strictEqual(unit(5e5, 'cm').format(), '5 km')

      delete Object.prototype.foo
    })
  })

  describe('parse', function () {
    it('should parse units correctly', function () {
      let unit1

      unit1 = unit('5kg')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('5 kg')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit(' 5 kg ')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('5e-3kg')
      assert.strictEqual(unit1.value, 0.005)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('5e+3kg')
      assert.strictEqual(unit1.value, 5000)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('5e3kg')
      assert.strictEqual(unit1.value, 5000)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('-5kg')
      assert.strictEqual(unit1.value, -5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('+5kg')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('.5kg')
      assert.strictEqual(unit1.value, 0.5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('-5mg')
      approx.equal(unit1.value, -5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'm')

      unit1 = unit('5.2mg')
      approx.equal(unit1.value, 5.2)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix.name, 'm')

      unit1 = unit('300 kg/minute')
      approx.equal(unit1.value, 300)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[1].unit.name, 'minute')
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('981 cm/s^2')
      approx.equal(unit1.value, 981)
      assert.strictEqual(unit1.units[0].unit.name, 'm')
      assert.strictEqual(unit1.units[1].unit.name, 's')
      assert.strictEqual(unit1.units[1].power, -2)
      assert.strictEqual(unit1.units[0].prefix.name, 'c')

      unit1 = unit('981 cm*s^-2')
      approx.equal(unit1.value, 981)
      assert.strictEqual(unit1.units[0].unit.name, 'm')
      assert.strictEqual(unit1.units[1].unit.name, 's')
      assert.strictEqual(unit1.units[1].power, -2)
      assert.strictEqual(unit1.units[0].prefix.name, 'c')

      unit1 = unit('8.314 kg m^2 / s^2 K mol')
      approx.equal(unit1.value, 8.314)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[1].unit.name, 'm')
      assert.strictEqual(unit1.units[2].unit.name, 's')
      assert.strictEqual(unit1.units[3].unit.name, 'K')
      assert.strictEqual(unit1.units[4].unit.name, 'mol')
      assert.strictEqual(unit1.units[0].power, 1)
      assert.strictEqual(unit1.units[1].power, 2)
      assert.strictEqual(unit1.units[2].power, -2)
      assert.strictEqual(unit1.units[3].power, -1)
      assert.strictEqual(unit1.units[4].power, -1)
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('8.314 kg m^2 / s^2 K mol')
      approx.equal(unit1.value, 8.314)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[1].unit.name, 'm')
      assert.strictEqual(unit1.units[2].unit.name, 's')
      assert.strictEqual(unit1.units[3].unit.name, 'K')
      assert.strictEqual(unit1.units[4].unit.name, 'mol')
      assert.strictEqual(unit1.units[0].power, 1)
      assert.strictEqual(unit1.units[1].power, 2)
      assert.strictEqual(unit1.units[2].power, -2)
      assert.strictEqual(unit1.units[3].power, -1)
      assert.strictEqual(unit1.units[4].power, -1)
      assert.strictEqual(unit1.units[0].prefix.name, 'k')

      unit1 = unit('5exabytes')
      approx.equal(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'bytes')

      unit1 = unit('1 / s')
      approx.equal(unit1.value, 1)
      assert.strictEqual(unit1.units[0].unit.name, 's')
      assert.strictEqual(unit1.units[0].power, -1)

      unit1 = unit('1/s')
      approx.equal(unit1.value, 1)
      assert.strictEqual(unit1.units[0].unit.name, 's')
      assert.strictEqual(unit1.units[0].power, -1)

      unit1 = unit('1 * s')
      approx.equal(unit1.value, 1)
      assert.strictEqual(unit1.units[0].unit.name, 's')
      assert.strictEqual(unit1.units[0].power, 1)
    })

    it('should throw error when parsing expressions with invalid characters', function () {
      assert.throws(() => { unit('8.314 J / (mol * K)') }, /Unexpected "\("/)
      assert.throws(() => { unit('8.314 J / mol / K') }, /Unexpected additional "\/"/)
    })

    it('should parse units with correct precedence', function () {
      const unit1 = unit('1  m^3 / kg s^2') // implicit multiplication

      approx.equal(unit1.value, 1)
      assert.strictEqual(unit1.units[0].unit.name, 'm')
      assert.strictEqual(unit1.units[1].unit.name, 'g')
      assert.strictEqual(unit1.units[2].unit.name, 's')
      assert.strictEqual(unit1.units[0].power, 3)
      assert.strictEqual(unit1.units[1].power, -1)
      assert.strictEqual(unit1.units[2].power, -2)
      assert.strictEqual(unit1.units[0].prefix.name, '')
    })

    it('should throw an exception when parsing an invalid unit', function () {
      assert.throws(function () { unit('.meter') }, /Unexpected "\."/)
      assert.throws(function () { unit('5e') }, /Unit "e" not found/)
      assert.throws(function () { unit('5e.') }, /Unit "e" not found/)
      assert.throws(function () { unit('5e1.3') }, /Unexpected "\."/)
      assert.throws(function () { unit('meter.') }, /Unexpected "\."/)
      assert.throws(function () { unit('meter/') }, /Trailing characters/)
      assert.throws(function () { unit('/meter') }, /Unexpected "\/"/)
      assert.throws(function () { unit('1 */ s') }, /Unexpected "\/"/)
      assert.throws(function () { unit('45 kg 34 m') }, /Unexpected "3"/)
    })

    it('should parse empty strings and only numbers', function () {
      assert.strictEqual(unit(123).value, 123)
      assert.strictEqual(unit(123).units.length, 0)
      assert.strictEqual(unit('').value, null)
      assert.strictEqual(unit('').units.length, 0)
      assert.strictEqual(unit().value, null)
      assert.strictEqual(unit().units.length, 0)
    })
  })

  describe('prefixes', function () {
    it('should accept both long and short prefixes for ohm', function () {
      assert.strictEqual(unit('5 ohm').toString(), '5 ohm')
      assert.strictEqual(unit('5 milliohm').toString(), '5 milliohm')
      assert.strictEqual(unit('5 mohm').toString(), '5 mohm')
    })

    it('should accept both long and short prefixes for bar', function () {
      assert.strictEqual(unit('5 bar').toString(), '5 bar')
      assert.strictEqual(unit('5 millibar').toString(), '5 millibar')
      assert.strictEqual(unit('5 mbar').toString(), '5 mbar')
    })
  })

  describe('isCompound', function () {
    it('should return the correct value', function () {
      assert.strictEqual(unit('34 kg').isCompound(), false)
      assert.strictEqual(unit('34 kg/s').isCompound(), true)
      assert.strictEqual(unit('34 kg^2').isCompound(), true)
      assert.strictEqual(unit('34 N').isCompound(), false)
      assert.strictEqual(unit('34 kg m / s^2').isCompound(), true)
    })
  })

  describe('add', function () {
    it('should add two units', () => {
      assert.deepStrictEqual(unit(300, 'm').add(unit(3, 'km')), unit(3300, 'm'))
      assert.deepStrictEqual(unit('2m').add(unit('3ft')), unit('2.9144 m'))
    })

    it('should convert parameter to unit', () => {
      assert.deepStrictEqual(unit('1 hour').add('30 minute'), unit(1.5, 'hour'))
      assert.deepStrictEqual(unit(100, 'cm / m').add(10), unit(1100, 'cm / m'))
    })

    it('should return a frozen unit', () => {
      assert(Object.isFrozen(unit(300, 'm').add(unit(3, 'km'))))
    })

    it('the alternate api syntax should also work', () => {
      assert.deepStrictEqual(unit.add(unit(300, 'm'), unit(3, 'km')), unit(3300, 'm'))
      assert.deepStrictEqual(unit.add('300 m', '3 km'), unit(3300, 'm'))
    })
  })

  describe('sub', function () {
    it('should subtract two units', () => {
      assert.deepStrictEqual(unit(300, 'm').sub(unit(3, 'km')), unit(-2700, 'm'))
      assert.deepStrictEqual(unit('2m').sub(unit('3ft')), unit('1.0856 m'))
    })

    it('should convert parameter to unit', () => {
      assert.deepStrictEqual(unit('1 hour').sub('30 minute'), unit(0.5, 'hour'))
      assert.deepStrictEqual(unit(100, 'm / cm').sub(10), unit('99.9 m / cm'))
    })

    it('should return a frozen unit', () => {
      assert(Object.isFrozen(unit(300, 'm').sub(unit(3, 'km'))))
    })

    it('the alternate api syntax should also work', () => {
      assert.deepStrictEqual(unit.sub(unit(300, 'm'), unit(3, 'km')), unit(-2700, 'm'))
      assert.deepStrictEqual(unit.sub('300 m', '3 km'), unit(-2700, 'm'))
    })
  })

  describe('mul', () => {
    it('should multiply unit\'s values and combine their units', () => {
      assert.deepStrictEqual(unit('2 kg').mul(unit('3 m')), unit('6 kg m'))
      assert.deepStrictEqual(unit('2 m').mul(unit('4 m')), unit('8 m^2'))
      assert.deepStrictEqual(unit('2 ft').mul(unit('4 ft')), unit('8 ft^2'))
      assert.deepStrictEqual(unit('65 mi/h').mul(unit('2 h')), unit('130 mi'))
      assert.deepStrictEqual(unit('2 L').mul(unit('1 s^-1')), unit('2 L / s'))
      assert.deepStrictEqual(unit('2 m/s').mul(unit('0.5 s/m')), unit('1'))
    })

    it('should convert parameter to unit', () => {
      assert.deepStrictEqual(unit('1 hour').mul('30 minute'), unit(30, 'hour minute'))
      assert.deepStrictEqual(unit('1 hour').mul(3), unit('3 hour'))
    })

    it('should return a frozen unit', () => {
      assert(Object.isFrozen(unit('2 kg').mul(unit('3 m'))))
    })

    it('the alternate api syntax should also work', () => {
      assert.deepStrictEqual(unit.mul(unit('2 kg'), unit('3 m')), unit('6 kg m'))
      assert.deepStrictEqual(unit.mul('2 kg', '3 m'), unit('6 kg m'))
      assert.deepStrictEqual(unit.mul('2 kg', 3), unit('6 kg'))
      assert.deepStrictEqual(unit.mul(3, '2 kg'), unit('6 kg'))
    })
  })

  describe('div', () => {
    it('should divide unit\'s values and combine their units', () => {
      assert.deepStrictEqual(unit('6 kg').div(unit('3 m')), unit('2 kg m^-1'))
      assert.deepStrictEqual(unit('2 m').div(unit('4 m')), unit('0.5'))
      assert.deepStrictEqual(unit('4 ft').div(unit('2 ft')), unit('2'))
      assert.deepStrictEqual(unit('65 mi/h').div(unit('2 h')), unit('32.5 mi h^-2'))
      assert.deepStrictEqual(unit('2 L').div(unit('1 s^-1')), unit('2 L s'))
      assert.deepStrictEqual(unit('2 m/s').div(unit('0.5 s/m')), unit('4 m^2 s^-2'))
      assert.deepStrictEqual(unit('2 kg').div(unit('500 g')), unit(4))
      assert.deepStrictEqual(unit('2000 g').div(unit('0.5 kg')), unit(4))
    })

    it('should convert parameter to unit', () => {
      assert.deepStrictEqual(unit('1 hour').div('0.5 hour'), unit(2))
      assert.deepStrictEqual(unit('1 hour').div(2), unit(0.5, 'hour'))
    })

    it('should return a frozen unit', () => {
      assert(Object.isFrozen(unit('2 kg').div(unit('3 m'))))
    })

    it('the alternate api syntax should also work', () => {
      assert.deepStrictEqual(unit.div(unit('6 kg'), unit('3 m')), unit('2 kg m^-1'))
      assert.deepStrictEqual(unit.div('6 kg', '3 m'), unit('2 kg m^-1'))
      assert.deepStrictEqual(unit.div('6 kg', 3), unit('2 kg'))
      assert.deepStrictEqual(unit.div(3, '6 kg'), unit('0.5 kg^-1'))
    })
  })

  describe('pow', () => {
    it('should calculate the power of a unit', () => {
      assert(unit('4 N').pow(2).equals(unit('16 N^2')))
      assert(unit('0.25 m/s').pow(-0.5).equals(unit('2 m^-0.5 s^0.5')))
      assert(unit('123 hogshead').pow(0).equals(unit('1')))
    })
  })

  describe.skip('multiply, divide, and pow', function () {
    it('should return a Unit that will be automatically simplified', function () {
      const unit1 = unit(10, 'kg')
      const unit2 = unit(9.81, 'm/s^2')
      assert.strictEqual(unit1.multiply(unit2).skipAutomaticSimplification, false)
      assert.strictEqual(unit1.divide(unit2).skipAutomaticSimplification, false)
      assert.strictEqual(unit1.pow(2).skipAutomaticSimplification, false)
    })

    it('should retain the units of their operands without simplifying', function () {
      const unit1 = unit(10, 'N/s')
      const unit2 = unit(10, 'h')
      const unitM = unit1.multiply(unit2)
      assert.strictEqual(unitM.units[0].unit.name, 'N')
      assert.strictEqual(unitM.units[1].unit.name, 's')
      assert.strictEqual(unitM.units[2].unit.name, 'h')

      const unit3 = unit(14.7, 'lbf')
      const unit4 = unit(1, 'in in')
      const unitD = unit3.divide(unit4)
      assert.strictEqual(unitD.units[0].unit.name, 'lbf')
      assert.strictEqual(unitD.units[1].unit.name, 'in')
      assert.strictEqual(unitD.units[2].unit.name, 'in')

      const unit5 = unit(1, 'N h/s')
      const unitP = unit5.pow(-3.5)
      assert.strictEqual(unitP.units[0].unit.name, 'N')
      assert.strictEqual(unitP.units[1].unit.name, 'h')
      assert.strictEqual(unitP.units[2].unit.name, 's')
    })
  })

  describe('plurals', function () {
    it('should support plurals', function () {
      const unit1 = unit(5, 'meters')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'meters')
      assert.strictEqual(unit1.units[0].prefix.name, '')

      const unit2 = unit(5, 'kilometers')
      assert.strictEqual(unit2.value, 5)
      assert.strictEqual(unit2.units[0].unit.name, 'meters')
      assert.strictEqual(unit2.units[0].prefix.name, 'kilo')

      const unit3 = unit(5, 'inches')
      approx.equal(unit3.value, 5)
      assert.strictEqual(unit3.units[0].unit.name, 'inches')
      assert.strictEqual(unit3.units[0].prefix.name, '')

      const unit4 = unit(9.81, 'meters/second^2')
      approx.equal(unit4.value, 9.81)
      assert.strictEqual(unit4.units[0].unit.name, 'meters')
      assert.strictEqual(unit4.units[0].prefix.name, '')
    })
  })

  describe('aliases', function () {
    it('should support aliases', function () {
      const unit1 = unit(5, 'lt')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'lt')
      assert.strictEqual(unit1.units[0].prefix.name, '')

      const unit2 = unit(1, 'lb')
      assert.strictEqual(unit2.value, 1)
      assert.strictEqual(unit2.units[0].unit.name, 'lb')
      assert.strictEqual(unit2.units[0].prefix.name, '')
    })
  })

  describe('unitStore', function () {
    describe('UNITS', () => {
      it('built-in units should be of the correct value and dimension', function () {
        assert.strictEqual(unit(1, 's A').equals(unit(1, 'C')), true)
        assert.strictEqual(unit(1, 'W/A').equals(unit(1, 'V')), true)
        assert.strictEqual(unit(1, 'V/A').equals(unit(1, 'ohm')), true)
        assert.strictEqual(unit(1, 'C/V').equals(unit(1, 'F')), true)
        assert.strictEqual(unit(1, 'J/A').equals(unit(1, 'Wb')), true)
        assert.strictEqual(unit(1, 'Wb/m^2').equals(unit(1, 'T')), true)
        assert.strictEqual(unit(1, 'Wb/A').equals(unit(1, 'H')), true)
        assert.strictEqual(unit(1, 'ohm^-1').equals(unit(1, 'S')), true)
        assert.strictEqual(unit(1, 'eV').equals(unit(1.602176565e-19, 'J')), true)
      })

      it("For each built-in unit, 'name' should match key", function () {
        for (const key in unit._unitStore.UNITS) {
          assert.strictEqual(key, unit._unitStore.UNITS[key].name)
        }
      })
    })

    describe('UNIT_SYSTEMS', () => {
      it('should not have any dimensions that are not present in DIMENSIONS', () => {
        for (let sys in unit._unitStore.UNIT_SYSTEMS) {
          for (let dim in unit._unitStore.UNIT_SYSTEMS[sys]) {
            assert(unit._unitStore.DIMENSIONS.hasOwnProperty(dim), `${dim} not found in DIMESNIONS`)
          }
        }
      })
    })
  })

  describe('angles', function () {
    it('should create angles', function () {
      assert.strictEqual(unit(1, 'radian').equals(unit(1, 'rad')), true)
      assert.strictEqual(unit(1, 'radians').equals(unit(1, 'rad')), true)
      assert(unit(1, 'degree').equals(unit(1, 'deg')))
      assert.strictEqual(unit(1, 'degrees').equals(unit(1, 'deg')), true)
      assert.strictEqual(unit(1, 'gradian').equals(unit(1, 'grad')), true)
      assert.strictEqual(unit(1, 'gradians').equals(unit(1, 'grad')), true)

      assert.strictEqual(unit(1, 'radian').to('rad').equals(unit(1, 'rad')), true)
      assert.strictEqual(unit(1, 'radians').to('rad').equals(unit(1, 'rad')), true)
      assert.deepStrictEqual(unit(1, 'deg').to('rad'), unit(2 * Math.PI / 360, 'rad').to())
      assert.strictEqual(unit(1, 'degree').to('rad').equals(unit(2 * Math.PI / 360, 'rad')), true)
      assert.strictEqual(unit(1, 'degrees').to('rad').equals(unit(2 * Math.PI / 360, 'rad')), true)
      assert.strictEqual(unit(1, 'gradian').to('rad').equals(unit(Math.PI / 200, 'rad')), true)
      assert.strictEqual(unit(1, 'gradians').to('rad').equals(unit(Math.PI / 200, 'rad')), true)
    })

    it.skip('should have correct long/short prefixes', function () {
      assert.strictEqual(unit(20000, 'rad').toString(), '20 krad')
      assert.strictEqual(unit(20000, 'radian').toString(), '20 kiloradian')
      assert.strictEqual(unit(20000, 'radians').toString(), '20 kiloradians')

      assert.strictEqual(unit(20000, 'deg').toString(), '20 kdeg')
      assert.strictEqual(unit(20000, 'degree').toString(), '20 kilodegree')
      assert.strictEqual(unit(20000, 'degrees').toString(), '20 kilodegrees')

      assert.strictEqual(unit(20000, 'grad').toString(), '20 kgrad')
      assert.strictEqual(unit(20000, 'gradian').toString(), '20 kilogradian')
      assert.strictEqual(unit(20000, 'gradians').toString(), '20 kilogradians')
    })
  })

  describe.skip('createUnitSingle', function () {
    it('should create a custom unit from a string definition', function () {
      Unit.createUnitSingle('widget', '5 kg bytes')
      assert.strictEqual(unit(1, 'widget').equals(unit(5, 'kg bytes')), true)
      Unit.createUnitSingle('woggle', '4 widget^2')
      assert.strictEqual(unit(1, 'woggle').equals(unit(4, 'widget^2')), true)
      assert.strictEqual(unit(2, 'woggle').equals(unit(200, 'kg^2 bytes^2')), true)
    })

    it('should create a custom unit from a Unit definition', function () {
      const Unit1 = unit(5, 'N/woggle')
      Unit.createUnitSingle('gadget', Unit1)
      assert.strictEqual(unit(1, 'gadget').equals(unit(5, 'N/woggle')), true)
    })

    it('should create a custom unit from a configuration object', function () {
      Unit.createUnitSingle('wiggle', { definition: '4 rad^2/s', offset: 1, prefixes: 'long' })
      assert.strictEqual(math.evaluate('8000 rad^2/s').toString(), '1 kilowiggle')
    })

    it('should return the new (value-less) unit', function () {
      const Unit2 = unit(1000, 'N h kg^-2 bytes^-2')
      const newUnit = Unit.createUnitSingle('whimsy', '8 gadget hours')
      assert.strictEqual(Unit2.to(newUnit).toString(), '2500 whimsy')
    })

    it('should not override an existing unit', function () {
      assert.throws(function () { Unit.createUnitSingle('m', '1 kg') }, /Cannot create unit .*: a unit with that name already exists/)
      assert.throws(function () { Unit.createUnitSingle('gadget', '1 kg') }, /Cannot create unit .*: a unit with that name already exists/)
      assert.throws(function () { Unit.createUnitSingle('morogrove', { aliases: 's' }) }, /Cannot create alias .*: a unit with that name already exists/)
    })

    it('should throw an error for invalid parameters', function () {
      assert.throws(function () { Unit.createUnitSingle() }, /createUnitSingle expects first parameter/)
      assert.throws(function () { Unit.createUnitSingle(42) }, /createUnitSingle expects first parameter/)
      assert.throws(function () { Unit.createUnitSingle('42') }, /Error: Invalid unit name/)
    })

    it('should apply the correct prefixes', function () {
      Unit.createUnitSingle('millizilch', { definition: '1e-3 m', prefixes: 'long' })
      assert.strictEqual(unit(1e-6, 'millizilch').toString(), '1 micromillizilch')
    })

    it('should override prefixed built-in units', function () {
      Unit.createUnitSingle('mm', { definition: '1e-4 m', prefixes: 'short' }) // User is being silly
      assert.strictEqual(unit(1e-3, 'mm').toString(), '1 mmm') // Use the user's new definition
      assert.strictEqual(unit(1e-3, 'mm').to('m').format(4), '1e-7 m') // Use the user's new definition
    })

    it('should create aliases', function () {
      Unit.createUnitSingle('knot', { definition: '0.51444444 m/s', aliases: ['knots', 'kts', 'kt'] })
      assert.strictEqual(unit(1, 'knot').equals(unit(1, 'kts')), true)
      assert.strictEqual(unit(1, 'kt').equals(unit(1, 'knots')), true)
    })

    it('should apply offset correctly', function () {
      Unit.createUnitSingle('whatsit', { definition: '3.14 kN', offset: 2 })
      assert.strictEqual(unit(1, 'whatsit').to('kN').toString(), '9.42 kN')
    })

    it('should create new base units', function () {
      const fooBaseUnit = Unit.createUnitSingle('fooBase')
      assert.strictEqual(fooBaseUnit.dimensions.toString(), Unit.BASE_UNITS['fooBase_STUFF'].dimensions.toString())
      const testUnit = unit(5, 'fooBase')
      assert.strictEqual(testUnit.toString(), '5 fooBase')
    })

    it('should not override base units', function () {
      assert.throws(function () { Unit.createUnitSingle('fooBase', '', { override: true }) }, /Cannot create/)
    })

    it('should create and use a new base if no matching base exists', function () {
      Unit.createUnitSingle('jabberwocky', '1 mile^5/hour')
      assert.strictEqual('jabberwocky_STUFF' in Unit.BASE_UNITS, true)
      assert.strictEqual(math.evaluate('4 mile^5/minute').format(4), '240 jabberwocky')
    })
  })

  describe.skip('createUnit', function () {
    it('should create multiple units', function () {
      Unit.createUnit({
        'foo1': '',
        'foo2': '2 foo1',
        'foo3': {
          definition: '2 foo2',
          prefixes: 'long'
        }
      })
      assert.strictEqual(math.evaluate('2 foo3 to foo1').toString(), '8 foo1')
    })

    it('should override units when requested and if able', function () {
      assert.throws(function () { Unit.createUnit({ foo1: '' }) }, /Cannot/)
      assert.throws(function () { Unit.createUnit({ foo1: '', override: true }) }, /Cannot/)
      Unit.createUnit({ foo3: '' }, { override: true })
    })

    it('should throw error when first parameter is not an object', function () {
      assert.throws(function () { Unit.createUnit('not an object') }, /createUnit expects first/)
    })
  })

  describe.skip('splitUnit', function () {
    it('should split a unit into parts', function () {
      assert.strictEqual((unit(1, 'm')).splitUnit(['ft', 'in']).toString(), '3 ft,3.3700787401574765 in')
      assert.strictEqual((unit(-1, 'm')).splitUnit(['ft', 'in']).toString(), '-3 ft,-3.3700787401574765 in')
      assert.strictEqual((unit(1, 'm/s')).splitUnit(['m/s']).toString(), '1 m / s')
      assert.strictEqual((unit(1, 'm')).splitUnit(['ft', 'ft']).toString(), '3 ft,0.280839895013123 ft')
      assert.strictEqual((unit(1.23, 'm/s')).splitUnit([]).toString(), '1.23 m / s')
      assert.strictEqual((unit(1, 'm')).splitUnit(['in', 'ft']).toString(), '39 in,0.030839895013123605 ft')
      assert.strictEqual((unit(1, 'm')).splitUnit([ unit(null, 'ft'), unit(null, 'in') ]).toString(), '3 ft,3.3700787401574765 in')
    })

    it('should be resistant to round-off error', function () {
      assert.strictEqual((unit(-12, 'in')).splitUnit(['ft', 'in']).toString(), '-1 ft,0 in')
      assert.strictEqual((unit(12, 'in')).splitUnit(['ft', 'in']).toString(), '1 ft,0 in')
      assert.strictEqual((unit(24, 'in')).splitUnit(['ft', 'in']).toString(), '2 ft,0 in')
      assert.strictEqual((unit(36, 'in')).splitUnit(['ft', 'in']).toString(), '3 ft,0 in')
      assert.strictEqual((unit(48, 'in')).splitUnit(['ft', 'in']).toString(), '4 ft,0 in')
      assert.strictEqual((unit(60, 'in')).splitUnit(['ft', 'in']).toString(), '5 ft,0 in')
      assert.strictEqual((unit(36000, 'in')).splitUnit(['ft', 'in']).toString(), '3000 ft,0 in')
    })
  })

  describe('toSI', function () {
    it('should return a clone of the unit', function () {
      const u1 = unit('3 ft')
      const u2 = u1.toSI()
      assert.strictEqual(u1 === u2, false)
    })

    it('should return the unit in SI units', function () {
      assert.deepStrictEqual(unit('4 ft').toSI(), unit('1.2192 m').to())
      assert.deepStrictEqual(unit('0.111 ft^2').toSI(), unit('0.01031223744 m^2').to())
    })

    it('should return SI units for valueless units', function () {
      assert.deepStrictEqual(unit('ft/minute').toSI(), unit('m / s').to())
    })

    it('alterate api syntax should work too', () => {
      assert.deepStrictEqual(unit.toSI(unit('4 ft')), unit('1.2192 m').to())
      assert.deepStrictEqual(unit.toSI('4 ft'), unit('1.2192 m').to())
    })

    it.skip('should return SI units for custom units defined from other units', function () {
      Unit.createUnit({ foo: '3 kW' }, { override: true })
      assert.strictEqual(Unit.parse('42 foo').toSI().toString(), '1.26e+5 (kg m^2) / s^3')
    })

    it.skip('should throw if custom unit not defined from existing units', function () {
      Unit.createUnit({ baz: '' }, { override: true })
      assert.throws(function () { Unit.parse('10 baz').toSI() }, /Cannot express custom unit/)
    })
  })
})
