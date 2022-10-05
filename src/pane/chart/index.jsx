import Chart from "./Chart";

const actions = [];

const contextmenus = {
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
};

export default {
  app: Chart,
  actions,
  contextmenus,
};
