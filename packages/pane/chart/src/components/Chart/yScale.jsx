import dimensions from "../../local-state/dimensions";
import ViperCanvas from "./ViperCanvas";

export default function yScale() {
  return (
    <div
      className="absolute"
      style={{
        left: `${dimensions.main.width.get()}px`,
        top: 0,
        width: `${dimensions.yScale.width.get()}px`,
        height: `${dimensions.yScale.height.get()}px`,
      }}
    >
      <ViperCanvas {...dimensions.yScale} />
    </div>
  );
}
