import React from "react";
import Plot from "react-plotly.js";
import "./Dashboard.css";
import type { Human } from "../entities/Human";
import { getColorForLabelString } from "../utils/colorUtils";

interface DashboardAdvancedProps {
  humans: Human[];
  setColorFilterType: (cType: "gender" | "age" | "nationality") => void;
  colorFilterType: "gender" | "age" | "nationality"; 
}

const DashboardAdvanced: React.FC<DashboardAdvancedProps> = ({ humans, setColorFilterType, colorFilterType}) => {
//   const aliveCount = humans.length;
 

  const nationalityCounter: Record<string, number> = {};
  
 

  for (const h of humans) {
    if (h.nationality) {
      nationalityCounter[h.nationality] =
        (nationalityCounter[h.nationality] || 0) + 1;
    }
    
   
  }

  const nationalities = Object.entries(nationalityCounter).sort(
    (a, b) => b[1] - a[1]
  );
  const topNationalities = nationalities.slice(0, 10);

  const nationalityLabels = topNationalities.map(([label]) => label);
  const nationalityValues = topNationalities.map(([, value]) => value);

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

      
      
    </div>
  );
};

export default DashboardAdvanced;
