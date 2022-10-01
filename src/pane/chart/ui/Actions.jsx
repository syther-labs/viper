import { Index } from "solid-js";
import { getTimeframeText } from "../data/timeframes";

export default function Timeframes({ $chart }) {
  function showAddDataModal() {
    $chart.ui.modal.set({
      visible: true,
      title: "Plot data",
      component: AddDataModal,
      data: {
        search: "",
      },
    });
  }

  return (
    <ul className="flex">
      <li class="flex items-center justify-center">
        <button onClick={showAddDataModal} className="p-2">
          <i class="ri-add-line"></i>
          <span className="leading-0">Plot Data</span>
        </button>
      </li>
      <Index each={$chart.config.timeframes.get()}>
        {timeframe => (
          <li>
            <button
              onClick={() => $chart.timeframe.set(timeframe())}
              className="p-2"
              classList={{
                "bg-gray-300 text-gray-900 font-bold":
                  $chart.timeframe.get() === timeframe(),
              }}
            >
              {getTimeframeText(timeframe())}
            </button>
          </li>
        )}
      </Index>
    </ul>
  );
}
