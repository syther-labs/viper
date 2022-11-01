import Calculations from "./calculations.js";
import utils from "../utils.js";

export default {
  yScale: {
    plots: {
      // plotValue(set, type, series, timestamps, scaleType) {
      //   let value = series[{ line: 0, candle: 3 }[type]];
      //   if (scaleType === 1) {
      //     const first = Calculations.getFirstValue(set, timestamps);
      //     value = (((value - first) / Math.abs(first)) * 100).toFixed(2);
      //   } else if (scaleType === 2) {
      //     value = Utils.toFixed(
      //       ((value - set.visibleMin) / (set.visibleMax - set.visibleMin)) *
      //         100,
      //       2
      //     );
      //   }
      //   return value;
      // },
      yScaleText(value, color, scaleType) {
        let text = `${value}`;
        if (scaleType === 1) {
          const a = value >= 0 ? "+" : "";
          text = `${a}${value}%`;
        } else if (scaleType === 2) {
          text = `${value}`;
        }
        return [text, "#FFF"];
      },
    },

    scales: {
      scaleText(value, scaleType) {
        if (scaleType === 1) {
          const a = value >= 0 ? "+" : "";
          return `${a}${value}%`;
        }
        return `${value}`;
      },
    },
  },
};
