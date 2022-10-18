import plot_types from "../../data/plot_types";
import utils from "../../utils";

import math from "../../viper-script/math";
import ScriptFunctions from "../../viper-script/script-functions";

import Instructions from "../../local-state/Instructions";
import Calculations from "../calculations";
import Generators from "../generators";

const queue = new Map();
const sets = {};
const computedState = {};
let instructions = Instructions;

self.addEventListener("message", async e => {
  const { id, method = "", params = {} } = e.data;

  postMessage({
    id,
    data: await methods[method](params),
  });
});

const methods = {
  addToQueue({ indicator }) {
    queue.set(indicator.setId, indicator);
  },

  setIndicatorVisibility({ setId, visible }) {
    const indicator = queue.get(setId);
    indicator.visible = visible;
    queue.set(setId, indicator);

    if (!indicator.visible) {
      delete instructions.main.values[setId];
      delete instructions.main.plots[setId];
      delete instructions.yScale.plots[setId];
      postMessage({
        id: "updateInstructions",
        data: { instructions },
      });
    }
  },

  removeFromQueue({ setId }) {
    queue.delete(setId);
    this.emptySet({ setId });
  },

  emptySet({ setId }) {
    // Delete set info
    delete sets[setId];
    delete computedState[setId];

    // Re calculate max decimal places when sets have changed
    // this.calculateMaxDecimalPlaces();
  },

  emptyAllSets() {
    for (const setId in sets) {
      this.emptySet({ setId });
    }
  },

  calculateOneSet({ setId, timestamps, dataset, dataModel }) {
    const { timeframe } = dataset;

    const indicator = queue.get(setId);
    indicator.draw = plot_types.getIndicatorById(indicator.id).draw;

    indicator.dataset = dataset;
    indicator.model = dataModel;

    // If indicator is set to not visible, don't calculate data
    if (!indicator.visible) return;

    if (!sets[setId]) {
      sets[setId] = createComputedSet({
        timeframe,
      });
    }

    const set = sets[setId];

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
      if (values.series.filter(e => isNaN(e) || typeof e !== "number").length) {
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

      sets[setId] = set;
    };

    if (!computedState[setId]) {
      computedState[setId] = {};
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
            computedState: computedState[setId],
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

    postMessage({
      id: "updateSet",
      data: {
        setId,
        data: set.data,
      },
    });
  },

  generateAllInstructions({
    requestedRanges,
    timeframe,
    chartDimensions,
    pixelsPerElement,
  }) {
    // Calculate max and min of all plotted sets
    const timestamps = utils.getAllTimestampsIn(
      requestedRanges.x.start,
      requestedRanges.x.end,
      timeframe
    );

    const layerMinsAndMaxs = {};
    for (const layerId in requestedRanges.y) {
      layerMinsAndMaxs[layerId] = {
        min: Infinity,
        max: -Infinity,
      };
    }

    // Calculate min and max of all sets in visible range that are visible
    for (const id in sets) {
      // Check if indicator is visible
      const indicator = queue.get(id);

      if (!indicator.visible) continue;

      let [setMin, setMax] = Calculations.getMinAndMax(sets[id], timestamps);

      let scaleMin = setMin;
      let scaleMax = setMax;

      const layer = requestedRanges.y[indicator.layerId];

      // If percentage chart, calculate scale based on first plotted value
      if (layer.scaleType === "percent") {
        const first = Calculations.getFirstValue(sets[id], timestamps);
        scaleMin = ((setMin - first) / Math.abs(first)) * 100;
        scaleMax = ((setMax - first) / Math.abs(first)) * 100;
      }

      // If normalizes chart, calcualte based on 0-100 range
      if (layer.scaleType === "normalized") {
        scaleMin = 0;
        scaleMax = 100;
      }

      // If min and max are equal, add +1 and -1 boundary to it so line data will render
      if (scaleMin === scaleMax) {
        scaleMin -= 1;
        scaleMax += 1;
        setMin -= 1;
        setMax += 1;
      }

      sets[id].visibleMin = setMin;
      sets[id].visibleMax = setMax;
      sets[id].visibleScaleMin = scaleMin;
      sets[id].visibleScaleMax = scaleMax;

      if (!layerMinsAndMaxs[indicator.layerId]) {
        layerMinsAndMaxs[indicator.layerId] = {
          min: Infinity,
          max: -Infinity,
        };
      }

      if (scaleMin < layerMinsAndMaxs[indicator.layerId].min) {
        layerMinsAndMaxs[indicator.layerId].min = scaleMin;
      }
      if (scaleMax > layerMinsAndMaxs[indicator.layerId].max) {
        layerMinsAndMaxs[indicator.layerId].max = scaleMax;
      }
    }

    const visibleRanges = {
      x: {
        start: requestedRanges.x.start,
        end: requestedRanges.x.end,
      },
      y: {},
    };

    // Calculate the visible range based on chart settings.
    for (const layerId in layerMinsAndMaxs) {
      const { y } = Calculations.getVisibleRange.bind(this)(
        {
          x: requestedRanges.x,
          y: requestedRanges.y[layerId],
        },
        layerMinsAndMaxs[layerId].min,
        layerMinsAndMaxs[layerId].max
      );
      visibleRanges.y[layerId] = {
        min: y.range.min,
        max: y.range.max,
      };
    }

    const { start, end } = visibleRanges.x;

    pixelsPerElement = Calculations.calculatePixelsPerElement(
      start,
      end,
      timeframe,
      chartDimensions.main.width
    );

    // Build fresh instructions struct
    const instructions = Instructions;

    // Get array of x coords for each timestamp on x axis
    const timestampXCoords = timestamps.map(time =>
      utils.getXCoordByTimestamp(start, end, chartDimensions.main.width, time)
    );

    // Loop through all sets and generate main and yScale instructions for plots
    for (const id in sets) {
      const set = sets[id];
      const indicator = queue.get(id);

      // If indicator is not visible, dont generate instrutions
      if (!indicator.visible) continue;

      const { scaleType } = requestedRanges.y[indicator.layerId];

      // Generate main instructions for set depending on scale type
      instructions.main.values[id] = {
        layerId: indicator.layerId,
        values: Generators.main.values(
          set,
          timestamps,
          indicator,
          timestampXCoords,
          pixelsPerElement,
          visibleRanges.y[indicator.layerId],
          chartDimensions
        ),
      };

      const [yScale, main] = Generators.yScale.plots(
        set,
        timestamps,
        indicator,
        chartDimensions,
        visibleRanges.y[indicator.layerId],
        scaleType
      );

      instructions.yScale.plots[id] = {
        layerId: indicator.layerId,
        values: yScale,
      };
      instructions.main.plots[id] = {
        layerId: indicator.layerId,
        values: main,
      };
    }

    // Calculate x and y scales
    instructions.yScale.scales = Generators.yScale.scales(
      visibleRanges.y,
      chartDimensions,
      requestedRanges.y
    );
    instructions.xScale.scales = Generators.xScale.scales(
      pixelsPerElement,
      timeframe,
      visibleRanges.x,
      chartDimensions
    );

    return {
      instructions,
      visibleRanges,
      pixelsPerElement,
      maxDecimalPlaces: 0,
    };
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
