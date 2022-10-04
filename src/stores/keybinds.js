/**
 * @typedef {Object} Keybind
 * @property {string} name Name for the UI and registration
 * @property {string[]} combo ex: ["ControlLeft", "KeyS"]
 * @property {string} description
 * @property {function} method Method to run when
 */

import AddDataModal from "../modals/AddDataModal";
import { activePane } from "./panes";
import { modal } from "./ui";

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
  if (e.target.nodeName === "INPUT") return;

  if (!keyCombo.includes(e.code)) {
    keyCombo.push(e.code);
  }
}

/**
 * Execute built key combo
 * @param {KeyboardEvent} e
 */
function onKeyUp(e) {
  if (e.target.nodeName === "INPUT") return;

  const id = keyCombo.join("+");
  const keybind = keybinds[id];

  // If typeing single key
  const generalKey = id.match(/^(Key)([A-Z])$/);
  if (generalKey) {
    if (activePane()?.get().type !== "chart") return;

    modal.set({
      title: "Add data",
      visible: true,
      component: AddDataModal,
      data: {
        search: generalKey[2],
      },
    });
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
