import { render } from "solid-js/web";

import App from "./App";

import utils from "./utils";

import { v } from "../../api/api";

import dimensions from "./local-state/dimensions";
import workers from "./workers/workers.js";
import Instructions from "./local-state/Instructions";

/**
 * Create a new chart
 * @param {Object} param0
 * @param {HTMLElement} param0.element The element to render the chart inside
 * @param {number} param0.timeframe Initial value for viewing timeframe (defaults to 3.6e6)
 * @param {Object} param0.$api The API for communicating with parent
 */
export default ({ element, timeframe = 3.6e6, config = {}, $api }) => ({
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
    // On mounted to HTML
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
    }

    // On master fire resize
    else if (event === "resize") {
      this.dimensions.setDimensions(
        this.element.clientWidth,
        this.element.clientHeight
      );

      this.setVisibleRange({});
    }

    // On dataset update
    else if (event === "data") {
      const { dataset, dataModel, timestamps } = data;
      const { source, name, timeframe } = dataset;

      if (timeframe !== this.timeframe.get()) return;

      /**
       * Loop through all indicators subscribed to set and check for any
       * that are subscribed to this dataset
       */
      for (const setId in this.indicators.get()) {
        const indicator = this.indicators.get()[setId].get();

        const plot = indicator.plot.get();

        if (plot.dataset.source === source && plot.dataset.name === name) {
          // Calcualte new data
          this.workers.calculateOneSet({
            setId,
            timestamps,
            dataset,
            dataModel,
          });
        }
      }
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

    // Fire request for any missing data
    for (const setId in this.indicators.get()) {
      const indicator = this.indicators.get()[setId].get();
      const plot = indicator.plot.get();

      const { source, name } = plot.dataset;

      this.$api.getDataPointsIfNotPresent({
        source,
        name,
        timeframe: this.timeframe.get(),
        modelId: indicator.model,
        start,
        end,
      });
    }
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

  setTimeframe(timeframe) {
    if (timeframe === this.timeframe.get()) return;

    // Clear all sets
    this.workers.emptyAllSets();

    // Loop through all plots and unsubscribe from all datasets
    for (const plot of Object.values(this.plots.get())) {
      const { dataset, indicatorIds } = plot.get();

      for (const indicatorId of indicatorIds) {
        const { model } = this.indicators.get()[indicatorId].get();

        this.$api.unsubscribeFromDataset({
          source: dataset.source,
          name: dataset.name,
          modelId: model,
          timeframe: this.timeframe.get(),
        });
      }
    }

    // Set the timeframe
    this.timeframe.set(timeframe);

    // Reset range
    this.setInitialVisibleRange();
  },

  createDataModelGroup({ source, name }) {
    const plot = v({
      type: "DataModelGroup",
      visible: true,
      dataset: {
        source,
        name,
      },
      indicatorIds: [],
    });

    this.plots.set([...this.plots.get(), plot]);

    return plot;
  },

  setDatasetVisibility(index, visible) {
    // Get the dataset from plot map
    const dataset = this.plots.get()[index];

    // Loop through all indicators and set their visibility
    for (const indicatorId of dataset.get().indicatorIds) {
      this.setIndicatorVisibility(indicatorId, visible);
    }

    // Set the dataset visibility
    dataset.set(v => ({ ...v, visible }));
  },

  async addIndicator(
    indicator,
    plot,
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
      plot,
      model,
      visible,
      layerId,
    };

    const { setId } = await this.workers.addToQueue({
      indicator,
    });

    indicator.setId = setId;
    indicator.renderingQueueId = setId;

    // Create the indicator to be added to state
    indicator = v(indicator);

    this.indicators.set(v => ({
      ...v,
      [setId]: indicator,
    }));

    // Add a reference to the indicator in the dataset group indicators array
    plot.set(v => {
      v.indicatorIds = [...v.indicatorIds, setId];
      return { ...v };
    });

    const { source, name } = plot.get().dataset;
    const timeframe = this.timeframe.get();

    // Request data from master
    this.$api.getAllDataPoints({
      source,
      name,
      timeframe,
      modelId: model,
    });

    // TODO TEMP fix to load initial data
    this.setVisibleRange({});
  },

  setIndicatorVisibility(setId, visible) {
    const indicators = this.indicators.get();
    const indicator = indicators[setId];

    indicator.set(v => ({ ...v, visible }));

    this.workers.setIndicatorVisibility({
      setId,
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
    const i = dataset.get().indicatorIds.indexOf(id);
    dataset.get().indicatorIds.splice(i, 1);
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
});
