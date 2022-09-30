import { onMount } from "solid-js";
import { Show } from "solid-js";
import Panes, { panes, createPane } from "../../stores/panes";
import { Button } from "../components";

export default function PanesView() {
  /** @type {HTMLElement} */
  let gridContainer;

  const keys = () => Object.keys(panes.get());

  onMount(() => {
    setTimeout(() => {
      Panes.init({ gridContainer });
    });
  });

  return (
    <>
      <div className="w-full h-full" ref={gridContainer}></div>

      <Show when={!keys().length}>
        <NoPanes />
      </Show>
    </>
  );
}

function NoPanes() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center justify-center">
        <h2 className="font-bold text-2xl mb-2">This layout has no panes</h2>
        <Button variant="primary-outline" size="md" onClick={[createPane]}>
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
