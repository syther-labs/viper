import { v } from "../../../api/api";
import _ from "lodash";

const defaults = {
  xScaleHeight: 20,
  yScaleWidth: 50,
};

export default ({ $chart }) => ({
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

  setDimensions(width, height) {
    this.height.set(height);
    this.width.set(width);

    this.main.height.set(height - this.xScale.height.get());
    this.main.width.set(width - this.yScale.width.get());

    this.xScale.width.set(width - this.yScale.width.get());
    this.yScale.height.set(height - this.xScale.height.get());

    // TODO update chart layers
    this.updateLayers();
  },

  /**
   * Update the computed pixel height and positioning of chart layers
   */
  updateLayers() {
    const y = $chart.ranges.y.get();

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
          ? this.main.height.get() * (layer.heightUnit / total)
          : 0;

        layers[id].top = top;
        layers[id].height = height;

        top += layers[id].height;
      }
    } else {
      layers[fullscreenId].height = this.main.height.get();
    }

    this.main.layers.set(layers);
  },
});
