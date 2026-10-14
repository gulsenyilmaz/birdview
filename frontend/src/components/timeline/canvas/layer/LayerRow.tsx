import React from "react";

import LayerButton from "./button/LayerButton";
import HistogramLayer from "./renderers/HistogramLayer";
import BarLayer from "./renderers/BarLayer";

import type {
  LayerConfig,
  TimelineXScale,
} from "../../timelineTypes";

interface LayerRowProps {
  layer: LayerConfig;

  chartWidth: number;

  minYear: number;
  maxYear: number;

  selectedYear: number;

  xScale: TimelineXScale;

  setSelectedYear: (year: number) => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  chartWidth,
  minYear,
  maxYear,
  selectedYear,
  xScale,
  setSelectedYear,
}) => {
  return (
    <div className="timeline-layer-row">
      <div className="timeline-layer-chart">
        {layer.type === "histogram" && (
          <HistogramLayer
            layer={layer}
            chartWidth={chartWidth}
            minYear={minYear}
            maxYear={maxYear}
            selectedYear={selectedYear}
            xScale={xScale}
            setSelectedYear={setSelectedYear}
          />
        )}

        {layer.type === "bar" && (
          <BarLayer
            layer={layer}
            chartWidth={chartWidth}
            minYear={minYear}
            maxYear={maxYear}
            selectedYear={selectedYear}
            xScale={xScale}
          />
        )}
      </div>

      <div className="timeline-layer-control">
        <LayerButton
          layerColor={layer.color}
          layerTypeName={layer.label}
          showLayer={layer.show}
          setShowLayer={layer.setShow}
        />
      </div>
    </div>
  );
};

export default LayerRow;