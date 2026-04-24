
import { useEffect, useState, useRef } from "react";

import * as d3 from "d3";
import "./TimeWindowSlider.css";


type Props = {
  fullRange: [number, number];       // tüm proje aralığı
  windowRange:[number, number];     // görünür pencere (örn. [1850, 1950])
  setWindowRange: (r: [number, number]) => void;
  selectedYear: number;                      // seçili yıl
  setSelectedYear: (y: number) => void;
  

};

const SNAP_STEP = 10;
const HANDLE_W = 10;
const HANDLE_H = 20;
const TRACK_H = 20;

export default function TimeWindowSlider({
  fullRange, 
  windowRange, 
  setWindowRange, 
  selectedYear, 
  setSelectedYear
 
}: Props) {

  const [alltime_minYear, alltime_maxYear] = fullRange;
  const [alltime_min, alltime_max] = fullRange;
  const [minYear, maxYear] = windowRange;
  
  const alltime_totalRange = alltime_maxYear - alltime_minYear;
  const totalRange = maxYear - minYear;
  const [zoom, setZoom] = useState(totalRange);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
 
  

  useEffect(() => {
    let newYear = selectedYear;
    if (selectedYear < minYear) newYear = minYear;
    else if (selectedYear > maxYear) newYear = maxYear;

    if (newYear !== selectedYear) {
      setSelectedYear(newYear);
    }
  }, [selectedYear, minYear, maxYear]); 

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = 50;
    const padX = HANDLE_W / 2;

    svg.attr("width", W).attr("height", H);
    svg.selectAll("*").remove();

    const xScale = d3.scaleLinear()
      .domain([alltime_min, alltime_max])
      .range([padX, W - padX]);

    const snap = (val: number) =>
      Math.round(val / SNAP_STEP) * SNAP_STEP;

    const clamp = (val: number) =>
      Math.max(alltime_min, Math.min(alltime_max, val));

    // Rail
    svg.append("rect")
      .attr("x", padX)
      .attr("y", H / 2 - TRACK_H / 2)
      .attr("width", W - HANDLE_W)
      .attr("height", TRACK_H)
      .attr("fill", "#D3D1C7")
      .attr("rx", 0);

    // Track (seçili alan)
    const track = svg.append("rect")
      .attr("x", xScale(minYear))
      .attr("y", H / 2 - TRACK_H / 2)
      .attr("width", xScale(maxYear) - xScale(minYear))
      .attr("height", TRACK_H)
      .attr("fill", "#15b8bb92")
      .attr("rx", 0);

    // Min label
    const minLabel = svg.append("text")
      .attr("x", xScale(minYear)+14)
      .attr("y", H / 2 + TRACK_H )
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "'Inter', sans-serif")
      .attr("font-weight", 500)
      .attr("fill", "#888780")
      .text(minYear);

    // Max label
    const maxLabel = svg.append("text")
      .attr("x", xScale(maxYear)-14)
      .attr("y", H / 2 + TRACK_H)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "'Inter', sans-serif")
      .attr("font-weight", 500)
      .attr("fill", "#888780")
      .text(maxYear);

    // Min handle
    const minHandle = svg.append("rect")
      .attr("x", xScale(minYear) - HANDLE_W / 2)
      .attr("y", H / 2 - HANDLE_H / 2)
      .attr("width", HANDLE_W)
      .attr("height", HANDLE_H)
      .attr("fill", "#15b8bbd7")
      .attr("stroke", "#189799d7")
      .attr("stroke-width", 1)
      .attr("rx", 0)
      .attr("cursor", "ew-resize");

    // Max handle
    const maxHandle = svg.append("rect")
      .attr("x", xScale(maxYear) - HANDLE_W / 2)
      .attr("y", H / 2 - HANDLE_H / 2)
      .attr("width", HANDLE_W)
      .attr("height", HANDLE_H)
      .attr("fill", "#15b8bbd7")
      .attr("stroke", "#189799d7")
      .attr("stroke-width", 1)
      .attr("rx", 0)
      .attr("cursor", "ew-resize");

    // Drag handlers
    let currentMin = minYear;
    let currentMax = maxYear;

    const dragMin = d3.drag<SVGRectElement, unknown>()
      .on("drag", (event) => {
        const rawVal = xScale.invert(event.x);
        const snapped = snap(clamp(rawVal));
        if (snapped >= currentMax) return;
        currentMin = snapped;

        minHandle.attr("x", xScale(currentMin) - HANDLE_W / 2);
        track
          .attr("x", xScale(currentMin))
          .attr("width", xScale(currentMax) - xScale(currentMin));
        minLabel.attr("x", xScale(currentMin)).text(currentMin);
      })
      .on("end", () => {
        setWindowRange([currentMin, currentMax]);
      });

    const dragMax = d3.drag<SVGRectElement, unknown>()
      .on("drag", (event) => {
        const rawVal = xScale.invert(event.x);
        const snapped = snap(clamp(rawVal));
        if (snapped <= currentMin) return;
        currentMax = Math.min(snapped, alltime_max);

        maxHandle.attr("x", xScale(currentMax) - HANDLE_W / 2);
        track.attr("width", xScale(currentMax) - xScale(currentMin));
        maxLabel.attr("x", xScale(currentMax)).text(currentMax);
      })
      .on("end", () => {
        setWindowRange([currentMin, currentMax]);
      });

    minHandle.call(dragMin);
    maxHandle.call(dragMax);

    // Alltime labels
    svg.append("text")
      .attr("x", padX+14)
      .attr("y", H / 2 + TRACK_H)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "'Inter', sans-serif")
      .attr("fill", "#888780")
      .text(alltime_min);

    svg.append("text")
      .attr("x", W - padX-14)
      .attr("y", H / 2 + TRACK_H)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "'Inter', sans-serif")
      .attr("fill", "#888780")
      .text(alltime_max);

  }, [fullRange, windowRange]);


  useEffect(() => {
    setZoom(maxYear - minYear);
  }, [minYear, maxYear]);
  
  const recalculateWindowRange = (n_totalRange:number) => {
    const centerYear = (minYear + maxYear) / 2;
    const halfRange = n_totalRange / 2;
    let newMin = Math.max(alltime_minYear, Math.floor(centerYear - halfRange));
    let newMax = Math.min(alltime_maxYear, Math.ceil(centerYear + halfRange));

    // Sınır kontrolleri
    if (newMin === alltime_minYear) {
      newMax = newMin + n_totalRange;
    } else if (newMax === alltime_maxYear) {
      newMin = newMax - n_totalRange;
    }

    // Eğer seçili yıl yeni aralığın dışındaysa, onu da ortala
    if (selectedYear < newMin || selectedYear > newMax) {
      const adjustedCenter = Math.min(
        Math.max(selectedYear, alltime_minYear + halfRange),
        alltime_maxYear - halfRange
      );
      newMin = Math.floor(adjustedCenter - halfRange);
      newMax = Math.ceil(adjustedCenter + halfRange);
    }

    setWindowRange([newMin, newMax]);
  }


  

  return (

    
    <div className="tw-container">
  
          <div className="tw-window" ref={containerRef}>
      <svg ref={svgRef} style={{ display: "block", overflow: "visible" }} />
    </div>
          

          <div className="zoom-slider-wrapper">
            <span className="zoom-label"> - </span>
              <input
                  // className="zoom-slider"
                  type="range"
                  min= {100}
                  max={alltime_totalRange}
                  step={1}
                  value={zoom}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    // setZoom(v);
                    recalculateWindowRange(v);
                  }}
                />
            <span className="zoom-label"> + </span>
          </div>
          
    </div>
  );
}
