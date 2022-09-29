import { padEnd, uniqueId } from "lodash";
import { v } from "../api/api";
import utils from "../pane/chart/utils";

export const selectedPage = v("");
export const panes = v({});

/**
 * Create a new pane
 * @param {number} top 0-100
 * @param {number} left 0-100
 * @param {number} width 0-100
 * @param {number} height 0-100
 * @returns {Pane}
 */
export function createPane(top, left, width, height) {
  const id = uniqueId();

  // Create a new pane
  /** @type {ReactivePane} */
  const pane = v({
    id,
    pos: {
      top: v(top),
      left: v(left),
      width: v(width),
      height: v(height),
    },
    color: utils.randomHexColor(),
  });

  // Add to state
  panes.set(v => ({ ...v, [id]: pane }));

  // Check if pane dimensions get in the way of any other panes
  checkForOverlappingPanes(pane);

  return pane;
}

/**
 * Check if any panes overlap with the pane in question
 * @param {Pane} pane
 */
function checkForOverlappingPanes(pane) {
  const { id, pos } = pane.get();

  const A = {
    x1: pos.left.get(),
    y1: pos.top.get(),
    x2: pos.left.get() + pos.width.get(),
    y2: pos.top.get() + pos.height.get(),
  };

  // Get all pane Ids excluding comparison pane
  const paneIds = Object.keys(panes.get());
  paneIds.splice(paneIds.indexOf(id), 1);

  //  Loop through all panes and check for horizontal overlap
  for (const paneId of paneIds) {
    const { set, get } = panes.get()[paneId];

    const { pos } = get();
    const B = {
      x1: pos.left.get(),
      y1: pos.top.get(),
      x2: pos.left.get() + pos.width.get(),
      y2: pos.top.get() + pos.height.get(),
    };

    const res = intersectingRect(A, B);
    let { x, y, xx, yy, w, h } = res;
    if (w <= 0 || h <= 0) continue;

    console.log(get().id, res);

    // If width is greater than height subtract height from box
    if (w >= h) {
      // If overlay y is greater than overlap height
      if (y - pos.top.get() >= h) {
        console.log("h");
        pos.height.set(v => v - h);
      } else {
        console.log("t");
        pos.top.set(v => v + h);
        pos.height.set(h);
      }
    }

    // If height is greater than width, subtract width from box
    else {
      if (x - pos.left.get() >= w) {
        console.log("w");
        pos.width.set(v => v - w);
      } else {
        console.log("l");
        pos.left.set(v => v + w);
        pos.width.set(w);
      }
    }
  }
}

function intersectingRect(r1, r2) {
  var x = Math.max(r1.x1, r2.x1);
  var y = Math.max(r1.y1, r2.y1);
  var xx = Math.min(r1.x2, r2.x2);
  var yy = Math.min(r1.y2, r2.y2);

  return {
    x: x,
    y: y,
    w: xx - x,
    h: yy - y,
  };
}

/**
 * @typedef {Object} ReactivePane
 * @property {function():Pane} get
 * @property {function(Pane)} set
 */

/**
 * @typedef {Object} Pane
 * @property {string} id
 * @property {PaneDimensions} pos
 */

/**
 * @typedef {Object} PaneDimensions
 * @property {ReactiveNumber} top
 * @property {ReactiveNumber} left
 * @property {ReactiveNumber} height
 * @property {ReactiveNumber} width
 */
