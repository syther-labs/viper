import ViperCanvas from "./ViperCanvas";

import { createSimpleEmitter } from "@solid-primitives/event-bus";
import _ from "lodash";

export default function Main({ $chart }) {
  return (
    <div
      className="absolute cursor-crosshair"
      style={{
        left: 0,
        top: 0,
        width: `${$chart.dimensions.main.width.get()}px`,
        height: `${$chart.dimensions.main.height.get()}px`,
      }}
      context-menu-id="main"
    >
      <ViperCanvas
        emit={emit}
        {...$chart.dimensions.main}
        $chart={$chart}
        type="main"
      />
    </div>
  );
}
