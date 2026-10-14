import React from "react";

interface ZoomControlProps {
  value: number;

  min: number;
  max: number;

  onChange: (value: number) => void;
}

const ZoomControl: React.FC<ZoomControlProps> = ({
  value,
  min,
  max,
  onChange,
}) => {
  return (
    <div className="zoom-slider-wrapper">
      <span className="zoom-label">
        −
      </span>

      <input
        className="zoom-slider"
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => {
          onChange(
            Number(event.target.value)
          );
        }}
      />

      <span className="zoom-label">
        +
      </span>
    </div>
  );
};

export default ZoomControl;