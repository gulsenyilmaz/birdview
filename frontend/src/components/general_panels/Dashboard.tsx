import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./Dashboard.css";
import type { Human } from "../../entities/Human";
import {
  getColorForLabelString,
  getColorForGenderString,
} from "../../utils/colorUtils";

interface DashboardProps {
  selectedYear: number;
  humans: Human[];
}

interface ChartItem {
  label: string;
  value: number;
  color: string;
}

const TOP_N = 5;
const BAR_HEIGHT = 10;
const BAR_GAP = 5;
const MARGIN = { top: 8, right: 16, bottom: 4, left: 0 };

const BarChart: React.FC<{ data: ChartItem[]; labelWidth: number }> = ({ data, labelWidth }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!data.length) return;

    const containerWidth = svgRef.current?.parentElement?.clientWidth ?? 200;
    const barAreaWidth = containerWidth - labelWidth - MARGIN.right;
    const totalHeight = TOP_N * (BAR_HEIGHT + BAR_GAP) + MARGIN.top + MARGIN.bottom;

    svg.attr("width", containerWidth).attr("height", totalHeight);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) ?? 1])
      .range([0, barAreaWidth]);

    const g = svg.append("g").attr("transform", `translate(${labelWidth}, ${MARGIN.top})`);

    data.forEach((d, i) => {
      const y = i * (BAR_HEIGHT + BAR_GAP);

      g.append("text")
        .attr("x", -6)
        .attr("y", y + BAR_HEIGHT / 2 + 3)
        .attr("text-anchor", "end")
        .attr("font-size", 10)
        .attr("font-family", "'Georgia', sans-serif")
        .attr("font-weight", 500)
        .attr("letter-spacing", "0.06em")
        .attr("fill", "#888780")
        .text(d.label);

      g.append("rect")
        .attr("x", 0)
        .attr("y", y)
        .attr("width", Math.max(xScale(d.value), 0))
        .attr("height", BAR_HEIGHT)
        .attr("rx", 2)
        .attr("fill", d.color);

      g.append("text")
        .attr("x", xScale(d.value) + 4)
        .attr("y", y + BAR_HEIGHT / 2 + 3)
        .attr("font-size", 9)
        .attr("font-family", "'Georgia', sans-serif")
        .attr("fill", "#5F5E5A")
        .text(d.value);
    });

  }, [data, labelWidth]);

  return <svg ref={svgRef} style={{ display: "block", overflow: "visible" }} />;
};

const Dashboard: React.FC<DashboardProps> = ({ selectedYear, humans }) => {
  const nationalityCounter: Record<string, number> = {};
  const cityCounter: Record<number, { name: string; count: number }> = {};
  const genderCounter: Record<string, number> = {};

  for (const h of humans) {
    if (h.nationality) {
      nationalityCounter[h.nationality] = (nationalityCounter[h.nationality] || 0) + 1;
    }
    if (h.city_id && h.city) {
      if (!cityCounter[h.city_id]) cityCounter[h.city_id] = { name: h.city, count: 0 };
      cityCounter[h.city_id].count += 1;
    }
    if (h.gender) {
      genderCounter[h.gender] = (genderCounter[h.gender] || 0) + 1;
    }
  }

  const nationalityData: ChartItem[] = Object.entries(nationalityCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([label, value]) => ({ label, value, color: getColorForLabelString(label) }));

  const cityData: ChartItem[] = Object.entries(cityCounter)
    .map(([, { name, count }]) => ({ label: name, value: count, color: "#BA7517" }))
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_N);

  const genderData: ChartItem[] = Object.entries(genderCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([label, value]) => ({ label, value, color: getColorForGenderString(label) }));

  const labelW = (data: ChartItem[]) =>
    Math.max(50, Math.max(0, ...data.map(d => d.label.length)) * 7);

  return (
  <>
    {humans && humans.length > 0 && (
      <div className="dashboard-container active">

        <div className="year-display">
          <span className="year-display-label">year</span>
          <span className="year-display-value">{selectedYear}</span>
        </div>

        <div className="chart-divider" style={{ margin: "0 0.4rem" }} />

        <div className="dashboard-charts">
          <div className="chart-box">
            <div className="chart-box-title">nationality</div>
            <BarChart data={nationalityData} labelWidth={labelW(nationalityData)} />
          </div>
          <div className="chart-divider" />
          <div className="chart-box">
            <div className="chart-box-title">city</div>
            <BarChart data={cityData} labelWidth={labelW(cityData)} />
          </div>
          <div className="chart-divider" />
          <div className="chart-box">
            <div className="chart-box-title">gender</div>
            <BarChart data={genderData} labelWidth={labelW(genderData)} />
          </div>
        </div>

      </div>
    )}
  </>
);
};

export default Dashboard;