import React, { useMemo } from "react";
import "./TimeSlider.css";

// ⬇️ yeni: dışarıdan verilecek "yıl -> hayatta olan sayısı"
// type YearCount = { year: number; count: number };

interface TimeSliderProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  // distinctDates?: number[];
  windowRange?: [number, number];



}

const TimeSlider: React.FC<TimeSliderProps> = ({
  selectedYear,
  setSelectedYear,
  // distinctDates = [],
  windowRange = [1200, 2025],
        
}) => {

  const [minYear, maxYear] = windowRange;
  const totalRange = maxYear - minYear;

  

  const step = useMemo(() => {
    const span = maxYear - minYear;

    // return Math.round(span/40);
    if (span <= 50) return 1;
    if (span <= 200) return 10;
    if (span <= 500) return 30;
    if (span <= 1500) return 70;
    if (span <= 2500) return 100;
    return 200;
  }, [minYear, maxYear]);



  const getLeftPercent = (year: number): number =>
    ((year - minYear) / totalRange) * 100;

  const getWidthPercent = (year: number, n_year:number): number =>
    ((n_year - year) / step) * 100;



  return (
    <div className="time-container">
      <div className="time-slider">
        
        <div className="year-labels">
          {Array.from(
            { length: Math.floor((maxYear - minYear) / step) + 1 },
            (_, index) => {
              const year = minYear + index * step;
              const next_year = minYear + (index+1) * step;
              const isActive = selectedYear >= year && selectedYear < year + step;
              const left = getLeftPercent(year);
              const w = getWidthPercent(year, next_year<maxYear?next_year:maxYear)
              
              return (
                <div key={year} className={`year-label ${isActive ? "active" : ""}`} style={{ left: `${left}%`, width:`${w}%` }}>
                  <strong>|</strong> {year}
                </div>
              );
            }
          )}
        </div>

        
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

       
        
      </div>
      <div className="label-group">
            <label>
              
              {maxYear}
            </label>
           
        </div>
    </div>
  );
};

export default TimeSlider;