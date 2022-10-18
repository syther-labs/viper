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
    const width = this.$chart.dimensions.width.get();
    const height = this.$chart.dimensions.height.get();
    const timeframe = this.$chart.state.timeframe.get();

    const viewport = { x: 0, y: 0, width, height };

    let i = 0;

    this.programs.background({ viewport });

    for (const setId in this.$chart.sets) {
      const set = this.$chart.sets[setId];

      // Get indicator
      const { layerId } = this.$chart.state.indicators.get()[setId].get();

      // Get layer
      const layer = this.$chart.state.ranges.y.get()[layerId].get();

      let { min, max } = layer.range;

      if (layer.scaleType === "normalized") {
        min = set.min;
        max = set.max;
      }

      const range5P = (max - min) * 0.05;
      min -= range5P;
      max += range5P;

      const { start, end } = this.$chart.state.ranges.x.get();
      console.log(start, end, min, max);
      const projection = mat4.ortho(mat4.create(), start, end, min, max, 0, -1);

      // Loop through all buffers
      for (const { type, buffer, length } of set.buffers) {
        switch (type) {
          case "line":
            this.programs.line({
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
