import "../types";
import { createSignal } from "solid-js";

/**
 * Returns a value with reactive get() and set() function
 * @param {any} v The initial value of your paramater
 * @returns {ReactiveValue}
 */
export const v = v => {
  const [get, set] = createSignal(v);
  return { get, set };
};

export default class API {
  constructor({
    datasets = {},
    dataModels = {},
    requestData = async () => ({}),
  }) {
    this.datasets = v(datasets);
    this.dataModels = v(dataModels);

    this.requestData = requestData;
  }
}
