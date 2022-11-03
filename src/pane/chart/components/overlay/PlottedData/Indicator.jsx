import { Match, Switch } from "solid-js";
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
                <span className="mr-2">{indicator.get().model.name}</span>
                <span className="opacity-75">{indicator.get().name}</span>
              </div>
            </Match>
            <Match when={indicator.get().type === "dataset"}>
              <span className="mr-2">{indicator.get().name}</span>
              <span className="opacity-75">{indicator.get().model.name}</span>
            </Match>
          </Switch>
        </div>
      }
    />
  );
}
