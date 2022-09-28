import { onMount } from "solid-js";
import { onCleanup } from "solid-js";
import { createSignal } from "solid-js";
import { v } from "../../api/api";
import global from "../../global";

/** @typedef {("none"|"drag"|"resize")} MovingState */

/**
 * Create a new moveable and resizable floating window
 * @param {Object} props
 */
export default function FloatingWindow(props) {
  const { title = "Untitled window" } = props;

  const pos = generateInitialWindowPosition();

  /** @type {MovingState} */
  let moving = "none";

  /** @param {MouseEvent} e */
  function onMouseUp(e) {
    moving = "none";
  }

  /** @param {MouseEvent} e */
  function onMouseMove(e) {
    const { movementX, movementY } = e;
    const { clientHeight, clientWidth } = global.element;

    if (moving === "drag") {
      const x = x => Math.min(Math.max(x, 0), clientWidth - pos.w.get());
      const y = y => Math.min(Math.max(y, 0), clientHeight - pos.h.get());

      pos.x.set(v => x(v + movementX));
      pos.y.set(v => y(v + movementY));
    } else if (moving === "resize") {
      pos.w.set(v => v + movementX);
      pos.h.set(v => v + movementY);
    }
  }

  /** @param {MovingState} newMoving */
  function setMoving(newMoving) {
    moving = newMoving;

    if (moving === "none") {
      window.removeEventListener("mousemove", onMouseMove);
    } else {
      window.addEventListener("mousemove", onMouseMove);
    }
  }

  onMount(() => {
    window.addEventListener("mouseup", onMouseUp);
  });

  onCleanup(() => {
    window.removeEventListener("mouseup", onMouseUp);
  });

  return (
    <div
      className="fixed bg-z-10 overflow-auto border-[1px] border-z-8 shadow-xl"
      style={{
        top: `${pos.y.get()}px`,
        left: `${pos.x.get()}px`,
        width: `${pos.w.get()}px`,
        height: `${pos.h.get()}px`,
      }}
    >
      <div className="flex items-center w-full h-12 select-none">
        <div onMouseDown={[setMoving, "drag"]} className="grow cursor-move p-3">
          <h1>{title}</h1>
        </div>
        <button className="text-xl h-12 w-12">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div
        onMouseDown={[setMoving, "resize"]}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
      ></div>
    </div>
  );
}

/**
 * Get initial position centered in an HTML element
 * @returns {FloatingWindowDimnsions}
 */
export function generateInitialWindowPosition() {
  // Get the width and height of the parent
  const { clientWidth: width, clientHeight: height } = global.element;

  // Make width and height half of respectively
  const w = Math.floor(width / 2);
  const h = Math.floor(height / 2);

  // Set x and y to half width and height - width / 2 and height / 2 to center the window on init by default
  const x = Math.floor(w / 2);
  const y = Math.floor(h / 2);

  return {
    x: v(x),
    y: v(y),
    w: v(w),
    h: v(h),
  };
}

/**
 * @typedef {Object} FloatingWindowDimnsions
 * @property {ReactiveNumber} x
 * @property {ReactiveNumber} y
 * @property {ReactiveNumber} w
 * @property {ReactiveNumber} h
 */
