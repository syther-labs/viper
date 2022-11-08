import { For } from "solid-js";
import Indicator from "./Indicator";
import ItemWithControls from "./ItemWithControls";

export default function DatasetGroup(props) {
  const { $chart, id } = props;
  const dataModelGroup = $chart.state.plots.get()[id];

  function onToggleVisible() {
    const { visible } = dataModelGroup.get();
    $chart.setDatasetVisibility(id, !visible);
  }

  function onRemove() {
    $chart.removePlot(id);
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
        <div className="text-xxs md:text-xs p-1">
          <div className="font-bold">{datasetName()}</div>
          <ul className="text-[0.66rem]">
            <For each={dataModelGroup.get().indicatorIds}>
              {indicatorId => (
                <li>
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
