import ViperCanvas from "./components/Chart/ViperCanvas";
import Overlay from "./components/overlay/Overlay";

function App({ $chart }) {
  return (
    <div className="relative overflow-hidden h-full w-full bg-black text-gray-100">
      <ViperCanvas $chart={$chart} />
      <div className="absolute p-4">
        <Overlay $chart={$chart} />
      </div>
    </div>
  );
}

export default App;
