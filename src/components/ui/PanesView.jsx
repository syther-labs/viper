import { Show } from "solid-js";
import { panes, createPane } from "../../stores/panes";
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
  const { top, left, width, height } = props.pos;

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
          onClick={[onNewPane, "l"]}
          class="absolute top-0 left-0 w-[2rem] h-full hover:bg-primary"
        />
        <div
          onClick={[onNewPane, "t"]}
          class="absolute top-0 left-0 w-full h-[2rem] hover:bg-primary"
        />
        <div
          onClick={[onNewPane, "r"]}
          class="absolute bottom-0 right-0 w-[2rem] h-full hover:bg-primary"
        />
        <div
          onClick={[onNewPane, "b"]}
          class="absolute bottom-0 right-0 w-full h-[2rem] hover:bg-primary"
        />
        <div className="w-full h-full flex items-center justify-center text-3xl">
          {props.id}
        </div>
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
