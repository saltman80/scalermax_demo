const defaultFormatter = new Intl.NumberFormat()

/**
 * Formats a numeric value using Intl.NumberFormat.
 * Accepts optional locales and formatting options.
 * Always returns a string.
 * @param {*} value - The value to format.
 * @param {string|string[]|number} [locales] - BCP 47 language tag(s), or number of fraction digits.
 * @param {Intl.NumberFormatOptions} [options] - Formatting options.
 * @returns {string}
 */
export function formatNumber(value, locales, options) {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return String(value)
  }

  // Legacy signature: formatNumber(value, fractionDigits)
  if (typeof locales === 'number' && options === undefined) {
    const digits = locales
    locales = undefined
    options = { minimumFractionDigits: digits, maximumFractionDigits: digits }
  }

  if (locales === undefined && options === undefined) {
    return defaultFormatter.format(num)
  }
  return new Intl.NumberFormat(locales, options).format(num)
}

/**
 * Returns a random integer between min and max (inclusive).
 * Rounds min up and max down.
 * @param {number} min - Lower bound, or upper bound if max is undefined.
 * @param {number} [max] - Upper bound.
 * @throws {TypeError} If min or max is not a finite number.
 * @throws {RangeError} If max < min after rounding.
 * @returns {number}
 */
export function randomInt(min, max) {
  if (max === undefined) {
    max = min
    min = 0
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new TypeError('randomInt: min and max must be finite numbers')
  }
  const _min = Math.ceil(min)
  const _max = Math.floor(max)
  if (_max < _min) {
    throw new RangeError('randomInt: max must be >= min')
  }
  return Math.floor(Math.random() * (_max - _min + 1)) + _min
}

/**
 * Returns a promise that resolves after the given number of milliseconds.
 * @param {number} ms - Milliseconds to sleep.
 * @throws {TypeError} If ms is not a non-negative finite number.
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new TypeError('sleep: ms must be a non-negative finite number')
  }
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Attach to global scope for direct browser usage
if (typeof globalThis !== 'undefined') {
  globalThis.formatNumber = formatNumber
  globalThis.randomInt = randomInt
  globalThis.sleep = sleep
}

// Default export for module consumers
export default {
  formatNumber,
  randomInt,
  sleep,
}