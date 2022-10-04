import DataState from "./stores/data";

export default {
  /** @type {HTMLElement|null} */
  element: null,
  data: DataState,
  dataModels: {},
  sources: {},
  requestData: async () => {},
};
