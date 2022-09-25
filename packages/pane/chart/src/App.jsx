import Main from "./components/Chart/Main";
import YScale from "./components/Chart/yScale";
import XScale from "./components/Chart/xScale";
import Overlay from "./components/overlay/Overlay";
import { onCleanup, onMount, Show } from "solid-js";
import Timeframes from "./ui/Actions";
import state from "./state";
import { setDimensions } from "./local-state/dimensions";

function App() {
  let chartElement;

  onMount(() => {
    window.addEventListener("resize", onResizeWindow);
    onResizeWindow();
  });

  onCleanup(() => {
    window.removeEventListener("resize", onResizeWindow);
  });

  function onResizeWindow() {
    const { clientWidth, clientHeight } = chartElement;
    setDimensions(clientWidth, clientHeight);
  }

  return (
    <div
      ref={chartElement}
      className="relative overflow-hidden h-full w-full bg-black text-gray-100"
    >
      <Main />
      <YScale />
      <XScale />
      <div className="absolute p-4">
        <Overlay />
      </div>
    </div>
  );
}

export default App;
