import { For } from "solid-js";
import { Dynamic } from "solid-js/web";
import DataModelGroup from "./DataModelGroup";

const PlotComponents = {
  DataModelGroup,
};

export default function Plots({ $chart }) {
  return (
    <ul className="w-full max-w-[20rem]">
      <For each={$chart.plots.get()}>
        {(plot, index) => (
          <Dynamic
            $chart={$chart}
            component={PlotComponents[plot.get().type]}
            index={index()}
          />
        )}
      </For>
    </ul>
  );
}
