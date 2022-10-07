import { createSignal } from "solid-js";
import { onCleanup, onMount } from "solid-js";
import { Dynamic } from "solid-js/web";
import global from "../global";

import { modal } from "../stores/ui";
import { contextmenu, hide } from "../stores/ui/contextmenu";

/**
 *
 * @param {Object} props
 * @param {import("solid-js").JSXElement} props.children
 * @param {("primary"|"primary-outline")} props.variant Button variant
 * @param {("xs"|"sm"|"md"|"lg")} props.size Size of the button
 * @param {function} props.onClick
 * @returns {import("solid-js").JSXElement}
 */
export function Button(props) {
  const { children, variant, size, onClick = () => {} } = props;

  const classList = {
    "text-xs px-1": size === "xs",
    "text-sm py-1 px-2": size === "sm",
    "text-md py-1 px-2": size === "md",
    "text-lg py-2 px-3": size === "lg",
    "bg-primary text-z-1": variant === "primary",
    "border-primary text-primary hover:bg-primary hover:text-z-1":
      variant === "primary-outline",
  };

  return (
    <button
      className="flex items-center duration-[150ms] border-[1px] capitalize rounded border-transparent"
      classList={classList}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Modal() {
  let modalContent;

  function onKeyUp({ code }) {
    if (code === "Escape") {
      modal.set(v => ({ ...v, visible: false }));
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
          <h1 className="grow text-2xl font-bold pl-2">{modal.get().title}</h1>
          <button
            onClick={() => modal.set(v => ({ ...v, visible: false }))}
            className="text-xl h-12 w-12 flex items-center justify-center"
          >
            <i class="ri-close-line"></i>
          </button>
        </div>

        <div ref={modalContent} className="p-2 overflow-auto grow">
          <Dynamic component={modal.get().component} />
        </div>
      </div>
    </div>
  );
}

export function ContextMenu() {
  /** @type {HTMLElement} */
  let ref;

  let [initial, setInitial] = createSignal(true);

  onMount(() => {
    const elWidth = ref.clientWidth;
    const elHeight = ref.clientHeight;
    const appWidth = global.element.clientWidth;
    const appHeight = global.element.clientHeight;

    contextmenu.set(v => ({
      ...v,
      pos: [
        Math.min(v.pos[0], appWidth - elWidth),
        Math.min(v.pos[1], appHeight - elHeight),
      ],
    }));

    setInitial(false);
  });

  const getPos = () => (initial() ? 0 : contextmenu.get().pos);

  return (
    <div
      className="absolute bg-z-10 border-z-8 border-1 p-1 shadow z-[1000]"
      context-menu="true"
      classList={{
        invisible: initial(),
      }}
      style={{
        top: `${getPos()[1]}px`,
        left: `${getPos()[0]}px`,
      }}
      ref={ref}
    >
      <Title title={contextmenu.get().title} />
      <div className="mt-2">
        <List children={contextmenu.get().config} />
      </div>
    </div>
  );
}

function Title({ title }) {
  return <div className="text-xxs">{title}</div>;
}

function List({ children }) {
  return (
    <div>
      <For each={children}>
        {child => (
          <Switch>
            <Match when={child.type === "list"}>
              <Title title={child.title} />
              <List children={child.children} />
            </Match>
            <Match when={child.type === "button"}>
              <button
                className="block text-xs bg-z-10 hover:bg-z-9 p-1 text-z-1 w-full text-left"
                disabled={child.disabled}
                onClick={[onClick, child.onClick]}
              >
                {child.text}
              </button>
            </Match>
          </Switch>
        )}
      </For>
    </div>
  );
}

function onClick(onClick) {
  onClick();
  hide();
}
