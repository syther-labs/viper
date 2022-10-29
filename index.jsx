import { render } from "solid-js/web";
import keybinds, { registerControl } from "./src/stores/keybinds";

import "./index.css";
import "remixicon/fonts/remixicon.css";

import App from "./src/App";
import global from "./src/global";
import ui, { createNewWindow } from "./src/stores/ui";
import contextmenu from "./src/stores/ui/contextmenu";

export default class Viper {
  /**
   * Initialize new Viper class
   * @param {Object} param0
   * @param {HTMLElement} param0.element
   * @param {Object} param0.dataModels
   * @param {Object} param0.sources
   */
  constructor({ element, dataModels, sources, requestData }) {
    global.element = element;
    global.dataModels = dataModels;
    global.sources = sources;
    global.requestData = requestData;

    render(() => <App />, element);

    this.init();
  }

  init() {
    keybinds.init();
    ui.init();
    contextmenu.init();

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
      method: () => {
        createNewWindow({
          title: "Controls",
          jsx: (
            <div className="p-2">
              "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam
              quibusdam, fuga deserunt corporis minus repudiandae excepturi
              voluptates quae alias architecto expedita neque, nam, vitae nihil
              hic harum praesentium. Nisi, obcaecati!"
            </div>
          ),
          height: 400,
          width: 400,
        });
      },
    });
  }

  updateDataset(datasetId, data) {
    const dataset = global.data.datasets[datasetId];
    dataset.updateDataset(data);
  }

  destory() {
    keybinds.destroy();
    ui.destroy();
    contextmenu.destroy();
  }
}
