import { getTimeframeText } from "../../data/timeframes";
import ChartName from "./ChartName";
import Plots from "./PlottedData/Plots";

export default function Overlay({ $chart }) {
  return (
    <div className="absolute top-0 p-4 max-h-[30%] md:max-h-[50%] w-full max-w-[15rem] md:max-w-[20rem] overflow-y-auto">
      <div className="flex items-center font-bold mb-2 text-xs">
        <ChartName $chart={$chart} />
        <span className="mx-2">•</span>
        <div>{getTimeframeText($chart.state.timeframe.get())}</div>
      </div>
      <Plots $chart={$chart} />
    </div>
  );
}
