import Chart from "./src/index";
import API from "../../api";

const datasets = {
  BINANCE: await getDatasetsFromBinance(),
};
const dataModels = {
  price: {
    id: "price",
    model: "ohlc",
    name: "Price",
    label: `%s:%n`,
  },
};

async function getDatasetsFromBinance() {
  const res = await fetch("https://www.binance.com/api/v3/exchangeInfo");
  const json = await res.json();

  const datasets = {};

  for (const item of json.symbols) {
    datasets[item.symbol] = {
      source: "BINANCE",
      name: item.symbol,
      modelIds: ["price"],
    };
  }

  return datasets;
}

// Create a chart
const $api = new API({
  datasets,
  dataModels,
  requestData: async ({ source, name, timeframe, modelId, start, end }) => {
    console.log(source, name);

    if (source === "Binance") {
      const tf = {
        60000: "1m",
        [60000 * 5]: "5m",
        [60000 * 15]: "15m",
        [60000 * 60]: "1h",
        [60000 * 60 * 4]: "4h",
        [60000 * 60 * 24]: "1d",
      }[timeframe];

      const res = await fetch(
        `https://www.binance.com/api/v3/klines?symbol=${name}&interval=${tf}&startTime=${start}&endTime=${end}`
      );
      const json = await res.json();

      const data = {};

      for (const item of json) {
        const [timestamp, open, high, low, close] = item;

        data[timestamp] = {
          open: +open,
          high: +high,
          low: +low,
          close: +close,
        };
      }

      return data;
    }
  },
});

window.chart = new Chart({
  element: document.getElementById("root"),
  $api,
});

const group = chart.createDatasetGroup({ source: "Binance", name: "BTCUSDT" });
chart.addIndicator(
  {
    id: "line",
    version: "1.0.0",
    name: "Line",
    dependencies: ["value"],
    draw({ value, plot }) {
      plot({
        value,
        title: "Line",
        color: this.color,
        linewidth: 2,
        ylabel: true,
      });
    },
  },
  group,
  {
    id: "price",
    model: "ohlc",
    name: "Price",
    label: `%s:%n`,
  },
  {}
);
