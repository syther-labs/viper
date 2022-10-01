import ViperCanvas from "./ViperCanvas";

import { createSimpleEmitter } from "@solid-primitives/event-bus";
import _ from "lodash";

export default function Main({ $chart }) {
  const [listen, emit] = createSimpleEmitter();

  const throttleSetVisibleRange = _.throttle(calculateNewVisibleRange, 16);

  let change = { x: 0, y: 0 };
  let layerToMove;

  listen((eventId, e) => {
    if (eventId === "onWheel") onWheel(e);
    if (eventId === "onDragToResize") onDragToResize(e);
    if (eventId === "onDoubleClick") onDoubleClick(e);
  });

  function onDragToResize({ movementX, movementY, layerY }) {
    if (!layerToMove) {
      layerToMove = $chart.getLayerByYCoord(layerY);
    }

    change.x += movementX;
    change.y += movementY;

    throttleSetVisibleRange();
  }

  function onWheel(e) {
    e.preventDefault();
    let { deltaX, deltaY, offsetX, offsetY } = e;

    const width = $chart.dimensions.main.width.get();

    // If horizontal scroll, move range
    if (deltaX !== 0) {
      const ppe = $chart.pixelsPerElement.get();
      const timeframe = $chart.timeframe.get();

      const d = deltaX;
      const change =
        (d > 0 ? d * 100 : -d * -100) * (width / ppe) * (timeframe / 60000);

      let { start, end } = $chart.ranges.x.get();
      start += change;
      end += change;

      $chart.setVisibleRange({ start, end });
    }

    // If vertical scroll
    else if (deltaY !== 0) {
      const layerId = $chart.getLayerByYCoord(offsetY);
      const layer = $chart.ranges.y.get()[layerId].get();
      let { start, end } = $chart.ranges.x.get();
      let { min, max } = layer.range;

      // If zoom on Y axis
      if (e.ctrlKey || e.shiftKey) {
        layer.lockedYScale = false;
        const { top, height } = $chart.dimensions.main.layers.get()[layerId];

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

      $chart.setVisibleRange({ start, end, min, max }, layerId);
    }
  }

  function onDoubleClick({ clientY }) {
    const layerId = $chart.getLayerByYCoord(clientY);
    const layer = $chart.ranges.y.get()[layerId];
    layer.set(v => ({ ...v, fullscreen: !v.fullscreen }));
    updateLayers();
    $chart.workers.generateAllInstructions();
  }

  function calculateNewVisibleRange() {
    const { x, y } = change;
    change = { x: 0, y: 0 };

    const layers = $chart.dimensions.main.layers.get();

    let { start, end } = $chart.ranges.x.get();
    const layer = $chart.ranges.y.get()[layerToMove].get();
    if (!layer) return;
    let { min, max } = layer.range;

    // Get how many candles moved
    const candlesMoved = x / $chart.pixelsPerElement.get();
    const timeMoved = $chart.timeframe.get() * candlesMoved;

    start -= timeMoved;
    end -= timeMoved;

    if (!layer.lockedYScale) {
      const pixelsPerTick = layers[layerToMove].height / (max - min);
      const priceMoved = y / pixelsPerTick;
      min += priceMoved;
      max += priceMoved;
    }

    $chart.setVisibleRange({ start, end, min, max }, layerToMove);
  }

  return (
    <div
      className="absolute cursor-crosshair"
      style={{
        left: 0,
        top: 0,
        width: `${$chart.dimensions.main.width.get()}px`,
        height: `${$chart.dimensions.main.height.get()}px`,
      }}
    >
      <ViperCanvas
        emit={emit}
        {...$chart.dimensions.main}
        $chart={$chart}
        type="main"
      />
    </div>
  );
}
