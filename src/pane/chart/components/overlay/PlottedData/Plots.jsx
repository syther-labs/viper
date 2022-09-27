import { For } from "solid-js";
import { Dynamic } from "solid-js/web";
import state from "../../../state";
import Dataset from "./Dataset";
import DatasetGroup from "./DatasetGroup";

const PlotComponents = {
  Dataset,
  DatasetGroup,
};

export default function Plots() {
  return (
    <ul className="w-full max-w-[20rem]">
      <For each={state.plots.get()}>
        {(plot, index) => (
          <Dynamic
            component={PlotComponents[plot.get().type]}
            index={index()}
          />
        )}
      </For>
    </ul>
  );
}
