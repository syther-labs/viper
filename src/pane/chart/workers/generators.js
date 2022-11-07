import utils from "../utils";
import constants from "../constants";
import Decimal from "decimal.js";
import helpers from "./helpers";

export function TimeScales(pixelsPerElement, timeframe, start, end, width) {
  const scales = document.createElement("div");

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

    const scale = document.createElement("div");
    scale.classList = "text-z-5 text-xxs text-center absolute";
    scale.style.left = `${getX(time)}px`;
    scale.innerText = text;

    scales.appendChild(scale);
  }

  return scales;
}

export function PriceScales(yRanges, dimensions, sets, yLabels) {
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

    scales[id] = document.createElement("div");

    // Generate all scales
    for (let i = 0; i < (max - min) / interval; i++) {
      const value = interval.times(i).add(min).toNumber();
      if (value < layer.range.min || value > layer.range.max) continue;

      const scale = document.createElement("div");
      scale.classList = "text-z-5 text-xxs text-center absolute w-full";
      scale.style.top = `${getY(value)}px`;
      scale.innerText = helpers.yScale.scales.scaleText(value, layer.scaleType);

      scales[id].appendChild(scale);
    }

    // Generate yLabel plots
    for (let [value, dataset, color, set] of yLabels[id]) {
      color = `rgba(${color[0] * 255},${color[1] * 255},${color[2] * 255}, ${
        color[3] * 255
      })`;

      let yScaleText = helpers.yScale.plots.yScaleText(
        value,
        color,
        layer.scaleType
      );

      if (layer.scaleType === 2) {
        value = ((value - set.min) / (set.max - set.min)) * 100;
      }

      const top = `${getY(value)}px`;

      const mainLabel = document.createElement("div");
      mainLabel.classList = "text-z-5 text-xxs p-1 text-center absolute";
      mainLabel.style.top = top;
      mainLabel.style.right = "100%";
      mainLabel.style.background = color;
      mainLabel.style.color = yScaleText[1];
      // <span class="text-xxs leading-0">${dataset.source}</span>
      mainLabel.innerHTML = `
        <span class="text-xxs font-bold">${dataset.name}</span>
      `;
      scales[id].appendChild(mainLabel);

      const yLabel = document.createElement("div");
      yLabel.classList = "text-z-5 text-xxs p-1 text-center absolute w-full";
      yLabel.style.top = top;
      yLabel.style.background = color;
      yLabel.style.color = yScaleText[1];
      yLabel.innerText = yScaleText[0];

      scales[id].appendChild(yLabel);
    }
  }

  return scales;
}
