import Main from "./components/Chart/Main";
import YScale from "./components/Chart/yScale";
import XScale from "./components/Chart/xScale";
import Overlay from "./components/overlay/Overlay";

function App({ $chart }) {
  return (
    <div className="relative overflow-hidden h-full w-full bg-black text-gray-100">
      <Main $chart={$chart} />
      <YScale $chart={$chart} />
      <XScale $chart={$chart} />
      <div className="absolute p-4">
        <Overlay $chart={$chart} />
      </div>
    </div>
  );
}

export default App;
