/**
 * @typedef {Object} ReactiveValue
 * @property {function} get // Returns current value
 * @property {function} set // Sets new value
 */

/**
 * @typedef {Object} Action
 * @property {("link"|"button")} type The type of action
 * @property {string} link The link to open a new tab
 * @property {function} onClick When user clicks button
 * @property {string} text Action text
 * @property {string} imageUrl Action image url
 * @property {boolean} active If action should be viewed as active
 * @property {boolean} disabled Disable button
 */
