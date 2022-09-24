import { For } from "solid-js";
import ItemWithControls from "./ItemWithControls";

export default function IndicatorGroup(props) {
  return (
    <ItemWithControls
      slot={
        <div className="text-xs p-1">
          <div className="font-bold">{props.indicatorName}</div>
          <ul className="text-[0.66rem]">
            <For each={props.datasets}>
              {(dataset) => (
                <li className="ml-2 my-1">
                  <ItemWithControls
                    slot={
                      <div className="grow">
                        <span className="mr-2">{dataset.name}</span>
                        <span className="opacity-75">{dataset.dataModel}</span>
                      </div>
                    }
                  />
                </li>
              )}
            </For>
          </ul>
        </div>
      }
    />
  );
}
