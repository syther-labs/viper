import dimensions from "../../local-state/dimensions";
import ViperCanvas from "./ViperCanvas";

import { createSimpleEmitter } from "@solid-primitives/event-bus";
import state from "../../state";

export default function yScale() {
  const [listen, emit] = createSimpleEmitter();

  let layerToMove;

  listen((eventId, e) => {``
    if (eventId === "onDoubleClick") onDoubleClick(e);
    if (eventId === "onDragToResize") onDragToResize(e);
  })

  function onDoubleClick(e) {
    const layerId = state.chart.getLayerByYCoord(e.clientY);
    const layer = state.ranges.y.get()[layerId];

    if (!layer.get().lockedYScale) {
      layer.set(v => ({ ...v,lockedYScale: true }))
      state.chart.setVisibleRange({});
    }
  }

  function onDragToResize({ movementY, layerY }) {
    if (movementY === 0) return;

    if (!layerToMove) {
      layerToMove = state.chart.getLayerByYCoord(layerY);
    }

    let { min, max } = state.ranges.y.get()[layerToMove].get().range;
    const delta = max - min;
    const delta10P = delta * 0.01;
    const change = -movementY * delta10P;
    min += change;
    max -= change;
    state.ranges.y.get()[layerToMove].set(v => ({ ...v, lockedYScale: false }))
    chart.setVisibleRange({ min, max }, layerToMove);
  }

  return (
    <div
      className="absolute cursor-ns-resize"
      style={{
        left: `${dimensions.main.width.get()}px`,
        top: 0,
        width: `${dimensions.yScale.width.get()}px`,
        height: `${dimensions.yScale.height.get()}px`,
      }}
    >
      <ViperCanvas emit={emit} {...dimensions.yScale} type="yScale" />
    </div>
  );
}
