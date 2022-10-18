import Dexie from "dexie";
import { v } from "../api/api";
import panes from "./panes";

export default class Storage {
  constructor() {
    this.db = new Dexie("viper");

    this.db.version(1).stores({
      templates: "++id,name,config",
    });

    this.config = v({
      activeTemplateId: 0,
    });

    this.templates = v([]);
  }

  async save() {
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
}
