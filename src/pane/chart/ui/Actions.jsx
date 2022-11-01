import { Index } from "solid-js";
import Action from "../../../components/ui/Action";
import { activePane } from "../../../stores/panes";
import { modal } from "../../../stores/ui";
import { getTimeframeText } from "../data/timeframes";

export default function Timeframes() {
  function showAddDataModal() {
    modal.set({
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
      <Index each={[6e4, 6e4 * 15, 3.6e6]}>
        {timeframe => (
          <li>
            {Action({
              type: "button",
              onClick: () => activePane().get().app.setTimeframe(timeframe()),
              text: getTimeframeText(timeframe()),
            })}
          </li>
        )}
      </Index>
    </ul>
  );
}
