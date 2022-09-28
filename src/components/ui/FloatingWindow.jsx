import { onMount, onCleanup, children } from "solid-js";
import { v } from "../../api/api";
import global from "../../global";
import { windows } from "../../stores/ui";

/** @typedef {("none"|"drag"|"resize")} MovingState */

/**
 * Create a new moveable and resizable floating window
 * @param {Object} props
 * @param {import("solid-js").JSXElement} props.children
 * @param {string} props.title The window title
 * @param {import("../../stores/ui").FloatingWindowDimensions} props.pos State for window position
 * @param {number} props.index The index of the window state in the ui/windows store
 */
export default function FloatingWindow(props) {
  const {
    children,
    title = "Untitled window",
    pos = generateInitialWindowPosition(),
    index,
  } = props;

  /** @type {MovingState} */
  let moving = "none";

  /** @param {MouseEvent} e */
  function onMouseUp(e) {
    if (moving !== "none") setMoving("none");
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
      const h = h => Math.max(h, 200);
      const w = w => Math.max(w, 200);

      pos.w.set(v => w(v + movementX));
      pos.h.set(v => h(v + movementY));
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

  /** Close this floating window */
  function close() {
    windows.set(v => {
      v.splice(index, 1);
      return [...v];
    });
  }

  onMount(() => {
    window.addEventListener("mouseup", onMouseUp);
  });

  onCleanup(() => {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onMouseMove);
  });

  return (
    <div
      className="fixed flex flex-col bg-z-10 border-[1px] border-z-8 shadow-xl"
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
        <button onClick={close} className="text-xl h-12 w-12">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div className="grow overflow-auto">{children}</div>

      <div
        onMouseDown={[setMoving, "resize"]}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
      ></div>
    </div>
  );
}

/**
 * Get initial position centered in an HTML element
 * @param {number|undefined} h Initial window height
 * @param {number|undefined} w Initial window width
 * @returns {import("../../stores/ui").FloatingWindowDimensions}
 */
export function generateInitialWindowPosition(h, w) {
  // Get the width and height of the parent
  const { clientWidth: width, clientHeight: height } = global.element;

  // Make width and height half of respectively
  w = w !== undefined ? w : Math.floor(width / 2);
  h = h !== undefined ? h : Math.floor(height / 2);

  // Set x and y to half width and height - width / 2 and height / 2 to center the window on init by default
  const x = Math.floor(width / 2 - w / 2);
  const y = Math.floor(height / 2 - h / 2);

  return {
    x: v(x),
    y: v(y),
    w: v(w),
    h: v(h),
  };
}
