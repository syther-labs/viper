import ViperCanvas from "./ViperCanvas";

import { createSimpleEmitter } from "@solid-primitives/event-bus";

export default function xScale({ $chart }) {
  const [listen, emit] = createSimpleEmitter();

  listen((eventId, e) => {
    if (eventId === "onDoubleClick") onDoubleClick(e);
    if (eventId === "onDragToResize") onDragToResize(e);
  });

  function onDoubleClick(e) {
    $chart.setInitialVisibleRange();
  }

  function onDragToResize({ movementX }) {
    if (movementX === 0) return;

    const m = movementX;
    const change = -(m > 0 ? -m * -10 : m * 10);
    $chart.resizeXRange(change);
  }

  return (
    <div
      className="absolute cursor-ew-resize"
      style={{
        left: 0,
        top: `${$chart.dimensions.main.height.get()}px`,
        width: `${$chart.dimensions.xScale.width.get()}px`,
        height: `${$chart.dimensions.xScale.height.get()}px`,
      }}
    >
      <ViperCanvas
        emit={emit}
        {...$chart.dimensions.xScale}
        $chart={$chart}
        type="xScale"
      />
    </div>
  );
}
