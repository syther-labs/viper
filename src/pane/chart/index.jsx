/* @refresh reload */
import { render } from "solid-js/web";

import App from "./App";

import utils from "./utils";

import { v } from "../../api/api";

import API from "../../api/api.js";
import dimensions from "./local-state/dimensions";
import workers from "./workers/workers.js";

/**
 * Create a new chart
 * @param {Object} param0
 * @param {HTMLElement} param0.element The element to render the chart inside
 * @param {number} param0.timeframe Initial value for viewing timeframe (defaults to 3.6e6)
 * @param {Object} param0.$api The API for communicating with parent
 */
export default ({ element, timeframe = 3.6e6, config = {}, $api = {} }) => ({
  // Parent stuff
  element,
  $api,

  // Pane config
  config: v({
    showTimeframes: v(true),
    timeframes: v([]),
    ...config,
  }),

  // Chart state
  timeframe: v(timeframe),
  name: v("Untitled chart"),
  plots: v([]),
  indicators: v({}),
  ranges: {
    x: v({
      start: undefined,
      end: undefined,
    }),
    y: v({}),
  },
  renderedRanges: {
    x: v({
      start: undefined,
      end: undefined,
    }),
    y: v({}),
  },
  pixelsPerElement: v(10),

  /**
   * On parent emitted events
   * @param {("resize","mounted")} event
   * @param {*} data
   */
  on(event, data) {
    if (event === "mounted") {
      this.dimensions = dimensions({ $chart: this });
      this.workers = workers({ $chart: this });
      this.workers.init();

      this.dimensions.setDimensions(
        this.element.clientWidth,
        this.element.clientHeight
      );

      // If no ranges, create a default one
      if (!Object.keys(this.ranges.y.get()).length) {
        this.addLayer(10);
      }

      this.setInitialVisibleRange();

      render(() => <App $chart={this} />, this.element);
    } else if (event === "resize") {
      this.dimensions.setDimensions(
        this.element.clientWidth,
        this.element.clientHeight
      );

      this.setVisibleRange({});
    }
  },

  setInitialVisibleRange() {
    let { start, end } = this.ranges.x.get();
    const timeframe = this.timeframe.get();
    const width = this.dimensions.main.width.get();

    const endTimestamp = Math.floor(Date.now() / timeframe) * timeframe;
    this.pixelsPerElement.set(10);

    const candlesInView = width / this.pixelsPerElement.get();
    end = endTimestamp + timeframe * 10;
    start = end - candlesInView * timeframe;

    this.setVisibleRange({ start, end });
  },

  setVisibleRange(
    newRange = {},
    layerId = Object.keys(this.ranges.y.get())[0]
  ) {
    const xRange = this.ranges.x.get();
    const yRange = this.ranges.y.get()[layerId].get().range;

    const {
      start = xRange.start,
      end = xRange.end,
      min = yRange.min,
      max = yRange.max,
    } = newRange;

    // If x range changed
    if (start !== xRange.start || end !== xRange.end) {
      this.ranges.x.set({ start, end });
    }

    if (min !== yRange.min || max !== yRange.max) {
      this.ranges.y.get()[layerId].set(v => ({
        ...v,
        range: { min, max },
      }));
    }

    this.workers.generateAllInstructions();
  },

  resizeXRange(change, left = 0.5, right = 0.5) {
    const width = this.dimensions.main.width.get();

    let { start, end } = this.ranges.x.get();
    let range = end - start;

    if (change < 0) {
      start -= (range * left) / 10;
      end += (range * right) / 10;
    } else if (change > 0) {
      start += (range * left) / 10;
      end -= (range * right) / 10;
    }

    // Calcualte new pixels per element based on new range
    const ppe = width / ((end - start) / this.timeframe.get());

    // If pixels per element is less than 1 or greater than 1000, dont apply changes
    if (ppe < 1 || ppe > 1000) return;

    this.setVisibleRange({ start, end });
  },

  createDatasetGroup({ source, name }) {
    const dataset = v({
      type: "Dataset",
      visible: true,
      values: {
        datasetName: `${source}:${name}`,
        indicatorIds: [],
      },
    });

    this.plots.set([...this.plots.get(), dataset]);

    return dataset;
  },

  setDatasetVisibility(index, visible) {
    // Get the dataset from plot map
    const dataset = this.plots.get()[index];

    // Loop through all indicators and set their visibility
    for (const indicatorId of dataset.get().values.indicatorIds) {
      this.setIndicatorVisibility(indicatorId, visible);
    }

    // Set the dataset visibility
    dataset.set(v => ({ ...v, visible }));
  },

  async addIndicator(
    indicator,
    dataset,
    model,
    { visible = true, layerId = Object.keys(this.ranges.y.get())[0] }
  ) {
    if (!layerId || !this.ranges.y.get()[layerId]) {
      layerId = this.addLayer(3);
    }

    const color = utils.randomHexColor();

    indicator = {
      ...indicator,
      color,
      dataset,
      model,
      visible,
      layerId,
    };

    const { renderingQueueId } = await this.workers.addToQueue({ indicator });

    indicator.renderingQueueId = renderingQueueId;

    // Create the indicator to be added to state
    indicator = v(indicator);

    this.indicators.set(v => ({
      ...v,
      [renderingQueueId]: indicator,
    }));

    // Add a reference to the indicator in the dataset group indicators array
    dataset.set(v => {
      v.values.indicatorIds = [...v.values.indicatorIds, renderingQueueId];
      return { ...v };
    });

    const { datasetName } = dataset.get().values;
    const [source, name] = datasetName.split(":");
    const { start, end } = this.ranges.x.get();
    const timeframe = this.timeframe.get();

    // Request data from master
    const data = await this.$api.requestData({
      source,
      name,
      timeframe,
      modelId: model.id,
      start,
      end,
    });

    // Calcualte new data
    this.workers.calculateOneSet({
      renderingQueueId,
      timestamps: Object.keys(data),
      dataset: {
        source,
        name,
        timeframe,
        data,
      },
    });
  },

  setIndicatorVisibility(renderingQueueId, visible) {
    const indicators = this.indicators.get();
    const indicator = indicators[renderingQueueId];

    indicator.set(v => ({ ...v, visible }));

    this.workers.setIndicatorVisibility({
      renderingQueueId,
      visible,
    });

    // Check if any indicators in layer are visible
    const layer = this.ranges.y.get()[indicator.get().layerId];
    let found = false;

    // Loop through all indicators and see if any are using same layerId and visible
    for (const renderingQueueId in indicators) {
      const { layerId, visible } = indicators[renderingQueueId].get();

      // If one indicator found, set to visible
      if (indicator.get().layerId === layerId && visible) {
        layer.set(v => ({ ...v, visible: true }));
        found = true;
        break;
      }
    }

    // If none visible, set layer to invisible
    if (!found) {
      layer.set(v => ({ ...v, visible: false }));
    }

    this.dimensions.updateLayers();

    this.workers.generateAllInstructions();
  },

  removeIndicator(indicator) {
    const { id, dataset } = indicator.get();

    // Delete indicator reference from dataset
    const i = dataset.get().values.indicatorIds.indexOf(id);
    dataset.get().values.indicatorIds.splice(i, 1);
    dataset.set(v => ({ ...v }));

    // Delete from indicators store
    this.indicators.set(v => {
      delete v[id];
      return { ...v };
    });
  },

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

    this.ranges.y.set(v => ({
      ...v,
      [id]: layer,
    }));

    const renderedLayer = v({ range: { min: Infinity, max: -Infinity } });

    this.renderedRanges.y.set(v => ({
      ...v,
      [id]: renderedLayer,
    }));

    this.dimensions.updateLayers();

    return id;
  },

  getLayerByYCoord(yCoord) {
    const layers = this.dimensions.main.layers.get();
    const ids = Object.keys(layers).filter(id => layers[id].height > 0);

    for (let i = 0; i < ids.length; i++) {
      const l1 = layers[ids[i]];
      const l2 = layers[ids[i + 1]];

      // If no next layer, current layer
      if (!l2) return ids[i];

      // If between top and bottom of layer in question
      if (yCoord >= l1.top && yCoord <= l2.top) return ids[i];
    }
  },

  /**
   *
   * @param {Object} param0
   * @param {string} param0.source Dataset source id
   * @param {string} param0.name Dataset name
   * @param {number} param0.timeframe Dataset timeframe
   * @param {string} param0.dataModel Data model id
   * @param {any[]} datapoints Array of new data points
   */
  addData({ source, name, timeframe, dataModel }, datapoints) {},

  destroy() {},
});
