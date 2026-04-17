import React, { useEffect, useMemo, useState,useRef  } from "react";
import "./TimeSlider.css";
import type { Movement } from "../../entities/Movement";

// ⬇️ yeni: dışarıdan verilecek "yıl -> hayatta olan sayısı"
// type YearCount = { year: number; count: number };

interface TimeSliderProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  // distinctDates?: number[];
  fullRange: [number, number];      
  windowRange?: [number, number];
  setWindowRange: (r: [number, number]) => void;
  setSelectedMovement: (obj: Movement) => void;
  movements: Movement[];
  children: React.ReactNode;
  detailMode?: boolean; 
  setManualMode:(obj: boolean) => void
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  selectedYear,
  setSelectedYear,
  // distinctDates = [],
  fullRange,
  windowRange = [1200, 2025],
  setWindowRange,
  setSelectedMovement,
  movements,
  children,
  detailMode = false,
  setManualMode
        
}) => {

  const stripRef = useRef<HTMLDivElement | null>(null);

  const [alltime_minYear, alltime_maxYear] = fullRange;
  const [minYear, maxYear] = windowRange;
  const totalRange = maxYear - minYear;

 

  const step = useMemo(() => {
    const span = maxYear - minYear;
   
    if (span <= 50) return 2;
    if (span <= 250) return 10;
    if (span <= 500) return 30;
    if (span <= 1500) return 70;
    if (span <= 2500) return 100;
    if (span <= 5000) return 200;
    if (span <= 7000) return 500;
    return 1000;
  }, [minYear, maxYear]);


  const getLeftPercent = (year: number): number =>
    ((year - minYear) / totalRange) * 100;

  const getWidthPercent = (year: number, n_year:number): number =>
    ((n_year - year) / step) * 100;

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
    setManualMode(false);
    
  };

  const stopAndSetSelectedYear= (n_year:number) => {
    setIsPlaying(false);
    setSelectedYear(n_year)
  };


  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ startX: number; startMin: number; startMax: number } | null>(null);

  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStart.current = { startX: e.pageX, startMin: minYear, startMax: maxYear };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !dragStart.current) return;

    const dx = e.pageX - dragStart.current.startX;
    const walkYears = Math.round(dx / 100) * step; // 100px -> step yıl

    if (walkYears === 0) return;

    let newMin = Math.max(alltime_minYear, dragStart.current.startMin - walkYears);
    let newMax = Math.min(alltime_maxYear, dragStart.current.startMax - walkYears);

    // sınır düzelt
    if (newMin === alltime_minYear) newMax = newMin + totalRange;
    else if (newMax === alltime_maxYear) newMin = newMax - totalRange;

    setWindowRange([newMin, newMax]);
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  return (
    
       <>
      <div className={`movements-container ${detailMode ? "hide" : ""}`}>
        {movements && movements.length>0 && (
            <div className="movements-wrapper">
                
              {movements
              .filter((item) =>
                item.start_date !== null && item.end_date !== null && item.start_date <= maxYear && item.start_date >= minYear && item.count>10
              )
              .map((item) => {
                  const left = getLeftPercent(item.start_date!);
                  
                  return (
                    <div 
                        className="milestone"
                        key={item.id}
                        style={{
                        left: `${left}%`,
                        // right: `${(1 - (item.end_date! - minYear) / (maxYear - minYear)) * 100}%`
                      
                        }}
                        title={`Jump to ${item.name} `}
                        onClick={() => setSelectedMovement(item)}
                        onMouseOver={() => console.log(`${item.name} (${item.start_date})`)}    
                        
                      /> 
                      
                  );
                }
              )}

            </div>
        )}
        <div className="label-group">
          <button className="label-button" style={{backgroundColor:'#705d15' }} onClick={() => setManualMode(true)}>
            Movements
            </button>
        </div>
      </div>
      <div className="time-container">
        <div className="time-slider">
          
          <div className="year-labels"
              ref={stripRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}>
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
        <div className="label-group">
          <button className="label-button" style={{backgroundColor:'#171717' }} onClick={handlePlayAction}>
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>
      </div>
      {children}

    </>
  );
};

export default TimeSlider;