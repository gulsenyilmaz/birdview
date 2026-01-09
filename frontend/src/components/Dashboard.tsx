import React from "react";
import Plot from "react-plotly.js";
import "./Dashboard.css";
import type { Human } from "../entities/Human";
import { getColorForLabelString, getColorForGenderString } from "../utils/colorUtils";

interface DashboardProps {
  humans: Human[];
  setColorFilterType: (cType: "gender" | "age" | "nationality") => void;
  colorFilterType: "gender" | "age" | "nationality"; 
}

const Dashboard: React.FC<DashboardProps> = ({ humans, setColorFilterType, colorFilterType}) => {
  const aliveCount = humans.length;
  const femaleCount = humans.filter((h) => h.gender === "female").length;
  const femalePct = aliveCount
    ? ((femaleCount / aliveCount) * 100).toFixed(1)
    : "0";

  const nationalityCounter: Record<string, number> = {};
  const cityCounter: Record<
    number,
    { name: string; count: number }
  > = {};
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
  const topNationalities = nationalities.slice(0, 10);

  const genders = Object.entries(genderCounter).sort((a, b) => b[1] - a[1]);

  const genderLabels = genders.map(([label]) => label);
  const genderValues = genders.map(([, value]) => value);

  const nationalityLabels = topNationalities.map(([label]) => label);
  const nationalityValues = topNationalities.map(([, value]) => value);

  const cities = Object.entries(cityCounter)
    .map(([id, { name, count }]) => ({
      id: Number(id),
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const topCities = cities.slice(0, 10);

  const citiesLabels = topCities.map((c) => c.name);
  const citiesValues = topCities.map((c) => c.count);
  // const citiesIds = topCities.map((c) => c.id);

  return (
    <div className="dashboard-container">
      <div className="button-bar">
        <button
          className={colorFilterType === "age" ? "active" : ""}
          onClick={() => setColorFilterType("age")}
        >
          Age
        </button>
        <button
          className={colorFilterType === "gender" ? "active" : ""}
          onClick={() => setColorFilterType("gender")}
        >
          Gender
        </button>
        <button
          className={colorFilterType === "nationality" ? "active" : ""}
          onClick={() => setColorFilterType("nationality")}
        >
          Nationality
        </button>
      </div>
      <div className="stats-box">
        
        <div>
          <strong>Female: </strong> {femaleCount} ({femalePct}%)
        </div>
        <div>
          <strong>Artists alive: </strong> {aliveCount}
        </div>
        <div>
          <strong>Nationalities: </strong>
          {nationalities.length}
        </div>
      </div>

      <div className="chart-box">
        <div className="chart-box-title">
          <strong>GENDER</strong>
        </div>
        <Plot
          data={[
            {
              values: genderValues,
              labels:genderLabels,
              type: "pie",
              hole: 0.5,
              textinfo: "label+percent",
              textposition: "inside",
              marker: {
                colors: genderLabels.map(label => getColorForGenderString(label)),
                line: {
                  color: "#fff",
                  width: 2,
                },
              },
            },
          ]}
          layout={{
            title: "Gender Distribution",
            showlegend: false,
            margin: { t: 0, l: 0, r: 0, b: 0 },
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
              family: "'Inter', sans-serif",
              color: "#2f2f2f",
              size: 14,
            },
          }}
          config={{ displayModeBar: false, staticPlot: false }}
          useResizeHandler
          style={{ width: "80%", height: "80%" }}
        />
      </div>

      <div className="chart-box">
        <div className="chart-box-title">
          <strong>NATIONALITIES : </strong>
          {nationalities.length}
        </div>
        <Plot
          data={[
            {
              x: nationalityValues,
              y: nationalityLabels,
              type: "bar",
              orientation: "h",
              marker: {
                color: nationalityLabels.map(getColorForLabelString),
              },
            },
          ]}
          layout={{
            yaxis: {
              autorange: "reversed",
              tickfont: {
                color: "gray",
                family: "'Inter', sans-serif",
              },
              title: {
                font: { color: "gray", family: "'Inter', sans-serif" },
              },
            },
            xaxis: {
              showticklabels: false,
              showgrid: false,
              showline: false,
              zeroline: false,
            },
            margin: { t: 0, l: 90, r: 5, b: 10 },
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
              family: "'Inter', sans-serif",
              color: "#2f2f2f",
            },
          }}
          config={{ displayModeBar: false, staticPlot: false }}
          useResizeHandler={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="chart-box">
        <div className="chart-box-title">
          <strong>LOCATIONS : </strong>
          {cities.length}
        </div>
        <Plot
          data={[
            {
              x: citiesValues,
              y: citiesLabels,
              type: "bar",
              orientation: "h",
              marker: { color: "#c7af48" },
            },
          ]}
          layout={{
            yaxis: {
              color: "gray",
              autorange: "reversed",
              tickfont: {
                color: "gray",
                family: "'Inter', sans-serif",
              },
              title: {
                font: { color: "gray", family: "'Inter', sans-serif" },
              },
            },
            xaxis: {
              showticklabels: false,
              showgrid: false,
              showline: false,
              zeroline: false,
            },
            margin: { t: 0, l: 90, r: 5, b: 10 },
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
              color: "white",
              family: "'Inter', sans-serif",
            },
          }}
          config={{ displayModeBar: false, staticPlot: false }}
          useResizeHandler={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      
    </div>
  );
};

export default Dashboard;
