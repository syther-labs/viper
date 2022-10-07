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
    const { setId } = await new Promise(resolve => {
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

    // const { canvas } = this.chart.subcharts.main;
    // canvas.RE.addToRenderingOrder(renderingQueueId);

    return { setId };
  },

  async setIndicatorVisibility({ setId, visible }) {
    await new Promise(resolve => {
      const id = this.addToResolveQueue(resolve);

      this.workers.chart.postMessage(
        j({
          id,
          method: "setIndicatorVisibility",
          params: { setId, visible },
        })
      );
    });

    await this.generateAllInstructions();
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

    // Generate instructions for this set
    await this.generateAllInstructions();
  },

  async generateAllInstructions() {
    // If already generating instructions, dont fill the call stack with useless calls
    if (this.isGeneratingAllInstrutions) {
      this.isRequestingToGenerateAllInstructions = true;
      return { throwback: true };
    }

    this.isGeneratingAllInstrutions = true;

    const {
      instructions: newInstructions,
      visibleRanges,
      pixelsPerElement,
      maxDecimalPlaces,
    } = await new Promise(resolve => {
      const id = this.addToResolveQueue(resolve);

      const y = { ...$chart.state.ranges.y.get() };
      for (const id in y) {
        y[id] = y[id].get();
      }

      this.workers.chart.postMessage(
        j({
          id,
          method: "generateAllInstructions",
          params: {
            requestedRanges: {
              x: $chart.state.ranges.x.get(),
              y,
            },
            timeframe: $chart.state.timeframe.get(),
            chartDimensions: {
              main: {
                width: $chart.dimensions.main.width.get(),
                height: $chart.dimensions.main.height.get(),
                layers: $chart.dimensions.main.layers.get(),
              },
              yScale: {
                width: $chart.dimensions.yScale.width.get(),
                height: $chart.dimensions.yScale.height.get(),
              },
              xScale: {
                width: $chart.dimensions.xScale.width.get(),
                height: $chart.dimensions.xScale.height.get(),
              },
            },
            pixelsPerElement: $chart.state.pixelsPerElement.get(),
          },
        })
      );
    });

    this.instructions = newInstructions;
    $chart.state.pixelsPerElement.set(pixelsPerElement);
    $chart.renderedRanges.x.set(visibleRanges.x);

    for (const layerId in visibleRanges.y) {
      const yRange = $chart.state.ranges.y.get()[layerId];
      const yRenderedRage = $chart.renderedRanges.y.get()[layerId];

      yRange.set(v => ({
        ...v,
        range: visibleRanges.y[layerId],
      }));

      yRenderedRage.set(v => ({
        ...v,
        range: visibleRanges.y[layerId],
      }));
    }

    this.isGeneratingAllInstrutions = false;

    // If another generation is requested, call again
    if (this.isRequestingToGenerateAllInstructions) {
      this.isRequestingToGenerateAllInstructions = false;
      setTimeout(this.generateAllInstructions.bind(this));
    }
  },

  updateIndicators(updates) {
    this.workers.chart.postMessage(
      j({
        type: "runComputedStateMethod",
        data: {
          method: "updateIndicators",
          params: { updates },
        },
      })
    );
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
      case "updateInstructions":
        this.instructions = data.instructions;
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
