import { For } from "solid-js";
import Indicator from "./Indicator";
import ItemWithControls from "./ItemWithControls";

export default function DatasetGroup(props) {
  const { $chart, index } = props;
  const dataModelGroup = $chart.plots.get()[index];

  function onToggleVisible() {
    const { visible } = dataModelGroup.get();
    $chart.setDatasetVisibility(index, !visible);
  }

  function onRemove() {
    $chart.removePlot(index);
  }

  const datasetName = () => {
    const { source, name } = dataModelGroup.get().dataset;
    return `${source}:${name}`;
  };

  return (
    <ItemWithControls
      visible={dataModelGroup.get().visible}
      onToggleVisible={onToggleVisible}
      onRemove={onRemove}
      slot={
        <div className="text-xs p-1">
          <div className="font-bold">{datasetName()}</div>
          <ul className="text-[0.66rem]">
            <For each={dataModelGroup.get().indicatorIds}>
              {indicatorId => (
                <li className="ml-2 my-1">
                  <div className="grow">
                    <Indicator
                      type="indicator"
                      $chart={$chart}
                      dataset={dataModelGroup}
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
