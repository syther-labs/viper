import utils from "../utils";
import constants from "../constants";

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
