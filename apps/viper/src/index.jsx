import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import API from "../../../packages/api";

import Chart from "../../../packages/pane/chart/src";

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
});

$api.requestData = async ({
  source,
  name,
  timeframe,
  dataModel,
  start,
  end,
}) => {
  if (source === "BINANCE") {
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

      const isoString = new Date(timestamp).toISOString();

      data[isoString] = {
        open: +open,
        high: +high,
        low: +low,
        close: +close,
      };
    }

    // Viper.addData({ source, name, timeframe, dataModel }, data);
    // TODO return data
  }
};
$api.emit = () => {};
$api.showModal = () => {};

window.chart = new Chart({
  element: document.getElementById("root"),
  timeframe: 3.6e6,
  $api,

  config: {
    timeframes: [6e4, 6e4 * 5, 6e4 * 15, 6e4 * 60, 6e4 * 60 * 4, 6e4 * 60 * 24],
  },
});

// render(() => <App />, document.getElementById('root'));
