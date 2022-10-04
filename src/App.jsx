import { For } from "solid-js";
import { actions, modal, windows } from "./stores/ui";

import "gridstack/dist/gridstack.min.css";

import { Show } from "solid-js";
import PanesView from "./components/ui/PanesView";
import FloatingWindow from "./components/ui/FloatingWindow";
import Spotlight from "./components/ui/Spotlight";
import Navbar from "./components/ui/Navbar";
import FangSearch from "./components/ui/FangSearch";
import { Modal } from "./components/components";

export default function App() {
  return (
    <div className="viper flex flex-col w-full h-full bg-z-10 text-z-1 relative text-sm">
      <Navbar />

      <section className="grow relative overflow-auto">
        <PanesView />
      </section>

      {/* Render all floating windows */}
      <For each={Object.keys(windows.get())}>
        {id => <FloatingWindow {...windows.get()[id].get()} id={id} />}
      </For>

      {/* <FangSearch /> */}

      <Show when={false} children={<Spotlight />} />

      <Show when={modal.get().visible} children={<Modal />} />
    </div>
  );
}
