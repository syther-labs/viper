import { GridStack } from "gridstack";
import _, { padEnd, uniqueId } from "lodash";
import { createEffect } from "solid-js";
import { v } from "../api/api";
import utils from "../pane/chart/utils";

/** @type {GridStack|null} */
let grid = null;

export const selectedPage = v("");
export const panes = v({});
export const gridEdit = v(false);

export function createPane(PaneApp) {
  const id = uniqueId();

  const gridItem = grid.addWidget({ w: 6, h: 4 });
  const element = gridItem.querySelector(".grid-stack-item-content");

  const pane = v({
    id,
    gridItem,
    element,
    appType: "chart",
    pos: undefined,
  });

  const app = PaneApp({
    element,
    config: {},
  });
  if (typeof app.on !== "function") app.on = () => {};

  // Update the pane with the app
  pane.set(v => ({
    ...v,
    app,
  }));

  panes.set(v => ({ ...v, [id]: pane }));

  updatePanePositions([gridItem]);

  app.on("mounted");

  return pane;
}

/**
 * On any Grid item change event
 * @param {Event} event
 * @param {import("gridstack").GridStackNode[]} items
 */
function onChange(event, items) {
  updatePanePositions(items.map(item => item.el));
}

/**
 * Update pane positions
 * @param {HTMLElement} elements
 */
function updatePanePositions(elements) {
  // Loop through all new items
  for (const el of elements) {
    const values = Object.values(panes.get());

    // Find correct pane that matches element
    const pane = values.find(v => v.get().gridItem === el);

    const { pos: oldPos, app } = pane.get();
    const newPos = {
      x: +el.getAttribute("gs-x"),
      y: +el.getAttribute("gs-y"),
      w: +el.getAttribute("gs-w"),
      h: +el.getAttribute("gs-h"),
    };

    // Add pos property for
    pane.set(v => ({
      ...v,
      pos: newPos,
    }));

    // If height or width have changed
    if (oldPos && (oldPos.w !== newPos.w || oldPos.h !== newPos.h)) {
      app.on("resize");
    }
  }
}

createEffect(() => {
  const value = gridEdit.get();
  if (!grid) return;
  grid.enableMove(value);
  grid.enableResize(value);

  // If grid edit true
  if (value) {
    for (const pane of Object.values(panes.get())) {
      const { element } = pane.get();
      if (element.querySelector(".resize-container")) continue;
      createResizeContainerElement(element);
    }
  } else {
    for (const div of document.querySelectorAll(".resize-container")) {
      div.remove();
    }
  }
});

/**
 * Append a div to Grid Item (Pane) to capture mouse move
 * @param {HTMLElement} element
 */
const createResizeContainerElement = element => {
  const div = document.createElement("div");
  div.classList.add("resize-container");
  element.appendChild(div);
};

let windowResizeTimeout;
const onWindowResize = _.throttle(() => {
  windowResizeTimeout = setTimeout(() => {
    for (const pane of Object.values(panes.get())) {
      const { app } = pane.get();
      app.on("resize");
    }
  }, 1000);
}, 100);

export default {
  /**
   * Init panes store
   * @param {Object} param0
   * @param {HTMLElement} param0.gridContainer
   * @param {Object} param0.options
   */
  init({ gridContainer, options = {} }) {
    grid = GridStack.addGrid(gridContainer, options);
    grid.on("change", onChange);

    window.addEventListener("resize", onWindowResize);

    grid.enableMove(false);
    grid.enableResize(false);
  },

  destroy() {
    grid.destroy();
    window.removeEventListener("resize", onWindowResize);
    clearTimeout(windowResizeTimeout);
  },
};
