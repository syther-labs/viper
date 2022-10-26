import ViperCanvas from "./components/Chart/ViperCanvas";
import Overlay from "./components/overlay/Overlay";

import TimeScale from "./components/Chart/TimeScale";
import PriceScale from "./components/Chart/PriceScale";

function App({ $chart }) {
  return (
    <div className="relative overflow-hidden h-full w-full bg-black text-gray-100">
      <div className="flex">
        <ViperCanvas $chart={$chart} />
        <PriceScale $chart={$chart} />
      </div>
      <TimeScale $chart={$chart} />
      <div className="absolute p-4">
        <Overlay $chart={$chart} />
      </div>
    </div>
  );
}

export default App;
