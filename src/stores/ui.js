import { uniqueId } from "lodash";
import { v } from "../api/api";
import { generateInitialWindowPosition } from "../components/ui/FloatingWindow";

export const actions = v([]);
export const windows = v([]);

/**
 * Create a new floating, movable window
 * @param {Object} obj
 * @param {string} obj.title Window title
 * @param {import('solid-js').JSXElement} obj.jsx JSX to be rendered as content
 * @param {number|undefined} obj.height
 * @param {number|undefined} obj.width
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

  windows.set(v => [...v, window]);
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
