import assert from 'assert'
import approx from './approx'
import unit from '../src/Unit.js'
import Decimal from 'decimal.js'

function configCustomUnits (units) {
  return unit.config({
    definitions: {
      units
    }
  })
}

let unitDec
let typeNoPow, typeNoGt, typeNoComp, typeFunnyFormat, typeNoRound

before(() => {
  Decimal.set({ precision: 32 })

  // Use strict type checking to make sure no numbers sneak in
  const isDec = a => assert(a instanceof Decimal)

  let typeComplete = {
    conv: a => Decimal(a),
    clone: a => { isDec(a); return Decimal(a) },
    add: (a, b) => {
      isDec(a)
      isDec(b)
      return Decimal.add(a, b)
    },
    sub: (a, b) => {
      isDec(a)
      isDec(b)
      return Decimal.sub(a, b)
    },
    mul: (a, b) => {
      isDec(a)
      isDec(b)
      return Decimal.mul(a, b)
    },
    div: (a, b) => {
      isDec(a)
      isDec(b)
      return Decimal.div(a, b)
    },
    pow: (a, b) => {
      isDec(a)
      isDec(b)
      return Decimal.pow(a, b)
    },
    eq: (a, b) => {
      isDec(a)
      isDec(b)
      return a.equals(b)
    },
    lt: (a, b) => a.lt(b),
    le: (a, b) => a.lte(b),
    gt: (a, b) => a.gt(b),
    ge: (a, b) => a.gte(b),
    abs: (a) => a.abs(),
    round: (a) => a.round(),
    trunc: (a) => Decimal.trunc(a)
  }

  typeNoPow = Object.assign({}, typeComplete)
  delete typeNoPow.pow

  typeNoGt = Object.assign({}, typeComplete)
  delete typeNoGt.gt

  typeNoRound = Object.assign({}, typeComplete)
  delete typeNoRound.round

  typeNoComp = Object.assign({}, typeComplete)
  delete typeNoComp.eq
  delete typeNoComp.lt
  delete typeNoComp.le
  delete typeNoComp.gt
  delete typeNoComp.ge

  typeFunnyFormat = { format: (a, b, c) => b + a.toString().split('').reverse().join(c) }

  unitDec = require('../index.js').config({ type: typeComplete })

  // These will be tested below
  // unitDecNoPow = require('../index.js').config({ type: typeNoPow })
  // unitDecNoGt = require('../index.js').config({ type: typeNoGt })
  // unitDecNoEq = require('../index.js').config({ type: typeNoEq })
})

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

    it('should have the correct default format config options', () => {
      let optionsToCheckEquality = {
        parentheses: false,
        precision: 15,
        prefix: 'auto',
        prefixMin: 0.1,
        prefixMax: 1000,
        prefixesToChooseFrom: 'common',
        simplify: 'auto',
        simplifyThreshold: 2,
        system: 'auto',
        subsystem: 'auto',
        definitions: {
          skipBuiltIns: false,
          units: {},
          prefixes: {},
          baseQuantities: [],
          quantities: {},
          unitSystems: {}
        }
      }
      let actualOptions = unit.config()
      for (let key in optionsToCheckEquality) {
        assert.deepStrictEqual(optionsToCheckEquality[key], actualOptions[key], `config option ${key} has the wrong default value`)
      }
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
      assert.strictEqual(newUnit.config().simplify, 'auto')
    })

    it('should throw on invalid options', () => {
      assert.throws(() => unit.config({ prefix: 'invalidOption' }), /Invalid option for prefix: 'invalidOption'/)
      assert.throws(() => unit.config({ simplify: 'bad' }), /Invalid option for simplify: 'bad'/)
    })

    describe('custom definitions', () => {
      it('should create new units', () => {
        let newUnit = configCustomUnits({
          furlongsPerFortnight: { value: '1 furlong/fortnight' },
          furlong: '220 yards',
          fortnight: { value: [2, 'weeks'] }
        })

        assert.strictEqual(newUnit('1 furlongsPerFortnight').to('yards/week').toString(), '110 yards / week')
      })

      it.skip('should use custom units when simplifying', () => {
        let newUnit = configCustomUnits({
          mph: { value: '1 mi/hr', autoAddToSystem: 'auto' }
        })
        assert.strictEqual(newUnit('5 mi').div('2 hr').toString(), '2.5 mph')
      })

      it.skip('should use custom units derived from other custom units when simplifying', () => {
        const newUnit = configCustomUnits({
          widget: { value: '5 kg bytes', autoAddToSystem: 'auto' },
          woggle: { value: '4 widget^2', autoAddToSystem: 'auto' },
          gadget: { value: '5 N/woggle', autoAddToSystem: 'auto' },
          whimsy: { value: '8 gadget hours', autoAddToSystem: 'auto' }
        })
        assert.strictEqual(newUnit(1000, 'N h kg^-2 bytes^-2').toString(), '2500 whimsy')
      })

      it.skip('should apply prefixes and offset to custom units', () => {
        const newUnit = configCustomUnits({
          wiggle: { value: '4 rad^2/s', offset: 1, prefixes: 'LONG', autoAddToSystem: 'auto' }
        })
        assert.strictEqual(newUnit('8000 rad^2/s').toString(), '1 kilowiggle')
      })

      it('should only allow valid names for units', () => {
        assert.throws(() => configCustomUnits({ 'not_a_valid_unit': '3.14 kg' }), /Unit name contains non-alpha/)
        assert.throws(() => configCustomUnits({ '5tartsWithNumber': '42 ft' }), /Unit name contains non-alpha/)
        assert.throws(() => configCustomUnits({ 5: '5 day' }), /Unit name contains non-alpha/)
      })

      it('should throw on invalid unit value type', () => {
        assert.throws(() => configCustomUnits({ myUnit: 42 }), /Unit definition for 'myUnit' must be a string/)

        assert.throws(() => configCustomUnits({ myUnit: { value: 42 } }), /Unit definition for 'myUnit' must be a string/)
      })

      it('should throw on invalid unit quantity', () => {
        assert.throws(() => configCustomUnits({
          myUnit: {
            quantity: 'ESSENCE_OF_FOO',
            value: 100
          }
        }), /Unknown quantity specified for unit myUnit: ESSENCE_OF_FOO/)
      })

      it('should override existing units', () => {
        let newUnit = configCustomUnits({
          poundmass: {
            value: '0.5 kg',
            aliases: ['lb', 'lbs', 'lbm', 'poundmasses']
          }
        })
        assert.strictEqual(unit('1 lb').to('kg').toString(), '0.45359237 kg')
        assert.strictEqual(newUnit('1 lb').to('kg').toString(), '0.5 kg')
      })

      it('should remove existing units if value is falsey', () => {
        let newUnit = configCustomUnits({ henry: null })
        assert.doesNotThrow(() => unit('henry'))
        assert.throws(() => newUnit('henry'), /Unit "henry" not found/)
      })

      it('should throw if not all units could be created', () => {
        assert.throws(() => configCustomUnits({
          myUnit: '1 theirUnit',
          theirUnit: '1 myUnit'
        }), /Error: Could not create the following units: myUnit, theirUnit. Reasons follow: SyntaxError: Unit "theirUnit" not found. SyntaxError: Unit "myUnit" not found./)

        assert.throws(() => configCustomUnits({
          myUnit: 'q038hfqi3hdq0'
        }), /Error: Could not create the following units: myUnit. Reasons follow: SyntaxError: Unit "q038hfqi3hdq0" not found./)

        assert.throws(() => configCustomUnits({
          myUnit: '8 m^'
        }), /In "8 m\^", "\^" must be followed by a floating-point number/)
      })

      it('should throw if an alias would override an existing unit', () => {
        assert.throws(() => configCustomUnits({
          myUnit: {
            value: '1 m',
            aliases: ['m']
          }
        }), /Alias 'm' would override an existing unit/)
      })

      it('should throw on unknown prefix', () => {
        assert.throws(() => configCustomUnits({
          myUnit: {
            value: '45 s',
            prefixes: 'MADE_UP_PREFIXES'
          }
        }), /Unknown prefixes 'MADE_UP_PREFIXES' for unit 'myUnit'/)
      })

      it('should create new prefixes', () => {
        // TODO: Mutating individual units in the definitions can have bad side effects!
        let meter = Object.assign({}, unit.definitions().units.meter)
        meter.prefixes = 'FUNNY'
        meter.commonPrefixes = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
        let newUnit = unit.config({
          prefixMin: 1,
          prefixMax: 2,
          definitions: {
            units: {
              meter
            },
            prefixes: {
              FUNNY: { '': 1, 'A': 2, 'B': 4, 'C': 8, 'D': 16, 'E': 32, 'F': 64, 'G': 128 }
            }
          }
        })

        assert.strictEqual(newUnit('6 meter').toString(), '1.5 Bmeter')
        assert.strictEqual(newUnit('10 Cmeter').toString(), '1.25 Fmeter')
      })

      it('should only allow common prefixes that are included in prefixes', () => {
        let meter = Object.assign({}, unit.definitions().units.meter)
        meter.commonPrefixes = ['', 'invalidPrefix']
        assert.throws(() => configCustomUnits({
          meter
        }), /common prefix.*was not found among the allowable prefixes/)
      })

      it('should create new base quantities and derived quantities', () => {
        let newUnit = unit.config({
          definitions: {
            baseQuantities: ['ESSENCE_OF_FOO'],
            quantities: {
              'FOOLUME': 'ESSENCE_OF_FOO^3',
              'FOOLOCITY': 'ESSENCE_OF_FOO TIME^-1'
            },
            units: {
              foo: {
                quantity: 'ESSENCE_OF_FOO',
                value: 1,
                prefixes: 'LONG'
              },
              fib: '5 foo/hr',
              flab: '1 foo^3'
            },
            unitSystems: {
              si: {
                ESSENCE_OF_FOO: 'foo',
                FOOLUME: 'flab',
                FOOLOCITY: 'fib'
              }
            }
          }
        })

        assert.deepStrictEqual(newUnit('fib').getQuantities(), ['FOOLOCITY'])
        assert.deepStrictEqual(newUnit('flab').getQuantities(), ['FOOLUME'])
        assert.strictEqual(newUnit('1 megafoo/s').simplify().toString(), '720000000 fib')
        assert.strictEqual(newUnit('1 megafoo/s').to('fib').toString(), '720000000 fib')
        assert.strictEqual(newUnit('3 foo').pow(3).toString(), '27 flab')
      })

      it('should throw on duplicate base quantities', () => {
        assert.throws(() => unit.config({
          definitions: {
            baseQuantities: ['MASS']
          }
        }), /Duplicate base quantity: MASS/)
      })

      it('should throw on invalid quantity definitions', () => {
        assert.throws(() => unit.config({
          definitions: {
            quantities: {
              'FOONESS': 'LENGTH^UMPTEENTHPOWER'
            }
          }
        }), /Error processing quantity FOONESS: could not determine value of the exponent in string LENGTH\^UMPTEENTHPOWER/)

        assert.throws(() => unit.config({
          definitions: {
            quantities: {
              'AWESOME': 'SAUCE'
            }
          }
        }), /Error processing quantity AWESOME: base quantity SAUCE not found/)
      })

      it('should extend, but not replace, individual unit systems', () => {
        // TODO: Still no good way to say that mi/hr should be replaced by mph unless mi is explicitly designated as a part of the unit system
        let newUnit = unit.config({
          definitions: {
            units: { mph: '1 mi/hr' },
            unitSystems: {
              us: { VELOCITY: 'mph', LENGTH: 'mi' }
            }
          }
        })
        assert.deepStrictEqual(newUnit('70 mi').div('60 min').toString(), '70 mph')
        assert.deepStrictEqual(newUnit.definitions().unitSystems.us.MASS, 'lbm')
      })

      it('should throw on unknown unit systems', () => {
        assert.throws(() => {
          unit.config({ system: 'nervous' })
        }, /Unknown unit system/)
      })

      it('should not allow unknown units in unit systems', () => {
        assert.throws(() => {
          unit.config({
            definitions: {
              unitSystems: { si: { LENGTH: 'fiddlesticks' } }
            }
          })
        }, /Unknown unit.*for quantity.*in unit system/)
        assert.doesNotThrow(() => {
          unit.config({
            definitions: {
              unitSystems: { si: { LENGTH: 'chain' } }
            }
          })
        })
      })

      it('should not allow unknown quantities in unit systems', () => {
        assert.throws(() => {
          unit.config({
            definitions: {
              unitSystems: { si: { ESSENCE_OF_FOO: 'meter' } }
            }
          })
        }, /Unit system.*mentions quantity.*which does not exist/)
      })

      it('should not allow inconsistent units/quantities in unit systems', () => {
        assert.throws(() => {
          unit.config({
            definitions: {
              unitSystems: { si: { LENGTH: 'day' } }
            }
          })
        }, /In system.*quantity.*is inconsistent with unit/)
      })

      it('should add new unit systems', () => {
        let newUnit = unit.config({
          system: 'custom',
          definitions: {
            unitSystems: {
              custom: { LENGTH: 'rod' }
            }
          }
        })
        assert.strictEqual(newUnit('66 ft').simplify().toString(), '4 rod')
      })

      it('should skip builtins if so desired', () => {
        let newUnit = unit.config({
          prefixMin: 0.200001,
          prefixMax: 4.99999,
          definitions: {
            skipBuiltIns: true,
            baseQuantities: ['ESSENCE_OF_FOO'],
            quantities: {
              'FOOLUME': 'ESSENCE_OF_FOO^3'
            },
            units: {
              foo: {
                quantity: 'ESSENCE_OF_FOO',
                value: 1,
                prefixes: 'PREFOO',
                commonPrefixes: ['fff', 'ff', 'f', '', 'F', 'FF', 'FFF']
              },
              fib: { value: '5 foo', prefixes: 'PREFOO', commonPrefixes: ['fff', 'ff', 'f', '', 'F', 'FF', 'FFF'] },
              flab: { value: '1 foo^3', prefixes: 'PREFOO', commonPrefixes: ['fff', 'ff', 'f', '', 'F', 'FF', 'FFF'] }
            },
            unitSystems: {
              fooSys: {
                ESSENCE_OF_FOO: 'foo',
                FOOLUME: 'flab'
              }
            },
            prefixes: {
              PREFOO: {
                'fff': 0.008,
                'ff': 0.04,
                'f': 0.2,
                '': 1,
                'F': 5,
                'FF': 25,
                'FFF': 125
              }
            }
          }
        })

        assert.strictEqual(newUnit('40 fib').format(), '1.6 FFfib')
      })

      describe('autoAddToSystem', () => {
        it.skip('should add the unit to the specified system', () => {
          let newUnit = unit.config({
            system: 'us',
            definitions: {
              units: {
                mph: {
                  value: '1 mile/hour',
                  autoAddToSystem: 'us'
                }
              }
            }
          })
          assert.strictEqual(newUnit.definitions().unitSystems.us.VELOCITY, 'mph')
        })

        it.skip('should auto-select system when \'auto\'', () => {
          let newUnit = unit.config({
            definitions: {
              units: {
                mph: {
                  value: '1 mile/hour',
                  autoAddToSystem: 'auto'
                }
              }
            }
          })
          assert.strictEqual(newUnit.definitions().unitSystems.us.VELOCITY, 'mph')
        })

        it.skip('should format matching Units using the newly added unit only if autoAddToSystem was set', () => {
          let newUnit = unit.config({
            definitions: {
              units: {
                mph: {
                  value: '1 mile/hour',
                  autoAddToSystem: 'us'
                }
              }
            }
          })
          let newUnitNoAuto = unit.config({
            definitions: {
              units: {
                mph: '1 mile/hour'
              }
            }
          })
          assert.strictEqual(unit('1 mile/hour').simplify().toString(), '1 mile/hour')
          assert.strictEqual(newUnitNoAuto('1 mile/hour').simplify().toString(), '1 mile/hour')
          assert.strictEqual(newUnit('1 mile/hour').simplify().toString(), '1 mph')
        })

        it.skip('should create new quantities', () => {
          let newUnit = unit.config({
            definitions: {
              units: {
                snap: {
                  value: '1 m/s^4',
                  autoAddToSystem: 'auto'
                }
              }
            }
          })
          assert.deepStrictEqual(newUnit('1 m/s^4').getQuantities(), ['snap_QUANTITY'])
          assert.strictEqual(newUnit('1 m/s^4').simplify().toString(), '1 snap')
        })

        it.skip('should not override existing quantities', () => {
          let newUnit = unit.config({
            definitions: {
              units: {
                snap: {
                  value: '1 m/s^4',
                  autoAddToSystem: 'auto'
                }
              },
              quantities: {
                JOUNCE: ['LENGTH/TIME^4']
              }
            }
          })
          assert.deepStrictEqual(newUnit('1 m/s^4').getQuantities(), ['JOUNCE'])
          assert.strictEqual(newUnit('1 m/s^4').simplify().toString(), '1 snap')
        })

        it('should not override existing unitSystem', () => {
          let newUnit = unit.config({
            definitions: {
              units: {
                tenmeter: {
                  value: '10 m',
                  autoAddToSystem: 'si'
                }
              }
            }
          })
          assert.strictEqual(newUnit('100 J').div('10 N').simplify().toString(), '10 m') // Not '1 tenmeter'
        })

        it.skip('should work as global option: definitions.autoAddToSystem', () => {
          let newUnit = unit.config({
            definitions: {
              units: {
                mph: '1 mile/hour'
              },
              autoAddToSystem: 'us'
            }
          })
          assert.strictEqual(newUnit('1 mile/hour').simplify().toString(), '1 mph')
        })

        it.skip('should throw if autoAddToSystem is not a string or known unit system', () => {
          assert.throws(() => {
            unit.config({ definitions: { units: { mph: { value: '1 mile/hour', autoAddToSystem: false } } } })
          }, /autoAddToSystem must be a string: either a known unit system or 'auto'/)
          assert.throws(() => {
            unit.config({ definitions: { units: { mph: { value: '1 mile/hour', autoAddToSystem: 'nervous' } } } })
          }, /autoAddToSystem must be a string: either a known unit system or 'auto'/)
        })
      })
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

  describe('definitions', () => {
    it('should return the original built-in unit definitions', () => {
      let defs = unit.definitions()

      assert.strictEqual(defs.units.inch.value, '0.0254 meter')
      assert.deepStrictEqual(defs.units.foot.aliases, ['ft', 'feet'])
      assert.strictEqual(defs.units.kelvin.prefixes, 'LONG')
      assert.strictEqual(defs.prefixes.LONG.giga, 1e9)
      assert.strictEqual(defs.prefixes.SHORT_LONG.giga, 1e9)
      assert.strictEqual(defs.unitSystems.si.FORCE, 'N')
      assert.strictEqual(defs.baseQuantities[0], 'MASS')
      assert.strictEqual(defs.quantities.AREA, 'LENGTH^2')

      // TODO: Add custom unit below so that the units get reprocessed (in case we cache unit definitions in the future)
      let defs2 = unit.config({}).definitions()

      assert.strictEqual(defs2.units.inch.value, '0.0254 meter')
      assert.deepStrictEqual(defs2.units.foot.aliases, ['ft', 'feet'])
      assert.strictEqual(defs2.units.kelvin.prefixes, 'LONG')
      assert.strictEqual(defs2.prefixes.LONG.giga, 1e9)
      assert.strictEqual(defs2.prefixes.SHORT_LONG.giga, 1e9)
      assert.strictEqual(defs2.unitSystems.si.FORCE, 'N')
      assert.strictEqual(defs2.baseQuantities[0], 'MASS')
      assert.strictEqual(defs2.quantities.AREA, 'LENGTH^2')
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

  describe('factory function', () => {
    it('should create unit correctly', () => {
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

      unit1 = unit('9.81', 'kg m/s^2')
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

    it('should ignore properties on Object.prototype', () => {
      Object.prototype.foo = unit._unitStore.defs.units['meter'] // eslint-disable-line no-extend-native

      assert.throws(() => { console.log(unit(1, 'foo')) }, /Unit "foo" not found/)

      delete Object.prototype.foo
    })

    it('should throw an error if called with wrong type of arguments', () => {
      assert.throws(() => { console.log(unit(0, 'bla')) }, /Unit.*not found/)
      assert.throws(() => { console.log(unit(0, 3)) }, /you must supply a single/)
    })
  })

  describe('exists', () => {
    it('should return true if the string contains unit plus a prefix', () => {
      assert.strictEqual(unit.exists('cm'), true)
      assert.strictEqual(unit.exists('inch'), true)
      assert.strictEqual(unit.exists('kb'), true)
      assert.strictEqual(unit.exists('bla'), false)
      assert.strictEqual(unit.exists('5cm'), false)
    })

    it('should throw on invalid parameter', () => {
      assert.throws(() => unit.exists(42), /parameter must be a string/)
    })
  })

  describe('getQuantity', () => {
    it('should return the QUANTITY matching this unit', () => {
      assert.deepStrictEqual(unit(5, 'kg m s K A rad bits').getQuantities(), [])
      assert.deepStrictEqual(unit(5).getQuantities(), ['UNITLESS'])
      assert.deepStrictEqual(unit(5, 'm s').getQuantities(), ['ABSEMENT'])
      assert.deepStrictEqual(unit(5, 'm/s^2').getQuantities(), ['ACCELERATION'])
      assert.deepStrictEqual(unit(5, 'deg').getQuantities(), ['ANGLE'])
      assert.deepStrictEqual(unit(5, 'rad/s^2').getQuantities(), ['ANGULAR_ACCELERATION'])
      assert.deepStrictEqual(unit(5, '5 kg m^2 rad/s').getQuantities(), ['ANGULAR_MOMENTUM'])
      assert.deepStrictEqual(unit(5, '5 rad/s').getQuantities(), ['ANGULAR_VELOCITY'])
      assert.deepStrictEqual(unit(5, 'mol').getQuantities(), ['AMOUNT_OF_SUBSTANCE'])
      assert.deepStrictEqual(unit(5, 'm^2').getQuantities(), ['AREA'])
      assert.deepStrictEqual(unit(5, 'kg/m^2').getQuantities(), ['AREA_DENSITY'])
      assert.deepStrictEqual(unit(5, 'kb').getQuantities(), ['BIT'])
      assert.deepStrictEqual(unit(5, 'Gb/s').getQuantities(), ['BIT_RATE'])
      assert.deepStrictEqual(unit(5, 'C/V').getQuantities(), ['CAPACITANCE'])
      assert.deepStrictEqual(unit(5, 'A/m^2').getQuantities(), ['CURRENT_DENSITY'])
      assert.deepStrictEqual(unit(5, 'A').getQuantities(), ['CURRENT'])
      assert.deepStrictEqual(unit(5, 'Pa s').getQuantities(), ['DYNAMIC_VISCOSITY'])
      assert.deepStrictEqual(unit(5, 'C').getQuantities(), ['ELECTRIC_CHARGE'])
      assert.deepStrictEqual(unit(5, 'C/m^3').getQuantities(), ['ELECTRIC_CHARGE_DENSITY'])
      assert.deepStrictEqual(unit(5, 'C/m^2').getQuantities(), ['ELECTRIC_DISPLACEMENT'])
      assert.deepStrictEqual(unit(5, 'V/m').getQuantities(), ['ELECTRIC_FIELD_STRENGTH'])
      assert.deepStrictEqual(unit(5, 'siemens').getQuantities(), ['ELECTRICAL_CONDUCTANCE'])
      assert.deepStrictEqual(unit(5, 'siemens/m').getQuantities(), ['ELECTRICAL_CONDUCTIVITY'])
      assert.deepStrictEqual(unit(5, 'V').getQuantities(), ['ELECTRIC_POTENTIAL'])
      assert.deepStrictEqual(unit(5, 'ohm').getQuantities(), ['RESISTANCE', 'IMPEDANCE'])
      assert.deepStrictEqual(unit(5, 'ohm m').getQuantities(), ['ELECTRICAL_RESISTIVITY'])
      assert.deepStrictEqual(unit(5, 'kg m^2 / s^2').getQuantities(), ['ENERGY', 'TORQUE'])
      assert.deepStrictEqual(unit(5, 'J / K').getQuantities(), ['ENTROPY', 'HEAT_CAPACITY'])
      assert.deepStrictEqual(unit(5, 'kg m / s^2').getQuantities(), ['FORCE'])
      assert.deepStrictEqual(unit(5, 's^-1').getQuantities(), ['FREQUENCY'])
      assert.deepStrictEqual(unit(5, 'W/m^2').getQuantities(), ['HEAT_FLUX_DENSITY', 'IRRADIANCE'])
      assert.deepStrictEqual(unit(5, 'N s').getQuantities(), ['IMPULSE', 'MOMENTUM'])
      assert.deepStrictEqual(unit(5, 'henry').getQuantities(), ['INDUCTANCE'])
      assert.deepStrictEqual(unit(5, 'm/s^3').getQuantities(), ['JERK'])
      assert.deepStrictEqual(unit(5, 'm^2/s').getQuantities(), ['KINEMATIC_VISCOSITY'])
      assert.deepStrictEqual(unit(5, 'cm').getQuantities(), ['LENGTH'])
      assert.deepStrictEqual(unit(5, 'kg/m').getQuantities(), ['LINEAR_DENSITY'])
      assert.deepStrictEqual(unit(5, 'candela').getQuantities(), ['LUMINOUS_INTENSITY'])
      assert.deepStrictEqual(unit(5, 'A/m').getQuantities(), ['MAGNETIC_FIELD_STRENGTH'])
      assert.deepStrictEqual(unit(5, 'tesla m^2').getQuantities(), ['MAGNETIC_FLUX'])
      assert.deepStrictEqual(unit(5, 'tesla').getQuantities(), ['MAGNETIC_FLUX_DENSITY'])
      assert.deepStrictEqual(unit(5, 'lbm').getQuantities(), ['MASS'])
      assert.deepStrictEqual(unit(5, 'mol/m^3').getQuantities(), ['MOLAR_CONCENTRATION'])
      assert.deepStrictEqual(unit(5, 'J/mol').getQuantities(), ['MOLAR_ENERGY'])
      assert.deepStrictEqual(unit(5, 'J/mol K').getQuantities(), ['MOLAR_ENTROPY', 'MOLAR_HEAT_CAPACITY'])
      assert.deepStrictEqual(unit(5, 'H/m').getQuantities(), ['PERMEABILITY'])
      assert.deepStrictEqual(unit(5, 'F/m').getQuantities(), ['PERMITTIVITY'])
      assert.deepStrictEqual(unit(5, 'kg m^2 / s^3').getQuantities(), ['POWER'])
      assert.deepStrictEqual(unit(5, 'kg / m s^2').getQuantities(), ['PRESSURE'])
      assert.deepStrictEqual(unit(5, 'H^-1').getQuantities(), ['RELUCTANCE'])
      assert.deepStrictEqual(unit(5, 'H^-1').getQuantities(), ['RELUCTANCE'])
      assert.deepStrictEqual(unit(5, 'J/kg').getQuantities(), ['SPECIFIC_ENERGY'])
      assert.deepStrictEqual(unit(5, 'J/kg K').getQuantities(), ['SPECIFIC_HEAT_CAPACITY'])
      assert.deepStrictEqual(unit(5, 'm^3/kg').getQuantities(), ['SPECIFIC_VOLUME'])
      assert.deepStrictEqual(unit(5, 'kg m^2/s').getQuantities(), ['SPIN'])
      assert.deepStrictEqual(unit(5, 'J/m^2').getQuantities(), ['SURFACE_TENSION'])
      assert.deepStrictEqual(unit(5, 'K').getQuantities(), ['TEMPERATURE'])
      assert.deepStrictEqual(unit(5, 'K/m').getQuantities(), ['TEMPERATURE_GRADIENT'])
      assert.deepStrictEqual(unit(5, 'W/m K').getQuantities(), ['THERMAL_CONDUCTIVITY'])
      assert.deepStrictEqual(unit(5, 'day').getQuantities(), ['TIME'])
      assert.deepStrictEqual(unit(5, 'm/s').getQuantities(), ['VELOCITY'])
      assert.deepStrictEqual(unit(5, 'm^3').getQuantities(), ['VOLUME'])
      assert.deepStrictEqual(unit(5, 'm^3/s').getQuantities(), ['VOLUMETRIC_FLOW_RATE'])
    })
  })

  describe('hasQuantity', () => {
    it('should test whether a unit has a certain dimension', () => {
      assert.strictEqual(unit(5, 'cm').hasQuantity('ANGLE'), false)
      assert.strictEqual(unit(5, 'cm').hasQuantity('LENGTH'), true)
      assert.strictEqual(unit(5, 'kg m / s ^ 2').hasQuantity('FORCE'), true)
    })

    it('should return false for an unknown quantity', () => {
      assert.strictEqual(unit(5, 'cm').hasQuantity('FOOLOCITY'), false)
    })

    it('should work if passed a quantity array directly from the compiled definitions', () => {
      assert.strictEqual(unit(5, 'kg m / s ^ 2').hasQuantity(unit._unitStore.defs.quantities['FORCE']), true)
    })
  })

  describe('equalQuantity', () => {
    it('should test whether two units are of the same quantity', () => {
      assert.strictEqual(unit(5, 'cm').equalQuantity(unit(10, 'm')), true)
      assert.strictEqual(unit(5, 'cm').equalQuantity(unit(10, 'kg')), false)
      assert.strictEqual(unit(5, 'N').equalQuantity(unit(10, 'kg m / s ^ 2')), true)
      assert.strictEqual(unit(8.314, 'J / mol K').equalQuantity(unit(0.02366, 'ft^3 psi / mol degF')), true)
    })
  })

  describe('equals', () => {
    it('should test whether two units are equal', () => {
      assert.strictEqual(unit(100, 'cm').equals(unit(1, 'm')), true)
      assert.strictEqual(unit(100, 'cm').equals(unit(2, 'm')), false)
      assert.strictEqual(unit(100, 'cm').equals(unit(1, 'kg')), false)
      assert.strictEqual(unit(100, 'ft lbf').equals(unit(1200, 'in lbf')), true)
      assert.strictEqual(unit(100, 'N').equals(unit(100, 'kg m / s ^ 2')), true)
      assert.strictEqual(unit(100, 'N').equals(unit(100, 'kg m / s')), false)
      assert.strictEqual(unit(100, 'Hz').equals(unit(100, 's ^ -1')), true)
    })

    it('should work with valueless units', () => {
      assert.strictEqual(unit('cm').equals(unit('cm')), true)
      assert.strictEqual(unit('cm').equals(unit('m')), false)
      assert.strictEqual(unit('cm/s').equals(unit('cm/s')), true)
    })

    it('should return false if one unit has a value and the other does not', () => {
      assert.strictEqual(unit('cm/s').equals(unit('1 cm/s')), false)
    })

    it('should convert parameter to a unit', () => {
      assert(unit(100, 'cm').equals('1 m'))
      assert(unit('3 kg / kg').equals(3))
    })
  })

  describe('compare', () => {
    it('should compare two units', () => {
      assert.strictEqual(unit('30 min').compare('1 hour'), -1)
      assert.strictEqual(unit('60 min').compare('1 hour'), 0)
      assert.strictEqual(unit('90 min').compare('1 hour'), 1)
    })

    it('should work with valueless units', () => {
      assert.strictEqual(unit('kg/hr').compare('kg/min'), -1)
      assert.strictEqual(unit('kg/hr').compare('kg/hr'), 0)
      assert.strictEqual(unit('kg/hr').compare('g/hr'), 1)
    })

    it('should throw if dimensions do not match', () => {
      assert.throws(() => unit(100, 'N').compare(unit(100, 'kg m / s')), /Cannot compare units.*dimensions do not match/)
      assert.throws(() => unit(100, 'cm').compare(unit(1, 'kg')), /Cannot compare units.*dimensions do not match/)
    })

    it('should convert parameter to a unit', () => {
      assert.strictEqual(unit(100, 'cm').compare('2 m'), -1)
      assert.strictEqual(unit('3 kg / kg').compare(2), 1)
    })

    it('should consistently compare NaNs', () => {
      assert.strictEqual(unit(100, 'cm').compare(unit(NaN, 'cm')), -1)
      assert.strictEqual(unit(NaN, 'cm').compare(unit(100, 'cm')), 1)
      assert.strictEqual(unit(NaN, 'cm').compare(unit(NaN, 'cm')), 1)
    })

    it('should sort Infinities and NaNs correctly', () => {
      const units = [
        unit(10, 'ft'),
        unit(Infinity, 'm'),
        unit(NaN, 'km'),
        unit(1, 'in'),
        unit(-Infinity, 'nm'),
        unit(1, 'ft'),
        unit(Infinity, 'mm'),
        unit(NaN, 'cm'),
        unit(-Infinity, 'mi'),
        unit(10, 'in')
      ]

      // Note: Infinity m and Infinity mm are the same number
      units.sort((a, b) => a.compare(b))
      assert.deepStrictEqual(
        units.map(u => u.toString()),
        [
          '-Infinity nm', '-Infinity mi',
          '1 in', '10 in',
          '1 ft', '10 ft',
          'Infinity m', 'Infinity mm',
          'NaN km', 'NaN cm'
        ]
      )
    })
  })

  describe('lessThan', () => {
    it('should test whether one unit is less than another', () => {
      assert.strictEqual(unit(100, 'cm').lessThan(unit(1, 'm')), false)
      assert.strictEqual(unit(100, 'cm').lessThan(unit(2, 'm')), true)
      // assert.strictEqual(unit(100, 'ft lbf').lessThan(unit(1200, 'in lbf')), false)  // Round-off error
      assert.strictEqual(unit(100, 'N').lessThan(unit(100, 'kg m / s ^ 2')), false)
      assert.strictEqual(unit(100, 'Hz').lessThan(unit(100, 's ^ -1')), false)
      assert.strictEqual(unit(101, 'Hz').lessThan(unit(100, 's ^ -1')), false)
      assert.strictEqual(unit(99, 'Hz').lessThan(unit(100, 's ^ -1')), true)
    })

    it('should work with valueless units', () => {
      assert.strictEqual(unit('cm').lessThan(unit('cm')), false)
      assert.strictEqual(unit('cm').lessThan(unit('m')), true)
      assert.strictEqual(unit('cm/s').lessThan(unit('cm/min')), false)
    })

    it('should throw if dimensions do not match', () => {
      assert.throws(() => unit(100, 'N').lessThan(unit(100, 'kg m / s')), /Cannot compare units.*dimensions do not match/)
      assert.throws(() => unit(100, 'cm').lessThan(unit(1, 'kg')), /Cannot compare units.*dimensions do not match/)
    })

    it('should throw if one unit has a value and the other does not', () => {
      assert.throws(() => unit('1m').lessThan('km'), /Cannot compare units.*one has a value and the other does not/)
    })

    it('should convert parameter to a unit', () => {
      assert(unit(100, 'cm').lessThan('2 m'))
      assert(unit('3 kg / kg').lessThan(4))
    })
  })

  describe('lessThanOrEqual', () => {
    it('should test whether one unit is less than another', () => {
      assert.strictEqual(unit(100, 'cm').lessThanOrEqual(unit(1, 'm')), true)
      assert.strictEqual(unit(100, 'cm').lessThanOrEqual(unit(2, 'm')), true)
      // assert.strictEqual(unit(100, 'ft lbf').lessThanOrEqual(unit(1200, 'in lbf')), false)  // Round-off error
      assert.strictEqual(unit(100, 'N').lessThanOrEqual(unit(100, 'kg m / s ^ 2')), true)
      assert.strictEqual(unit(100, 'Hz').lessThanOrEqual(unit(100, 's ^ -1')), true)
      assert.strictEqual(unit(101, 'Hz').lessThanOrEqual(unit(100, 's ^ -1')), false)
      assert.strictEqual(unit(99, 'Hz').lessThanOrEqual(unit(100, 's ^ -1')), true)
    })

    it('should work with valueless units', () => {
      assert.strictEqual(unit('cm').lessThanOrEqual(unit('cm')), true)
      assert.strictEqual(unit('cm').lessThanOrEqual(unit('m')), true)
      assert.strictEqual(unit('cm/s').lessThanOrEqual(unit('cm/min')), false)
    })

    it('should throw if dimensions do not match', () => {
      assert.throws(() => unit(100, 'N').lessThanOrEqual(unit(100, 'kg m / s')), /Cannot compare units.*dimensions do not match/)
      assert.throws(() => unit(100, 'cm').lessThanOrEqual(unit(1, 'kg')), /Cannot compare units.*dimensions do not match/)
    })

    it('should throw if one unit has a value and the other does not', () => {
      assert.throws(() => unit('1m').lessThanOrEqual('km'), /Cannot compare units.*one has a value and the other does not/)
    })

    it('should convert parameter to a unit', () => {
      assert(unit(100, 'cm').lessThanOrEqual('2 m'))
      assert(unit('3 kg / kg').lessThanOrEqual(4))
    })
  })

  describe('greaterThan', () => {
    it('should test whether one unit is greater than another', () => {
      assert.strictEqual(unit(100, 'cm').greaterThan(unit(1, 'm')), false)
      assert.strictEqual(unit(100, 'cm').greaterThan(unit(0.5, 'm')), true)
      // assert.strictEqual(unit(100, 'ft lbf').greaterThan(unit(1200, 'in lbf')), false)  // Round-off error
      assert.strictEqual(unit(100, 'N').greaterThan(unit(100, 'kg m / s ^ 2')), false)
      assert.strictEqual(unit(100, 'Hz').greaterThan(unit(100, 's ^ -1')), false)
      assert.strictEqual(unit(101, 'Hz').greaterThan(unit(100, 's ^ -1')), true)
      assert.strictEqual(unit(99, 'Hz').greaterThan(unit(100, 's ^ -1')), false)
    })

    it('should work with valueless units', () => {
      assert.strictEqual(unit('cm').greaterThan(unit('cm')), false)
      assert.strictEqual(unit('cm').greaterThan(unit('m')), false)
      assert.strictEqual(unit('cm/s').greaterThan(unit('cm/min')), true)
    })

    it('should throw if dimensions do not match', () => {
      assert.throws(() => unit(100, 'N').greaterThan(unit(100, 'kg m / s')), /Cannot compare units.*dimensions do not match/)
      assert.throws(() => unit(100, 'cm').greaterThan(unit(1, 'kg')), /Cannot compare units.*dimensions do not match/)
    })

    it('should throw if one unit has a value and the other does not', () => {
      assert.throws(() => unit('1m').greaterThan('km'), /Cannot compare units.*one has a value and the other does not/)
    })

    it('should convert parameter to a unit', () => {
      assert(unit(100, 'cm').greaterThan('0.5 m'))
      assert(unit('3 kg / kg').greaterThan(2))
    })
  })

  describe('greaterThanOrEqual', () => {
    it('should test whether one unit is greater than another', () => {
      assert.strictEqual(unit(100, 'cm').greaterThanOrEqual(unit(1, 'm')), true)
      assert.strictEqual(unit(100, 'cm').greaterThanOrEqual(unit(2, 'm')), false)
      // assert.strictEqual(unit(100, 'ft lbf').greaterThanOrEqual(unit(1200, 'in lbf')), false)  // Round-off error
      assert.strictEqual(unit(100, 'N').greaterThanOrEqual(unit(100, 'kg m / s ^ 2')), true)
      assert.strictEqual(unit(100, 'Hz').greaterThanOrEqual(unit(100, 's ^ -1')), true)
      assert.strictEqual(unit(101, 'Hz').greaterThanOrEqual(unit(100, 's ^ -1')), true)
      assert.strictEqual(unit(99, 'Hz').greaterThanOrEqual(unit(100, 's ^ -1')), false)
    })

    it('should work with valueless units', () => {
      assert.strictEqual(unit('cm').greaterThanOrEqual(unit('cm')), true)
      assert.strictEqual(unit('cm').greaterThanOrEqual(unit('m')), false)
      assert.strictEqual(unit('cm/s').greaterThanOrEqual(unit('cm/min')), true)
    })

    it('should throw if dimensions do not match', () => {
      assert.throws(() => unit(100, 'N').greaterThanOrEqual(unit(100, 'kg m / s')), /Cannot compare units.*dimensions do not match/)
      assert.throws(() => unit(100, 'cm').greaterThanOrEqual(unit(1, 'kg')), /Cannot compare units.*dimensions do not match/)
    })

    it('should throw if one unit has a value and the other does not', () => {
      assert.throws(() => unit('1m').greaterThanOrEqual('km'), /Cannot compare units.*one has a value and the other does not/)
    })

    it('should convert parameter to a unit', () => {
      assert(unit(100, 'cm').greaterThanOrEqual('0.5 m'))
      assert(unit('3 kg / kg').greaterThanOrEqual(2))
    })
  })

  describe('clone', () => {
    it('should clone a unit', () => {
      const u1 = unit(100, 'cm')
      const u2 = u1.clone()
      assert.notStrictEqual(u1, u2)
      assert.deepStrictEqual(u1, u2)

      const u3 = unit(8.314, 'km/hr')
      const u4 = u3.clone()
      assert.notStrictEqual(u3, u4)
      assert.deepStrictEqual(u3, u4)

      const u7 = unit(8.314, 'kg m^2 / s^2 K mol')
      const u8 = u7.clone()
      assert.notStrictEqual(u7, u8)
      assert.deepStrictEqual(u7, u8)

      const u9 = unit(8.314, 'kg m^2 / s^2 K mol').to()
      const u10 = u9.clone()
      assert.notStrictEqual(u9, u10)
      assert.deepStrictEqual(u9, u10)
    })

    it('should freeze the returned unit', () => {
      assert(Object.isFrozen(unit(100, 'cm').clone()))
    })
  })

  describe('to', () => {
    it('should convert a unit using a target unit string', () => {
      const u1 = unit(5000, 'in')
      assert.strictEqual(u1.value, 5000)
      assert.strictEqual(u1.units[0].unit.name, 'in')
      assert.strictEqual(u1.units[0].prefix, '')

      const u2 = u1.to('cm')
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 12700)
      assert.strictEqual(u2.units[0].unit.name, 'm')
      assert.strictEqual(u2.units[0].prefix, 'c')

      const u3 = unit(299792.458, 'km/s')
      assert.strictEqual(u3.value, 299792.458)
      assert.strictEqual(u3.units[0].unit.name, 'm')
      assert.strictEqual(u3.units[1].unit.name, 's')
      assert.strictEqual(u3.units[0].prefix, 'k')

      const u4 = u3.to('m/s')
      assert.notStrictEqual(u3, u4) // u4 must be a clone
      assert.strictEqual(u4.value, 299792458)
      assert.strictEqual(u4.units[0].unit.name, 'm')
      assert.strictEqual(u4.units[1].unit.name, 's')
      assert.strictEqual(u4.units[0].prefix, '')
    })

    it('should convert a unit using a target unit', () => {
      const u1 = unit(5000, 'in')
      assert.strictEqual(u1.value, 5000)
      assert.strictEqual(u1.units[0].unit.name, 'in')
      assert.strictEqual(u1.units[0].prefix, '')

      const u2 = u1.to(unit('cm'))
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 12700)
      assert.strictEqual(u2.units[0].unit.name, 'm')
      assert.strictEqual(u2.units[0].prefix, 'c')

      const u3 = unit(299792.458, 'km/s')
      assert.strictEqual(u3.value, 299792.458)
      assert.strictEqual(u3.units[0].unit.name, 'm')
      assert.strictEqual(u3.units[1].unit.name, 's')
      assert.strictEqual(u3.units[0].prefix, 'k')

      const u4 = u3.to(unit('m/s'))
      assert.notStrictEqual(u3, u4) // u4 must be a clone
      assert.strictEqual(u4.value, 299792458)
      assert.strictEqual(u4.units[0].unit.name, 'm')
      assert.strictEqual(u4.units[1].unit.name, 's')
      assert.strictEqual(u4.units[0].prefix, '')
    })

    it('should convert a valueless unit', () => {
      const u1 = unit(null, 'm')
      assert.strictEqual(u1.value, null)
      assert.strictEqual(u1.units[0].unit.name, 'm')
      assert.strictEqual(u1.units[0].prefix, '')

      const u2 = u1.to(unit(null, 'cm'))
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 100) // u2 must have a value
      assert.strictEqual(u2.units[0].unit.name, 'm')
      assert.strictEqual(u2.units[0].prefix, 'c')

      const u3 = unit(null, 'm/s')
      assert.strictEqual(u3.value, null)
      assert.strictEqual(u3.units[0].unit.name, 'm')
      assert.strictEqual(u3.units[1].unit.name, 's')
      assert.strictEqual(u3.units[0].prefix, '')

      const u4 = u3.to(unit(null, 'cm/s'))
      assert.notStrictEqual(u3, u4) // u4 must be a clone
      assert.strictEqual(u4.value, 100) // u4 must have a value
      assert.strictEqual(u4.units[0].unit.name, 'm')
      assert.strictEqual(u4.units[1].unit.name, 's')
      assert.strictEqual(u4.units[0].prefix, 'c')

      const u5 = unit(null, 'km').to('cm')
      assert.strictEqual(u5.value, 100000)
      assert.strictEqual(u5.units[0].unit.name, 'm')
      assert.strictEqual(u5.units[0].prefix, 'c')
    })

    it('should convert a binary prefixes (1)', () => {
      const u1 = unit(1, 'Kib')
      assert.strictEqual(u1.value, 1)
      assert.strictEqual(u1.units[0].unit.name, 'b')
      assert.strictEqual(u1.units[0].prefix, 'Ki')

      const u2 = u1.to(unit(null, 'b'))
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 1024) // u2 must have a value
      assert.strictEqual(u2.units[0].unit.name, 'b')
      assert.strictEqual(u2.units[0].prefix, '')

      const u3 = unit(1, 'Kib/s')
      assert.strictEqual(u3.value, 1)
      assert.strictEqual(u3.units[0].unit.name, 'b')
      assert.strictEqual(u3.units[1].unit.name, 's')
      assert.strictEqual(u3.units[0].prefix, 'Ki')

      const u4 = u3.to(unit(null, 'b/s'))
      assert.notStrictEqual(u3, u4) // u4 must be a clone
      assert.strictEqual(u4.value, 1024) // u4 must have a value
      assert.strictEqual(u4.units[0].unit.name, 'b')
      assert.strictEqual(u4.units[1].unit.name, 's')
      assert.strictEqual(u4.units[0].prefix, '')
    })

    it('should convert a binary prefixes (2)', () => {
      const u1 = unit(1, 'kb')
      assert.strictEqual(u1.value, 1)
      assert.strictEqual(u1.units[0].unit.name, 'b')
      assert.strictEqual(u1.units[0].prefix, 'k')

      const u2 = u1.to(unit(null, 'b'))
      assert.notStrictEqual(u1, u2) // u2 must be a clone
      assert.strictEqual(u2.value, 1000) // u2 must have a value
      assert.strictEqual(u2.units[0].unit.name, 'b')
      assert.strictEqual(u2.units[0].prefix, '')
    })

    it('the alternate api syntax should also work', () => {
      assert.strictEqual(unit.to('lbm', 'kg').format(), '0.45359237 kg')
      assert.strictEqual(unit.to(unit('10 lbm'), unit('kg')).format(), '4.5359237 kg')
    })

    it('should throw an error when converting to an incompatible unit', () => {
      const u1 = unit(5000, 'cm')
      assert.throws(() => { u1.to('kg') }, /dimensions do not match/)
      const u2 = unit(5000, 'N s')
      assert.throws(() => { u2.to('kg^5 / s') }, /dimensions do not match/)
    })

    it('should throw an error when converting to a unit having a value', () => {
      const u1 = unit(5000, 'cm')
      assert.throws(() => { u1.to(unit(4, 'm')) }, /unit must be valueless/)
    })

    it('should throw an error when converting to an unsupported type of argument', () => {
      const u1 = unit(5000, 'cm')
      assert.throws(() => { u1.to(new Date()) }, /Parameter must be a Unit or a string./)
    })
  })

  describe('getUnits', () => {
    it('should return the units only of a unit', () => {
      assert.deepStrictEqual(unit('42 kg / m s^2').getUnits(), unit('kg / m s^2'))
    })
  })

  describe('toString', () => {
    it('should convert to string when no extra simplification is requested', () => {
      assert.strictEqual(unit(5000, 'cm').to().toString(), '5000 cm')
      assert.strictEqual(unit(5, 'kg').to().toString(), '5 kg')
      assert.strictEqual(unit(2 / 3, 'm').to().toString(), '0.666666666666667 m')
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

    it('should convert to string properly', () => {
      assert.strictEqual(unit(5, 'kg').toString(), '5 kg')
      assert.strictEqual(unit(2 / 3, 'm').toString(), '0.666666666666667 m')
      assert.strictEqual(unit(5, 'N').toString(), '5 N')
      assert.strictEqual(unit(5, 'kg^1.0e0 m^1.0e0 s^-2.0e0').to().toString(), '5 kg m / s^2')
      assert.strictEqual(unit(5, 's^-2').toString(), '5 s^-2')
      assert.strictEqual(unit(5, 'm / s ^ 2').toString(), '5 m / s^2')
      assert.strictEqual(unit(null, 'kg m^2 / s^2 mol').toString(), 'kg m^2 / s^2 mol')
      assert.strictEqual(unit(10, 'hertz').toString(), '10 hertz')
    })

    it('should render with the best prefix', () => {
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

      assert.strictEqual(unit(-0.000001, 'm').format(8), '-1 um')
      assert.strictEqual(unit(-0.00001, 'm').format(8), '-10 um')
      assert.strictEqual(unit(-0.0001, 'm').format(8), '-0.1 mm')
      assert.strictEqual(unit(-0.0005, 'm').format(8), '-0.5 mm')
      assert.strictEqual(unit(-0.0006, 'm').toString(), '-0.6 mm')
      assert.strictEqual(unit(-0.001, 'm').toString(), '-0.1 cm')
      assert.strictEqual(unit(-0.01, 'm').toString(), '-1 cm')
      assert.strictEqual(unit(-100000, 'm').toString(), '-100 km')
      assert.strictEqual(unit(-300000, 'm').toString(), '-300 km')
      assert.strictEqual(unit(-500000, 'm').toString(), '-500 km')
      assert.strictEqual(unit(-600000, 'm').toString(), '-600 km')
      assert.strictEqual(unit(-1000000, 'm').toString(), '-1000 km')
      assert.strictEqual(unit(-10000000, 'm').toString(), '-10000 km')
      assert.strictEqual(unit(-2000, 'ohm').toString(), '-2 kohm')
    })

    it('should keep the original prefix when in range', () => {
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

    it('should render best prefix for a single unit raised to integral power', () => {
      assert.strictEqual(unit(3.2e7, 'm^2').toString(), '32 km^2')
      assert.strictEqual(unit(3.2e-7, 'm^2').toString(), '0.32 mm^2')
      assert.strictEqual(unit(15000, 'm^-1').toString(), '150 cm^-1')
      assert.strictEqual(unit(3e-9, 'm^-2').toString(), '0.003 km^-2')
      assert.strictEqual(unit(3e-9, 'm^-1.5').toString(), '3e-9 m^-1.5')
      assert.strictEqual(unit(2, 'kg^0').toString(), '2')
    })

    it('should not change the prefix unless there is a `commonPrefixes` defined for the unit', () => {
      // lumen has prefixes, but no commonPrefixes, so its prefixes should not change
      assert.strictEqual(unit('4 microlumen').format(), '4 microlumen')
      assert.strictEqual(unit('4e-6 lumen').format(), '0.000004 lumen')

      // newton has prefixes and commonPrefixes so its prefix should change
      assert.strictEqual(unit('4 micronewton').format(), '4 micronewton')
      assert.strictEqual(unit('4e-6 newton').format(), '4 micronewton')
    })

    it('should use the prefixesToChooseFrom option', () => {
      assert.strictEqual(unit('4 microlumen').format({ prefixesToChooseFrom: 'all' }), '4 microlumen')
      assert.strictEqual(unit('4e-6 lumen').format({ prefixesToChooseFrom: 'all' }), '4 microlumen')

      assert.strictEqual(unit('4e-6 micronewton').format({ prefixesToChooseFrom: 'all' }), '4 piconewton')
      assert.strictEqual(unit('4e-2 newton').format({ prefixesToChooseFrom: 'all' }), '0.4 decinewton')
      assert.strictEqual(unit('4e+9 newton').format({ prefixesToChooseFrom: 'all' }), '4 giganewton')

      assert.strictEqual(unit('4e-6 micronewton').format({ prefixesToChooseFrom: 'common' }), '0.000004 micronewton')
      assert.strictEqual(unit('4e-2 newton').format({ prefixesToChooseFrom: 'common' }), '40 millinewton')
      assert.strictEqual(unit('4e+9 newton').format({ prefixesToChooseFrom: 'common' }), '4000 meganewton')
    })

    it('should avoid division by zero by not choosing a prefix for very small values', () => {
      assert.strictEqual(unit('1e-40 m').format(), '1e-31 nm')
      assert.strictEqual(unit('1e-60 m').format(), '1e-60 m')
      assert.strictEqual(unit('0 m').format(), '0 m')
      assert.strictEqual(unit('-1e-40 m').format(), '-1e-31 nm')
      assert.strictEqual(unit('-1e-60 m').format(), '-1e-60 m')
    })

    it('should not render best prefix if "fixed" by the `to` method', () => {
      const u = unit(5e-3, 'm')
      assert.strictEqual(u.toString(), '0.5 cm')
      const v = u.to()
      assert.strictEqual(v.toString(), '0.005 m')
    })

    it('should format a unit without value', () => {
      assert.strictEqual(unit(null, 'cm').toString(), 'cm')
      assert.strictEqual(unit(null, 'm').toString(), 'm')
      assert.strictEqual(unit(null, 'kg m/s').toString(), 'kg m / s')
    })

    it('should format a unit with fixed prefix and without value', () => {
      assert.strictEqual(unit(null, 'km').to('cm').toString(), '100000 cm')
      assert.strictEqual(unit(null, 'inch').to('cm').toString(), '2.54 cm')
      assert.strictEqual(unit(null, 'N/m^2').to('lbf/inch^2').toString({ precision: 10 }), '0.0001450377377 lbf / inch^2')
    })

    it('should ignore properties in Object.prototype when finding the best prefix', () => {
      Object.prototype.foo = 'bar' // eslint-disable-line no-extend-native

      assert.strictEqual(unit(5e5, 'cm').format(), '5 km')

      delete Object.prototype.foo
    })
  })

  describe('setValue', () => {
    it('should set a unit\'s value', () => {
      assert.strictEqual(unit('10 lumen').setValue(20).format(), '20 lumen')
      assert.strictEqual(unit('lumen').setValue(20).format(), '20 lumen')
      assert.strictEqual(unit('10 lumen').setValue(null).format(), 'lumen')
      assert.strictEqual(unit('10 lumen').setValue().format(), 'lumen')
    })
  })

  describe('getValue', () => {
    it('should get a unit\'s value', () => {
      assert.strictEqual(unit('20 kg').getValue(), 20)
      assert.strictEqual(unit('3 g').getValue(), 3)
      assert.strictEqual(unit('40 mi/hr').getValue(), 40)
      assert.strictEqual(unit('km/hr').getValue(), null)
    })
  })

  describe('getNormalizedValue', () => {
    it('should get a unit\'s normalized value', () => {
      assert.strictEqual(unit('20 kg').getNormalizedValue(), 20)
      assert.strictEqual(unit('3 g').getNormalizedValue(), 0.003)
      assert.strictEqual(unit('40 mi/hr').getNormalizedValue(), 17.8816)
      assert.strictEqual(unit('km/hr').getNormalizedValue(), null)
    })
  })

  describe('setNormalizedValue', () => {
    it('should set a unit\'s normalized value', () => {
      assert.strictEqual(unit('20 kg').setNormalizedValue(10).format(), '10 kg')
      assert.strictEqual(unit('3 g').setNormalizedValue(5).format(), '5 kg')
      assert.strictEqual(unit('40 mi/hr').setNormalizedValue(10).format(), '22.369362920544 mi / hr')
      assert.strictEqual(unit('km/hr').setNormalizedValue(1).format(), '3.6 km / hr')
    })
  })

  describe('simplify', () => {
    it('should not simplify units fixed by the to() method', () => {
      const unit1 = unit(10, 'kg m/s^2').to()
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[1].unit.name, 'm')
      assert.strictEqual(unit1.units[2].unit.name, 's')
      assert.strictEqual(unit1.toString(), '10 kg m / s^2')
    })

    it('should simplify units without values', () => {
      assert.strictEqual(unit('kg m/s^2').simplify().format(), 'N')
    })

    it('should simplify units when they cancel out', () => {
      const unit1 = unit(2, 'Hz')
      const unit2 = unit(2, 's')
      const unit3 = unit1.mul(unit2)
      assert.strictEqual(unit3.toString(), '4')

      const nounit = unit('40m').mul('40N').div('40J')
      assert.strictEqual(nounit.toString(), '40')

      const nounit2 = unit('2 hours').div('1 hour')
      assert.strictEqual(nounit2.toString(), '2')
    })

    it('should simplify units according to chosen unit system', () => {
      // Simplify explicitly
      let unit1 = unit.config({ system: 'us' })('10 N')
      assert.strictEqual(unit1.simplify().toString(), '2.2480894309971 lbf')

      let unit2 = unit.config({ system: 'cgs' })('10 N')
      assert.strictEqual(unit2.simplify().toString(), '1000 kdyn')

      // Reduce threshold to 0
      let newUnit = unit.config({ simplifyThreshold: 0 })

      let unit3 = newUnit.config({ system: 'us' })('10 N')
      assert.strictEqual(unit3.toString(), '2.2480894309971 lbf')

      let unit4 = newUnit.config({ system: 'cgs' })('10 N')
      assert.strictEqual(unit4.toString(), '1000 kdyn')
    })

    it('should correctly simplify units when unit system is "auto"', () => {
      const unit1 = unit(5, 'lbf min / s')
      assert.strictEqual(unit1.simplify().toString(), '300 lbf')
      assert.strictEqual(unit('150 lbf').div('10 in^2').toString(), '15 psi')
      assert.strictEqual(unit('400 N').div('10 cm^2').toString(), '400 kPa')
    })

    it.skip('should infer the unit system when using non-preferred units which are members of that system', () => {
      // mile and kip are not preferred, but are members of the 'us' system, therefore result should simplify to 'BTU'
      let unit1 = unit('10 mile').mul('10 kip')
      assert.strictEqual(unit1.toString(), '0.678515620705073 MMBTU')
    })

    it.skip('should try to use preexisting units in the simplified expression', () => {
      let unit1 = unit('10 ft hour / minute')
      assert.strictEqual(unit1.toString(), '600 ft')

      unit1 = unit('10 mile hour / minute')
      assert.strictEqual(unit1.toString(), '600 mile')

      unit1 = unit('10 mi hour / minute')
      assert.strictEqual(unit1.toString(), '600 mi')

      unit1 = unit('10 m hour / minute')
      assert.strictEqual(unit1.toString(), '600 m')

      unit1 = unit('10 meter hour / minute')
      assert.strictEqual(unit1.toString(), '600 meter')
    })

    it('should silently fail if the unit system does not specify a unit needed for a base quantity', () => {
      assert.strictEqual(unit('4 W / F').simplify().format(), '4 kg^2 m^4 / s^7 A^2')

      let newUnit = unit.config({
        system: 'noAmps',
        definitions: {
          unitSystems: {
            noAmps: {
              MASS: 'kg',
              LENGTH: 'm',
              TIME: 's'
            }
          }
        }
      })
      assert.strictEqual(newUnit('4 W / F').simplify().format(), '4 W / F')
    })

    it('should not simplify unless complexity is reduced by the threshold', () => {
      assert.strictEqual(unit('10 N m').toString(), '10 N m')
      assert.strictEqual(unit('10 J / m').toString(), '10 N')
      assert.strictEqual(unit('10 m^3 Pa').toString(), '10 J')
      assert.strictEqual(unit('10 s^-1').toString(), '10 Hz')
      assert.strictEqual(unit('10 C/s').toString(), '10 A')

      let newUnit = unit.config({ simplifyThreshold: 10 })
      assert.strictEqual(newUnit('10 N m').toString(), '10 N m')
      assert.strictEqual(newUnit('10 J / m').toString(), '10 J / m')
      assert.strictEqual(newUnit('10 m^3 Pa').toString(), '10 m^3 Pa')

      newUnit = newUnit.config({ simplifyThreshold: 0 })
      assert.strictEqual(newUnit('10 N m').toString(), '10 J')
      assert.strictEqual(newUnit('10 J / m').toString(), '10 N')
      assert.strictEqual(newUnit('10 m^3 Pa').toString(), '10 J')
    })
  })

  describe('precision', () => {
    it('should format units with given precision', () => {
      assert.strictEqual(unit.config({ precision: 3 })(2 / 3, 'm').toString(), '0.667 m')
      assert.strictEqual(unit.config({ precision: 1 })(2 / 3, 'm').toString(), '0.7 m')
      assert.strictEqual(unit.config({ precision: 10 })(2 / 3, 'm').toString(), '0.6666666667 m')
    })
  })

  describe('format', () => {
    it('should accept formatting options as argument to the function', () => {
      assert.strictEqual(unit('1 lb').to('kg').format({ prefix: 'always', prefixMin: 1, precision: 4 }), '453.6 g')
    })

    it('should render parentheses if desired', () => {
      assert.strictEqual(unit('kg m / s^2').to().format({ parentheses: true }), '(kg m) / s^2')
      assert.strictEqual(unit('8.314 J / mol K').to().format({ parentheses: true }), '8.314 J / (mol K)')
    })

    it('should only simplify units with values', () => {
      let unit1 = unit(null, 'kg m mol / s^2 mol')
      assert.strictEqual(unit1.format(), 'kg m / s^2')
      unit1 = unit1.mul(1)
      assert.strictEqual(unit1.format(), '1 N')
    })

    it('should respect the `simplify` option', () => {
      assert.strictEqual(unit('1 kg m / s^2').format(), '1 N')
      assert.strictEqual(unit('1 kg m / s^2').format({ simplify: 'never' }), '1 kg m / s^2')
      assert.strictEqual(unit('1 N m').format(), '1 N m')
      assert.strictEqual(unit('1 N m').format({ simplify: 'always' }), '1 J')
    })
  })

  describe('valueOf', () => {
    it('should output a raw, unsimplified string representation of this unit', () => {
      assert.strictEqual(unit('8.314 J / mol K').valueOf(), '8.314 J / mol K')
      assert.strictEqual(unit('10 h / s').valueOf(), '10 h / s')
      assert.strictEqual(unit('10 h / s').format(), '36000')
    })
  })

  describe('parse', () => {
    it('should parse units correctly', () => {
      let unit1

      unit1 = unit('5kg')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('5 kg')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit(' 5 kg ')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('5e-3kg')
      assert.strictEqual(unit1.value, 0.005)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('5e+3kg')
      assert.strictEqual(unit1.value, 5000)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('5e3kg')
      assert.strictEqual(unit1.value, 5000)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('-5kg')
      assert.strictEqual(unit1.value, -5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('+5kg')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('.5kg')
      assert.strictEqual(unit1.value, 0.5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('-5mg')
      approx.equal(unit1.value, -5)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'm')

      unit1 = unit('5.2mg')
      approx.equal(unit1.value, 5.2)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[0].prefix, 'm')

      unit1 = unit('300 kg/minute')
      approx.equal(unit1.value, 300)
      assert.strictEqual(unit1.units[0].unit.name, 'g')
      assert.strictEqual(unit1.units[1].unit.name, 'minute')
      assert.strictEqual(unit1.units[0].prefix, 'k')

      unit1 = unit('981 cm/s^2')
      approx.equal(unit1.value, 981)
      assert.strictEqual(unit1.units[0].unit.name, 'm')
      assert.strictEqual(unit1.units[1].unit.name, 's')
      assert.strictEqual(unit1.units[1].power, -2)
      assert.strictEqual(unit1.units[0].prefix, 'c')

      unit1 = unit('981 cm*s^-2')
      approx.equal(unit1.value, 981)
      assert.strictEqual(unit1.units[0].unit.name, 'm')
      assert.strictEqual(unit1.units[1].unit.name, 's')
      assert.strictEqual(unit1.units[1].power, -2)
      assert.strictEqual(unit1.units[0].prefix, 'c')

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
      assert.strictEqual(unit1.units[0].prefix, 'k')

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
      assert.strictEqual(unit1.units[0].prefix, 'k')

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

    it('should throw error when parsing expressions with invalid characters', () => {
      assert.throws(() => { unit('8.314 J / (mol * K)') }, /Unexpected "\("/)
      assert.throws(() => { unit('8.314 J / mol / K') }, /Unexpected additional "\/"/)
    })

    it('should parse units with correct precedence', () => {
      const unit1 = unit('1  m^3 / kg s^2') // implicit multiplication

      approx.equal(unit1.value, 1)
      assert.strictEqual(unit1.units[0].unit.name, 'm')
      assert.strictEqual(unit1.units[1].unit.name, 'g')
      assert.strictEqual(unit1.units[2].unit.name, 's')
      assert.strictEqual(unit1.units[0].power, 3)
      assert.strictEqual(unit1.units[1].power, -1)
      assert.strictEqual(unit1.units[2].power, -2)
      assert.strictEqual(unit1.units[0].prefix, '')
    })

    it('should throw an exception when parsing an invalid unit', () => {
      assert.throws(() => { unit('.meter') }, /Unexpected "\."/)
      assert.throws(() => { unit('5e') }, /Unit "e" not found/)
      assert.throws(() => { unit('5e.') }, /Unit "e" not found/)
      assert.throws(() => { unit('5e1.3') }, /Unexpected "\."/)
      assert.throws(() => { unit('meter.') }, /Unexpected "\."/)
      assert.throws(() => { unit('meter/') }, /Trailing characters/)
      assert.throws(() => { unit('/meter') }, /Unexpected "\/"/)
      assert.throws(() => { unit('1 */ s') }, /Unexpected "\/"/)
      assert.throws(() => { unit('45 kg 34 m') }, /Unexpected "3"/)
      assert.throws(() => unit('10 m^'), /must be followed by a floating/)
      assert.throws(() => unit('10 m+'), /Unexpected "\+"/)
    })

    it('should parse empty strings and only numbers', () => {
      assert.strictEqual(unit(123).value, 123)
      assert.strictEqual(unit(123).units.length, 0)
      assert.strictEqual(unit('').value, null)
      assert.strictEqual(unit('').units.length, 0)
      assert.strictEqual(unit().value, null)
      assert.strictEqual(unit().units.length, 0)
    })

    it('should throw if parser() receives other than a string', () => {
      assert.throws(() => unit._unitStore.parser(42), /TypeError: Invalid argument in parse/)
    })
  })

  describe('prefixes', () => {
    it('should accept both long and short prefixes for ohm', () => {
      assert.strictEqual(unit('5 ohm').toString(), '5 ohm')
      assert.strictEqual(unit('5 milliohm').toString(), '5 milliohm')
      assert.strictEqual(unit('5 mohm').toString(), '5 mohm')
    })

    it('should accept both long and short prefixes for bar', () => {
      assert.strictEqual(unit('5 bar').toString(), '5 bar')
      assert.strictEqual(unit('5 millibar').toString(), '5 millibar')
      assert.strictEqual(unit('5 mbar').toString(), '5 mbar')
    })
  })

  describe('isCompound', () => {
    it('should return the correct value', () => {
      assert.strictEqual(unit('34').isCompound(), false)
      assert.strictEqual(unit('34 kg').isCompound(), false)
      assert.strictEqual(unit('34 kg/s').isCompound(), true)
      assert.strictEqual(unit('34 kg^2').isCompound(), true)
      assert.strictEqual(unit('34 N').isCompound(), false)
      assert.strictEqual(unit('34 kg m / s^2').isCompound(), true)
    })
  })

  describe('add', () => {
    it('should add two units', () => {
      assert.deepStrictEqual(unit(300, 'm').add(unit(3, 'km')), unit(3300, 'm'))
      approx.deepEqual(unit('2m').add(unit('3ft')), unit('2.9144 m'))
      approx.deepEqual(unit('2').add(unit('3')), unit('5'))
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

    it('should throw if one or both units do not have values', () => {
      assert.throws(() => unit('10 m').add('ft'), /Cannot add.*both units must have values/)
      assert.throws(() => unit('m').add('10 ft'), /Cannot add.*both units must have values/)
    })

    it('should throw if units are not consistent', () => {
      assert.throws(() => unit('10 kg').add('8 day'), /Cannot add.*dimensions do not match/)
      assert.throws(() => unit('10 kg').add('8 kg^0.99'), /Cannot add.*dimensions do not match/)
      assert.throws(() => unit('10 kg').add('8'), /Cannot add.*dimensions do not match/)
    })
  })

  describe('sub', () => {
    it('should subtract two units', () => {
      assert.deepStrictEqual(unit(300, 'm').sub(unit(3, 'km')), unit(-2700, 'm'))
      approx.deepEqual(unit('2m').sub(unit('3ft')), unit('1.0856 m'))
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

    it('should throw if one or both units do not have values', () => {
      assert.throws(() => unit('10 m').sub('ft'), /Cannot subtract.*both units must have values/)
      assert.throws(() => unit('m').sub('10 ft'), /Cannot subtract.*both units must have values/)
    })

    it('should throw if units are not consistent', () => {
      assert.throws(() => unit('10 kg').sub('8 day'), /Cannot subtract.*dimensions do not match/)
      assert.throws(() => unit('10 kg').sub('8 kg^0.99'), /Cannot subtract.*dimensions do not match/)
      assert.throws(() => unit('10 kg').sub('8'), /Cannot subtract.*dimensions do not match/)
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
      assert.deepStrictEqual(unit('5 degC').mul(2), unit('283.15 degC'))
    })

    it('should multiply units without values', () => {
      assert.deepStrictEqual(unit('kg').mul('kg'), unit('kg^2'))
      assert.deepStrictEqual(unit('4 kg').mul('kg'), unit('4 kg^2'))
      assert.deepStrictEqual(unit('kg').mul('4 kg'), unit('4 kg^2'))
      assert.deepStrictEqual(unit('m/s').mul('h/m').toString(), 'h / s')
      assert.deepStrictEqual(unit('1 m/s').mul('h/m').toString(), '3600')
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

    it('should divide units without values', () => {
      assert.deepStrictEqual(unit('kg').div('s'), unit('kg/s'))
      assert.deepStrictEqual(unit('4 kg').div('s'), unit('4 kg/s'))
      assert.deepStrictEqual(unit('kg').div('4 s'), unit('0.25 kg/s'))
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
      assert(unit('123 chain').pow(0).equals(unit('1')))
    })

    it('should work with units without values', () => {
      assert.strictEqual(unit('V/m').pow(2).format(), 'V^2 / m^2')
      assert(unit('1 V/m').pow(2).equals(unit('1 V^2/m^2')))
    })

    it('the alternate api syntax should also work', () => {
      assert(unit.pow('4 N', unit(2)).equals(unit('16 N^2')))
      assert(unit.pow(unit('0.25 m/s'), -0.5).equals(unit('2 m^-0.5 s^0.5')))
      assert(unit.pow('123 chain', 0).equals(unit('1')))
    })
  })

  describe('sqrt', () => {
    it('should calculate the square root of a unit', () => {
      assert(unit('16 kg').sqrt().equals(unit('4 kg^0.5')))
      assert(unit('16').sqrt().equals(unit('4')))
      assert(unit('16 m^2/s^2').sqrt().equals(unit('4 m/s')))
      assert.strictEqual(unit('-16 m^2/s^2').sqrt().format(), 'NaN m / s')
    })

    it('the alternate api syntax should also work', () => {
      assert(unit.sqrt('16 kg').equals(unit('4 kg^0.5')))
      assert(unit.sqrt(16).equals(unit('4')))
      assert(unit.sqrt(unit('16 m^2/s^2')).equals(unit('4 m/s')))
    })
  })

  describe('abs', () => {
    it('should return the absolute value of a unit', () => {
      assert.strictEqual(unit('5 m').abs().format(), '5 m')
      assert.strictEqual(unit('-5 m/s').abs().format(), '5 m / s')
      assert.strictEqual(unit('-283.15 degC').abs().format(), '-263.15 degC')
    })

    it('the alternate api syntax should also work', () => {
      assert.strictEqual(unit.abs('5 m').format(), '5 m')
      assert.strictEqual(unit.abs('-5 m/s').format(), '5 m / s')
      assert.strictEqual(unit.abs(unit('-5 m/s')).format(), '5 m / s')
      assert.strictEqual(unit.abs(-5).format(), '5')
      assert.strictEqual(unit.abs('-283.15 degC').format(), '-263.15 degC')
    })
  })

  describe('mul, div, and pow', () => {
    it('should retain the units of their operands without simplifying', () => {
      const unit1 = unit(10, 'N/s')
      const unit2 = unit(10, 'h')
      const unitM = unit1.mul(unit2)
      assert.strictEqual(unitM.units[0].unit.name, 'N')
      assert.strictEqual(unitM.units[1].unit.name, 's')
      assert.strictEqual(unitM.units[2].unit.name, 'h')

      const unit3 = unit(14.7, 'lbf')
      const unit4 = unit(1, 'in in')
      const unitD = unit3.div(unit4)
      assert.strictEqual(unitD.units[0].unit.name, 'lbf')
      assert.strictEqual(unitD.units[1].unit.name, 'in')
      assert.strictEqual(unitD.units[1].power, -2)

      const unit5 = unit(1, 'N h/s')
      const unitP = unit5.pow(-3.5)
      assert.strictEqual(unitP.units[0].unit.name, 'N')
      assert.strictEqual(unitP.units[1].unit.name, 'h')
      assert.strictEqual(unitP.units[2].unit.name, 's')
    })
  })

  describe('plurals', () => {
    it('should support plurals', () => {
      const unit1 = unit(5, 'meters')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'meters')
      assert.strictEqual(unit1.units[0].prefix, '')

      const unit2 = unit(5, 'kilometers')
      assert.strictEqual(unit2.value, 5)
      assert.strictEqual(unit2.units[0].unit.name, 'meters')
      assert.strictEqual(unit2.units[0].prefix, 'kilo')

      const unit3 = unit(5, 'inches')
      approx.equal(unit3.value, 5)
      assert.strictEqual(unit3.units[0].unit.name, 'inches')
      assert.strictEqual(unit3.units[0].prefix, '')

      const unit4 = unit(9.81, 'meters/second^2')
      approx.equal(unit4.value, 9.81)
      assert.strictEqual(unit4.units[0].unit.name, 'meters')
      assert.strictEqual(unit4.units[0].prefix, '')
    })
  })

  describe('aliases', () => {
    it('should support aliases', () => {
      const unit1 = unit(5, 'lt')
      assert.strictEqual(unit1.value, 5)
      assert.strictEqual(unit1.units[0].unit.name, 'lt')
      assert.strictEqual(unit1.units[0].prefix, '')

      const unit2 = unit(1, 'lb')
      assert.strictEqual(unit2.value, 1)
      assert.strictEqual(unit2.units[0].unit.name, 'lb')
      assert.strictEqual(unit2.units[0].prefix, '')
    })
  })

  describe('unitStore', () => {
    describe('defs.quantities', () => {
      it('should contain the correct dimension for each quantity', () => {
        assert.strictEqual(unit._unitStore.defs.baseQuantities.length, 10)
        assert.deepStrictEqual(unit._unitStore.defs.quantities['UNITLESS'], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['LENGTH'], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['TIME'], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['CURRENT'], [0, 0, 0, 1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['TEMPERATURE'], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['LUMINOUS_INTENSITY'], [0, 0, 0, 0, 0, 1, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['AMOUNT_OF_SUBSTANCE'], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ANGLE'], [0, 0, 0, 0, 0, 0, 0, 1, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['BIT'], [0, 0, 0, 0, 0, 0, 0, 0, 1, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['SOLID_ANGLE'], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ABSEMENT'], [0, 1, 1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ACCELERATION'], [0, 1, -2, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ANGULAR_ACCELERATION'], [0, 0, -2, 0, 0, 0, 0, 1, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ANGULAR_MOMENTUM'], [1, 2, -1, 0, 0, 0, 0, 1, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ANGULAR_VELOCITY'], [0, 0, -1, 0, 0, 0, 0, 1, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['AREA'], [0, 2, 0, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['AREA_DENSITY'], [1, -2, 0, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['BIT_RATE'], [0, 0, -1, 0, 0, 0, 0, 0, 1, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['CAPACITANCE'], [-1, -2, 4, 2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['CURRENT_DENSITY'], [0, -2, 0, 1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['DYNAMIC_VISCOSITY'], [1, -1, -1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ELECTRIC_CHARGE'], [0, 0, 1, 1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ELECTRIC_CHARGE_DENSITY'], [0, -3, 1, 1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ELECTRIC_DISPLACEMENT'], [0, -2, 1, 1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ELECTRIC_FIELD_STRENGTH'], [1, 1, -3, -1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ELECTRICAL_CONDUCTANCE'], [-1, -2, 3, 2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ELECTRICAL_CONDUCTIVITY'], [-1, -3, 3, 2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ELECTRIC_POTENTIAL'], [1, 2, -3, -1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['RESISTANCE'], [1, 2, -3, -2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ELECTRICAL_RESISTIVITY'], [1, 3, -3, -2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ENERGY'], [1, 2, -2, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ENTROPY'], [1, 2, -2, 0, -1, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['FORCE'], [1, 1, -2, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['FREQUENCY'], [0, 0, -1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['HEAT_CAPACITY'], [1, 2, -2, 0, -1, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['HEAT_FLUX_DENSITY'], [1, 0, -3, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['ILLUMINANCE'], [0, -2, 0, 0, 0, 1, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['IMPEDANCE'], [1, 2, -3, -2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['IMPULSE'], [1, 1, -1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['INDUCTANCE'], [1, 2, -2, -2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['IRRADIANCE'], [1, 0, -3, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['JERK'], [0, 1, -3, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['KINEMATIC_VISCOSITY'], [0, 2, -1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['LINEAR_DENSITY'], [1, -1, 0, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['LUMINOUS_FLUX'], [0, 0, 0, 0, 0, 1, 0, 0, 0, 1])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MAGNETIC_FIELD_STRENGTH'], [0, -1, 0, 1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MAGNETIC_FLUX'], [1, 2, -2, -1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MAGNETIC_FLUX_DENSITY'], [1, 0, -2, -1, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MOLAR_CONCENTRATION'], [0, -3, 0, 0, 0, 0, 1, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MOLAR_ENERGY'], [1, 2, -2, 0, 0, 0, -1, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MOLAR_ENTROPY'], [1, 2, -2, 0, -1, 0, -1, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MOLAR_HEAT_CAPACITY'], [1, 2, -2, 0, -1, 0, -1, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MOMENT_OF_INERTIA'], [1, 2, 0, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['MOMENTUM'], [1, 1, -1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['PERMEABILITY'], [1, 1, -2, -2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['PERMITTIVITY'], [-1, -3, 4, 2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['POWER'], [1, 2, -3, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['PRESSURE'], [1, -1, -2, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['RELUCTANCE'], [-1, -2, 2, 2, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['SPECIFIC_ENERGY'], [0, 2, -2, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['SPECIFIC_HEAT_CAPACITY'], [0, 2, -2, 0, -1, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['SPECIFIC_VOLUME'], [-1, 3, 0, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['SPIN'], [1, 2, -1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['SURFACE_TENSION'], [1, 0, -2, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['TEMPERATURE_GRADIENT'], [0, -1, 0, 0, 1, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['THERMAL_CONDUCTIVITY'], [1, 1, -3, 0, -1, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['TORQUE'], [1, 2, -2, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['VELOCITY'], [0, 1, -1, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['VOLUME'], [0, 3, 0, 0, 0, 0, 0, 0, 0, 0])
        assert.deepStrictEqual(unit._unitStore.defs.quantities['VOLUMETRIC_FLOW_RATE'], [0, 3, -1, 0, 0, 0, 0, 0, 0, 0])
      })
    })

    describe('defs.units', () => {
      it('built-in units should be of the correct value and dimension', () => {
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

      it("For each built-in unit, 'name' should match key", () => {
        assert(unit._unitStore.defs.hasOwnProperty('units'))
        for (const key in unit._unitStore.defs.units) {
          assert.strictEqual(key, unit._unitStore.defs.units[key].name)
        }
      })
    })

    describe('defs.unitSystems', () => {
      it('should not have any dimensions that are not present in DIMENSIONS', () => {
        assert(unit._unitStore.defs.hasOwnProperty('unitSystems'))
        for (let sys in unit._unitStore.defs.unitSystems) {
          for (let dim in unit._unitStore.defs.unitSystems[sys]) {
            assert(unit._unitStore.defs.quantities.hasOwnProperty(dim), `${dim} not found in defs.quantities`)
          }
        }
      })
    })

    it.skip('should not reprocess units if only the formatting options have changed', () => {

    })
  })

  describe('angles', () => {
    it('should create angles', () => {
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

    it('should have correct long/short prefixes', () => {
      assert.strictEqual(unit(0.02, 'rad').toString(), '20 mrad')
      assert.strictEqual(unit(0.02, 'radian').toString(), '20 milliradian')
      assert.strictEqual(unit(0.02, 'radians').toString(), '20 milliradians')

      assert.strictEqual(unit(0.02, 'grad').toString(), '2 cgrad')
      assert.strictEqual(unit(0.02, 'gradian').toString(), '2 centigradian')
      assert.strictEqual(unit(0.02, 'gradians').toString(), '2 centigradians')
    })
  })

  describe('split', () => {
    it('should split a unit into parts', () => {
      assert.strictEqual(unit(1, 'm').split(['ft', 'in']).join(','), '3 ft,3.37007874015748 in')
      assert.strictEqual(unit(-1, 'm').split(['ft', 'in']).join(','), '-3 ft,-3.37007874015748 in')
      assert.strictEqual(unit(1, 'm/s').split(['m/s']).join(','), '1 m / s')
      assert.strictEqual(unit(1, 'm').split(['ft', 'ft']).join(','), '3 ft,0.280839895013124 ft')
      assert.strictEqual(unit(1.23, 'm/s').split([]).join(','), '1.23 m / s')
      assert.strictEqual(unit(1, 'm').split(['in', 'ft']).join(','), '39 in,0.0308398950131236 ft')
      assert.strictEqual(unit(10, 'km').split(['mi', 'ft', 'in']).join(','), '6 mi,1128 ft,4.78740157486361 in')
      assert.strictEqual(unit(1, 'm').split([unit(null, 'ft'), unit(null, 'in')]).join(','), '3 ft,3.37007874015748 in')
      assert.strictEqual(unit('51.4934 deg').split(['deg', 'arcmin', 'arcsec']).map(a => a.toString({ precision: 6 })).join(','), '51 deg,29 arcmin,36.24 arcsec')
    })

    it('should be resistant to round-off error', () => {
      assert.strictEqual((unit(-12, 'in')).split(['ft', 'in']).join(','), '-1 ft,0 in')
      assert.strictEqual((unit(12, 'in')).split(['ft', 'in']).join(','), '1 ft,0 in')
      assert.strictEqual((unit(24, 'in')).split(['ft', 'in']).join(','), '2 ft,0 in')
      assert.strictEqual((unit(36, 'in')).split(['ft', 'in']).join(','), '3 ft,0 in')
      assert.strictEqual((unit(48, 'in')).split(['ft', 'in']).join(','), '4 ft,0 in')
      assert.strictEqual((unit(60, 'in')).split(['ft', 'in']).join(','), '5 ft,0 in')
      assert.strictEqual((unit(36000, 'in')).split(['ft', 'in']).join(','), '3000 ft,0 in')
    })
  })

  describe('toSI', () => {
    it('should return a clone of the unit', () => {
      const u1 = unit('3 ft')
      const u2 = u1.toSI()
      assert.strictEqual(u1 === u2, false)
    })

    it('should return the unit in SI units', () => {
      approx.deepEqual(unit('4 ft').toSI(), unit('1.2192 m').to())
      approx.deepEqual(unit('0.111 ft^2').toSI(), unit('0.01031223744 m^2').to())
    })

    it('should return SI units for valueless units', () => {
      assert.deepStrictEqual(unit('ft/minute').toSI(), unit('m / s').to())
    })

    it('alterate api syntax should work too', () => {
      approx.deepEqual(unit.toSI(unit('4 ft')), unit('1.2192 m').to())
      approx.deepEqual(unit.toSI('4 ft'), unit('1.2192 m').to())
    })

    it('should return SI units for custom units defined from other units', () => {
      let newUnit = configCustomUnits({ foo: '3 kW' })
      assert.strictEqual(newUnit('42 foo').toSI().format(), '126000 kg m^2 / s^3')
    })

    it('should throw if custom unit not defined from existing units', () => {
      let newUnit = unit.config({
        definitions: {
          baseQuantities: ['BAZINESS'],
          units: {
            baz: {
              quantity: 'BAZINESS',
              value: 1
            }
          }
        }
      })
      assert.throws(() => { newUnit('10 baz').toSI() }, /Cannot express unit '10 baz' in SI units. System 'si' does not contain a unit for base quantity 'BAZINESS'/)
    })
  })

  describe('custom types', () => {
    describe('configuration', () => {
      it('should throw if failed to include all custom type functions', () => {
        assert.throws(() => require('../index.js').config({ type: typeNoPow }), /You must supply all required custom type functions/)
      })

      it('should throw if failed to include conditionally required functions', () => {
        assert.throws(() => require('../index.js').config({ type: typeNoGt }), /The following custom type functions are required when prefix is/)
        assert.doesNotThrow(() => require('../index.js').config({ type: typeNoGt, prefix: 'never' }))
      })

      it('should throw if attempting to call a method that depends on a custom type function that was not provided', () => {
        let unitDecNoComp = require('../index.js').config({ type: typeNoComp, prefix: 'never' })
        let unitDecNoRound = require('../index.js').config({ type: typeNoRound })
        assert.throws(() => unitDecNoComp('3 m').equals('4 m'), /When using custom types, equals requires a type.eq function/)
        assert.throws(() => unitDecNoComp('3 m').compare('4 m'), /When using custom types, compare requires a type.gt and a type.lt function/)
        assert.throws(() => unitDecNoComp('3 m').lessThan('4 m'), /When using custom types, lessThan requires a type.lt function/)
        assert.throws(() => unitDecNoComp('3 m').lessThanOrEqual('4 m'), /When using custom types, lessThanOrEqual requires a type.le function/)
        assert.throws(() => unitDecNoComp('3 m').greaterThan('4 m'), /When using custom types, greaterThan requires a type.gt function/)
        assert.throws(() => unitDecNoComp('3 m').greaterThanOrEqual('4 m'), /When using custom types, greaterThanOrEqual requires a type.ge function/)
        assert.throws(() => unitDecNoRound('3 m').split(['ft'], ['in']), /When using custom types, split requires a type.round and a type.trunc function/)
      })
    })

    describe('constructing a unit', () => {
      it('if given a single string, should parse the numeric portion using type.conv', () => {
        let u = unitDec('3.1415926535897932384626433832795 rad')
        assert(u.value instanceof Decimal)
        assert.strictEqual(u.toString(), '3.1415926535897932384626433832795 rad')
      })

      it('if given a number, should convert it to custom type', () => {
        assert(unitDec(3.1415, 'rad').value instanceof Decimal)
      })

      it('should work if given the custom type directly', () => {
        let u = unitDec(Decimal('3.1415926535897932384626433832795'), 'rad')
        assert.strictEqual(u.toString(), '3.1415926535897932384626433832795 rad')
        assert(u.value instanceof Decimal)
      })

      it('should create valueless units', () => {
        let u = unitDec('rad')
        assert.strictEqual(u.toString(), 'rad')
        assert.strictEqual(u.value, null)
      })
    })

    describe('operations', () => {
      it('should add custom typed units', () => {
        let u1 = unitDec('0.3333333333333333333333 kg/m^3')
        let u2 = unitDec('0.6666666666666666666666 kg/m^3')
        let u3 = u1.add(u2)
        assert.strictEqual(u3.toString(), '0.9999999999999999999999 kg / m^3')
        assert(u3.value instanceof Decimal)
      })

      it('should subtract custom typed units', () => {
        let u1 = unitDec('0.3333333333333333333333 kg/m^3')
        let u2 = unitDec('0.6666666666666666666666 kg/m^3')
        let u3 = u1.sub(u2)
        assert.strictEqual(u3.toString(), '-0.3333333333333333333333 kg / m^3')
        assert(u3.value instanceof Decimal)
      })

      it('should multiply custom typed units', () => {
        let u1 = unitDec('0.3333333333333333333333 kg/m^3')
        let u2 = unitDec('3 m^3')
        let u3 = u1.mul(u2)
        assert.strictEqual(u3.toString(), '0.9999999999999999999999 kg')
        assert(u3.value instanceof Decimal)
      })

      it('should divide custom typed units', () => {
        let u1 = unitDec('1 kg')
        let u2 = unitDec('3 m^3')
        let u3 = u1.div(u2)
        assert.strictEqual(u3.toString(), '0.33333333333333333333333333333333 kg / m^3') // 32 3's
        assert(u3.value instanceof Decimal)
      })

      it('should do powers', () => {
        let u1 = unitDec('11 s')
        let u2 = u1.pow(30)
        assert.strictEqual(u2.toString(), '1.7449402268886407318558803753801e+31 s^30')
        assert(u2.value instanceof Decimal)
      })

      it('should do sqrt', () => {
        assert.strictEqual(unitDec('64 m^2/s^2').sqrt().format(), '8 m / s')
        assert.strictEqual(unitDec('2 W').sqrt().format(), '1.4142135623730950488016887242097 W^0.5')
      })

      it('should do split', () => {
        assert.strictEqual(unitDec(1, 'm').split(['ft', 'in']).join(','), '3 ft,3.3700787401574803149606299212595 in')
        assert.strictEqual(unitDec(-1, 'm').split(['ft', 'in']).join(','), '-3 ft,-3.3700787401574803149606299212595 in')
        assert.strictEqual(unitDec(1, 'm/s').split(['m/s']).join(','), '1 m / s')
        assert.strictEqual(unitDec(1, 'm').split(['ft', 'ft']).join(','), '3 ft,0.28083989501312335958005249343829 ft')
        assert.strictEqual(unitDec(1.23, 'm/s').split([]).join(','), '1.23 m / s')
        assert.strictEqual(unitDec(1, 'm').split(['in', 'ft']).join(','), '39 in,0.03083989501312335958005249343832 ft')
        assert.strictEqual(unitDec(10, 'km').split(['mi', 'ft', 'in']).join(','), '6 mi,1128 ft,4.7874015748031496062992125984252 in')
        assert.strictEqual(unitDec(1, 'm').split([unit(null, 'ft'), unit(null, 'in')]).join(','), '3 ft,3.3700787401574803149606299212598 in')
        assert.strictEqual(unitDec(100, 'in').split(['ft', 'in']).join(','), '8 ft,4 in')
        // TODO: Try redefining deg using a more precise value of pi
        assert.strictEqual(unitDec('51.4934 deg').split(['deg', 'arcmin', 'arcsec']).map(a => a.toString({ precision: 6 })).join(','), '51 deg,29 arcmin,36.240000000000072499200000000012 arcsec')
      })

      describe('equals', () => {
        it('should test if two custom typed units are equal', () => {
          assert.strictEqual(unitDec(100, 'cm').equals(unitDec(1, 'm')), true)
          assert.strictEqual(unitDec(100, 'cm').equals(unitDec(2, 'm')), false)
          assert.strictEqual(unitDec(100, 'cm').equals(unitDec(1, 'kg')), false)
          assert.strictEqual(unitDec(100, 'ft lbf').equals(unitDec(1200, 'in lbf')), true)
          assert.strictEqual(unitDec(100, 'N').equals(unitDec(100, 'kg m / s ^ 2')), true)
          assert.strictEqual(unitDec(100, 'N').equals(unitDec(100, 'kg m / s')), false)
          assert.strictEqual(unitDec(100, 'Hz').equals(unitDec(100, 's ^ -1')), true)
        })

        it('should work with valueless units', () => {
          assert.strictEqual(unitDec('cm').equals(unitDec('cm')), true)
          assert.strictEqual(unitDec('cm').equals(unitDec('m')), false)
          assert.strictEqual(unitDec('cm/s').equals(unitDec('cm/s')), true)
        })

        it('should convert parameter to a unit', () => {
          assert(unitDec(100, 'cm').equals('1 m'))
          assert(unitDec('3 kg / kg').equals(3))
        })
      })

      it('should do comparisons', () => {
        assert(unitDec('10 m').lessThan('1 km'))
        assert(unitDec('5 km').lessThanOrEqual('500000 cm'))
        assert(unitDec('5 N').greaterThan('5 dyne'))
        assert(unitDec('10 kg').greaterThanOrEqual('1 kg'))
        assert.strictEqual(unitDec('60 min').compare('2 hour'), -1)
        assert.strictEqual(unitDec('60 min').compare('1 hour'), 0)
        assert.strictEqual(unitDec('60 min').compare('0.5 hour'), 1)
      })

      it('should do setValue', () => {
        assert.strictEqual(unitDec('64 m^2/s^2').setValue(10).format(), '10 m^2 / s^2')
        assert.strictEqual(unitDec('64 m^2/s^2').setValue('1.4142135623730950488016887242097').format(), '1.4142135623730950488016887242097 m^2 / s^2')
        assert.strictEqual(unitDec('64 m^2/s^2').setValue(Decimal('1.4142135623730950488016887242097')).format(), '1.4142135623730950488016887242097 m^2 / s^2')
      })

      // TODO: Test all other custom functions
    })

    describe('formatting', () => {
      it('should choose the best prefix', () => {
        assert.strictEqual(unitDec('0.000001 m').format(8), '1 um')
        assert.strictEqual(unitDec('0.00001 m').format(8), '10 um')
        assert.strictEqual(unitDec('0.0001 m').format(8), '0.1 mm')
        assert.strictEqual(unitDec('0.0005 m').format(8), '0.5 mm')
        assert.strictEqual(unitDec('0.0006 m').toString(), '0.6 mm')
        assert.strictEqual(unitDec('0.001 m').toString(), '0.1 cm')
        assert.strictEqual(unitDec('0.01 m').toString(), '1 cm')
        assert.strictEqual(unitDec('100000 m').toString(), '100 km')
        assert.strictEqual(unitDec('300000 m').toString(), '300 km')
        assert.strictEqual(unitDec('500000 m').toString(), '500 km')
        assert.strictEqual(unitDec('600000 m').toString(), '600 km')
        assert.strictEqual(unitDec('1000000 m').toString(), '1000 km')
        assert.strictEqual(unitDec('10000000 m').toString(), '10000 km')
        assert.strictEqual(unitDec('1232123212321232123212321 m').toString(), '1.232123212321232123212321e+21 km')
        assert.strictEqual(unitDec('2000 ohm').toString(), '2 kohm')
      })

      it('should use custom formatter', () => {
        let unitFunny = require('../index.js').config({ type: typeFunnyFormat })
        assert.strictEqual(unitFunny('3.14159 rad').toString('$', '_'), '$9_5_1_4_1_._3 rad')
      })
    })
  })
})
