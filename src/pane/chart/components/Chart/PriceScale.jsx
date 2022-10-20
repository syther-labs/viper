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
      onDragToResize={onDragToResize}
    />
  );
}
