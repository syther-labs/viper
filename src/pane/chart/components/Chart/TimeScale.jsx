import { For } from "solid-js";

export default function TimeScale({ $chart }) {
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
      className="absolute cursor-ew-resize border-t-1 border-r-1 border-z-8"
      style={{
        left: 0,
        top: `${$chart.dimensions.main.height.get()}px`,
        width: `${$chart.dimensions.xScale.width.get()}px`,
        height: `${$chart.dimensions.xScale.height.get()}px`,
        background: "rgba(10,10,10,1)",
      }}
      context-menu-id="xScale"
      on:dblclick={onDoubleClick}
      onDragToResize={onDragToResize}
    >
      <div className="relative w-full h-full overflow-hidden">
        <For each={$chart.scales.time.get()}>
          {([left, text]) => <RenderTime {...{ left, text }} />}
        </For>
      </div>
    </div>
  );
}

function RenderTime({ left, text }) {
  return (
    <div
      className="text-z-2 text-xs text-center absolute"
      style={{ left: `${left}px` }}
    >
      {text}
    </div>
  );
}
