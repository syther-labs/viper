import { Match, Switch } from "solid-js";
import state from "../../../state";
import ItemWithControls from "./ItemWithControls";

export default function Indicator(props) {
  const { indicatorId, dataset } = props;

  const indicator = state.indicators.get()[indicatorId];

  function onToggleVisible() {
    indicator.set((v) => ({
      ...v,
      visible: !v.visible,
    }));
  }

  function onRemove() {
    state.chart.removeIndicator(indicator);
  }

  return (
    <ItemWithControls
      visible={indicator.get().visible}
      onToggleVisible={onToggleVisible}
      onRemove={onRemove}
      slot={
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
      }
    />
  );
}
