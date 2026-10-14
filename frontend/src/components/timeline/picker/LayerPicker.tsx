import React, { useMemo, useState } from "react";

import type { LayerConfig } from "../timelineTypes";

import LayerButton from "../canvas/layer/button/LayerButton";

import "./LayerPicker.css";

interface LayerPickerProps {
  layers: LayerConfig[];
}

const LayerPicker: React.FC<LayerPickerProps> = ({
  layers,
}) => {
 

  const hiddenLayers = useMemo(
    () =>
      layers.filter(
        (layer) => !layer.show
      ),
    [layers]
  );

  return (
    <div className="layer-picker">
        
     
        <div className="layer-picker-menu">
          {hiddenLayers.length === 0 ? (
            <div className="layer-picker-empty">
              All layers are visible
            </div>
          ) : (
            hiddenLayers.map((layer) => (
                <div className="timeline-layer-control">
                    <LayerButton
                    layerColor={layer.color}
                    layerTypeName={layer.label}
                    showLayer={layer.show}
                    setShowLayer={layer.setShow}
                    />
                </div>
            ))
          )}
        </div>
     
    </div>
  );
};

export default LayerPicker;