import Dexie from "dexie";
import { v } from "../api/api";
import { panes } from "./panes";

export default class Storage {
  constructor() {
    this.db = new Dexie("viper");

    this.db.version(1).stores({
      templates: "++id,name,config",
    });

    this.config = v({
      activeTemplateId: 1,
    });

    this.templates = v([]);

    this._interval = null;
  }

  init() {
    this._interval = setInterval(this.snapshotState.bind(this), 5000);
  }

  async save(id, name, config) {
    // Check if template exists at id
    const rows = await this.db.templates.where("id").equals(id).toArray();
    const row = rows[0];

    if (row) {
      // If so, update it
      await this.db.templates.update(id, { name, config });
    } else {
      // If not, create it
      await this.db.templates.add({ name, config });
    }

    return await this.db.templates.orderBy("id").last();
  }

  async delete(id) {
    await this.db.templates.delete(id);
  }

  snapshotState() {
    const config = this.config.get();

    // If tempalte is string (remote template id) dont save locally
    if (typeof config.activeTemplateId === "string") {
      return;
    }

    const snapshot = {
      config,
      panes: [],
    };

    // Loop through all panes and add to state
    const panesArr = Object.values(panes.get());
    for (const pane of panesArr) {
      // Copy pane config and state

      const { type, pos, app } = pane.get();
      const state = copyReactiveState(type, app.state);

      snapshot.panes.push({
        type,
        pos,
        state,
      });
    }

    console.log(snapshot.panes);

    // Save template to IndexedDB
    this.save(config.activeTemplateId, "Untitled template 1", {
      panes: snapshot.panes,
    });

    // Save global config to LocalStorage
    localStorage.setItem("config", JSON.stringify(config));
  }

  destroy() {
    if (this._interval) clearInterval(this._interval);
  }
}

export function copyReactiveState(type, state) {
  let parentKey;

  const convertObj = obj => {
    obj = { ...obj };

    // Loop through every paramater in object
    for (const key in obj) {
      // If object has get and set method
      const { get } = obj[key];

      if (typeof get === "function") {
        obj[key] = get();
      }

      if (typeof obj[key] === "object") {
        parentKey = key;
        obj[key] = convertObj(obj[key]);
      }
    }

    return obj;
  };

  return convertObj(state);
}
