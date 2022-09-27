import { render } from "solid-js/web";
import controls, { registerControl } from "./src/stores/keybinds";

import "./index.css";
import "remixicon/fonts/remixicon.css";

import App from "./src/App";

export default class Viper {
  /**
   *
   * @param {Object} param0
   * @param {HTMLElement} param0.element
   */
  constructor({ element }) {
    this.element = element;

    render(<App />, this.element);

    this.init();
  }

  init() {
    controls.init();

    // Define all keybinds
    registerControl({
      name: "Save layout",
      combo: ["ControlLeft", "KeyS"],
      method: () => console.log("Saved layout"),
    });
  }

  destory() {
    controls.destroy();
  }
}
