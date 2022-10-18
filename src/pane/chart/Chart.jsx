import { render } from "solid-js/web";

import App from "./App";

import utils from "./utils";

import { v } from "../../api/api";

import dimensions from "./local-state/dimensions";
import workers from "./workers/workers.js";
import { uniqueId } from "lodash";

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

  // Presistent state
  state: {
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

    pixelsPerElement: v(10),
  },

  // Local state
  renderedRanges: {
    x: v({
      start: undefined,
      end: undefined,
    }),
    y: v({}),
  },
  sets: {},
  regl: null,

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
      if (!Object.keys(this.state.ranges.y.get()).length) {
        this.addLayer(10);
      }

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

      if (timeframe !== this.state.timeframe.get()) return;

      /**
       * Loop through all indicators subscribed to set and check for any
       * that are subscribed to this dataset
       */
      for (const setId in this.state.indicators.get()) {
        const indicator = this.state.indicators.get()[setId].get();

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
    let { start, end } = this.state.ranges.x.get();
    const timeframe = this.state.timeframe.get();
    const width = this.dimensions.main.width.get();

    const endTimestamp = Math.floor(Date.now() / timeframe) * timeframe;
    this.state.pixelsPerElement.set(10);

    const candlesInView = width / this.state.pixelsPerElement.get();
    end = endTimestamp + timeframe * 10;
    start = end - candlesInView * timeframe;

    this.setVisibleRange({ start, end });
  },

  setVisibleRange(
    newRange = {},
    layerId = Object.keys(this.state.ranges.y.get())[0]
  ) {
    if (this.regl === null) return;

    const xRange = this.state.ranges.x.get();
    const yRange = this.state.ranges.y.get()[layerId].get().range;

    let {
      start = xRange.start,
      end = xRange.end,
      min = yRange.min,
      max = yRange.max,
    } = newRange;

    // If x range changed
    if (start !== xRange.start || end !== xRange.end) {
      this.state.ranges.x.set({ start, end });
    }

    // If y range changed
    if (min !== yRange.min || max !== yRange.max) {
      this.state.ranges.y.get()[layerId].set(v => ({
        ...v,
        range: { min, max },
      }));
    }

    const indicators = this.state.indicators.get();
    const yRanges = this.state.ranges.y.get();

    const timestamps = utils.getAllTimestampsIn(
      start,
      end,
      this.state.timeframe.get()
    );

    // Loop through all layers
    for (const layerId in yRanges) {
      const { scaleType, indicatorIds } = yRanges[layerId].get();

      // Loop through all sets and update data buffers with updated data
      const inView = [];
      const minsAndMaxs = [];

      let i = 0;

      // Loop through all indicators in layer
      for (const indicatorId of indicatorIds) {
        const { visible, model } = indicators[indicatorId].get();
        const set = this.sets[indicatorId];

        if (!visible) continue;

        inView[i] = [];
        const plots = [];

        let first = undefined;

        let missingPoints = [];

        // Loop through each time
        for (const timestamp of timestamps) {
          // If no data or never attempted to load data at time
          if (set.data[timestamp] === undefined) {
            missingPoints.push(timestamp);
            continue;
          }

          // If data has already been attempted to be loaded
          if (set.data[timestamp] === null) continue;

          let j = 0;
          for (const { type, values } of set.data[timestamp]) {
            if (first === undefined) first = values.series[0];

            if (!inView[i][j]) inView[i][j] = { type: "", values: [] };

            // Add timestamp to data
            inView[i][j].values.push(timestamp);

            for (let value of values.series) {
              if (scaleType === "percent") {
                value = ((value - first) / Math.abs(first)) * 100;
              }

              inView[i][j].type = type;
              inView[i][j].values.push(value);
              plots.push(value);
            }

            j++;
          }
        }

        // If missing data points from set, request them from parent
        // if (missingPoints.length) {
        //   // Request data from master
        //   this.$api.getDataPoints({
        //     source,
        //     name,
        //     timeframe: this.state.timeframe.get(),
        //     modelId: model,
        //     start: Math.min.apply(this, missingPoints),
        //     end: Math.max.apply(this, missingPoints),
        //   });
        // }

        const min = Math.min.apply(this, plots);
        const max = Math.max.apply(this, plots);
        minsAndMaxs.push(min, max);

        set.min = min;
        set.max = max;

        for (let j = 0; j < inView[i].length; j++) {
          const { type, values } = inView[i][j];

          if (!set.buffers[j]) {
            set.buffers[j] = { type, length: 0, buffer: this.regl.buffer([]) };
          }

          set.buffers[j].length = values.length;
          set.buffers[j].buffer(values);
        }

        i++;
      }

      min = Math.min.apply(this, minsAndMaxs);
      max = Math.max.apply(this, minsAndMaxs);
    }

    /// OLD CODE BEYOND

    // Fire request for any missing data
    for (const setId in this.state.indicators.get()) {
      const indicator = this.state.indicators.get()[setId].get();
      const plot = indicator.plot.get();

      const { source, name } = plot.dataset;

      this.$api.getDataPointsIfNotPresent({
        source,
        name,
        timeframe: this.state.timeframe.get(),
        modelId: indicator.model,
        start,
        end,
      });
    }
  },

  resizeXRange(change, left = 0.5, right = 0.5) {
    const width = this.dimensions.main.width.get();

    let { start, end } = this.state.ranges.x.get();
    let range = end - start;

    if (change < 0) {
      start -= (range * left) / 10;
      end += (range * right) / 10;
    } else if (change > 0) {
      start += (range * left) / 10;
      end -= (range * right) / 10;
    }

    // Calcualte new pixels per element based on new range
    const ppe = width / ((end - start) / this.state.timeframe.get());

    // If pixels per element is less than 1 or greater than 1000, dont apply changes
    if (ppe < 1 || ppe > 1000) return;

    this.setVisibleRange({ start, end });
  },

  setTimeframe(timeframe) {
    if (timeframe === this.state.timeframe.get()) return;

    // Clear all sets
    this.workers.emptyAllSets();

    // Loop through all plots and unsubscribe from all datasets
    for (const plot of Object.values(this.state.plots.get())) {
      const { dataset, indicatorIds } = plot.get();

      for (const indicatorId of indicatorIds) {
        const { model } = this.state.indicators.get()[indicatorId].get();

        this.$api.unsubscribeFromDataset({
          source: dataset.source,
          name: dataset.name,
          modelId: model,
          timeframe: this.state.timeframe.get(),
        });
      }
    }

    // Set the timeframe
    this.state.timeframe.set(timeframe);

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

    this.state.plots.set([...this.state.plots.get(), plot]);

    return plot;
  },

  setDatasetVisibility(index, visible) {
    // Get the dataset from plot map
    const dataset = this.state.plots.get()[index];

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
    { visible = true, layerId = Object.keys(this.state.ranges.y.get())[0] }
  ) {
    if (!layerId || !this.state.ranges.y.get()[layerId]) {
      layerId = this.addLayer(3);
    }

    const setId = uniqueId();

    indicator = v({
      ...indicator,
      setId,
      renderingQueueId: setId,
      color: utils.randomHexColor(),
      plot,
      model,
      visible,
      layerId,
    });

    this.workers.addToQueue({ indicator: indicator.get() });

    this.sets[setId] = {
      min: Infinity,
      max: -Infinity,
      data: {},
      buffers: [],
    };

    this.state.indicators.set(v => ({
      ...v,
      [setId]: indicator,
    }));

    // Add a reference to the indicator in the dataset group indicators array
    plot.set(v => {
      v.indicatorIds = [...v.indicatorIds, setId];
      return { ...v };
    });

    // Add reference to indicator
    this.state.ranges.y.get()[layerId].set(v => {
      v.indicatorIds = [...v.indicatorIds, setId];
      return { ...v };
    });

    const { source, name } = plot.get().dataset;
    const timeframe = this.state.timeframe.get();

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
    const indicators = this.state.indicators.get();
    const indicator = indicators[setId];

    indicator.set(v => ({ ...v, visible }));

    this.workers.setIndicatorVisibility({
      setId,
      visible,
    });

    // Check if any indicators in layer are visible
    const layer = this.state.ranges.y.get()[indicator.get().layerId];
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
    const { setId, plot, layerId } = indicator.get();

    // Delete indicator reference from plot
    const i = plot.get().indicatorIds.indexOf(setId);
    plot.get().indicatorIds.splice(i, 1);
    plot.set(v => ({ ...v }));

    // Delete indicator reference from layer
    this.state.ranges.y.get()[layerId].set(v => {
      const i = v.indicatorIds.indexOf(setId);
      v.indicatorIds.splice(i, 1);
      return { ...v };
    });

    // Delete from indicators store
    this.state.indicators.set(v => {
      delete v[setId];
      return { ...v };
    });

    this.workers.removeFromQueue({ setId });
    this.workers.generateAllInstructions();
  },

  removePlot(index) {
    const plots = this.state.plots.get();

    for (const setId of plots[index].get().indicatorIds) {
      this.removeIndicator(this.state.indicators.get()[setId]);
    }

    plots.splice(index, 1);
    this.state.plots.set([...plots]);
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
      indicatorIds: [],
      range: { min: Infinity, max: -Infinity },
    });

    this.state.ranges.y.set(v => ({
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