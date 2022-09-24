export default function ViperCanvas(props) {
  const { height, width } = props;

  return (
    <canvas
      height={height.get()}
      width={width.get()}
      className="w-full h-full"
    />
  );
}
