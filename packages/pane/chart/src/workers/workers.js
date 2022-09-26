import utils from "../utils";

import ChartWorker from "./modules/chart?worker";
import dimensions from "../local-state/dimensions";
import Instructions from "../local-state/Instructions";
import state from "../state";

const j = (d) => JSON.parse(JSON.stringify(d));

const workersSupported = !!window.Worker;
const workers = {
  chart: createWorker("chart"),
};
const resolveQueue = {};

export let instructions = Instructions;
let isRequestingToGenerateAllInstructions = false;
let isGeneratingAllInstrutions = false;

/**
 * Create a new JavaScript worker of type
 * @param {('chart')} type 
 * @returns 
 */
function createWorker(type = "") {
  let worker
  
  if (type === "chart") {
    worker = new ChartWorker({ type: "module" });
  } else {
    throw new Error(`No valid implementation for ${type} worker`)
  }
  worker.onmessage = onWorkerMessage.bind(this);
  worker.onerror = onWorkerError.bind(this);

  return worker;
}

export async function addToQueue({ indicator }) {
  const { renderingQueueId } = await new Promise((resolve) => {
    const id = addToResolveQueue(resolve);

    workers.chart.postMessage(
      j({
        id,
        method: "addToQueue",
        params: {
          indicator: {
            ...indicator,
            draw: undefined,
          },
        },
      })
    );
  });

  // const { canvas } = this.chart.subcharts.main;
  // canvas.RE.addToRenderingOrder(renderingQueueId);

  return { renderingQueueId };
}

export async function setVisibility({ renderingQueueId, visible }) {
  await new Promise((resolve) => {
    const id = addToResolveQueue(resolve);

    workers.chart.postMessage(
      j({
        type: "runComputedStateMethod",
        data: {
          method: "setVisibility",
          resolveId: id,
          params: { renderingQueueId, visible },
        },
      })
    );
  });

  await generateAllInstructions();
}

export async function calculateOneSet({
  renderingQueueId,
  timestamps,
  dataset,
}) {
  await new Promise((resolve) => {
    const id = addToResolveQueue(resolve);

    workers.chart.postMessage(
      j({
        id,
        method: "calculateOneSet",
        params: {
          renderingQueueId,
          timestamps,
          dataset,
        },
      })
    );
  });

  // Generate instructions for this set
  await generateAllInstructions();
}

export async function generateAllInstructions() {
  // If already generating instructions, dont fill the call stack with useless calls
  if (isGeneratingAllInstrutions) {
    isRequestingToGenerateAllInstructions = true;
    return { throwback: true };
  }

  isGeneratingAllInstrutions = true;

  const {
    instructions: newInstructions,
    visibleRanges,
    pixelsPerElement,
    maxDecimalPlaces,
  } = await new Promise((resolve) => {
    const id = addToResolveQueue(resolve);

    const y = { ...state.ranges.y.get() };
    for (const id in y) {
      y[id] = y[id].get();
    }

    workers.chart.postMessage(
      j({
        id,
        method: "generateAllInstructions",
        params: {
          requestedRanges: {
            x: state.ranges.x.get(),
            y,
          },
          timeframe: state.timeframe.get(),
          chartDimensions: {
            main: {
              width: dimensions.main.width.get(),
              height: dimensions.main.height.get(),
              layers: dimensions.main.layers.get(),
            },
            yScale: {
              width: dimensions.yScale.width.get(),
              height: dimensions.yScale.height.get(),
            },
            xScale: {
              width: dimensions.xScale.width.get(),
              height: dimensions.xScale.height.get(),
            },
          },
          pixelsPerElement: state.pixelsPerElement.get(),
        },
      })
    );
  });

  instructions = newInstructions;
  state.pixelsPerElement.set(pixelsPerElement);
  state.renderedRanges.x.set(visibleRanges.x);

  for (const layerId in visibleRanges.y) {
    const yRange = state.ranges.y.get()[layerId];
    const yRenderedRage = state.renderedRanges.y.get()[layerId];

    yRange.set((v) => ({
      ...v,
      range: visibleRanges.y[layerId],
    }));

    yRenderedRage.set((v) => ({
      ...v,
      range: visibleRanges.y[layerId],
    }));
  }

  isGeneratingAllInstrutions = false;

  // If another generation is requested, call again
  if (isRequestingToGenerateAllInstructions) {
    isRequestingToGenerateAllInstructions = false;
    setTimeout(generateAllInstructions);
  }
}

export function updateIndicators(updates) {
  workers.chart.postMessage(
    j({
      type: "runComputedStateMethod",
      data: {
        method: "updateIndicators",
        params: { updates },
      },
    })
  );
}

export function emptySet({ renderingQueueId }) {
  workers.chart.postMessage(
    j({
      type: "runComputedStateMethod",
      data: {
        method: "emptySet",
        params: { renderingQueueId },
      },
    })
  );
}

export function emptyAllSets() {
  workers.chart.postMessage(
    j({
      type: "runComputedStateMethod",
      data: {
        method: "emptyAllSets",
        params: {},
      },
    })
  );
}

export function removeFromQueue({ renderingQueueIds }) {
  workers.chart.postMessage(
    j({
      type: "runComputedStateMethod",
      data: {
        method: "removeFromQueue",
        params: { renderingQueueIds },
      },
    })
  );

  // const { canvas } = this.chart.subcharts.main;
  // for (const id of renderingQueueIds) {
  //   canvas.RE.removeFromRenderingOrder(id);
  // }
}

/**
 * Add resolve function to queue for resolving result of worker
 * @param {function} resolve
 * @returns {string} Resolve id
 */
function addToResolveQueue(resolve) {
  const id = utils.uniqueId();
  resolveQueue[id] = resolve;
  return id;
}

function onWorkerMessage(e) {
  const { id, data } = e.data;

  switch (id) {
    case "updateInstructions":
      instructions.set(data.instructions);
      break;
    default:
      resolveQueue[id](data);
      delete resolveQueue[id];
      break;
  }
}

function onWorkerError(e) {
  console.error(e);
}
