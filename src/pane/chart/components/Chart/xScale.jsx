import dimensions from "../../local-state/dimensions";
import ViperCanvas from "./ViperCanvas";

import { createSimpleEmitter } from "@solid-primitives/event-bus"
import state from "../../state";

export default function xScale() {
  const [listen, emit] = createSimpleEmitter();

  listen((eventId, e) => {
    if (eventId === "onDoubleClick") onDoubleClick(e);
    if (eventId === "onDragToResize") onDragToResize(e);
  })

  function onDoubleClick(e) {
    state.chart.setInitialVisibleRange();
  }

  function onDragToResize({ movementX }) {
    if (movementX === 0) return;

    const m = movementX;
    const change = -(m > 0 ? -m * -10 : m * 10);
    state.chart.resizeXRange(change);
  }

  return (
    <div
      className="absolute cursor-ew-resize"
      style={{
        left: 0,
        top: `${dimensions.main.height.get()}px`,
        width: `${dimensions.xScale.width.get()}px`,
        height: `${dimensions.xScale.height.get()}px`,
      }}
    >
      <ViperCanvas emit={emit} {...dimensions.xScale} type="xScale" />
    </div>
  );
}
