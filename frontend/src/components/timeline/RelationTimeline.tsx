import React, { useMemo, useState,useEffect } from "react";
import "./TimeSlider.css";
import * as d3 from "d3";
import { getLayerColor, getColorForRelationTypeString } from "../../utils/colorUtils";
import type { RelatedHuman } from "../../entities/RelatedHuman";
import Legend from "../Legend";

interface RelationTimelineProps {
  humanRelations: RelatedHuman[];
  windowRange?: [number, number];
  layerTypeName: string;
  showLayer?: boolean;
  setShowLayer: (ch: boolean) => void;
}

const RelationTimeline: React.FC<RelationTimelineProps> = ({
  humanRelations,
  windowRange = [1200, 2025],
  layerTypeName,
  showLayer = true,
  setShowLayer
}) => {
  const [minYear, maxYear] = windowRange;
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);

  const filteredRelations = useMemo(() => {
    
    return humanRelations
      .filter((rel) => {
        const s = (rel.start_date ?? rel.birth_date ) ?? minYear;
        const e = (rel.end_date ?? rel.death_date ) ?? maxYear;
        return s <= maxYear && e >= minYear;
      })
      .map((rel) => ({
        ...rel,
        visibleStart: Math.max((rel.start_date ?? rel.birth_date ) ?? minYear, minYear),
        visibleEnd: Math.min((rel.end_date ?? rel.death_date ) ?? maxYear, maxYear)
      }));
  }, [humanRelations, minYear, maxYear]);

  console.log("Filtered Relations:", humanRelations);

  const width = 900;
  const rowHeight = 5;
  
  const timelineHeight = filteredRelations.length * rowHeight;
  const height = timelineHeight +1;

  const margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  const xScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([minYear, maxYear])
      .range([margin.left, width - margin.right]);
  }, [minYear, maxYear]);



  const handleShowAction = () => {
    setShowLayer(!showLayer);
  };

  useEffect(() => {
    setUniqueTypes( Array.from(
        new Set(
            filteredRelations.map(l => l.relationship_type_name)
        )
    ));
  }, [filteredRelations]);

  return (
    <div className="relations-container">
      <div className="relations-wrapper">
        {showLayer && (
          <svg
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMinYMin meet"
          >
          

            {/* rows */}
            {filteredRelations.map((rel, i) => {
              const y = margin.top + i * rowHeight + 2;
              const x1 = xScale(rel.visibleStart);
              const x2 = xScale(rel.visibleEnd);
              const barWidth = Math.max(3, x2 - x1);
              const color = getColorForRelationTypeString(rel.relationship_type_name);

              const xS1 = xScale(Math.max(rel.birth_date, minYear));
              const xS2 = xScale(rel.death_date ? Math.min(rel.death_date, maxYear) : maxYear );
              const barSWidth = Math.max(3, xS2 - xS1);

              return (
                <g key={`${rel.qid}-${i}`}>
                 {/* optional dates */}
                 

                  {/* bar */}
                  <rect
                    x={xS1}
                    y={y}
                    width={barSWidth}
                    height={rowHeight-0.4}
                    rx={0}
                    fill={color}
                    opacity={0.3}
                  />
                  <rect
                    x={x1}
                    y={y}
                    width={barWidth}
                    height={rowHeight-0.4}
                    rx={0}
                    fill={color}
                    opacity={0.7}
                  />

                  {/* optional dates */}
                  <text
                    x={x1 }
                    y={y + 4}
                    fontSize="5"
                    fontWeight={500}
                    fill="#fefcfc"
                  >{" – "}{rel.name}
                    {rel.birth_date ?? "?"}
                    {" – "}
                    {rel.death_date ?? "?"}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="label-group" style={{ color: getLayerColor(layerTypeName) }}>
        <button
          className={`label-button ${showLayer ? "active" : ""}`}
          style={{ backgroundColor: getLayerColor(layerTypeName) }}
          onClick={handleShowAction}
        >
          {layerTypeName}
        </button>
        {showLayer && (
        <Legend items={uniqueTypes} />
        )}
      </div>
    </div>
  );
};

export default RelationTimeline;