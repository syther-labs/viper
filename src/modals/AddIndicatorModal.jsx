import { v } from "../../../../packages/api";
import { Index } from "solid-js";
import plot_types from "../../../../packages/pane/chart/src/data/plot_types";
import utils from "../../../../packages/pane/chart/src/utils";

export default function AddIndicatorModal() {
  const { dataset } = state.ui.modal.get().data;
  const { datasetName } = dataset.get().values;
  const [source, name] = datasetName.split(":");

  const { modelIds } = state.$master.state.datasets.get()[source][name];

  const tab = v(modelIds[0] || "");

  function onAddIndicator(indicator, offChart = false) {}

  return (
    <div className="flex flex-col h-full">
      <ul className="flex flex-wrap mx-[-0.5rem] mb-3">
        <Index each={modelIds}>
          {modelId => (
            <li className="mx-[0.5rem]">
              <button
                onClick={() => tab.set(modelId())}
                className="py-1 px-3 bg-gray-800 rounded font-bold text-lg"
                classList={{
                  "bg-gray-500": tab.get() === modelId(),
                }}
              >
                {state.config.dataModels.get()[modelId()].name}
              </button>
            </li>
          )}
        </Index>
      </ul>
      <ul className="grow overflow-y-scroll">
        <Index each={Object.keys(plot_types.bases)}>
          {id => {
            const indicator = plot_types.bases[id()];

            return (
              <li className="flex my-2 w-full bg-gray-800 rounded">
                <button
                  onClick={[onAddIndicator, indicator]}
                  className="grow py-1 px-3 text-left"
                >
                  {indicator.name}
                </button>
                <button
                  onClick={[onAddIndicator, indicator, true]}
                  className="py-1 px-3"
                >
                  Off Chart
                </button>
              </li>
            );
          }}
        </Index>
      </ul>
    </div>
  );
}
