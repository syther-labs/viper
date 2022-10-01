import { For } from "solid-js";
import Indicator from "./Indicator";
import ItemWithControls from "./ItemWithControls";

export default function DatasetGroup(props) {
  const { $chart, index } = props;
  const dataset = $chart.plots.get()[index];

  function onToggleVisible() {
    const { visible } = dataset.get();
    $chart.setDatasetVisibility(index, !visible);
  }

  function onRemove() {
    const plots = $chart.plots.get();
    plots.splice(index, 1);
    $chart.plots.set([...plots]);
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
              {indicatorId => (
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
