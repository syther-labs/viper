import { For } from "solid-js";
import { actions } from "./stores/ui";

import Action from "./components/ui/Action";
import { Show } from "solid-js";
import AddPaneButton from "./components/ui/AddPaneButton";
import { panes } from "./stores/panes";
import PanesView from "./components/ui/PanesView";
import FloatingWindow from "./components/ui/FloatingWindow";

export default function App() {
  return (
    <div className="flex flex-col w-full h-full bg-z-10 text-z-1 relative">
      <nav className="flex items-center w-full h-12 border-z-8 border-b-1">
        <div className="border-z-8 border-r-1">
          {Action({
            type: "link",
            link: "https://vipercharts.com",
            imageUrl: "/assets/images/logos/viper-xs.webp",
          })}
        </div>

        {/* Pane defined actions */}
        <div className="border-z-8 border-r-1 h-full">
          <Show
            when={actions.length}
            fallback={Action({
              type: "button",
              disabled: true,
              text: "This pane has no actions",
            })}
          >
            <For each={actions}>{Action}</For>
          </Show>
        </div>

        <div className="grow"></div>

        <div className="border-z-8 border-l-1 h-full">
          {Action({
            type: "button",
            onClick: () => {},
            text: "Unlock grid",
          })}
        </div>
      </nav>

      <section onWheel={e => e.preventDefault()} className="grow">
        <div className="relative h-full overflow-hidden">
          <PanesView />
        </div>
      </section>

      <div className="fixed right-[0px] bottom-[0px]">
        <AddPaneButton />
      </div>

      <FloatingWindow />
    </div>
  );
}
