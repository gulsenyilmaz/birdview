
import "./TimeSlider.css";
import LayerButton from "./LayerButton";
import type { Movement } from "../../entities/Movement";
import { getColorForLabelString } from "../../utils/colorUtils";
import { useMemo, useState } from "react";
import * as d3 from "d3";



interface MovementTimelineProps {
   
  windowRange?: [number, number];
  movements: Movement[];
  setSelectedMovement: (obj: Movement) => void;
  layerTypeName: string;
  layerColor:string;

}

const MovementTimeline: React.FC<MovementTimelineProps> = ({
  
  
  windowRange = [1200, 2025],
  movements,
  setSelectedMovement,
  layerTypeName,
  layerColor,
        
}) => {
  const [showLayer, setShowLayer] = useState(false);
  const [minYear, maxYear] = windowRange;
 

  const filteredMovements = useMemo(() => {
  
    return movements
        .filter((mov: any) => {
          const s = mov.start_date ?? minYear;
          const e = mov.end_date  ?? maxYear;
          return mov.start_date && mov.end_date && s <= maxYear && e >= minYear;
        })
        .map((rel: any) => ({
          ...rel,
          visibleStart: Math.max(rel.start_date ?? minYear, minYear),
          visibleEnd: Math.min(rel.end_date ?? maxYear, maxYear)
        }));
  
    }, [movements, minYear, maxYear]);

    const width = 900;
    const rowHeight = 6;

    const timelineHeight = filteredMovements.length * rowHeight;
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

  
   

  return (
    
      <div className="timeline-row">
            <div className="timeline-main">

              {showLayer && (

                <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMin meet">
                   
                    {filteredMovements.map((rel: any, i: number) => {
                    const y = margin.top + i * rowHeight + 2;
                    const x1 = xScale(rel.visibleStart==maxYear?rel.visibleStart-1:rel.visibleStart);
                    const x2 = xScale(rel.visibleEnd==minYear?rel.visibleEnd+1:rel.visibleEnd);
                    const barWidth = Math.max(3, x2 - x1);
                    const color = getColorForLabelString(rel.name);
        
                    const xS1 = xScale(rel.birth_date ? Math.max(rel.birth_date, minYear) : minYear);
                    const xS2 = xScale(rel.death_date ? Math.min(rel.death_date, maxYear) : maxYear );
                    const barSWidth = Math.max(3, xS2 - xS1);
        
                    return (
                         <g
                            key={`${rel.qid}-${i}`}
                            onClick={() => setSelectedMovement(rel)}
                            style={{ cursor: "pointer" }}
                            >
                       
                        {/* bar */}
                        <rect
                            x={xS1}
                            y={y}
                            width={barSWidth}
                            height={rowHeight-0.8}
                            rx={0}
                            fill={color}
                            opacity={0.3}
                        />
                        <rect
                            x={x1}
                            y={y}
                            width={barWidth}
                            height={rowHeight-0.8}
                            rx={0}
                            fill={color}
                            opacity={0.7}
                        />
        
                        {/* optional dates */}
                        <text
                            x={x1}
                            y={y + 4}
                            fontSize="5"
                            fontWeight={500}
                            fill="#fefcfc"
                        >{" – "}{rel.name}
                            {rel.start_date ?? "?"}
                            {" – "}
                            {rel.end_date ?? "?"}
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
            {/* <button
                className={`label-button ${showLayer ? "active" : ""}`}
                style={{color:getLayerColor(layerTypeName) }}
                onClick={handleShowAction}
            >
                
                {layerTypeName}

                {showLayer ? <FaEyeSlash /> : <FaEye />}
            </button> */}
                
        </div>
      </div> 
    
     

  );
};

export default MovementTimeline;