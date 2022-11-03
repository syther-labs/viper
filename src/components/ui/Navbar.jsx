import { Show } from "solid-js";
import { actions } from "../../stores/ui";
import Action from "./Action";
import { activePane, createPane, gridEdit } from "../../stores/panes";
import Chart from "../../pane/chart";
import Timeframes from "../../pane/chart/ui/Actions";

export default function Navbar() {
  return (
    <nav className="flex items-center w-full h-12 border-z-8 border-b-1 overflow-x-auto">
      <div className="border-z-8 border-r-1 shrink-0">
        {Action({
          type: "link",
          link: "https://vipercharts.com",
          imageUrl: "/images/logos/viper-xs.webp",
        })}
      </div>

      {/* Pane defined actions */}
      <div className="border-z-8 border-r-1 h-full overflow-y-hidden shrink-0">
        {/* <Show
          when={actions.length}
          fallback={Action({
            type: "button",
            disabled: true,
            text: "This pane has no actions",
          })}
        >
          <For each={actions}>{Action}</For>
        </Show> */}
        <Show when={activePane()?.get().type === "chart"}>
          <Timeframes />
        </Show>
      </div>

      <div className="grow"></div>

      <div className="flex items-center border-z-8 border-l-1 h-full shrink-0">
        {Action({
          type: "button",
          onClick: () => gridEdit.set(!gridEdit.get()),
          text: gridEdit.get() ? "Lock grid" : "Unlock grid",
          disabled: true,
        })}
        <button
          disabled
          onClick={[createPane, Chart]}
          className="bg-primary h-12 w-12"
        >
          <i class="ri-add-line text-xl"></i>
        </button>
      </div>
    </nav>
  );
}
