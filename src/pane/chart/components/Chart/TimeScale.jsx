import { For } from "solid-js";
import utils from "../../utils";

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

  function onMouseDown(e) {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onDragToResize);
  }

  function onMouseUp(e) {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onDragToResize);
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
      onMouseDown={onMouseDown}
    >
      <div className="relative w-full h-full overflow-hidden select-none">
        <div>{$chart.scales.time.get()}</div>
        <div
          className="absolute px-2 text-z-3 text-xs text-center font-bold bg-z-9 whitespace-nowrap"
          style={{
            left: `${$chart.crosshair.get().time[0]}px`,
            transform: `translateX(-50%)`,
          }}
        >
          {CrosshairTime($chart.crosshair.get().time[1])}
        </div>
      </div>
    </div>
  );
}

function CrosshairTime(time) {
  const d = new Date(time);
  const { aZ } = utils;

  const day = d.getDate();
  const mo = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][d.getMonth()];
  const y = d.getFullYear();
  const h = aZ(d.getHours());
  const m = aZ(d.getMinutes());

  return `${day} ${mo} ${y} ${h}:${m}`;
}
