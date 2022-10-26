import utils from "../utils";
import constants from "../constants";
import Decimal from "decimal.js";
import helpers from "./helpers";

export function TimeScales(pixelsPerElement, timeframe, start, end, width) {
  const scales = [];

  const minPixels = 100;
  let xTimeStep = 0;

  for (let i = constants.TIMESCALES.indexOf(timeframe); i >= 0; i--) {
    // Check if this timeframe fits between max and min pixel boundaries
    const pixelsPerScale =
      pixelsPerElement * (constants.TIMESCALES[i] / timeframe);

    if (pixelsPerScale >= minPixels) {
      xTimeStep = constants.TIMESCALES[i];
      break;
    }
  }

  const getX = t => utils.getXCoordByTimestamp(start, end, width, t);

  for (let time = start - (start % xTimeStep); time < end; time += xTimeStep) {
    const d = new utils.DateWrapper(time);

    let text = "";
    if ((time / constants.DAY) % 1 === 0) {
      const date = d.value.getDate();
      if (date === 1) {
        text = `${constants.MONTHS[d.value.getMonth()].short}`;
      } else {
        text = `${date}`;
      }
    } else {
      const { aZ } = utils;

      // If less than 1min tf
      if (timeframe < 6e4) {
        text = `${aZ(d.m())}:${aZ(d.s())}`;
      }

      // If less than 1h tf
      else if (timeframe < 6e4 * 60) {
        text = `${aZ(d.h())}:${aZ(d.m())}`;
      }

      // If less than 1d tf
      else if (timeframe < 6e4 * 60 * 24) {
        text = `${aZ(d.h())}:${aZ(d.m())}`;
      }

      // Else
      else {
        text = `${aZ(d.d())}d:${aZ(d.h())}h`;
      }
    }

    scales.push([getX(time), text]);
  }

  return scales;
}

export function PriceScales(yRanges, dimensions, sets) {
  const scales = {};

  for (const id in yRanges) {
    const layer = yRanges[id].get();
    let { min, max } = layer.range;

    if (min === Infinity || max === -Infinity) continue;

    const { height } = dimensions.main.layers.get()[id];

    const range = new Decimal(max - min);
    const exp = new Decimal(+range.toExponential().split("e")[1]);
    let interval = new Decimal(10).pow(exp);

    const baseInterval = new Decimal(interval);
    let i = 1;
    const arr = [0.5, 0.25, 0.1, 0.05, 0.025, 0.001];
    while ((max - min) / interval < Math.floor(height / 50)) {
      if (!arr[i]) break;
      interval = baseInterval.times(arr[i]);
      i++;
    }

    min = new Decimal(min).minus(new Decimal(min).modulo(interval)).toNumber();
    max = new Decimal(max)
      .plus(interval.minus(new Decimal(max).modulo(interval)))
      .toNumber();

    const getY = v =>
      utils.getYCoordByPrice(layer.range.min, layer.range.max, height, v);

    scales[id] = {
      scales: [],
      yLabels: [],
    };

    // Generate all scales
    for (let i = 0; i < (max - min) / interval; i++) {
      const value = interval.times(i).add(min).toNumber();
      if (value < layer.range.min || value > layer.range.max) continue;

      scales[id].scales.push([
        getY(value),
        helpers.yScale.scales.scaleText(value, layer.scaleType),
      ]);
    }

    // Generate yLabel plots
    for (const [value, text, color] of layer.yLabels) {
      scales[id].yLabels.push([
        getY(value),
        helpers.yScale.plots.yScaleText(value, color, layer.scaleType),
        text,
        color,
      ]);
    }
  }

  return scales;
}
