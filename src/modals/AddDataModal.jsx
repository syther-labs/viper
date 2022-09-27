import {
  createMemo,
  createSignal,
  For,
  Index,
  onCleanup,
  onMount,
} from "solid-js";
import state, { getters } from "../../../../packages/pane/chart/src/state";
import { v } from "../../../../packages/api";

import { VirtualContainer } from "@minht11/solid-virtual-container";
import AddIndicatorModal from "./AddIndicatorModal";

export default function AddDataModal() {
  let scrollTarget;
  let input;

  const [search, setSearch] = createSignal(
    state.ui.modal.get().data.search || ""
  );
  const [selected, setSelected] = createSignal(-1);

  const results = createMemo(() => {
    const regex = new RegExp(search().replace(/[\W_]+/g, "."), "ig");

    return getters.datasetsArray().filter(({ source, name }) => {
      return regex.test(`${source}:${name}`);
    });
  });

  onMount(() => {
    window.addEventListener("keyup", onKeyUp);
  });

  onCleanup(() => {
    window.removeEventListener("keyup", onKeyUp);
  });

  function onKeyUp(e) {
    if (e.code === "Enter") {
      if (selected() > -1) {
        createDataset(results()[selected()]);
      }
    }

    if (["ArrowUp", "ArrowDown"].includes(e.code)) {
      if (e.code === "ArrowUp") {
        setSelected((v) => Math.max(v - 1, 0));
      } else if (e.code === "ArrowDown") {
        setSelected((v) => Math.min(v + 1, results().length - 1));
      }

      const item = results()[selected()];
      input.value = `${item.source}:${item.name}`;
    }
  }

  function onInput(e) {
    setSelected(-1);
    setSearch(e.target.value);
  }

  function createDataset({ source, name }) {
    const dataset = v({
      type: "Dataset",
      visible: true,
      values: {
        datasetName: `${source}:${name}`,
        indicatorIds: [],
      },
    });

    state.plots.set([...state.plots.get(), dataset]);

    state.ui.modal.set({
      visible: true,
      title: "Add Indicator",
      component: AddIndicatorModal,
      data: {
        dataset,
      },
    });
  }

  function DatasetItem(props) {
    return (
      <div className="w-full p-1" style={props.style}>
        <button
          onClick={[createDataset, props.item]}
          className="text-left text-sm rounded p-2 bg-gray-800 w-full h-full"
          classList={{
            "bg-gray-400": selected() === props.index,
          }}
        >
          <div className="uppercase font-bold">
            <span className="mr-2">{props.item.source}</span>
            <span className="opacity-75">{props.item.name}</span>
          </div>
          <div className="opacity-50 italic">
            <Index each={props.item.modelIds}>
              {(modelId) => (
                <span>{state.config.dataModels.get()[modelId()].name}</span>
              )}
            </Index>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <input
        type="text"
        value={search()}
        onInput={onInput}
        ref={input}
        className="w-full bg-gray-800 uppercase rounded m-1 px-3 text-lg leading-[56px]"
        placeholder="Search for a dataset source here..."
      />
      <div ref={scrollTarget} className="flex-grow overflow-y-auto">
        <VirtualContainer
          items={results()}
          scrollTarget={scrollTarget}
          itemSize={{ height: 64 }}
        >
          {DatasetItem}
        </VirtualContainer>
      </div>
    </div>
  );
}
