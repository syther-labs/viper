import { createMemo } from "solid-js";
import { v } from "../../api/api";

const state = {
  chart: {},

  config: {
    showTimeframes: v(true),
    timeframes: v([]),
  },

  name: v("Untitled chart"),
  timeframe: v(0),
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
};

export function initState({ chart }) {
  state.chart = chart;
}

export default state;
