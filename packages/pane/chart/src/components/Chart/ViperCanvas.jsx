import { onCleanup } from "solid-js";
import { onMount } from "solid-js";
import RenderingEngine from "../../lib/rendering-engine";
import utils from "../../utils";

export default function ViperCanvas(props) {
  const { emit, type, height, width } = props;

  let canvasEl;
  let canvas;

  let mouseDown = false;

  function onMouseDown(e) {
    mouseDown = true;
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onDragToResize);
    emit("onMouseDown", e)
  }

  function onMouseUp(e) {
    mouseDown = false;
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onDragToResize);
    emit("onMouseUp", e)
  }

  function onDragToResize(e) {
    emit("onDragToResize", e)
  }

  function onWheel(e) {
    emit("onWheel", e);
  }

  function onDoubleClick(e) {
    emit("onDoubleClick", e);
  }

  onMount(() => {
    canvas = new Canvas({
      canvas: canvasEl,
      type,
    })
  })

  onCleanup(() => {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onDragToResize);
  })

  return (
    <canvas
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      on:dblclick={onDoubleClick}
      ref={canvasEl}
      height={height.get()}
      width={width.get()}
      className="w-full h-full"
    />
  );
}

class Canvas {
  constructor({ $state, canvas, type = "" }) {
    this.$state = $state;

    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.RE = new RenderingEngine({
      canvas: this,
      type,
    });;
    this.type = type;
  }

  /**
   *
   * @param {string} color Hex color
   * @param {number[]} coords Coordinates to draw at
   */
  drawBox(color, [x, y, w, h]) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x,
      y,
      utils.getAbsoluteMax(w, 1),
      utils.getAbsoluteMax(h, 1)
    );
  }

  drawText(color, [x, y], text, options) {
    options = {
      textAlign: "center",
      font: "10px Arial",
      stroke: false,
      ...options,
    };
    this.ctx.textAlign = options.textAlign;
    this.ctx.font = options.font;
    this.ctx.fillStyle = color;
    if (!options.stroke) {
      this.ctx.fillText(text, x, y);
    } else {
      this.ctx.strokeText(text, x, y);
    }
  }

  /**
   * Draw a rectangle with 2 price coords and a width percentage of element / candle px width
   * @param {string} color Hex color
   * @param {number[]} coords Array of timestamp, top price, low price
   * @param {number} width Percentage of element width to cover
   */
  // drawBoxByPriceAndPercWidthOfTime(color, coords, width) {
  //   // Get percentage of element width
  //   const w = this.$state.chart.pixelsPerElement * width;

  //   const x = this.$state.chart.getXCoordByTimestamp(coords[0]);
  //   const y1 = this.$state.chart.getYCoordByPrice(coords[1]);
  //   const y2 = this.$state.chart.getYCoordByPrice(coords[2]);

  //   const h = y2 - y1;

  //   if (h >= 0)
  //     this.drawBox(color, [x - w / 2, y1, Math.max(w, 1), Math.max(h, 1)]);
  //   else this.drawBox(color, [x - w / 2, y1, Math.max(w, 1), Math.min(h, 1)]);
  // }

  /**
   * Draw line between 2 points using canvas pixel coords
   * @param {string} color Hex color
   * @param {number[]} coords Coordinates to draw line from and to
   * @param {number} linewidth Width in pixels of the line to draw
   */
  drawLine(color, coords, linewidth = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = linewidth;
    this.ctx.beginPath();
    this.ctx.moveTo(Math.floor(coords[0]), Math.floor(coords[1]));
    this.ctx.lineTo(Math.floor(coords[2]), Math.floor(coords[3]));
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawPolygon(color, coords) {
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.moveTo(coords[0], coords[1]);
    for (let i = 2; i < coords.length; i += 2) {
      this.ctx.lineTo(coords[i], coords[i + 1]);
    }
    this.ctx.fill();
    this.ctx.closePath();
  }

  /**
   * Draw line between 2 points using price and time coords
   * @param {string} color Hex color
   * @param {number[]} coords Time and price coordinates to draw line from and to
   */
  // drawLineByPriceAndTime(color, coords) {
  //   this.ctx.strokeStyle = color;
  //   this.ctx.beginPath();
  //   const x1 = this.$state.chart.getXCoordByTimestamp(coords[0]);
  //   const y1 = this.$state.chart.getYCoordByPrice(coords[1]);
  //   this.ctx.moveTo(x1, y1);
  //   const x2 = this.$state.chart.getXCoordByTimestamp(coords[2]);
  //   const y2 = this.$state.chart.getYCoordByPrice(coords[3]);
  //   this.ctx.lineTo(x2, y2);
  //   this.ctx.stroke();
  //   this.ctx.closePath();
  // }

  // drawTextAtPriceAndTime(color, coords, text) {
  //   this.ctx.textAlign = "center";
  //   this.ctx.fillStyle = color;
  //   const x = this.$state.chart.getXCoordByTimestamp(coords[0]);
  //   this.ctx.fillText(text, x, coords[1]);
  // }
}
