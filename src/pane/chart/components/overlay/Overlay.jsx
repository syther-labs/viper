import { getTimeframeText } from "../../data/timeframes";
import ChartName from "./ChartName";
import Plots from "./PlottedData/Plots";

export default function Overlay({ $chart }) {
  return (
    <div>
      <div className="flex items-center font-bold mb-2">
        <ChartName $chart={$chart} />
        <span className="mx-2">•</span>
        <div>{getTimeframeText($chart.timeframe.get())}</div>
      </div>
      <Plots $chart={$chart} />
    </div>
  );
}
