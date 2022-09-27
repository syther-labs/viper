import { For } from "solid-js";
import state from "../../../state";
import Indicator from "./Indicator";
import ItemWithControls from "./ItemWithControls";

export default function DatasetGroup(props) {
  const dataset = state.plots.get()[props.index];

  function onToggleVisible() {
    const { visible } = dataset.get();
    state.chart.setDatasetVisibility(props.index, !visible);
  }

  function onRemove() {
    const plots = state.plots.get();
    plots.splice(props.index, 1);
    state.plots.set([...plots]);
  }

  return (
    <ItemWithControls
      visible={dataset.get().visible}
      onToggleVisible={onToggleVisible}
      onRemove={onRemove}
      slot={
        <div className="text-xs p-1">
          <div className="font-bold">{dataset.get().values.datasetName}</div>
          <ul className="text-[0.66rem]">
            <For each={dataset.get().values.indicatorIds}>
              {(indicatorId) => (
                <li className="ml-2 my-1">
                  <div className="grow">
                    <Indicator
                      type="indicator"
                      dataset={dataset}
                      indicatorId={indicatorId}
                    />
                  </div>
                </li>
              )}
            </For>
          </ul>
        </div>
      }
    />
  );
}
