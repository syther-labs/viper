import { throttle } from "lodash";
import REGL from "regl";
import { onCleanup } from "solid-js";
import { onMount } from "solid-js";
import RenderingEngine from "../../lib/rendering-engine";
import utils from "../../utils";

export default function ViperCanvas(props) {
  const { $chart, type, height, width } = props;

  let canvasEl;
  let RE;

  let change = { x: 0, y: 0 };
  let layerToMove = undefined;

  const throttleSetVisibleRange = throttle(() => {
    const layers = $chart.dimensions.main.layers.get();

    let { start, end } = $chart.state.ranges.x.get();
    const layer = $chart.state.ranges.y.get()[layerToMove].get();
    if (!layer) return;
    let { min, max } = layer.range;

    // Get how many candles moved
    const candlesMoved = change.x / $chart.state.pixelsPerElement.get();
    const timeMoved = $chart.state.timeframe.get() * candlesMoved;

    start -= timeMoved;
    end -= timeMoved;

    if (!layer.lockedYScale) {
      const pixelsPerTick = layers[layerToMove].height / (max - min);
      const priceMoved = y / pixelsPerTick;
      min += priceMoved;
      max += priceMoved;
    }

    $chart.setVisibleRange({ start, end, min, max }, layerToMove);
    change = { x: 0, y: 0 };
  }, 50);

  function onMouseDown(e) {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onDragToResize);
  }

  function onMouseUp(e) {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onDragToResize);
  }

  function onDragToResize(e) {
    const { movementX: x, movementY: y, layerY } = e;

    if (layerToMove === undefined) {
      layerToMove = $chart.getLayerByYCoord(layerY);
    }

    change.x += x;
    change.y += y;

    throttleSetVisibleRange();
  }

  function onWheel(e) {
    e.preventDefault();
    let { deltaX, deltaY, offsetX, offsetY } = e;

    const width = $chart.dimensions.main.width.get();

    // If horizontal scroll, move range
    if (deltaX !== 0) {
      const ppe = $chart.state.pixelsPerElement.get();
      const timeframe = $chart.state.timeframe.get();

      const d = deltaX;
      const change =
        (d > 0 ? d * 100 : -d * -100) * (width / ppe) * (timeframe / 60000);

      let { start, end } = $chart.state.ranges.x.get();
      start += change;
      end += change;

      $chart.setVisibleRange({ start, end });
    }

    // If vertical scroll
    else if (deltaY !== 0) {
      const layerId = $chart.getLayerByYCoord(offsetY);
      const layer = $chart.state.ranges.y.get()[layerId].get();
      let { start, end } = $chart.state.ranges.x.get();
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

  function onDoubleClick(e) {
    const layerId = $chart.getLayerByYCoord(clientY);
    const layer = $chart.state.ranges.y.get()[layerId];
    layer.set(v => ({ ...v, fullscreen: !v.fullscreen }));
    $chart.dimensions.updateLayers();
  }

  onMount(() => {
    // Initialize regl (webgl lib wrapper)
    $chart.regl = REGL({
      canvas: canvasEl,
      attributes: { antialias: true },
      extensions: ["ANGLE_instanced_arrays"],
    });

    RE = new RenderingEngine({ $chart });

    $chart.setInitialVisibleRange();
  });

  onCleanup(() => {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onDragToResize);
  });

  return (
    <canvas
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      on:dblclick={onDoubleClick}
      ref={canvasEl}
      height={$chart.dimensions.height.get()}
      width={$chart.dimensions.width.get()}
      className="w-full h-full"
    />
  );
}
