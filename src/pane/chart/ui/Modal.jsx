import { onCleanup, onMount } from "solid-js";
import { Dynamic } from "solid-js/web";

export default function Modal() {
  let modalContent;

  function onKeyUp({ code }) {
    if (code === "Escape") {
      state.ui.modal.set(v => ({ ...v, visible: false }));
    }
  }

  onMount(() => {
    window.addEventListener("keyup", onKeyUp);

    // Get the first input and focus on it
    const input = modalContent.querySelector("input");

    if (input) {
      input.focus();
    }
  });

  onCleanup(() => {
    window.removeEventListener("keyup", onKeyUp);
  });

  return (
    <div class="flex items-center justify-center absolute top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.75)]">
      <div className="flex flex-col w-full h-full max-w-[50rem] max-h-[50rem] bg-gray-900 p-4">
        <div className="flex items-center w-full">
          <h1 className="grow text-2xl font-bold pl-2">
            {state.ui.modal.get().title}
          </h1>
          <button
            onClick={() => state.ui.modal.set(v => ({ ...v, visible: false }))}
            className="text-xl h-12 w-12 flex items-center justify-center"
          >
            <i class="ri-close-line"></i>
          </button>
        </div>

        <div ref={modalContent} className="p-2 overflow-auto grow">
          <Dynamic component={state.ui.modal.get().component} />
        </div>
      </div>
    </div>
  );
}
