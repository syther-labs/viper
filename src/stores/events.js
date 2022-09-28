/** @type {Object.<string,function[]>} */
const subscriptions = {};

/** @param {UIEvent} e */
function onResize(e) {
  const methods = subscriptions["resize"];
  if (methods && methods.length) {
    for (const method of methods) {
      method();
    }
  }
}

function onMouseUp

/**
 * Subscribe to global events
 * @param {("reisze")} event
 * @param {function} callback
 */
export function subscribe(event, callback) {
  if (!subscriptions[event]) {
    subscriptions[event] = [];
  }

  subscriptions[event].push(callback);
}

/**
 * Unsubscribe from global events
 * @param {("resize")} event
 * @param {function} callback
 * @returns {boolean}
 */
export function unsubscribe(event, callback) {
  if (!subscriptions[event]) {
    return false;
  }

  subscriptions[event].splice(subscriptions[event].indexOf(callback));

  // If no more subscribers, delete array
  if (!subscriptions[event].length) {
    delete subscriptions[event];
  }

  return true;
}

export default {
  init() {
    window.addEventListener("resize", onResize);
    window.addEventListener("resize", onResize);
  },

  destroy() {
    window.removeEventListener("resize", onResize);
  },
};
