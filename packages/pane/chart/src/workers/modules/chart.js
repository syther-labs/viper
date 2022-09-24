import plot_types from "../../data/plot_types";
import utils from "../../utils";

import math from "../../viper-script/math";
import ScriptFunctions from "../../viper-script/script-functions";

const queue = new Map();
const sets = {};
const computedState = {};

self.addEventListener("message", async (e) => {
  const { id, method = "", params = {} } = e.data;

  postMessage({
    id,
    data: await methods[method](params),
  });
});

const methods = {
  addToQueue({ indicator }) {
    let renderingQueueId = utils.uniqueId();
    queue.set(renderingQueueId, indicator);
    return { renderingQueueId };
  },

  calculateOneSet({ renderingQueueId, timestamps, dataset }) {
    const { timeframe } = dataset;

    const indicator = queue.get(renderingQueueId);
    indicator.draw = plot_types.getIndicatorById(indicator.id).draw;

    // If indicator is set to not visible, don't calculate data
    if (!indicator.visible) return;

    if (!sets[renderingQueueId]) {
      sets[renderingQueueId] = createComputedSet({
        timeframe,
      });
    }

    const set = sets[renderingQueueId];

    // Check if set has requires lookback or lookforwardw
    if (set.maxLookback) {
      let n = set.maxLookback;

      const last = +timestamps[timestamps.length - 1];
      if (n === Infinity) {
        n = (dataset.maxTime - last) / dataset.timeframe;
      }

      const start = last + timeframe;
      const end = last + timeframe * n;
      timestamps = [
        ...timestamps,
        ...utils.getAllTimestampsIn(start, end, timeframe),
      ];
    }
    if (set.maxLookforward) {
      let n = set.maxLookforward;

      const first = +timestamps[0];
      if (n === Infinity) {
        n = (first - dataset.minTime) / dataset.timeframe;
      }

      const start = first - timeframe * n;
      const end = first - timeframe;
      timestamps = [
        ...utils.getAllTimestampsIn(start, end, timeframe),
        ...timestamps,
      ];
    }

    let iteratedTime = 0;

    // Storage for global variables used across indicator times only defined once
    const globals = {};

    const addSetItem = (time, type, values) => {
      // If any of the values are not a number, (invalid calculation, ignore them)
      if (
        values.series.filter((e) => isNaN(e) || typeof e !== "number").length
      ) {
        return;
      }

      // If first plotted item at time, create fresh array
      if (!set.data[time]) {
        set.data[time] = [];
      }

      // Add plot type and plot values to time
      set.data[time].push({ type, values });

      // Update max & min if applicable
      const { series } = values;
      for (const val of series) {
        // If potential for more decimal places, check
        if (set.decimalPlaces < 8) {
          const decimalPlaces = utils.getDecimalPlaces(val, 8);

          // If decimal places for number is larger, set max decimal places
          if (decimalPlaces > set.decimalPlaces) {
            set.setDecimalPlaces(decimalPlaces);
          }
        }
      }

      sets[renderingQueueId] = set;
    };

    if (!computedState[renderingQueueId]) {
      computedState[renderingQueueId] = {};
    }

    const funcWraps = {};
    for (const funcName in ScriptFunctions) {
      funcWraps[funcName] = function () {
        return ScriptFunctions[funcName](
          {
            set,
            addSetItem,
            time: iteratedTime,
            timeframe,
            dataset,
            data: dataset.data,
            dataModel: indicator.model,
            globals,
            computedState: computedState[renderingQueueId],
          },
          ...arguments
        );
      }.bind(this);
    }

    // Run the indicator function for this candle and get all results
    for (const timestamp of timestamps) {
      iteratedTime = timestamp;

      // If item exists at iterated time, delete it
      delete set.data[iteratedTime];

      let data = dataset.data[iteratedTime];
      if (data === undefined || data === null) continue;

      if (
        indicator.dependencies[0] === "value" &&
        indicator.model.model === "ohlc"
      ) {
        data = { value: data.close };
      }

      indicator.draw({
        ...data,
        ...funcWraps,
        math,
        times: {
          iteratedTime,
          timeframe,
        },
      });
    }
  },
};

function createComputedSet({ timeframe }) {
  return {
    data: {},
    timeframe,
    visibleMin: Infinity,
    visibleMax: -Infinity,
    visibleScaleMin: Infinity,
    visibleScaleMax: -Infinity,
    decimalPlaces: 0,
    maxLookback: 0,
    maxLookforward: 0,

    setDecimalPlaces(decimalPlaces) {
      this.decimalPlaces = decimalPlaces;
      // calcualteMaxDecimalPlaces();
    },

    addLookback(lookback) {
      if (lookback === 0) return;

      // If lookback is positive, means we are looking back and if greater than historical lookback
      if (lookback > 0 && lookback > this.maxLookback) {
        this.maxLookback = lookback;
      }
      // If lookback is negative, means we are looking forward and if less than historial lookforward
      if (lookback < 0 && lookback < -this.maxLookforward) {
        this.maxLookforward = -lookback;
      }
    },
  };
}
