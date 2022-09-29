import { onMount } from "solid-js";
import { onCleanup } from "solid-js";
import { Show } from "solid-js";
import global from "../../global";
import {
  panes,
  createPane,
  checkForOverlappingPanes,
} from "../../stores/panes";
import { Button } from "../components";

export default function PanesView() {
  const keys = () => Object.keys(panes.get());

  return (
    <>
      <Show when={!keys().length}>
        <NoPanes />
      </Show>
      <Show when={keys().length}>
        <div className="relative w-full h-full">
          <For each={keys()}>
            {id => <Pane {...panes.get()[id].get()} id={id} />}
          </For>
        </div>
      </Show>
    </>
  );
}

function Pane(props) {
  const { id } = props;
  const { top, left, width, height } = props.pos;

  /** @type {MovingState} */
  let moving = "none";

  /** @param {MouseEvent} e */
  function onMouseUp(e) {
    if (moving !== "none") setMoving("none");
  }

  /** @param {MouseEvent} e */
  function onMouseMove(e) {
    const { movementX: mx, movementY: my } = e;
    const { innerHeight: ch, innerWidth: cw } = window;

    // Get the percent change in width and height by comparing mouse movement to current rect bounds
    const hp = (my / ch) * 100;
    const wp = (mx / cw) * 100;

    if (moving === "drag") {
      const l = l => Math.min(Math.max(l, 0), 100 - width.get());
      const t = t => Math.min(Math.max(t, 0), 100 - height.get());

      left.set(v => l(v + wp));
      top.set(v => t(v + hp));
    } else if (moving === "resize") {
      const h = h => Math.max(h, 5);
      const w = w => Math.max(w, 5);

      width.set(v => w(v + wp));
      height.set(v => h(v + hp));
    }

    // Recalculate grid
    checkForOverlappingPanes(panes.get()[id]);
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
    window.removeEventListener("mousemove", onMouseMove);
  });

  /** @param {("l"|"t"|"r"|"b")} loc (l = left) */
  function onNewPane(loc) {
    let t = top.get();
    let l = left.get();
    let w = width.get();
    let h = height.get();

    if (loc === "l") {
      createPane(t, l, w / 2, h);
    } else if (loc === "t") {
      createPane(t, l, w, h / 2);
    } else if (loc === "r") {
      createPane(t, l + w / 2, w / 2, h);
    } else if (loc === "b") {
      createPane(t + h / 2, l, w, h / 2);
    }
  }

  return (
    <div
      className="absolute"
      style={{
        top: `${top.get()}%`,
        left: `${left.get()}%`,
        width: `${width.get()}%`,
        height: `${height.get()}%`,
        background: props.color,
      }}
    >
      <div className="h-full w-full relative">
        <div
          onMouseDown={[setMoving, "drag"]}
          className="absolute top-0 left-0 h-4 w-4 cursor-move"
        ></div>

        <div
          onClick={[onNewPane, "l"]}
          class="absolute top-[20%] left-0 w-[2rem] h-[60%] hover:bg-primary"
        />
        <div
          onClick={[onNewPane, "t"]}
          class="absolute top-0 left-[20%] w-[60%] h-[2rem] hover:bg-primary"
        />
        <div
          onClick={[onNewPane, "r"]}
          class="absolute bottom-[20%] right-0 w-[2rem] h-[60%] hover:bg-primary"
        />
        <div
          onClick={[onNewPane, "b"]}
          class="absolute bottom-0 right-[20%] w-[60%] h-[2rem] hover:bg-primary"
        />
        <div className="w-full h-full flex items-center justify-center text-3xl">
          {props.id}
        </div>

        <div
          onMouseDown={[setMoving, "resize"]}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        ></div>
      </div>
    </div>
  );
}

function NoPanes() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center justify-center">
        <h2 className="font-bold text-2xl mb-2">This layout has no panes</h2>
        <Button
          variant="primary-outline"
          size="md"
          onClick={() => createPane(0, 0, 100, 100)}
        >
          Add a pane
          <span className="inline-block opacity-75 text-xs ml-2">
            <div className="flex items-center">
              <i class="ri-command-line"></i> + A
            </div>
          </span>
        </Button>
      </div>
    </div>
  );
}
