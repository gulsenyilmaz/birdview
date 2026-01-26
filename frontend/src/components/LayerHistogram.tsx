import React, { useMemo } from "react";
import "./TimeSlider.css";
import { getLayerColor } from "../utils/colorUtils";


// ⬇️ yeni: dışarıdan verilecek "yıl -> hayatta olan sayısı"
type YearCount = { year: number; count: number };

interface LayerHistogramProps {
  
  setSelectedYear: (year: number) => void;
  windowRange?: [number, number];
  aliveCounts?: YearCount[];
  binAggregation?: "avg" | "sum";
  layerTypeName:string;
  // setSelectedLayer:(ch: boolean) => void;
}

const LayerHistogram: React.FC<LayerHistogramProps> = ({
 
  setSelectedYear,
  windowRange = [1200, 2025],
  aliveCounts = [],   
  binAggregation = "avg", 
  layerTypeName,  
  // setSelectedLayer,
}) => {

  const [minYear, maxYear] = windowRange;
  const totalRange = maxYear - minYear;
  
  // Histogram bin genişliği
  const binSize = useMemo(() => {
    const span = maxYear - minYear;
    // return Math.round(span/250);
    if (span <= 50) return 1;
    if (span <= 150) return 2;
    if (span <= 500) return 5;
    if (span <= 1500) return 10;
    return 20;
  }, [minYear, maxYear]);

  const { bins, maxVal } = useMemo(() => {
    if (!aliveCounts.length) return { bins: [] as Array<{start:number; end:number; value:number}>, maxVal: 0 };

    const arrLen = maxYear - minYear + 1;
    const dense: number[] = new Array(arrLen).fill(0);
    for (const { year, count } of aliveCounts) {
      if (Number.isFinite(year) && year >= minYear && year <= maxYear) {
        dense[year - minYear] = count;
      }
    }

    const start = Math.floor(minYear / binSize) * binSize;
    const end = Math.floor(maxYear / binSize) * binSize;

    const out: Array<{ start: number; end: number; value: number }> = [];
    let peak = 0;

    for (let s = start; s <= end; s += binSize) {
      let sum = 0;
      let validYears = 0;
      const e = Math.min(s + binSize - 1, maxYear);

      for (let y = Math.max(s, minYear); y <= e; y++) {
        sum += dense[y - minYear];
        validYears++;
      }

      const value = binAggregation === "avg" && validYears > 0 ? sum / validYears : sum;
      out.push({ start: s, end: e, value });
      if (value > peak) peak = value;
    }

    return { bins: out, maxVal: peak };
  }, [aliveCounts, minYear, maxYear, binSize, binAggregation]);

  const getLeftPercent = (year: number): number =>
    ((year - minYear) / totalRange) * 100;

  const getWidthPercentForBin = (size: number): number =>
    (size / totalRange) * 100;

  return (
    <div className="time-container">
      <div className="time-slider">
        
         {/* ⬇️ Tam windowRange boyunca "o yıl hayatta olanlar" histogramı */}
        {bins.length > 0 && (
          <div className="histogram">
            {bins.map((b, i) => {
              const left = getLeftPercent(b.start);
              const width = getWidthPercentForBin(binSize);
              const pct = maxVal > 0 ? Math.round((b.value / maxVal) * 100) : 0;
              const height = b.value > 0 ? Math.max(2, pct) : 0; // 0 ise gizle
              // const mid = Math.round((b.start + b.end) / 2);
              return (
                <div
                  key={`${b.start}-${i}`}
                  className={`hist-bar ${b.value > 0 ? "active" : ""}`}
                  style={{ left: `${left}%`, width: `${width}%`, height: `${height}%`, color:getLayerColor(layerTypeName) }}
                  title={`${b.start}–${b.end}: ${binAggregation === "avg" ? "avg" : "sum"}=${b.value.toFixed(0)}`}
                  onClick={() => b.value > 0 && setSelectedYear(b.start)}
                />
              );
            })}
          </div>
        )}
        
      </div>
      <div className="label-group">
            <label>
              
              {layerTypeName}
            </label>
           
        </div>
    </div>
  );
};

export default LayerHistogram;
