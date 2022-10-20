import { mat4 } from "gl-matrix";
import { uniqueId } from "lodash";
import {
  BackgroundProgram,
  CandleBodyProgram,
  CandleStickProgram,
  LineProgram,
} from "./gl-programs.js";

// TODO TEMP
const datastore = {
  colors: new Array(200)
    .fill()
    .map(() => [Math.random(), Math.random(), Math.random(), 1]),
};

/**
 * Handles render queue and layers including order
 */
export default class RenderingEngine {
  constructor({ $chart }) {
    this.$chart = $chart;

    const { regl } = $chart;

    this.programs = {
      line: LineProgram(regl),
      background: BackgroundProgram(regl),
      candlestick: CandleStickProgram(regl),
      candlebody: CandleBodyProgram(regl),
    };

    requestAnimationFrame(this.recursiveDraw.bind(this));
  }

  recursiveDraw() {
    this.draw();
    requestAnimationFrame(this.recursiveDraw.bind(this));
  }

  /**
   * Run draw canvas regardless of requesting animation frame or anything.
   * This can be used for when user interacts with the window like resizing
   */
  draw() {
    const width = this.$chart.dimensions.main.width.get();
    const mainHeight = this.$chart.dimensions.main.height.get();
    const timeframe = this.$chart.state.timeframe.get();

    let i = 0;

    this.programs.background();

    // Loop through each layer
    for (const layer of Object.values(this.$chart.state.ranges.y.get())) {
      const { id, scaleType, range, indicatorIds } = layer.get();
      const { top, height } = this.$chart.dimensions.main.layers.get()[id];

      const viewport = { x: 0, y: mainHeight - (top + height), width, height };

      for (const setId of indicatorIds) {
        const set = this.$chart.sets[setId];

        let { min, max } = range;

        if (scaleType === "normalized") {
          min = set.min;
          max = set.max;
        }

        const range5P = (max - min) * 0.05;
        min -= range5P;
        max += range5P;

        const { start, end } = this.$chart.state.ranges.x.get();
        const projection = mat4.ortho(
          mat4.create(),
          start,
          end,
          min,
          max,
          0,
          -1
        );

        // Loop through all buffers
        for (const id in set.buffers.data) {
          const { config, buffer, length } = set.buffers.data[id];

          switch (config.type) {
            case "line":
              this.programs.line({
                times: set.buffers.times,
                points: buffer,
                width: (max - min) / 500,
                color: datastore.colors[i],
                projection,
                viewport,
                segments: length / 2 - 2,
              });
              break;
            case "candle":
              this.programs.candlestick({
                points: buffer,
                color: datastore.colors[i],
                projection,
                viewport,
                timeframe,
                segments: length / 5,
              });
              this.programs.candlebody({
                points: buffer,
                color: datastore.colors[i],
                projection,
                viewport,
                timeframe,
                segments: length / 5,
              });
              break;
          }
        }

        i++;
      }
    }
  }

  addSet(type, name) {
    const id = uniqueId();

    sets[id] = {
      id,
      type,
      name,
      max: -Infinity,
      min: Infinity,
      length: 0,
      buffer: regl.buffer([]),
    };

    return sets[id];
  }

  removeSet(id) {
    delete this.sets[id];
  }
}
