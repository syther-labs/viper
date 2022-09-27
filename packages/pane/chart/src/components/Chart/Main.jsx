import dimensions from "../../local-state/dimensions";
import ViperCanvas from "./ViperCanvas";

import { createSimpleEmitter } from "@solid-primitives/event-bus"
import state from "../../state";
import _ from "lodash";

export default function Main() {
  const [listen, emit] = createSimpleEmitter()

  const throttleSetVisibleRange = _.throttle(
    calculateNewVisibleRange,
    16
  )

  let change = { x: 0, y: 0 };
  let layerToMove;

  listen((eventId, e) => {
    if (eventId === "onWheel") onWheel(e);
    if (eventId === "onDragToResize") onDragToResize(e);
  })

  function onDragToResize({ movementX, movementY, layerY }) {
    if (!layerToMove) {
      layerToMove = state.chart.getLayerByYCoord(layerY);
    }

    change.x += movementX;
    change.y += movementY;

    throttleSetVisibleRange();
  }

  function onWheel(e) {
    e.preventDefault();
    let { deltaX, deltaY, offsetX, offsetY } = e;

    const width = dimensions.main.width.get();

    // If horizontal scroll, move range
    if (deltaX !== 0) {
      const ppe = state.pixelsPerElement.get();
      const timeframe = state.timeframe.get();

      const d = deltaX;
      const change =
        (d > 0 ? d * 100 : -d * -100) * (width / ppe) * (timeframe / 60000);

      let { start, end } = state.ranges.x.get();
      start += change;
      end += change;

      state.chart.setVisibleRange({ start, end });
    }

    // If vertical scroll
    else if (deltaY !== 0) {
      const layerId = state.chart.getLayerByYCoord(offsetY);
      const layer = state.ranges.y.get()[layerId].get();
      let { start, end } = state.ranges.x.get();
      let { min, max } = layer.range;

      // If zoom on Y axis
      if (
        e.ctrlKey ||
        e.shiftKey
      ) {
        layer.lockedYScale = false;
        const { top, height } = dimensions.main.layers.get()[layerId];

        const topP = (offsetY - top) / height;
        const bottomP = 1 - topP;
        const range = max - min;

        if (e.shiftKey) {
          deltaY = -deltaY;
        }

        if (deltaY < 0) {
          max -= (range * topP) / 10;
          min += (range * bottomP) / 10;
        } else {
          max += (range * topP) / 10;
          min -= (range * bottomP) / 10;
        }
      }

      if (!e.shiftKey) {
        const leftP = offsetX / width;
        const rightP = 1 - leftP;

        const range = end - start;

        if (deltaY > 0) {
          start -= (range * leftP) / 10;
          end += (range * rightP) / 10;
        } else {
          start += (range * leftP) / 10;
          end -= (range * rightP) / 10;
        }
      }

      state.chart.setVisibleRange({ start, end, min, max }, layerId);
    }
  }

  function calculateNewVisibleRange() {
    const { x, y } = change;
    change = { x: 0, y: 0 };

    const layers = dimensions.main.layers.get();

    let { start, end } = state.ranges.x.get();
    const layer = state.ranges.y.get()[layerToMove].get();
    if (!layer) return;
    let { min, max } = layer.range;

    // Get how many candles moved
    const candlesMoved = x / state.pixelsPerElement.get();
    const timeMoved = state.timeframe.get() * candlesMoved;

    start -= timeMoved;
    end -= timeMoved;

    if (!layer.lockedYScale) {
      const pixelsPerTick = layers[layerToMove].height / (max - min);
      const priceMoved = y / pixelsPerTick;
      min += priceMoved;
      max += priceMoved;
    }

    state.chart.setVisibleRange(
      { start, end, min, max },
      layerToMove
    );
  }

  return (
    <div
      className="absolute cursor-crosshair"
      style={{
        left: 0,
        top: 0,
        width: `${dimensions.main.width.get()}px`,
        height: `${dimensions.main.height.get()}px`,
      }}
    >
      <ViperCanvas emit={emit} {...dimensions.main} type="main" />
    </div>
  );
}
