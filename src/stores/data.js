import Utils from "../../utils";
export default class DataState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;
    this.datasets = {};
    this.sources = {};

    this.allRequestedPoints = {};
    this.requestInterval = setInterval(this.fireRequest.bind(this), 250);
  }

  init() {}

  setAllDataSources(sources) {
    this.sources = sources;
    this.fire("set-all-data-sources", this.sources);
  }

  getDataSource(source, name) {
    return this.sources[source][name];
  }

  addOrGetDataset({ source, name, timeframe, data = {} }) {
    let dataset;
    const datasetId = `${source}:${name}:${timeframe}`;

    // If dataset does not exist, fetch and create
    if (!this.datasets[datasetId]) {
      dataset = new Dataset(this.$global, source, name, timeframe, data);
      this.datasets[datasetId] = dataset;
    } else {
      dataset = this.datasets[datasetId];
    }

    this.fire("add-dataset", dataset);
    return dataset;
  }

  requestDataPoints({ dataset, start, end }) {
    const { timeframe } = dataset;
    const id = dataset.getId();
    const now = Date.now();

    const requestedPoint = [Infinity, -Infinity, new Set()];
    const dependencies = Array.from(dataset.dependencies.keys());

    const { maxItemsPerRequest = 300 } =
      this.sources[dataset.source][dataset.name];

    // Get left and right bound times based on batch interval of dataset
    const batchSize = timeframe * maxItemsPerRequest;
    const leftBound = start - (start % batchSize);
    const rightBound = end - (end % batchSize) + batchSize;

    // Loop through each requested timestamp and check if any are not found
    for (const timestamp of Utils.getAllTimestampsIn(
      leftBound,
      rightBound,
      timeframe
    )) {
      // Check if greater than now
      if (timestamp > now - (now % timeframe) + timeframe) break;

      const missingData = [];

      // Check if in data state
      if (dataset.data[timestamp] === undefined) {
        missingData = dependencies;
      } else {
        // Check all models for missing data
        for (const d of dependencies) {
          if (dataset.data[timestamp][d] === undefined) {
            missingData.push(d);
          }
        }
      }

      if (!missingData.length) continue;

      // Add to state
      missingData.forEach((m) => requestedPoint[2].add(m));
      if (timestamp < requestedPoint[0]) {
        requestedPoint[0] = timestamp;
      }
      if (timestamp > requestedPoint[1]) {
        requestedPoint[1] = timestamp;
      }
    }

    // If no unloaded data, or start and end time are not valid, don't add request
    if (requestedPoint[0] === Infinity || requestedPoint[1] === -Infinity) {
      return;
    }

    requestedPoint[2] = Array.from(requestedPoint[2].keys());

    requestedPoint[0] = Math.floor(requestedPoint[0] / batchSize) * batchSize;
    requestedPoint[1] = Math.ceil(requestedPoint[1] / batchSize) * batchSize;

    this.allRequestedPoints[id] = requestedPoint;
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
      const [start, end, dataModels] = allRequestedPoints[id];
      const dataset = this.datasets[id];
      const { timeframe } = dataset;

      // This is so data does not get requested again
      for (const timestamp of Utils.getAllTimestampsIn(start, end, timeframe)) {
        if (!dataset.data[timestamp]) {
          dataset.data[timestamp] = {};
        }

        for (const dataModel of dataModels) {
          dataset.data[timestamp][dataModel] = null;
        }
      }
    }

    // Build array with requested sources, names, timeframes, and start & end times
    let requests = [];
    for (const id of datasetIds) {
      let [start, end, dataModels] = allRequestedPoints[id];
      const dataset = this.datasets[id];
      const { source, name, timeframe } = dataset;
      const { maxItemsPerRequest = 300 } = this.sources[source][name];

      // Loop from end to start timeframe on timeframe * itemsPerRequest || 3000 to batch requests if multiple needed
      let i =
        start === end ? 1 : (end - start) / (timeframe * maxItemsPerRequest);

      for (; i > 0; i--) {
        const leftBound = i <= 1 ? start : end - timeframe * maxItemsPerRequest;

        dataModels.forEach((m) => dataset.pendingRequests[m]++);

        // If start and end are the same, ignore
        if (leftBound === end) continue;

        requests.push({
          id,
          source,
          name,
          dataModels,
          timeframe,
          start: leftBound,
          end,
        });

        end -= timeframe * maxItemsPerRequest;
      }

      dataset.fire("pending-requests", dataset.pendingRequests);
    }

    // Sort by latest timestamps
    requests = requests.sort((a, b) => b.end - a.end);

    this.$global.api.onRequestHistoricalData({
      requests,
    });
  }
}
