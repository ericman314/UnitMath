const assert = require('assert')
const path = require('path')
const esmRequire = require('esm')(module)

/* These test ensure that the bundling is successful.
 * They should be run without esm or babel and the
 * `npm run build` must be run just before these tests.
 */

const createTests = (req, directory) => {
  const Unit = req(path.join(directory, 'UnitMath'))
  const UnitMin = req(path.join(directory, 'UnitMath.min'))
  it('should be able to import bundle', () => {
    assert(typeof Unit.add === 'function')
  })
  it('minified bundle should be idential to standard bundle', () => {
    assert.deepStrictEqual(new Set(Object.keys(UnitMin)), new Set(Object.keys(Unit)))
    assert.deepStrictEqual(new Set(Object.keys(UnitMin())), new Set(Object.keys(Unit())))
  })
}

describe('bundling', () => {
  describe('umd', () => createTests(require, '../dist'))
  describe('umd - compatibility', () => {
    it('unit math should work if Object.assign is not a function', () => {
      let oldObjectAssign = Object.assign
      delete Object.assign
      delete require.cache[require.resolve('../dist/UnitMath')]
      const LegacyUnit = require('../dist/UnitMath')
      assert.doesNotThrow(LegacyUnit.config({}))
      Object.defineProperty(Object, 'assign', {
        value: oldObjectAssign,
        writable: true,
        enumerable: false,
        configurable: true
      })
    })
  })
  describe('esm', () => createTests(path => esmRequire(path).default, '../es'))
})
