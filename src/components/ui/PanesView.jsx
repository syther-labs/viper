import { panes } from "../../stores/panes";
import { Button } from "../components";

export default function PanesView() {
  const { length } = Object.keys(panes.get());

  if (!length) return NoPanes();
}

function NoPanes() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center justify-center">
        <h2 className="font-bold text-2xl mb-2">This layout has no panes</h2>
        <Button variant="primary-outline" size="md">
          Add a pane
          <span className="inline-block opacity-75 text-xs ml-2">
            <div className="flex items-center">
              <i class="ri-command-line"></i> + A
            </div>
          </span>
        </Button>
      </div>
    </div>
  );
}
