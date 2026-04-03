import React from "react";
import "./Dashboard.css";
import type { Human } from "../entities/Human";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  getColorForLabelString,
  getColorForGenderString,
} from "../utils/colorUtils";

interface DashboardProps {
  humans: Human[];
}

interface ChartItem {
  label: string;
  value: number;
  color: string;
}

const chartMargin = { top: 5, right: 5, left: 5, bottom: 5 };

const commonAxisStyle = {
  fontSize: 10,
  fill: "white",
  fontFamily: "'Inter', sans-serif",
};

const getYAxisWidth = (data: ChartItem[], minWidth = 65) => {
  const longest = data.reduce((max, item) => Math.max(max, item.label.length), 0);
  return Math.max(minWidth, longest * 7);
};

interface CustomBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartItem;
}

const CustomBarShape: React.FC<CustomBarShapeProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}) => {
  const radius = 4;
  const color = payload?.color || "#8884d8";

  const safeWidth = Math.max(width, 0);
  const safeHeight = Math.max(height, 0);

  return (
    <path
      d={`
        M${x},${y}
        H${x + safeWidth - radius}
        Q${x + safeWidth},${y} ${x + safeWidth},${y + radius}
        V${y + safeHeight - radius}
        Q${x + safeWidth},${y + safeHeight} ${x + safeWidth - radius},${y + safeHeight}
        H${x}
        Z
      `}
      fill={color}
    />
  );
};

const Dashboard: React.FC<DashboardProps> = ({ humans }) => {
  const nationalityCounter: Record<string, number> = {};
  const cityCounter: Record<number, { name: string; count: number }> = {};
  const genderCounter: Record<string, number> = {};

  for (const h of humans) {
    if (h.nationality) {
      nationalityCounter[h.nationality] =
        (nationalityCounter[h.nationality] || 0) + 1;
    }

    if (h.city_id && h.city) {
      if (!cityCounter[h.city_id]) {
        cityCounter[h.city_id] = { name: h.city, count: 0 };
      }
      cityCounter[h.city_id].count += 1;
    }

    if (h.gender) {
      genderCounter[h.gender] = (genderCounter[h.gender] || 0) + 1;
    }
  }

  const nationalities = Object.entries(nationalityCounter).sort(
    (a, b) => b[1] - a[1]
  );
  const topNationalities = nationalities.slice(0, 5);

  const nationalityData: ChartItem[] = topNationalities.map(([label, value]) => ({
    label,
    value,
    color: getColorForLabelString(label),
  }));

  const genders = Object.entries(genderCounter).sort((a, b) => b[1] - a[1]);

  const genderData: ChartItem[] = genders.map(([label, value]) => ({
    label,
    value,
    color: getColorForGenderString(label),
  }));

  const cities = Object.entries(cityCounter)
    .map(([id, { name, count }]) => ({
      id: Number(id),
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const topCities = cities.slice(0, 5);

  const cityData: ChartItem[] = topCities.map((c) => ({
    label: c.name,
    value: c.count,
    color: "#c7af48",
  }));

  const renderHorizontalBarChart = (data: ChartItem[]) => {
    const yAxisWidth = getYAxisWidth(data);

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={chartMargin}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={yAxisWidth}
            axisLine={false}
            tickLine={false}
            tick={commonAxisStyle}
          />
          <Bar
            dataKey="value"
            shape={<CustomBarShape />}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <>
      {humans && humans.length > 0 && (
        <div className="dashboard-container">
          <div className="dashboard-charts">
            <div className="chart-box">
              {renderHorizontalBarChart(nationalityData)}
            </div>

            <div className="chart-box">
              {renderHorizontalBarChart(cityData)}
            </div>

            <div className="chart-box">
              {renderHorizontalBarChart(genderData)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;