import { render } from "solid-js/web";
import keybinds, { registerControl } from "./src/stores/keybinds";

import "./index.css";
import "remixicon/fonts/remixicon.css";

import App from "./src/App";
import global from "./src/global";

export default class Viper {
  /**
   *
   * @param {Object} param0
   * @param {HTMLElement} param0.element
   */
  constructor({ element }) {
    global.element = element;

    render(<App />, element);

    this.init();
  }

  init() {
    keybinds.init();

    // Define all keybinds
    // TODO move to separate file
    registerControl({
      name: "Save layout",
      combo: ["ControlLeft", "KeyS"],
      method: () => console.log("Saved layout"),
    });

    registerControl({
      name: "Show all controls",
      combo: ["ShiftLeft", "Slash"],
      method: () => console.log("TODO: Show controls modal"),
    });
  }

  destory() {
    keybinds.destroy();
  }
}
