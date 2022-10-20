import utils from "../utils";

import ChartWorker from "./modules/chart?worker";
import Instructions from "../local-state/Instructions";

const j = d => JSON.parse(JSON.stringify(d));

export default ({ $chart }) => ({
  workersSupported: !!window.Worker,
  workers: {
    chart: null,
  },
  resolveQueue: {},
  instructions: Instructions,
  isRequestingToGenerateAllInstructions: false,
  isGeneratingAllInstrutions: false,

  init() {
    this.workers.chart = this.createWorker("chart");
  },

  /**
   * Create a new JavaScript worker of type
   * @param {('chart')} type
   * @returns
   */
  createWorker(type = "") {
    let worker;

    if (type === "chart") {
      worker = new ChartWorker({ type: "module" });
    } else {
      throw new Error(`No valid implementation for ${type} worker`);
    }
    worker.onmessage = this.onWorkerMessage.bind(this);
    worker.onerror = this.onWorkerError.bind(this);

    return worker;
  },

  async addToQueue({ indicator }) {
    await new Promise(resolve => {
      const id = this.addToResolveQueue(resolve);

      this.workers.chart.postMessage(
        j({
          id,
          method: "addToQueue",
          params: {
            indicator: {
              ...indicator,
              draw: undefined,
            },
          },
        })
      );
    });
  },

  async calculateOneSet({ setId, timestamps, dataset, dataModel }) {
    await new Promise(resolve => {
      const id = this.addToResolveQueue(resolve);

      this.workers.chart.postMessage(
        j({
          id,
          method: "calculateOneSet",
          params: {
            setId,
            timestamps,
            dataset,
            dataModel,
          },
        })
      );
    });
  },

  emptySet({ setId }) {
    this.workers.chart.postMessage(
      j({
        method: "emptySet",
        params: { setId },
      })
    );
  },

  emptyAllSets() {
    this.workers.chart.postMessage(
      j({
        method: "emptyAllSets",
        params: {},
      })
    );
  },

  removeFromQueue({ setId }) {
    this.workers.chart.postMessage(
      j({
        method: "removeFromQueue",
        params: { setId },
      })
    );
  },

  /**
   * Add resolve function to queue for resolving result of worker
   * @param {function} resolve
   * @returns {string} Resolve id
   */
  addToResolveQueue(resolve) {
    const id = utils.uniqueId();
    this.resolveQueue[id] = resolve;
    return id;
  },

  onWorkerMessage(e) {
    const { id, data } = e.data;

    switch (id) {
      case "updateSet":
        $chart.sets[data.setId].times = data.times;
        $chart.sets[data.setId].configs = data.configs;
        $chart.sets[data.setId].data = data.data;
        $chart.setVisibleRange({});
        break;
      default:
        if (!this.resolveQueue[id]) return;
        this.resolveQueue[id](data);
        delete this.resolveQueue[id];
        break;
    }
  },

  onWorkerError(e) {
    console.error(e);
  },
});
