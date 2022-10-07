import Chart from "./Chart";

export default param0 => ({
  app: Chart(param0),

  // methods() {
  //   return {
  //     ShowAddDataModel: {
  //       name: "Add Data",
  //       method: () => {},
  //     },
  //     SetTimeframe: {
  //       name: "Set Timeframe",
  //       method: tf => this.app.setTimeframe(tf),
  //     },
  //   };
  // },

  // actions() {
  //   return {

  //   }
  // },

  menus() {
    return {
      main: (chart, e) => {
        const { clientY } = e;

        // Get the layer
        const layerId = chart.getLayerByYCoord(clientY);
        const layer = chart.ranges.y.get()[layerId];
        const { fullscreen } = layer.get();

        return {
          title: chart.name.get(),
          config: [
            {
              type: "list",
              title: "Layer",
              children: [
                {
                  type: "button",
                  text: "Reset price scale",
                  onClick: () => {
                    layer.set(v => ({ ...v, lockedYScale: true }));
                    chart.setVisibleRange({});
                  },
                },
                {
                  type: "button",
                  text: fullscreen ? "Exit fullscreen" : "Make fullscreen",
                  onClick: () => {
                    layer.set(v => ({ ...v, fullscreen: !v.fullscreen }));
                    chart.dimensions.updateLayers();
                    chart.workers.generateAllInstructions();
                  },
                },
                {
                  type: "button",
                  text: "Delete layer",
                  disabled: true,
                  onClick: () => {},
                },
              ],
            },
            {
              type: "list",
              title: "Chart",
              children: [
                {
                  type: "button",
                  text: "Reset view",
                  onClick: () => {
                    chart.setInitialVisibleRange();
                  },
                },
                {
                  type: "button",
                  text: "Clear chart",
                  disabled: true,
                  onClick: () => {},
                },
                {
                  type: "button",
                  text: "Delete chart",
                  disabled: true,
                  onClick: () => {},
                },
              ],
            },
          ],
        };
      },

      yScale: (chart, e) => {
        const { clientY } = e;

        // Get the layer
        const layerId = chart.getLayerByYCoord(clientY);
        const layer = chart.ranges.y.get()[layerId];
        const { scaleType } = layer.get();

        return {
          title: chart.name.get(),
          config: [
            {
              type: "list",
              title: "Set scale type",
              children: [
                {
                  type: "button",
                  text: "Default",
                  onClick: () => {
                    layer.set(v => ({ ...v, scaleType: "default" }));
                    chart.workers.generateAllInstructions();
                  },
                },
                {
                  type: "button",
                  text: "Percent",
                  onClick: () => {
                    layer.set(v => ({ ...v, scaleType: "percent" }));
                    chart.workers.generateAllInstructions();
                  },
                },
                {
                  type: "button",
                  text: "Normalized",
                  onClick: () => {
                    layer.set(v => ({ ...v, scaleType: "normalized" }));
                    chart.workers.generateAllInstructions();
                  },
                },
              ],
            },
          ],
        };
      },
    };
  },
});
