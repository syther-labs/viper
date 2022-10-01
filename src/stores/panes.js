import { GridStack } from "gridstack";
import { uniqueId } from "lodash";
import { createEffect } from "solid-js";
import { v } from "../api/api";
import utils from "../pane/chart/utils";

/** @type {GridStack|null} */
let grid = null;

export const selectedPage = v("");
export const panes = v({});
export const gridEdit = v(false);

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

  items.forEach(item => {
    item.el.style.border = "1px solid #fff";
  });
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
    if (!pane) continue;

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
  }
}

createEffect(() => {
  const value = gridEdit.get();
  if (!grid) return;
  grid.enableMove(value);
  grid.enableResize(value);
});

export default {
  /**
   * Init panes store
   * @param {Object} param0
   * @param {HTMLElement} param0.gridContainer
   * @param {Object} param0.options
   */
  init({ gridContainer, options = {} }) {
    grid = GridStack.addGrid(gridContainer, options);
    grid.on("added", onAdded);
    grid.on("change", onChange);

    grid.enableMove(false);
    grid.enableResize(false);
  },

  destroy() {
    grid.destroy();
  },
};
