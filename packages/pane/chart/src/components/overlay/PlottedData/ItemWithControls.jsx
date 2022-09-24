import { v } from "../../../../../../api";

export default function ItemWithControls(props) {
  const showControls = v(false);

  const onMouseOver = () => showControls.set(true);
  const onMouseOut = () => showControls.set(false);

  return (
    <div
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      className="flex items-center cursor-pointer text-gray-400 border-[1px] border-transparent rounded hover:border-gray-600"
      classList={{
        "opacity-50": !props.visible,
      }}
    >
      <div className="grow">{props.slot}</div>
      <div
        className="flex items-center"
        classList={{
          invisible: !showControls.get(),
          visible: showControls.get(),
        }}
      >
        <button
          onClick={() => props.onToggleVisible && props.onToggleVisible()}
          class="h-4 w-4 text-sm flex items-center justify-center"
        >
          <Show when={props.visible}>
            <i class="ri-eye-line"></i>
          </Show>
          <Show when={!props.visible}>
            <i class="ri-eye-off-line"></i>
          </Show>
        </button>
        <button
          onClick={() => props.onRemove && props.onRemove()}
          class="h-4 w-4 text-sm flex items-center justify-center"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
    </div>
  );
}
