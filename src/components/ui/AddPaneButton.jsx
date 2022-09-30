import { createSignal } from "solid-js";
import { createPane } from "../../stores/panes";

export default function AddPaneButton() {
  const [visible, setVisible] = createSignal(false);

  return (
    <div className="p-8">
      <div
        onMouseEnter={[setVisible, true]}
        onMouseLeave={[setVisible, false]}
        className="relative w-[33vw] h-[15vw]"
      >
        <button
          onClick={[createPane]}
          className="absolute bottom-[0px] right-[0px] rounded-full bg-primary h-12 w-12 duration-[150ms]"
          classList={{ "opacity-[0]": !visible() }}
        >
          <i class="ri-add-line text-2xl"></i>
        </button>
      </div>
    </div>
  );
}
