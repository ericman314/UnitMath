import { FindUnitFn, RequiredOptions, ParsedUnit } from "./types"

const ignoredCharacters = ' \t()*'

/**
 * Returns a new Parser.
 */
export function createParser<T>(options: RequiredOptions<T>, findUnit: FindUnitFn<T>) {
  // private variables and functions for the Unit parser
  let text: string, index: number, c: string

  function skipIgnored() {
    while (c && ignoredCharacters.includes(c)) {
      next()
    }
  }

  function isDigitDot(c: string) {
    return ((c >= '0' && c <= '9') || c === '.')
  }

  function isDigit(c: string) {
    return ((c >= '0' && c <= '9'))
  }

  function next () {
    index++
    c = text.charAt(index)
  }

  function revert(oldIndex: number) {
    index = oldIndex
    c = text.charAt(index)
  }

  function parseNonFinite() {
    const nonFiniteStrings = ['NaN', 'Infinity', '-Infinity']
    for (let nonFiniteString of nonFiniteStrings) {
      if (text.substr(index, nonFiniteString.length) === nonFiniteString) {
        index += nonFiniteString.length
        c = text.charAt(index)
        return nonFiniteString
      }
    }
    return null
  }

  function parseNumber () {
    let number = ''
    let oldIndex
    oldIndex = index

    if (c === '+') {
      next()
    } else if (c === '-') {
      number += c
      next()
    }

    if (!isDigitDot(c)) {
      // a + or - must be followed by a digit
      revert(oldIndex)
      return null
    }

    // get number, can have a single dot
    if (c === '.') {
      number += c
      next()
      if (!isDigit(c)) {
        // this is no legal number, it is just a dot
        revert(oldIndex)
        return null
      }
    } else {
      while (isDigit(c)) {
        number += c
        next()
      }
      if (c === '.') {
        number += c
        next()
      }
    }
    while (isDigit(c)) {
      number += c
      next()
    }

    // check for exponential notation like "2.3e-4" or "1.23e50"
    if (c === 'E' || c === 'e') {
      // The grammar branches here. This could either be part of an exponent or the start of a unit that begins with the letter e, such as "4exabytes"

      let tentativeNumber = ''
      const tentativeIndex = index

      tentativeNumber += c
      next()

      // @ts-ignore: Typescript does not realize that c has changed
      if (c === '+' || c === '-') {
        tentativeNumber += c
        next()
      }

      // Scientific notation MUST be followed by an exponent (otherwise we assume it is not scientific notation)
      if (!isDigit(c)) {
        // The e or E must belong to something else, so return the number without the e or E.
        revert(tentativeIndex)
        return number
      }

      // We can now safely say that this is scientific notation.
      number = number + tentativeNumber
      while (isDigit(c)) {
        number += c
        next()
      }
    }

    return number
  }

  function parseUnit () {
    let unitName = ''

    // Alphanumeric characters only; matches [a-zA-Z0-9]
    let code = text.charCodeAt(index)
    while ((code >= 48 && code <= 57) ||
            (code >= 65 && code <= 90) ||
            (code >= 97 && code <= 122)) {
      unitName += c
      next()
      code = text.charCodeAt(index)
    }

    // Must begin with [a-zA-Z]
    code = unitName.charCodeAt(0)
    if ((code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122)) {
      return unitName
    } else {
      return null
    }
  }

  function parseCharacter(toFind: string) {
    if (c === toFind) {
      next()
      return toFind
    } else {
      return null
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
  function parse(str: string): ParsedUnit<T> {
    // console.log(`parse("${str}")`)

    text = str
    index = -1
    c = ''

    if (typeof text !== 'string') {
      throw new TypeError('Invalid argument in parse, string expected')
    }

    const unit: ParsedUnit<T> = {
      type: 'Unit',
      value: null,
      unitList: [],
      dimension: {}
    }


    let powerMultiplierCurrent = 1
    let expectingUnit = false

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

    next()
    skipIgnored()

    // Optional number or non-finite string at the start of the string
    const valueStr = parseNonFinite() || parseNumber()
    // console.log(`valueStr = "${valueStr}"`)

    if (valueStr) {
      unit.value = options.type.conv(valueStr)

      skipIgnored() // Whitespace is not required here

      // handle multiplication or division right after the value, like '1/s'
      if (parseCharacter('/')) {
        powerMultiplierCurrent = -1
        expectingUnit = true
      }
    }

    while (true) {
      skipIgnored()

      // Parentheses are not allowed
      // if (c === '(' || c === ')') {
      //   throw new SyntaxError(`Unexpected "${c}" in "${text}" at index ${index}`)
      // }

      // Is there something here?
      let uStr
      if (c) {
        const oldC = c
        uStr = parseUnit()
        if (uStr === null) {
          throw new SyntaxError('Unexpected "' + oldC + '" in "' + text + '" at index ' + index.toString())
        }
      } else {
        // End of input.
        break
      }

      // Verify the unit exists and get the prefix (if any)
      const found = findUnit(uStr)
      if (found === null) {
        // Unit not found.
        throw new SyntaxError('Unit "' + uStr + '" not found.')
      }

      let power = powerMultiplierCurrent
      // Is there a "^ number"?
      skipIgnored()
      if (parseCharacter('^')) {
        skipIgnored()
        const p = parseNumber()
        if (p === null) {
          // No valid number found for the power!
          throw new SyntaxError('In "' + str + '", "^" must be followed by a floating-point number')
        }
        power *= +p
      }

      // Add the unit to the list
      unit.unitList.push({
        unit: found.unit,
        prefix: found.prefix,
        power: power
      })

      for (let dim of Object.keys(found.unit.dimension)) {
        unit.dimension[dim] = (unit.dimension[dim] || 0) + (found.unit.dimension[dim] || 0) * power
      }

      skipIgnored()

      // "/" means we are expecting something to come next.
      // Is there a forward slash? If so, set powerMultiplierCurrent to -1. All remaining units will be in the denominator.
      expectingUnit = false

      if (parseCharacter('/')) {
        if (powerMultiplierCurrent === -1) {
          throw new SyntaxError(`Unexpected additional "/" in "${text}" at index ${index}`)
        }
        powerMultiplierCurrent = -1
        expectingUnit = true
      }
    }

    // Is there a trailing slash?
    if (expectingUnit) {
      throw new SyntaxError('Trailing characters: "' + str + '"')
    }

    return unit
  }

  return parse
}
