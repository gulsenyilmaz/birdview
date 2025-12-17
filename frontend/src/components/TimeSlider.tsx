import React, { useMemo } from "react";
import "./TimeSlider.css";

// ⬇️ yeni: dışarıdan verilecek "yıl -> hayatta olan sayısı"
type YearCount = { year: number; count: number };

interface TimeSliderProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  distinctDates?: number[];
  windowRange?: [number, number];

  /** Yeni: her yıl için hayatta olan sayısı (buildAliveCounts çıktısı) */
  aliveCounts?: YearCount[];
  /** Bin değerini nasıl toplayalım: 'avg' (standart) ya da 'sum' */
  binAggregation?: "avg" | "sum";
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  selectedYear,
  setSelectedYear,
  distinctDates = [],
  windowRange = [1200, 2025],
  aliveCounts = [],               // ⬅️ yeni
  binAggregation = "avg",           // ⬅️ yeni
}) => {

  const [minYear, maxYear] = windowRange;
  const totalRange = maxYear - minYear;

  // console.log("TimeSlider windowRange:", windowRange);

  const step = useMemo(() => {
    const span = maxYear - minYear;

    // return Math.round(span/40);
    if (span <= 50) return 1;
    if (span <= 150) return 5;
    if (span <= 500) return 10;
    if (span <= 1500) return 20;
    if (span <= 1500) return 50;
    return 50;
  }, [minYear, maxYear]);

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
              const mid = Math.round((b.start + b.end) / 2);
              return (
                <div
                  key={`${b.start}-${i}`}
                  className={`hist-bar ${b.value > 0 ? "active" : ""}`}
                  style={{ left: `${left}%`, width: `${width}%`, height: `${height}%` }}
                  title={`${b.start}–${b.end}: ${binAggregation === "avg" ? "avg" : "sum"}=${b.value.toFixed(0)}`}
                  onClick={() => b.value > 0 && setSelectedYear(mid)}
                />
              );
            })}
          </div>
        )}
      
        <div className="year-labels">
          {Array.from(
            { length: Math.floor((maxYear - minYear) / step) + 1 },
            (_, index) => {
              const year = minYear + index * step;
              const isActive = selectedYear >= year && selectedYear < year + step;
              return (
                <span key={year} className={`year-label ${isActive ? "active" : ""}`}>
                  | {year}
                </span>
              );
            }
          )}
        </div>

        
        <div className="slider-wrapper">
          <div className="milestone-markers bottom">
            {distinctDates.map((year, idx) => {
              if (isNaN(year) || minYear > year || maxYear < year) return null;
              const left = getLeftPercent(year);
              return (
                <div
                  key={idx}
                  className="milestone"
                  style={{ left: `${left}%` }}
                  title={`Jump to ${year}`}
                  onClick={() => setSelectedYear(year)}
                >
                  ▼
                </div>
              );
            })}
          </div>

          <input
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          />
        </div>

        <hr className="divider" />
        <div className="time-slider-info">[step: {step}, bin: {binSize}, aggregation: {binAggregation}]
          Explore the geographic presence of artists who were alive in a given
          year. Scroll through time, uncover patterns, and see the rise and
          fall of artistic generations.
        </div>
      </div>
    </div>
  );
};

export default TimeSlider;
