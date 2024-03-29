import { render } from "solid-js/web";

import App from "./App";

import utils from "./utils";

import { v } from "../../api/api";

import dimensions from "./local-state/dimensions";
import workers from "./workers/workers.js";
import _, { uniqueId } from "lodash";
import plot_types from "./data/plot_types";
import { PriceScales, TimeScales } from "./workers/generators";
import { batch } from "solid-js";
import global from "../../global";

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
    plots: v({}),
    indicators: v({}),

    ranges: {
      x: v({
        start: undefined,
        end: undefined,
      }),
      y: v({}),
    },

    pixelsPerElement: v(5),
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
  crosshair: v({
    time: [],
    price: [],
  }),
  scales: {
    time: v(document.createElement("div")),
    price: v(document.createElement("div")),
  },
  anchorTime: 0,
  lockedViewport: false,
  yLabels: {},

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

      const now = Date.now();
      const timeframe = this.state.timeframe.get();
      this.anchorTime = now - (now % timeframe) - timeframe * 500;

      // If data is defined, it's the state object
      if (data) {
        batch(() => {
          this.state.timeframe.set(data.timeframe);
          this.state.name.set(data.name);

          // Create all ranges
          Object.values(data.ranges.y).forEach(this.addLayer.bind(this));

          // Create all plots
          setTimeout(() => {
            batch(() => {
              for (const id in data.plots) {
                data.plots[id] = v(data.plots[id]);
              }
              this.state.plots.set(data.plots);

              // Add all indicators
              for (const id in data.indicators) {
                const indicator = data.indicators[id];

                this.addIndicator(
                  plot_types.getIndicatorById(indicator.indicatorId),
                  this.state.plots.get()[indicator.plotId],
                  indicator.model,
                  indicator
                );
              }
            });
          });
        });
      }

      // If no ranges, create a default one
      if (!Object.keys(this.state.ranges.y.get()).length) {
        this.addLayer({ heightUnit: 10 });
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

        const plot = this.state.plots.get()[indicator.plotId].get();

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
    this.state.pixelsPerElement.set(5);

    const candlesInView = width / this.state.pixelsPerElement.get();
    end = endTimestamp + timeframe * 10;
    start = end - candlesInView * timeframe;

    this.setVisibleRange({ start, end });
  },

  setVisibleRange(
    newRange = {},
    layerId = Object.keys(this.state.ranges.y.get())[0]
  ) {
    batch(() => {
      if (this.regl === null) return;

      const width = this.dimensions.main.width.get();
      const height = this.dimensions.main.height.get();

      const xRange = this.state.ranges.x.get();
      const yRanges = this.state.ranges.y.get();
      const layer = yRanges[layerId].get();
      const yRange = layer.range;

      const timeframe = this.state.timeframe.get();

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

      this.state.pixelsPerElement.set(width / ((end - start) / timeframe));

      const indicators = this.state.indicators.get();

      const minTime = start - (start % timeframe) - this.anchorTime;
      const maxTime = end + timeframe - (end % timeframe) - this.anchorTime;

      // Loop through all layers
      if (!this.lockedViewport) {
        const yLabels = {};

        for (const layerId in yRanges) {
          const { scaleType, lockedYScale, indicatorIds } =
            yRanges[layerId].get();

          // Loop through all sets and update data buffers with updated data
          const minsAndMaxs = [];

          yLabels[layerId] = [];

          // Loop through all indicators in layer
          for (const indicatorId of indicatorIds) {
            const { visible, model, plotId } = indicators[indicatorId].get();
            const { dataset } = this.state.plots.get()[plotId].get();

            const set = this.sets[indicatorId];

            if (!visible) continue;

            let i = Math.max(set.times.indexOf(minTime), 0);
            let j = set.times.indexOf(maxTime);
            if (j === -1) j = set.times.length - 1;

            // Set times to array of times in viewport
            set.buffers.times(set.times.slice(i, j + 1));

            // Clear the first point in set
            set.first = undefined;

            for (const id in set.configs) {
              const config = set.configs[id];

              const l = config.length;
              const data = set.data[id].slice(i * l, j * l + 1);

              if (set.first === undefined) set.first = data[0];

              // If no buffer exists for this set config, create it
              if (!set.buffers.data[id]) {
                set.buffers.data[id] = {
                  config,
                  length: 0,
                  buffer: this.regl.buffer([]),
                };
              }

              set.buffers.data[id].length = data.length;
              set.buffers.data[id].buffer(data);

              // Calcuate set min's and max's + visible min's and max'x
              set.min = Math.min.apply(this, data);
              set.max = Math.max.apply(this, data);

              let visibleMin = set.min;
              let visibleMax = set.max;

              if (scaleType === 2) {
                visibleMin = 0;
                visibleMax = 100;
              } else if (scaleType === 1) {
                visibleMin =
                  ((set.min - set.first) / Math.abs(set.first)) * 100;
                visibleMax =
                  ((set.max - set.first) / Math.abs(set.first)) * 100;
              }

              set.visibleMin = visibleMin;
              set.visibleMax = visibleMax;
              minsAndMaxs.push(visibleMin, visibleMax);

              if (config.yLabel) {
                let value = data[data.length - 1];

                if (scaleType === 1) {
                  value = ((value - set.first) / Math.abs(set.first)) * 100;
                }

                yLabels[layerId].push([
                  value,
                  dataset,
                  config.colors.color,
                  set,
                ]);
              }
            }
          }

          // If yScale is locked, apply min and max bounds
          if (lockedYScale) {
            let min = Math.min.apply(this, minsAndMaxs);
            let max = Math.max.apply(this, minsAndMaxs);

            const range5P = (max - min) * 0.05;
            min -= range5P;
            max += range5P;

            yRanges[layerId].set(v => ({
              ...v,
              range: { min, max },
            }));
          }
        }

        this.yLabels = yLabels;
      }

      // Regenerate TimeScales and PriceScales
      this.scales.time.set(
        TimeScales(
          this.state.pixelsPerElement.get(),
          timeframe,
          start,
          end,
          width
        )
      );

      this.scales.price.set(
        PriceScales(yRanges, this.dimensions, this.sets, this.yLabels)
      );

      /// OLD CODE BEYOND

      // Fire request for any missing data
      // TODO FIXED THIS UNOPTIMIED PEICE OF SHIT
      if (!this.lockedViewport) {
        for (const setId in this.state.indicators.get()) {
          const indicator = this.state.indicators.get()[setId].get();
          const plot = this.state.plots.get()[indicator.plotId].get();

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
      }
    });
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

    // Reset scales and shit
    this.scales.time.set(document.createElement("div"));
    this.scales.price.set(document.createElement("div"));

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

        const set = this.sets[indicatorId];
        set.times = [];
        set.configs = {};
        set.data = {};
      }
    }

    // Set the timeframe
    this.state.timeframe.set(timeframe);
    const now = Date.now();
    this.anchorTime = now - (now % timeframe) - timeframe * 500;

    // Reset range
    this.setInitialVisibleRange();
  },

  createDataModelGroup(state = {}) {
    const plot = v({
      id: utils.uniqueId(),
      type: "DataModelGroup",
      visible: true,
      dataset: {},
      indicatorIds: [],
      ...state,
    });

    const { id } = plot.get();
    this.state.plots.set(v => ({ ...v, [id]: plot }));

    return plot;
  },

  setDatasetVisibility(id, visible) {
    // Get the dataset from plot map
    const plot = this.state.plots.get()[id];

    // Loop through all indicators and set their visibility
    for (const indicatorId of plot.get().indicatorIds) {
      this.setIndicatorVisibility(indicatorId, visible);
    }

    // Set the dataset visibility
    plot.set(v => ({ ...v, visible }));
  },

  async addIndicator(
    indicator,
    plot,
    model,
    {
      setId,
      visible = true,
      layerId = Object.keys(this.state.ranges.y.get())[0],
    }
  ) {
    if (!layerId || !this.state.ranges.y.get()[layerId]) {
      layerId = this.addLayer({ heightUnit: 3 });
    }

    if (!setId) setId = uniqueId();

    indicator = v({
      indicatorId: indicator.id,
      setId,
      renderingQueueId: setId,
      color: utils.randomRGBAColor(),
      plotId: plot.get().id,
      model,
      visible,
      layerId,
    });

    this.workers.addToQueue({ indicator: indicator.get() });

    this.sets[setId] = {
      min: Infinity,
      max: -Infinity,

      times: [],
      configs: {},
      data: {},

      buffers: {
        times: this.regl.buffer([]),
        data: {},
      },
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

    this.setVisibleRange({});
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
    ``;

    // Delete from indicators store
    this.state.indicators.set(v => {
      delete v[setId];
      return { ...v };
    });

    this.workers.removeFromQueue({ setId });
    this.workers.generateAllInstructions();
  },

  removePlot(id) {
    const plots = this.state.plots.get();

    for (const setId of plots[id].get().indicatorIds) {
      this.removeIndicator(this.state.indicators.get()[setId]);
    }

    this.state.plots.set(v => {
      delete v[id];
      return v;
    });
  },

  addLayer(state = {}) {
    const layer = v({
      id: uniqueId(),
      heightUnit: 10,
      lockedYScale: true,
      visible: true,
      fullscreen: false,
      scaleType: 1,
      indicatorIds: [],
      range: { min: Infinity, max: -Infinity },
      ...state,
    });

    const { id } = layer.get();

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
