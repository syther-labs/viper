import { getTimeframeText } from "../../data/timeframes";
import state from "../../state";
import ChartName from "./ChartName";
import Plots from "./PlottedData/Plots";

export default function Overlay() {
  return (
    <div>
      <div className="flex items-center font-bold mb-2">
        <ChartName />
        <span className="mx-2">•</span>
        <div>{getTimeframeText(state.timeframe.get())}</div>
      </div>
      <Plots />
    </div>
  );
}
