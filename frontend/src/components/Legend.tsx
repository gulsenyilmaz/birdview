import React from "react";
import { getColorForRelationTypeString } from "../utils/colorUtils";

interface LegendProps {
  items: string[]; // relationship_type_name listesi
}

const Legend: React.FC<LegendProps> = ({ items }) => {
  return (
    <div className="legend">
      {items.map((type) => {
        const color = getColorForRelationTypeString(type);

        return (
          <div key={type} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: color }}
            />
            <span className="legend-label" style={{ color: color }}>{type}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Legend;