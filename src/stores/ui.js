import { uniqueId } from "lodash";
import { v } from "../api/api";
import { generateInitialWindowPosition } from "../components/ui/FloatingWindow";

export const actions = v([]);

export const spotlight = {
  search: v(""),
  visible: v(false),
};

export const windows = v({});
export const activeWindow = v("");

/**
 * Create a new floating, movable window
 * @param {Object} obj
 * @param {string} obj.title Window title
 * @param {import('solid-js').JSXElement} obj.jsx JSX to be rendered as content
 * @param {number|undefined} obj.height
 * @param {number|undefined} obj.width
 * @returns {ReactiveFloatingWindow}
 */
export function createNewWindow({ title, jsx, height, width }) {
  // Create a unique id for this window
  const id = uniqueId();

  /** @type {ReactiveFloatingWindow} */
  const window = v({
    title,
    children: jsx,
    pos: generateInitialWindowPosition(height, width),
  });

  windows.set(v => ({ ...v, [id]: window }));
  activeWindow.set(id);

  return window;
}

/**
 * @param {string} id
 */
export function closeWindow(id) {
  windows.set(v => {
    delete v[id];
    return { ...v };
  });

  if (id === activeWindow.get()) {
    activeWindow.set("");
  }
}

/**
 * @typedef {Object} ReactiveFloatingWindow
 * @property {function():FloatingWindow} get
 * @property {function(FloatingWindow)} set
 */

/**
 * @typedef {Object} FloatingWindow
 * @property {string} title
 * @property {import("solid-js").JSXElement} children
 * @property {FloatingWindowDimensions} pos
 */

/**
 * @typedef {Object} FloatingWindowDimensions
 * @property {ReactiveNumber} x
 * @property {ReactiveNumber} y
 * @property {ReactiveNumber} w
 * @property {ReactiveNumber} h
 */

/** @param {KeyboardEvent} e */
function onKeyUp(e) {
  // If an active window, close when pressing ESC
  if (e.code === "Escape") {
    closeWindow(activeWindow.get());
  }
}

export default {
  init() {
    window.addEventListener("keyup", onKeyUp);
  },

  destroy() {
    window.removeEventListener("keyup", onKeyUp);
  },
};
