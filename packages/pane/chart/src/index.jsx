/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import "remixicon/fonts/remixicon.css";

import App from "./App";

import { v } from "../../../api";
import utils from "./utils";

import state, { initState } from "./state";
import API from "../../../api";
import dimensions, { setDimensions } from "./local-state/dimensions";
import { addToQueue, calculateOneSet } from "./workers/workers.js";
import plot_types from "./data/plot_types";

export default class Chart {
  /**
   * Create a new chart
   * @param {Object} param0
   * @param {HTMLElement} param0.element The element to render the chart inside
   * @param {number} param0.timeframe Initial value for viewing timeframe (defaults to 3.6e6)
   * @param {Object} param0.$api The API for communicating with parent
   */
  constructor({
    element,
    timeframe = 3.6e6,

    config = {},
    $api = new API({}),
  }) {
    this.element = element;
    this.$api = $api;
    this.state = state;

    initState({ chart: this });
    state.timeframe.set(timeframe);

    // Initially set dimensions based on element width and height
    setDimensions(element.clientWidth, element.clientHeight);

    // Set all config keys
    for (const key in config) {
      state.config[key].set(config[key]);
    }

    this.init();

    render(() => <App />, this.element);
  }

  init() {
    // If no ranges, create a default one
    if (!Object.keys(state.ranges.y.get()).length) {
      this.addLayer(10);
    }

    this.setInitialVisibleRange();
  }

  setInitialVisibleRange() {
    let { start, end } = state.ranges.x.get();
    const timeframe = state.timeframe.get();
    const width = dimensions.main.width.get();

    const endTimestamp = Math.floor(Date.now() / timeframe) * timeframe;
    state.pixelsPerElement.set(10);

    const candlesInView = width / state.pixelsPerElement.get();
    end = endTimestamp + timeframe * 10;
    start = end - candlesInView * timeframe;

    this.setVisibleRange({ start, end });
  }

  setVisibleRange(
    newRange = {},
    layerId = Object.keys(state.ranges.y.get())[0]
  ) {
    const xRange = state.ranges.x.get();
    const yRange = state.ranges.y.get()[layerId].get().range;

    const {
      start = xRange.start,
      end = xRange.end,
      min = yRange.min,
      max = yRange.max,
    } = newRange;

    // If x range changed
    if (start !== xRange.start || end !== xRange.end) {
      state.ranges.x.set({ start, end });
    }

    if (min !== yRange.min || max !== yRange.max) {
      state.ranges.y.get()[layerId].set((v) => ({
        ...v,
        range: { min, max },
      }));
    }

    // TODO generate all instructions
  }

  createDatasetGroup({ source, name }) {
    const dataset = v({
      type: "Dataset",
      visible: true,
      values: {
        datasetName: `${source}:${name}`,
        indicatorIds: [],
      },
    });

    state.plots.set([...state.plots.get(), dataset]);

    return dataset;
  }

  async addIndicator(
    indicator,
    dataset,
    model,
    { visible = true, layerId = Object.keys(state.ranges.y.get())[0] }
  ) {
    if (!layerId || !state.ranges.y.get()[layerId]) {
      layerId = this.addLayer(3);
    }

    const color = utils.randomHexColor();

    indicator = {
      ...indicator,
      dataset,
      model,
      visible,
      layerId,
    };

    const { renderingQueueId } = await addToQueue({ indicator });

    indicator.renderingQueueId = renderingQueueId;

    // Create the indicator to be added to state
    indicator = v(indicator);

    state.indicators.set((v) => ({
      ...v,
      [renderingQueueId]: indicator,
    }));

    // Add a reference to the indicator in the dataset group indicators array
    dataset.set((v) => {
      v.values.indicatorIds = [...v.values.indicatorIds, renderingQueueId];
      return { ...v };
    });

    const { datasetName } = dataset.get().values;
    const [source, name] = datasetName.split(":");
    const { start, end } = state.ranges.x.get();
    const timeframe = state.timeframe.get();

    // Request data from master
    const data = await state.chart.$api.requestData({
      source,
      name,
      timeframe,
      modelId: model.id,
      start,
      end,
    });

    // Calcualte new data
    calculateOneSet({
      renderingQueueId,
      timestamps: Object.keys(data),
      dataset: {
        source,
        name,
        timeframe,
        data,
      },
    });
  }

  removeIndicator(indicator) {
    const { id, dataset } = indicator.get();

    // Delete indicator reference from dataset
    const i = dataset.get().values.indicatorIds.indexOf(id);
    dataset.get().values.indicatorIds.splice(i, 1);
    dataset.set((v) => ({ ...v }));

    // Delete from indicators store
    state.indicators.set((v) => {
      delete v[id];
      return { ...v };
    });
  }

  addLayer(heightUnit) {
    const id = utils.uniqueId();

    const layer = v({
      id,
      heightUnit,
      lockedYScale: true,
      visible: true,
      fullscreen: false,
      scaleType: "default",
      indicators: {},
      range: { min: Infinity, max: -Infinity },
    });

    state.ranges.y.set((v) => ({
      ...v,
      [id]: layer,
    }));

    const renderedLayer = v({ range: { min: Infinity, max: -Infinity } });

    state.renderedRanges.y.set((v) => ({
      ...v,
      [id]: renderedLayer,
    }));
  }

  /**
   *
   * @param {Object} param0
   * @param {string} param0.source Dataset source id
   * @param {string} param0.name Dataset name
   * @param {number} param0.timeframe Dataset timeframe
   * @param {string} param0.dataModel Data model id
   * @param {any[]} datapoints Array of new data points
   */
  addData({ source, name, timeframe, dataModel }, datapoints) {}

  destroy() {}
}
