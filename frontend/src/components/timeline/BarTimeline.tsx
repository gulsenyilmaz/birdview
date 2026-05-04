import "./TimeSlider.css";

import React, { useMemo, useState, useEffect } from "react";
import * as d3 from "d3";

import LayerButton from "./LayerButton";
import Legend from "../Legend";


interface BarTimelineProps {

  windowRange?: [number, number];

  layerTypeName: string;
  layerColor:string;
  objectColor:(label: string) => string;

  currentData: any[];
  setSelectedData: (obj: any) => void;

}

const BarTimeline: React.FC<BarTimelineProps> = ({

  windowRange = [1200, 2025],

  layerTypeName,
  layerColor,
  objectColor,

  currentData,
  setSelectedData

}) => {
  const [showLayer, setShowLayer] = useState(false);
  const [minYear, maxYear] = windowRange;

  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);

  const filteredRelations = useMemo(() => {

    return currentData
      .filter((rel: any) => {
        const s = (rel.start_date ?? rel.birth_date ) ?? minYear;
        const e = (rel.end_date ?? rel.death_date ) ?? maxYear;
        return s <= maxYear && e >= minYear;
      })
      .map((rel: any) => ({
        ...rel,
        visibleStart: Math.max((rel.start_date ?? rel.birth_date ) ?? minYear, minYear),
        visibleEnd: Math.min((rel.end_date ?? rel.death_date ) ?? maxYear, maxYear)
      }));

  }, [currentData, minYear, maxYear]);

  const width = 900;
  const rowHeight = 5;
  const rowGap = 1;
  
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

  useEffect(() => {
    setUniqueTypes( Array.from(
        new Set(
            filteredRelations.map((l: any) => l.relationship_type_name)
        )
    ));
  }, [filteredRelations]);

  return (
    <div className="timeline-row">
      <div className="timeline-main">
        {showLayer && (
          <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMin meet">

            {filteredRelations.map((rel: any, i: number) => {
              const y = margin.top + i * rowHeight + 2;
              const x1 = xScale(rel.visibleStart==maxYear?rel.visibleStart-1:rel.visibleStart);
              const x2 = xScale(rel.visibleEnd==minYear?rel.visibleEnd+1:rel.visibleEnd);
              const barWidth = Math.max(3, x2 - x1);
              const color = objectColor(rel.relationship_type_name?? rel.name);

              const xS1 = xScale(rel.birth_date ? Math.max(rel.birth_date, minYear) : minYear);
              const xS2 = xScale(rel.death_date ? Math.min(rel.death_date, maxYear) : maxYear );
              const barSWidth = Math.max(3, xS2 - xS1);

              return (
                <g
                  key={`${rel.qid}-${i}`}
                  onClick={() => setSelectedData(rel)}
                  style={{ cursor: "pointer" }}
                  >
                 
                  <rect
                    x={xS1}
                    y={y}
                    width={barSWidth+1}
                    height={rowHeight-rowGap}
                    rx={0}
                    fill={color}
                    opacity={0.3}
                  />

                  <rect
                    x={x1}
                    y={y}
                    width={barWidth}
                    height={rowHeight-rowGap}
                    rx={0}
                    fill={color}
                    opacity={0.7}
                  />

                  <text
                    x={x1}
                    y={y + 3.2}
                    fontSize="4"
                    fontWeight={900}
                    fill="#fefcfc"
                  >{" – "}{rel.name}
                    {rel.start_date ?? rel.birth_date ?? "?"}
                    {" – "}
                    {rel.end_date ?? rel.death_date ?? "?"}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="timeline-side">
        <LayerButton
            layerColor={layerColor}
            layerTypeName={layerTypeName}
            showLayer={showLayer}
            setShowLayer={setShowLayer}
          />
          {showLayer && (
            <Legend items={uniqueTypes} />
          )}
      </div>
    </div>
  );
};

export default BarTimeline;