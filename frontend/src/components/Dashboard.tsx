import React from "react";
import Plot from "react-plotly.js";
import "./Dashboard.css";
import type { Human } from "../entities/Human";
import { getColorForLabelString, getColorForGenderString } from "../utils/colorUtils";

interface DashboardProps {
  humans: Human[];
  
}

const Dashboard: React.FC<DashboardProps> = ({ humans}) => {
  
 

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
  const topNationalities = nationalities.slice(0, 5);

  const nationalityLabels = topNationalities.map(([label]) => label);
  const nationalityValues = topNationalities.map(([, value]) => value);


  const genders = Object.entries(genderCounter).sort((a, b) => b[1] - a[1]);

  const genderLabels = genders.map(([label]) => label);
  const genderValues = genders.map(([, value]) => value);

 
  const cities = Object.entries(cityCounter)
    .map(([id, { name, count }]) => ({
      id: Number(id),
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const topCities = cities.slice(0, 5);

  const citiesLabels = topCities.map((c) => c.name);
  const citiesValues = topCities.map((c) => c.count);
  // const citiesIds = topCities.map((c) => c.id);

  return (
    <>
    {humans && humans.length>0 && (
    <div className="dashboard-container">
      <div className="dashboard-charts">

      <div className="chart-box">
        {/* <div className="chart-box-title">
          <strong>NATIONALITIES : </strong>
          {nationalities.length}
        </div> */}
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
                color: "white",
                family: "'Inter', sans-serif",
              },
              title: {
                font: { color: "white", family: "'Inter', sans-serif" },
              },
            },
            xaxis: {
              showticklabels: false,
              showgrid: false,
              showline: false,
              zeroline: false,
            },
            margin: { t: 5, l: 85, r: 0, b: 5 },
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
              family: "'Inter', sans-serif",
              size: 10,
              color: "#e0e0e0",
            },
          }}
          config={{ displayModeBar: false, staticPlot: false }}
          useResizeHandler={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="chart-box">
        {/* <div className="chart-box-title">
          <strong>LOCATIONS : </strong>
          {cities.length}
        </div> */}
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
              color: "white",
              autorange: "reversed",
              tickfont: {
                color: "white",
                family: "'Inter', sans-serif",
              },
              title: {
                font: { color: "white", family: "'Inter', sans-serif" },
              },
            },
            xaxis: {
              showticklabels: false,
              showgrid: false,
              showline: false,
              zeroline: false,
            },
            margin: { t: 5, l: 85, r: 0, b: 5 },
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
              color: "white",
              size: 10,
              family: "'Inter', sans-serif",
            },
          }}
          config={{ displayModeBar: false, staticPlot: false }}
          useResizeHandler={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="chart-box">
        {/* <div className="chart-box-title">
          <strong>GENDER : </strong>
        </div> */}
       

        <Plot
          data={[
            {
              x: genderValues,
              y: genderLabels,
              type: "bar",
              orientation: "h",
              marker: {
                color: genderLabels.map(label => getColorForGenderString(label)),
              },
            },
          ]}
          layout={{
            yaxis: {
              autorange: "reversed",
              tickfont: {
                color: "white",
                family: "'Inter', sans-serif",
              },
              title: {
                font: { color: "white", family: "'Inter', sans-serif" },
              },
            },
            xaxis: {
              showticklabels: false,
              showgrid: false,
              showline: false,
              zeroline: false,
            },
            margin: { t: 5, l: 65, r: 0, b: 5 },
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
              family: "'Inter', sans-serif",
              size: 10,
              color: "#f0f0f0",
            },
          }}
          config={{ displayModeBar: false, staticPlot: false }}
          useResizeHandler={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      </div>
     
      
    </div>)}
    </>
  );
  
};


export default Dashboard;
