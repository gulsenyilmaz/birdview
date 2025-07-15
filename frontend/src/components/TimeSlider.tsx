import React from "react";
import "./TimeSlider.css";

interface TimeSliderProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  distinctDates?: number[];
  dateRange?: number[];
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  selectedYear,
  setSelectedYear,
  distinctDates = [],
  dateRange = []
}) => {

  const minYear = dateRange[0];
  const maxYear = dateRange[1];
  const totalRange = maxYear - minYear;

  const getLeftPercent = (year: number): number =>
    ((year - minYear) / totalRange) * 100;

  return (
    <div className="time-container">
      <div className="time-slider">
        {/* Decade labels */}
        <div className="year-labels">
          {Array.from(
            { length: Math.floor((maxYear - minYear) / 10) + 1 },
            (_, index) => {
              const year = minYear + index * 10;
              const isActive =
                selectedYear >= year && selectedYear < year + 10;
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

        {/* Main slider and milestones */}
        <div className="slider-wrapper">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          />

          {/* Milestone markers */}
          <div className="milestone-markers bottom">
            {distinctDates.map((year, idx) => {
              
              if (isNaN(year)) return null;
              const left = getLeftPercent(year);
              return (
                <div
                  key={idx}
                  className="milestone"
                  style={{ left: `${left}%` }}
                  title={`Jump to ${year}`}
                  onClick={() => setSelectedYear(year)}
                >
                  ▲
                </div>
              );
            })}
          </div>
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

export default TimeSlider;
