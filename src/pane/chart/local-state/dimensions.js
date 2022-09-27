import state from "../state";
import { v } from "../../../api/api";
import _ from "lodash";

const defaults = {
  xScaleHeight: 20,
  yScaleWidth: 50,
};

const dimensions = {
  height: v(0),
  width: v(0),
  main: {
    height: v(0),
    width: v(0),
    layers: v({}),
  },
  xScale: {
    height: v(defaults.xScaleHeight),
    width: v(0),
  },
  yScale: {
    height: v(0),
    width: v(defaults.yScaleWidth),
  },
};

export const setDimensions = _.throttle((width, height) => {
  dimensions.height.set(height);
  dimensions.width.set(width);

  dimensions.main.height.set(height - dimensions.xScale.height.get());
  dimensions.main.width.set(width - dimensions.yScale.width.get());

  dimensions.xScale.width.set(width - dimensions.yScale.width.get());
  dimensions.yScale.height.set(height - dimensions.xScale.height.get());

  // TODO update chart layers
  updateLayers();
}, 100);

/**
 * Update the computed pixel height and positioning of chart layers
 */
export function updateLayers() {
  const y = state.ranges.y.get();

  const ids = Object.keys(y);
  if (!ids.length) return;

  let top = 0;
  let total = 0;
  let fullscreenId = "";
  const layers = {};

  for (const id of ids) {
    const layer = y[id].get();
    layers[id] = { top: 0, height: 0 };

    if (layer.fullscreen) {
      fullscreenId = id;
    }

    if (layer.visible) {
      total += layer.heightUnit;
    }
  }

  if (!fullscreenId.length) {
    for (const id of ids) {
      const layer = y[id].get();

      const height = layer.visible
        ? dimensions.main.height.get() * (layer.heightUnit / total)
        : 0;

      layers[id].top = top;
      layers[id].height = height;

      top += layers[id].height;
    }
  } else {
    layers[fullscreenId].height = dimensions.main.height.get();
  }

  dimensions.main.layers.set(layers);
}

export default dimensions;
