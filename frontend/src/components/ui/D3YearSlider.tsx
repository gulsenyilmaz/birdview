import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const D3YearSlider: React.FC<{
  minYear: number;
  maxYear: number;
  selectedYear: number;
  onYearChange: (year: number) => void;
}> = ({ minYear, maxYear, selectedYear, onYearChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const HANDLE_W = 12;
  const HANDLE_H = 20;
  const TRACK_H = 1;

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = HANDLE_H;
    const padX = HANDLE_W / 2;

    svg.attr("width", W).attr("height", H);
    svg.selectAll("*").remove();

    const xScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([padX, W - padX]);

    const clamp = (val: number) =>
      Math.max(minYear, Math.min(maxYear, Math.round(val)));

    svg.append("rect")
      .attr("x", padX)
      .attr("y", H / 2 - TRACK_H / 2)
      .attr("width", W - HANDLE_W)
      .attr("height", TRACK_H)
      .attr("fill", "#D3D1C7");

    const handle = svg.append("rect")
      .attr("x", xScale(selectedYear) - HANDLE_W / 2)
      .attr("y", 0)
      .attr("width", HANDLE_W)
      .attr("height", HANDLE_H)
      .attr("fill", "#D85A30")
      .attr("stroke", "#F0997B")
      .attr("stroke-width", 1)
      .attr("cursor", "col-resize");

    svg.on("click", (event) => {
      const [x] = d3.pointer(event);
      const year = clamp(xScale.invert(x));
      handle.attr("x", xScale(year) - HANDLE_W / 2);
      onYearChange(year);
    });

    const drag = d3.drag<SVGRectElement, unknown>()
      .on("drag", (event) => {
        const year = clamp(xScale.invert(event.x));
        handle.attr("x", xScale(year) - HANDLE_W / 2);
        onYearChange(year);
      });

    handle.call(drag);

  }, [minYear, maxYear]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const padX = HANDLE_W / 2;
    const xScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([padX, W - padX]);

    svg.selectAll<SVGRectElement, unknown>("rect")
      .filter((_, i, nodes) => nodes[i] === nodes[nodes.length - 1])
      .attr("x", xScale(selectedYear) - HANDLE_W / 2);

  }, [selectedYear, minYear, maxYear]);

  return (
    
    <div ref={containerRef} style={{ width: "100%", height: `${HANDLE_H}px` }}>
      <svg ref={svgRef} style={{ display: "block", overflow: "visible" }} />
    </div>
  );
};

export default D3YearSlider;