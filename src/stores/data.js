import utils from "../pane/chart/utils";

import global from "../global";
import { panes } from "./panes";

class DataState {
  constructor() {
    this.datasets = {};

    this.allRequestedPoints = {};
    this.requestInterval = setInterval(this.fireRequest.bind(this), 250);
  }

  addOrGetDataset({ source, name, modelId, timeframe, data = {} }) {
    let dataset;
    const datasetId = `${source}:${name}:${modelId}:${timeframe}`;

    // If dataset does not exist, fetch and create
    if (!this.datasets[datasetId]) {
      dataset = new Dataset(source, name, modelId, timeframe, data);
      this.datasets[datasetId] = dataset;
    } else {
      dataset = this.datasets[datasetId];
    }

    return dataset;
  }

  /**
   * Check for missing data
   * @param {Object} param0
   * @returns {boolean|Object}
   */
  hasDataPoints(paneId, { source, name, timeframe, modelId, start, end }) {
    const dataset = this.addOrGetDataset({ source, name, modelId, timeframe });
    const now = Date.now();

    dataset.subscribe(paneId);

    // const { maxItemsPerRequest = 300 } =
    //   this.sources[dataset.source][dataset.name];
    const maxItemsPerRequest = 500;

    const batchSize = timeframe * maxItemsPerRequest;

    // Get left and right bound times based on batch interval of dataset
    const leftBound = start - (start % batchSize);
    const rightBound = end - (end % batchSize) + batchSize;

    const requestedPoint = { start: Infinity, end: -Infinity };

    // Loop through each requested timestamp and check if any are not found
    for (const timestamp of utils.getAllTimestampsIn(
      leftBound,
      rightBound,
      timeframe
    )) {
      // Check if greater than now
      if (timestamp > now - (now % timeframe) + timeframe) break;

      // Check if in data state
      if (dataset.data[timestamp] !== undefined) continue;

      if (timestamp < requestedPoint.start) {
        requestedPoint.start = timestamp;
      }
      if (timestamp > requestedPoint.end) {
        requestedPoint.end = timestamp;
      }
    }

    // If no unloaded data, or start and end time are not valid, don't add request
    if (requestedPoint.start === Infinity || requestedPoint.end === -Infinity) {
      return false;
    }

    return requestedPoint;
  }

  getDataPoints(paneId, { source, name, timeframe, modelId, start, end }) {
    const dataset = this.addOrGetDataset({ source, name, modelId, timeframe });
    const id = dataset.getId();

    // Check if data points exist in memory
    const requestedPoint = this.hasDataPoints(paneId, arguments[1]);

    // If no data to request
    if (!requestedPoint) {
      const pane = panes.get()[paneId];

      pane.get().app.on("data", {
        dataset,
        dataModel: global.dataModels[modelId],
        timestamps: utils.getAllTimestampsIn(start, end, timeframe),
      });
    }

    // If need to request data
    else {
      this.buildRequest(arguments[1], requestedPoint);
    }
  }

  getAllDataPoints(paneId, { source, name, modelId, timeframe }) {
    const dataset = this.addOrGetDataset({ source, name, modelId, timeframe });
    const pane = panes.get()[paneId];

    pane.get().app.on("data", {
      dataset,
      dataModel: global.dataModels[modelId],
      timestamps: utils.getAllTimestampsIn(
        dataset.minTime,
        dataset.maxTime,
        timeframe
      ),
    });
  }

  unsubscribeFromDataset(paneId, { source, name, modelId, timeframe }) {
    const dataset = this.addOrGetDataset({ source, name, modelId, timeframe });
    dataset.unsubscribe(paneId);
  }

  buildRequest({ source, name, timeframe, modelId }, { start, end }) {
    // const { maxItemsPerRequest = 300 } =
    //   this.sources[dataset.source][dataset.name];
    const maxItemsPerRequest = 500;
    const batchSize = timeframe * maxItemsPerRequest;

    start = Math.floor(start / batchSize) * batchSize;
    end = Math.ceil(end / batchSize) * batchSize;

    const id = `${source}:${name}:${modelId}:${timeframe}`;
    this.allRequestedPoints[id] = { start, end };
  }

