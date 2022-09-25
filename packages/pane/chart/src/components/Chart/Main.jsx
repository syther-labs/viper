import dimensions from "../../local-state/dimensions";
import ViperCanvas from "./ViperCanvas";

export default function Main() {
  function onWheel(e) {
    e.preventDefault();
    console.log(e);
  }

  return (
    <div
      onWheel={onWheel}
      className="absolute"
      style={{
        left: 0,
        top: 0,
        width: `${dimensions.main.width.get()}px`,
        height: `${dimensions.main.height.get()}px`,
      }}
    >
      <ViperCanvas{...dimensions.main} />
    </div>
  );
}
