import React, { useMemo } from "react";
import "./TimeSlider.css";

interface TimeSliderProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  /** benzersiz tarihler (milestone üçgenleri için — opsiyonel) */
  distinctDates?: number[];
  /** histogram için tüm kayıtların yılı (her kayıt için bir yıl) */
  histogramYears?: number[];
  windowRange?: [number, number];
}

const TimeSlider_: React.FC<TimeSliderProps> = ({
  selectedYear,
  setSelectedYear,
  distinctDates = [],
  histogramYears = [],
  windowRange = [1200, 2025],
}) => {
  const [minYear, maxYear] = windowRange;
  const totalRange = maxYear - minYear;

  // Etiket aralığı
  const step = useMemo(() => {
    const span = maxYear - minYear;
    if (span <= 50) return 1;
    if (span <= 150) return 5;
    if (span <= 500) return 10;
    if (span <= 1500) return 25;
    return 50;
  }, [minYear, maxYear]);

  // Histogram için bin genişliği (etiketten biraz daha granüler tutuyoruz)
  const binSize = useMemo(() => {
    const span = maxYear - minYear;
    if (span <= 50) return 1;
    if (span <= 150) return 1;
    if (span <= 500) return 1;
    if (span <= 1500) return 1;
    return 1;
  }, [minYear, maxYear]);

  // Bin’leri hazırla (başlangıcı hizala)
  const { bins, maxCount } = useMemo(() => {
    if (!histogramYears.length) return { bins: [] as Array<{start:number; end:number; count:number}>, maxCount: 0 };

    const start = Math.floor(minYear / binSize) * binSize;
    const end = Math.floor(maxYear / binSize) * binSize;

    const tmp = new Map<number, number>();
    for (const y of histogramYears) {
      if (Number.isFinite(y) && y >= minYear && y <= maxYear) {
        const b = Math.floor(y / binSize) * binSize;
        tmp.set(b, (tmp.get(b) ?? 0) + 1);
      }
    }

    const out: Array<{ start: number; end: number; count: number }> = [];
    let peak = 0;
    for (let s = start; s <= end; s += binSize) {
      const c = tmp.get(s) ?? 0;
      out.push({ start: s, end: s + binSize - 1, count: c });
      if (c > peak) peak = c;
    }
    return { bins: out, maxCount: peak };
  }, [histogramYears, minYear, maxYear, binSize]);

  const getLeftPercent = (year: number): number =>
    ((year - minYear) / totalRange) * 100;

  const getWidthPercentForBin = (size: number): number =>
    (size / totalRange) * 100;

  return (
    <div className="time-container">
      <div className="time-slider">

        {/* Histogram (alt şerit) */}
        {bins.length > 0 && maxCount > 0 && (
          <div className="histogram">
            {bins.map((b, i) => {
              const left = getLeftPercent(b.start);
              const width = getWidthPercentForBin(binSize);
              const height = Math.max(2, Math.round((b.count / maxCount) * 100)); // % olarak
              const mid = Math.round((b.start + b.end) / 2);
              return (
                <div
                  key={`${b.start}-${i}`}
                  className={`hist-bar ${b.count > 0 ? "active" : ""}`}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                  }}
                  title={`${b.start}–${b.end}: ${b.count}`}
                  onClick={() => b.count > 0 && setSelectedYear(mid)}
                />
              );
            })}
          </div>
        )}

        {/* Slider ve (istenirse) milestones */}
        <div className="slider-wrapper">
          {/* <div className="milestone-markers bottom">
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
          </div> */}

          <input
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          />
        </div>

        {/* Yıl etiketleri */}
        <div className="year-labels">
          {Array.from(
            { length: Math.floor((maxYear - minYear) / step) + 1 },
            (_, index) => {
              const year = minYear + index * step;
              const isActive = selectedYear >= year && selectedYear < year + step;
              return (
                <span
                  key={year}
                  className={`year-label ${isActive ? "active" : ""}`}
                >
                  {year}
                </span>
              );
            }
          )}
        </div>

        <hr className="divider" />
        <div className="time-slider-info">
          Explore the geographic presence of artists who were alive in a given
          year. Scroll through time, uncover patterns, and see the rise and
          fall of artistic generations.
        </div>
      </div>
    </div>
  );
};

export default TimeSlider_;
