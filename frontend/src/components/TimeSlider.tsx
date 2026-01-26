import React, { useEffect, useMemo, useState,useRef  } from "react";
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

  // ▶️ Play state + interval
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const yearRef = useRef(selectedYear);
  useEffect(() => {
    yearRef.current = selectedYear;
  }, [selectedYear]);

  useEffect(() => {
    if (!isPlaying) return;

    intervalRef.current = window.setInterval(() => {
      const next = yearRef.current + 1;

      if (next > maxYear) {
        // başa sar:
        setSelectedYear(minYear);
        yearRef.current = minYear; // ref'i de güncelle
      } else {
        setSelectedYear(next);
        yearRef.current = next;
      }
    }, 100);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isPlaying, minYear, maxYear, setSelectedYear]);

  // Eğer kullanıcı slider'ı elle sona getirirse otomatik durdur (opsiyonel)
  useEffect(() => {
    if (isPlaying && selectedYear >= maxYear) {
      setIsPlaying(false);
    }
  }, [isPlaying, selectedYear, maxYear]);

  const handlePlayAction = () => {
    setIsPlaying((p) => !p);
  };

  const stopAndSetSelectedYear= (n_year:number) => {
    setIsPlaying(false);
    setSelectedYear(n_year)
  };


  return (
    <div className="time-container">
      <div className="play-button">
        <button onClick={handlePlayAction}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      </div>
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
            onChange={(e) => stopAndSetSelectedYear(Number(e.target.value))}
          />
        </div>

       
        
      </div>
      {/* <div className="label-group">
        <label>
          {maxYear}
        </label>
      </div> */}
    </div>
  );
};

export default TimeSlider;