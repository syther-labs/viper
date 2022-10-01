/**
 * @typedef {Object} Keybind
 * @property {string} name Name for the UI and registration
 * @property {string[]} combo ex: ["ControlLeft", "KeyS"]
 * @property {string} description
 * @property {function} method Method to run when
 */

/** @type {string[]} */
let keyCombo = [];

/** @type {Object.<string,Keybind>} */
const keybinds = {};

/**
 * Handle all keyboard evetns in one spot
 * @param {KeyboardEvent} e
 */
function onKeyDown(e) {
  // If not already in an input

  if (!keyCombo.includes(e.code)) {
    keyCombo.push(e.code);
  }
}

/**
 * Execute built key combo
 * @param {KeyboardEvent} e
 */
function onKeyUp(e) {
  const id = keyCombo.join("+");
  const keybind = keybinds[id];

  // If spotlight search
  if (id.match(/^(Key)([A-Z])$/)) {
  }

  // Reset the key combo
  keyCombo = [];

  // If combo exists
  if (keybind) {
    keybind.method();
  }
}

/**
 * Define a new control keybind
 * @param {Keybind} keybind
 * @returns {boolean}
 */
export function registerControl(keybind) {
  const id = keybind.combo.join("+");

  // If a keybind for already exists
  if (keybinds[id]) return false;

  keybinds[id] = keybind;
  return true;
}

export default {
  init() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  },

  destroy() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keydown", onKeyUp);
  },
};
