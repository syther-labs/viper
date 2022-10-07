import ViperCanvas from "./ViperCanvas";

import { createSimpleEmitter } from "@solid-primitives/event-bus";

export default function yScale({ $chart }) {
  const [listen, emit] = createSimpleEmitter();

  let layerToMove;

  listen((eventId, e) => {
    if (eventId === "onDoubleClick") onDoubleClick(e);
    if (eventId === "onDragToResize") onDragToResize(e);
  });

  function onDoubleClick(e) {
    const layerId = $chart.getLayerByYCoord(e.clientY);
    const layer = $chart.state.ranges.y.get()[layerId];

    if (!layer.get().lockedYScale) {
      layer.set(v => ({ ...v, lockedYScale: true }));
      $chart.setVisibleRange({});
    }
  }

  function onDragToResize({ movementY, layerY }) {
    if (movementY === 0) return;

    if (!layerToMove) {
      layerToMove = $chart.getLayerByYCoord(layerY);
    }

    let { min, max } = $chart.state.ranges.y.get()[layerToMove].get().range;
    const delta = max - min;
    const delta10P = delta * 0.01;
    const change = -movementY * delta10P;
    min += change;
    max -= change;

    const layer = $chart.state.ranges.y.get()[layerToMove];
    layer.set(v => ({ ...v, lockedYScale: false }));

    $chart.setVisibleRange({ min, max }, layerToMove);
  }

  return (
    <div
      className="absolute cursor-ns-resize"
      style={{
        left: `${$chart.dimensions.main.width.get()}px`,
        top: 0,
        width: `${$chart.dimensions.yScale.width.get()}px`,
        height: `${$chart.dimensions.yScale.height.get()}px`,
      }}
      context-menu-id="yScale"
    >
      <ViperCanvas
        emit={emit}
        {...$chart.dimensions.yScale}
        $chart={$chart}
        type="yScale"
      />
    </div>
  );
}
