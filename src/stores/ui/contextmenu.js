import { v } from "../../api/api";
import global from "../../global";
import { panes } from "../panes";

const newContextMenu = () => ({
  title: "",
  visible: false,
  config: [],
  pos: [0, 0],
});

export const contextmenu = v(newContextMenu());

/**
 * On context menu
 * @param {MouseEvent} e
 */
export function onContextMenu(e) {
  e.preventDefault();

  if (e.target === null) return;

  /** @type {HTMLElement} */
  let element = e.target;

  let contextMenuId = null;

  // TODO look for closest parent with context-menu-id
  while (element !== null) {
    contextMenuId = element.getAttribute("context-menu-id");
    if (contextMenuId) break;
    element = element.parentElement;
  }

  if (!contextMenuId) return;

  let pane = null;

  // Find if within a pane
  while (element !== null) {
    if (element.classList.contains("grid-stack-item-content")) {
      // Find the pane associated with this
      const values = Object.values(panes.get());
      pane = values.find(v => v.get().element === element);
      break;
    }
    element = element.parentElement;
  }

  const config = [];
  let title = "";

  if (pane) {
    const { app, menus } = pane.get();
    const menu = menus[contextMenuId](app, e);
    title = menu.title;
    config.push(...menu.config);
  }

  // TODO check for global context menus

  // Render the context menu
  show({
    title,
    config,
    pos: [e.clientX, e.clientY],
  });
}

function show({ title, config = [], pos }) {
  contextmenu.set({
    title,
    visible: true,
    config,
    pos,
  });
}

export function hide() {
  contextmenu.set(newContextMenu());
}

/**
 *
 * @param {MouseEvent} e
 */
function onMouseDown(e) {
  // Close context menu if open and parent element is no the context menu itself
  if (contextmenu.get().visible) {
    let element = e.target;
    let isContextMenu = false;

    while (element !== null) {
      const attr = element.getAttribute("context-menu");
      if (attr) break;
      element = element.parentElement;
    }

    // If searched entire document, close context menu
    if (element === null) {
      hide();
    }
  }
}

export default {
  init() {
    window.addEventListener("mousedown", onMouseDown);
  },

  destroy() {
    window.removeEventListener("mousedown", onMouseDown);
  },
};
