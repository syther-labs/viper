import { Index } from "solid-js";

export default function PriceScale({ $chart }) {
  let layerToMove;

  function onDoubleClick(e) {
    const layerId = $chart.getLayerByYCoord(e.clientY);
    const layer = $chart.state.ranges.y.get()[layerId];

    if (!layer.get().lockedYScale) {
      layer.set(v => ({ ...v, lockedYScale: true }));
      $chart.setVisibleRange({});
    }
  }

  function onMouseDown(e) {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onDragToResize);
  }

  function onMouseUp(e) {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onDragToResize);
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

  // Make a unique container for each layer and render the scales for each

  return (
    <div
      className="absolute cursor-ns-resize border-l-1 border-b-1 border-z-8"
      style={{
        left: `${$chart.dimensions.main.width.get()}px`,
        top: 0,
        width: `${$chart.dimensions.yScale.width.get()}px`,
        height: `${$chart.dimensions.yScale.height.get()}px`,
        background: "rgba(10,10,10,1)",
      }}
      context-menu-id="yScale"
      on:dblclick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      <For each={Object.keys($chart.scales.price.get())}>
        {layerId => <RenderLayer {...{ $chart, layerId }} />}
      </For>
    </div>
  );
}

function RenderLayer({ $chart, layerId }) {
  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        height: `${$chart.dimensions.main.layers.get()[layerId].height}px`,
      }}
    >
      {$chart.scales.price.get()[layerId]}
    </div>
  );
}
