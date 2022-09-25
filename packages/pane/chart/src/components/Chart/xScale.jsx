import dimensions from "../../local-state/dimensions";
import ViperCanvas from "./ViperCanvas";

export default function xScale() {
  return (
    <div
      className="absolute"
      style={{
        left: 0,
        top: `${dimensions.main.height.get()}px`,
        width: `${dimensions.xScale.width.get()}px`,
        height: `${dimensions.xScale.height.get()}px`,
      }}
    >
      <ViperCanvas {...dimensions.xScale} type="xScale" />
    </div>
  );
}