  fireRequest() {
    const allRequestedPoints = JSON.parse(
      JSON.stringify(this.allRequestedPoints)
    );
    this.allRequestedPoints = {};
    const datasetIds = Object.keys(allRequestedPoints);

    // Check if any requested times for any datasets
    if (!datasetIds.length) return;

    // Loop through all requested timestamps and mark their dataset data points as fetched
    for (const id of datasetIds) {
      const { start, end } = allRequestedPoints[id];
      const dataset = this.datasets[id];
      const { timeframe } = dataset;

      // This is so data does not get requested again
      for (const timestamp of utils.getAllTimestampsIn(start, end, timeframe)) {
        if (!dataset.data[timestamp]) {
          dataset.data[timestamp] = null;
        }
      }
    }

    // Build array with requested sources, names, timeframes, and start & end times
    let requests = [];

    for (const id of datasetIds) {
      let { start, end } = allRequestedPoints[id];
      const dataset = this.datasets[id];
      const { source, name, modelId, timeframe } = dataset;
      // const { maxItemsPerRequest = 300 } = this.sources[source][name];
      const maxItemsPerRequest = 500;

      // Loop from end to start timeframe on timeframe * itemsPerRequest || 3000 to batch requests if multiple needed
      let i =
        start === end ? 1 : (end - start) / (timeframe * maxItemsPerRequest);

      for (; i > 0; i--) {
        const leftBound = i <= 1 ? start : end - timeframe * maxItemsPerRequest;

        // If start and end are the same, ignore
        if (leftBound === end) continue;

        requests.push({
          id,
          source,
          name,
          modelId,
          timeframe,
          start: leftBound,
          end,
        });

        end -= timeframe * maxItemsPerRequest;
      }
    }

    // Sort by latest timestamps
    requests = requests.sort((a, b) => b.end - a.end);

    global.requestData(requests);
  }
}

class Dataset {
  constructor(source, name, modelId, timeframe, data) {
    this.source = source;
    this.name = name;
    this.modelId = modelId;
    this.timeframe = timeframe;
    this.data = data;
    this.subscribers = new Set();
    this.minTime = Infinity;
    this.maxTime = -Infinity;
  }

  getId() {
    return `${this.source}:${this.name}:${this.modelId}:${this.timeframe}`;
  }

  getTimeframeAgnosticId() {
    return `${this.source}:${this.name}:${this.modelId}`;
  }

  /**
   * Update the data and call all subscribers that updates were applied
   * @param {Object.<number,Object>} updates Object[time]{ ...values }
   */
  updateDataset(updates) {
    let timestamps = new Set();

    // Apply updates
    for (const key in updates) {
      let time = +key;

      timestamps.add(time);

      if (time < this.minTime) {
        this.minTime = time;
      }
      if (time > this.maxTime) {
        this.maxTime = time;
      }

      if (!this.data[time]) {
        this.data[time] = updates[key];
        continue;
      }

      this.data[time] = updates[key];
    }

    timestamps = Array.from(timestamps.keys()).sort((a, b) => a - b);

    // Hand data to all listeners
    for (const paneId of Array.from(this.subscribers.keys())) {
      const pane = panes.get()[paneId];

      pane.get().app.on("data", {
        dataset: {
          source: this.source,
          name: this.name,
          timeframe: this.timeframe,
          data: this.data,
        },
        dataModel: global.dataModels[this.modelId],
        timestamps,
      });
    }
  }

  subscribe(paneId) {
    this.subscribers.add(paneId);
  }

  unsubscribe(paneId) {
    this.subscribers.delete(paneId);

    // If no more subscribers, delete from memory
    if (this.subscribers.size === 0) {
      delete global.data.datasets[this.getId()];
    }
  }
}

export default new DataState();
