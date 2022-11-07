import { Match, Switch } from "solid-js";
import global from "../../../../../global";
import plot_types from "../../../data/plot_types";
import ItemWithControls from "./ItemWithControls";

export default function Indicator(props) {
  const { $chart, indicatorId, dataset } = props;

  const indicator = $chart.state.indicators.get()[indicatorId];

  function onToggleVisible() {
    const { renderingQueueId, visible } = indicator.get();
    $chart.setIndicatorVisibility(renderingQueueId, !visible);
  }

  function onRemove() {
    $chart.removeIndicator(indicator);
  }

  function getIndicatorName(indicator) {
    const plotType = plot_types.getIndicatorById(indicator.indicatorId);
    return plotType.name;
  }

  function getDataModelName(modelId) {
    return global.dataModels[modelId].name;
  }

  return (
    <ItemWithControls
      visible={indicator.get().visible}
      onToggleVisible={onToggleVisible}
      onRemove={onRemove}
      slot={
        <div className="text-xxs">
          <Switch fallback={<div>Error</div>}>
            <Match when={props.type === "indicator"}>
              <div>
                <span className="mx-2">
                  {getDataModelName(indicator.get().model)}
                </span>
                <span className="opacity-75">
                  {getIndicatorName(indicator.get())}
                </span>
              </div>
            </Match>
            <Match when={indicator.get().type === "dataset"}>
              <span className="mx-2">{getIndicatorName(indicator.get())}</span>
              <span className="opacity-75">
                {getDataModelName(indicator.get().model)}
              </span>
            </Match>
          </Switch>
        </div>
      }
    />
  );
}
