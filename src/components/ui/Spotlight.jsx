import { onCleanup } from "solid-js";
import { onMount } from "solid-js";

export default function Spotlight() {
  /** @param {KeyboardEvent} e */
  function onKeyUp(e) {
    if (e.code === "Escape") {
      // TODO close
    }
  }

  onMount(() => {
    window.addEventListener("keyup", onKeyUp);
  });

  onCleanup(() => {
    window.removeEventListener("keyup", onKeyUp);
  });

  return (
    <div className="fixed flex items-center justify-center w-full h-full bg-[#00000033]">
      <div className="w-full h-full max-w-[600px] max-h-[75vh]">
        <div className="flex items-center"></div>

        <ul></ul>
      </div>
    </div>
  );
}
