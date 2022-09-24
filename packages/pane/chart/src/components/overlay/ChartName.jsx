import { v } from "../../../../../api";
import { createEffect, Show } from "solid-js";
import state from "../../state";

export default function ChartName() {
  let inputRef;

  const isEdit = v(false);

  function onBlur(event) {
    if (isEdit.get() === false) return;

    const { value } = event.target;
    isEdit.set(false);
    state.name.set(value);
  }

  function onKeyUp(event) {
    const { code } = event;

    if (code === "Escape") {
      isEdit.set(false);
    } else if (code === "Enter") {
      isEdit.set(false);
      state.name.set(event.target.value);
    }
  }

  createEffect(() => {
    if (isEdit.get() === true) {
      inputRef.focus();
    }
  });

  return (
    <>
      <Show when={!isEdit.get()}>
        <button
          onClick={() => isEdit.set(true)}
          className="border-2 border-transparent"
        >
          {state.name.get()}
        </button>
      </Show>
      <Show when={isEdit.get()}>
        <input
          ref={inputRef}
          value={state.name.get()}
          onBlur={onBlur}
          onKeyUp={onKeyUp}
          className="bg-transparent border-2"
          style={{ width: "auto" }}
        />
      </Show>
    </>
  );
}
