import React, { useId, useState } from "react";

import { IoSettings, IoSettingsOutline } from "react-icons/io5";

import "./MapControls.css";

export type MapLayerType = "arc" | "text" | "circle";
export type MapColorType = "age" | "gender" | "nationality";

interface MapControlsProps {
  manualMode: boolean;
  setManualMode: (value: boolean) => void;

  showHumanControls: boolean;

  selectedLayerType: MapLayerType;
  setSelectedLayerType: (value: MapLayerType) => void;

  colorFilterType: MapColorType;
  setColorFilterType: (value: MapColorType) => void;

  identifierThreshold: number;
  setIdentifierThreshold: (value: number) => void;
  maxIdentifierThreshold: number;
}

const layerOptions: {
  value: MapLayerType;
  label: string;
}[] = [
  { value: "arc", label: "Arcs" },
  { value: "text", label: "Names" },
  { value: "circle", label: "Circles" },
];

const colorOptions: {
  value: MapColorType;
  label: string;
}[] = [
  { value: "age", label: "Age" },
  { value: "gender", label: "Gender" },
  { value: "nationality", label: "Nationality" },
];

const MapControls: React.FC<MapControlsProps> = ({
  manualMode,
  setManualMode,
  showHumanControls,
  selectedLayerType,
  setSelectedLayerType,
  colorFilterType,
  setColorFilterType,
  identifierThreshold,
  setIdentifierThreshold,
  maxIdentifierThreshold,
}) => {
  const controlId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`map-settings${isOpen ? " open" : ""}`}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !isOpen) return;

        event.stopPropagation();
        setIsOpen(false);

        event.currentTarget
          .querySelector<HTMLButtonElement>(".map-settings-toggle")
          ?.focus();
      }}
    >
      <div className="map-settings-viewport">
        <div
          id={`${controlId}-panel`}
          className="map-controls"
          aria-hidden={!isOpen}
        >
          <label className="map-manual-control">
            <input
              type="checkbox"
              checked={manualMode}
              tabIndex={isOpen ? 0 : -1}
              onChange={(event) => setManualMode(event.target.checked)}
            />
            <span className="map-control-label">Manual Mode</span>
          </label>

          {showHumanControls && (
            <>
              <div
                className="map-controls-group"
                role="group"
                aria-labelledby={`${controlId}-display`}
              >
                <span
                  id={`${controlId}-display`}
                  className="map-controls-heading"
                >
                  Display
                </span>

                {layerOptions.map(({ value, label }) => (
                  <label className="map-control-option" key={value}>
                    <input
                      type="radio"
                      name={`${controlId}-layer`}
                      value={value}
                      checked={selectedLayerType === value}
                      tabIndex={isOpen ? undefined : -1}
                      onChange={() => setSelectedLayerType(value)}
                    />
                    <span className="map-control-label">{label}</span>
                  </label>
                ))}
              </div>

              <div
                className="map-controls-group"
                role="group"
                aria-labelledby={`${controlId}-color`}
              >
                <span
                  id={`${controlId}-color`}
                  className="map-controls-heading"
                >
                  Color by
                </span>

                {colorOptions.map(({ value, label }) => (
                  <label className="map-control-option" key={value}>
                    <input
                      type="radio"
                      name={`${controlId}-color`}
                      value={value}
                      checked={colorFilterType === value}
                      tabIndex={isOpen ? undefined : -1}
                      onChange={() => setColorFilterType(value)}
                    />
                    <span className="map-control-label">{label}</span>
                  </label>
                ))}
              </div>

              <label
                className="map-prominence-control"
                title="Higher thresholds show fewer people, based on external identifier counts. People born before 1700 are always included."
              >
                <span className="map-control-label">Prominence</span>

                <input
                  type="range"
                  min={0}
                  max={maxIdentifierThreshold}
                  step={1}
                  value={identifierThreshold}
                  tabIndex={isOpen ? 0 : -1}
                  aria-label="Prominence threshold"
                  onChange={(event) =>
                    setIdentifierThreshold(event.target.valueAsNumber)
                  }
                />

                <span className="map-prominence-value">
                  &gt; {identifierThreshold}
                </span>
              </label>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`map-settings-toggle${isOpen ? " active" : ""}`}
        aria-expanded={isOpen}
        aria-controls={`${controlId}-panel`}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span aria-hidden="true">{isOpen ? <IoSettings /> : <IoSettingsOutline />}</span>
        
      </button>
    </div>
  );
};

export default MapControls;