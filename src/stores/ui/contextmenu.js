import { v } from "../../api/api";
import global from "../../global";

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

  // TODO look for closest parent with context-menu-id

  // Render the context menu
  show({
    title: "My first context menu",
    config: [],
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

function hide() {
  contextmenu.set(newContextMenu());
}

function onMouseDown() {
  if (contextmenu.get().visible) {
    hide();
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
