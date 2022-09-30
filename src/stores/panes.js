import { GridStack } from "gridstack";
import { uniqueId } from "lodash";
import { v } from "../api/api";
import utils from "../pane/chart/utils";

/** @type {GridStack|null} */
let grid = null;

export const selectedPage = v("");
export const panes = v({});

export function createPane() {
  const id = uniqueId();

  const pane = v({
    id,
    element: grid.addWidget({ w: 2, h: 2 }),
    pos: undefined,
  });

  panes.set(v => ({ ...v, [id]: pane }));

  return pane;
}

/**
 * On new Grid item(s)
 * @param {Event} event
 * @param {import("gridstack").GridStackNode[]} items
 */
function onAdded(event, items) {
  updatePanePositions(items);
}

/**
 * On any Grid item change event
 * @param {Event} event
 * @param {import("gridstack").GridStackNode[]} items
 */
function onChange(event, items) {
  updatePanePositions(items);
}

/**
 * Update pane positions
 * @param {import("gridstack").GridStackNode[]} items
 */
function updatePanePositions(items) {
  // Loop through all new items
  for (const item of items) {
    const values = Object.values(panes.get());

    // Find correct pane that matches element
    const pane = values.find(v => v.get().element === item.el);

    // Add pos property for
    pane.set(v => ({
      ...v,
      pos: {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      },
    }));

    console.log(pane.get().pos);
  }
}

export default {
  /**
   * Init panes store
   * @param {Object} param0
   * @param {HTMLElement} param0.gridContainer
   * @param {Object} param0.options
   */
  init({ gridContainer, options = {} }) {
    grid = GridStack.addGrid(gridContainer, options);
    console.log(grid, gridContainer);
    grid.on("added", onAdded);
    grid.on("change", onChange);
  },

  destroy() {
    grid.destroy();
  },
};
