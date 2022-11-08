import { For } from "solid-js";
import { Dynamic } from "solid-js/web";
import DataModelGroup from "./DataModelGroup";

const PlotComponents = {
  DataModelGroup,
};

export default function Plots({ $chart }) {
  return (
    <ul className="w-full max-w-[20rem]">
      <For each={Object.keys($chart.state.plots.get())}>
        {(id, index) => {
          const plot = $chart.state.plots.get()[id];

          return (
            <Dynamic
              $chart={$chart}
              component={PlotComponents[plot.get().type]}
              index={index()}
              id={id}
            />
          );
        }}
      </For>
    </ul>
  );
}
