import "./Dashboard.css";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import type { Human } from "../../entities/Human";
import {
  getColorForLabelString,
  getColorForGenderString,
} from "../../utils/colorUtils";

interface DashboardProps {
  humans: Human[];
  dashboardMode: boolean;
  setDashboardMode: (mode: boolean) => void;
}

interface ChartItem {
  label: string;
  value: number;
  color: string;
}

const TOP_N = 5;
const BAR_HEIGHT = 10;
const BAR_GAP = 5;
const BAR_HEIGHT_RATIO = BAR_HEIGHT / (BAR_HEIGHT + BAR_GAP);
const MARGIN = { top: 6, right: 16, bottom: 4, left: 0 };

const BarChart: React.FC<{
  data: ChartItem[];
  labelWidth: number;
}> = ({ data, labelWidth }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    const container = svgEl?.parentElement;

    if (!svgEl || !container) return;

    const draw = () => {
      const svg = d3.select(svgEl);

      svg.selectAll("*").remove();

      if (!data.length) return;

      const containerWidth = container.clientWidth || 200;

      const barAreaWidth = Math.max(
        0,
        containerWidth - labelWidth - MARGIN.right
      );

      const rowHeight = 15;
      const barHeight = rowHeight * BAR_HEIGHT_RATIO;

      const labelFontSize = Math.min(9, rowHeight * 0.65);
      const valueFontSize = Math.min(9, rowHeight * 0.65);

      svg
        .attr("width", containerWidth)
        .attr(
          "height",
          rowHeight * data.length + MARGIN.top + MARGIN.bottom
        );

      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) ?? 1])
        .range([0, barAreaWidth]);

      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${labelWidth}, ${MARGIN.top})`
        );

      data.forEach((d, i) => {
        const y = i * rowHeight;

        g.append("text")
          .attr("x", -2)
          .attr("y", y + barHeight / 2 + 3)
          .attr("text-anchor", "end")
          .attr("font-size", labelFontSize)
          .attr("font-family", "'Arial', sans-serif")
          .attr("font-weight", 500)
          .attr("letter-spacing", "0.06em")
          .attr("fill", "#828080")
          .text(d.label.toUpperCase());

        g.append("rect")
          .attr("x", 0)
          .attr("y", y)
          .attr("width", Math.max(xScale(d.value), 0))
          .attr("height", barHeight)
          .attr("rx", 2)
          .attr("fill", d.color);

        g.append("text")
          .attr("x", 2)
          .attr("y", y + barHeight / 2 + 3)
          .attr("font-size", valueFontSize)
          .attr("font-family", "'Arial', sans-serif")
          .attr("fill", "#ffefef")
          .attr("font-weight", 500)
          .text(d.value);
      });
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [data, labelWidth]);

  return (
    <svg
      ref={svgRef}
      style={{
        display: "block",
        overflow: "visible",
      }}
    />
  );
};

const Dashboard: React.FC<DashboardProps> = ({ humans, dashboardMode, setDashboardMode }) => {
  

  const nationalityCounter: Record<string, number> = {};

  const cityCounter: Record<
    number,
    {
      name: string;
      count: number;
    }
  > = {};

  const genderCounter: Record<string, number> = {};

  for (const h of humans) {
    if (h.nationality) {
      nationalityCounter[h.nationality] =
        (nationalityCounter[h.nationality] || 0) + 1;
    }

    if (h.city_id && h.city) {
      if (!cityCounter[h.city_id]) {
        cityCounter[h.city_id] = {
          name: h.city,
          count: 0,
        };
      }

      cityCounter[h.city_id].count += 1;
    }

    if (h.gender) {
      genderCounter[h.gender] =
        (genderCounter[h.gender] || 0) + 1;
    }
  }

  const nationalityData: ChartItem[] = Object.entries(
    nationalityCounter
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([label, value]) => ({
      label,
      value,
      color: getColorForLabelString(label),
    }));

  const cityData: ChartItem[] = Object.entries(cityCounter)
    .map(([, { name, count }]) => ({
      label: name,
      value: count,
      color: "#7aa260",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_N);

  const genderData: ChartItem[] = Object.entries(genderCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([label, value]) => ({
      label,
      value,
      color: getColorForGenderString(label),
    }));

  const labelW = (data: ChartItem[]) =>
    Math.max(
      50,
      Math.max(0, ...data.map((d) => d.label.length)) * 7
    );

  return (
    <>
    
        <div className="dashboard-container">
          {humans.length > 0 && (
            <div className="dashboard-charts">
              <div className="chart-box">
                <div className="chart-box-title">
                  nationality
                </div>

                <div className="chart-box-canvas">
                  <BarChart
                    data={nationalityData}
                    labelWidth={labelW(nationalityData)}
                  />
                </div>
              </div>

              <div className="chart-box">
                <div className="chart-box-title">
                  city
                </div>

                <div className="chart-box-canvas">
                  <BarChart
                    data={cityData}
                    labelWidth={labelW(cityData)}
                  />
                </div>
              </div>

              <div className="chart-box">
                <div className="chart-box-title">
                  gender
                </div>

                <div className="chart-box-canvas">
                  <BarChart
                    data={genderData}
                    labelWidth={labelW(genderData)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
     

      <button
        type="button"
        className="dashboard-close"
        onClick={() => setDashboardMode(!dashboardMode)}
        aria-label={
          dashboardMode
            ? "Close dashboard"
            : "Open dashboard"
        }
        title={
          dashboardMode
            ? "Close dashboard"
            : "Open dashboard"
        }
      >
        {dashboardMode ? "‹" : "›"}
      </button>
    </>
  );
};

export default Dashboard;