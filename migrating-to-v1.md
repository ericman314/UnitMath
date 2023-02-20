# Migrating to v1

Most of the changes in v1 were the result of efforts to make the API simpler and more predictable. 

## Simplifying vs. Outputting

`toString` no longer simplifies units. You must now explicitly call `simplify` for the unit to be simplified.

In v0.8.7, units were automatically simplified when formatting as a string. When and how to simplify a unit is very subjective, and UnitMath cannot anticipate all needs. Further, certain use cases such as converting to a specific unit are broken if the unit is automatically simplified. This necessitates additional state in the unit object to prevent it from being simplified. All these issues can be avoided if the user is responsible for calling `simplify` when they want the unit to be simplified.

v0.8.7:

```js
unit('4 ft').mul('3 in').toString() // '12 ft^2'
```

v1:

```js
unit('4 ft').mul('3 in').toString() // '12 ft in'
unit('4 ft').mul('3 in').simplify().toString() // '1 ft^2'
```

Because of this, the `simplify` and `simplifyThreshold` options were removed. 

## Unit Systems

Each system defined in `definitions.systems` is now just a string array of units assigned to that system. To further enforce this difference, `unitSystems` was renamed to `systems`:

v0.8.7:

```js
definitions: {
  unitSystems: {
    si: {
      AMOUNT_OF_SUBSTANCE: 'mol',
      CAPACITANCE: 'F',
      CURRENT: 'A',
      MASS: 'kg',
      ...
    }
  }
}
```

v1:

```js
definitions: {
  systems: {
    si: ['mol', 'F', 'A', 'kg', ...]
  }
}
```

With this simpler method of defining systems, the options `definitons.quantities`, `definitions.baseQuantities`, and `autoAddToSystem` were no longer needed, and were removed.

## Other Changes

Customer formatters no longer accept additional user arguments. (see https://github.com/ericman314/UnitMath/issues/47)

Renamed `definitions.prefixes` to `definitions.prefixGroups`.


