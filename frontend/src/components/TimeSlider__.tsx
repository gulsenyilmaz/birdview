import React, { useEffect, useMemo, useRef, useState } from "react";
import "./TimeSlider.css";
import type { Movement } from "../entities/Movement";

interface TimeSliderProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  windowRange?: [number, number]; // domain
  setSelectedMovement: (obj: Movement) => void;
  movements: Movement[];
}

type Range = [number, number];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const clampRange = (r: Range, domain: Range): Range => {
  const [d0, d1] = domain;
  let [a, b] = r;
  const w = b - a;
  const dw = d1 - d0;
  if (w >= dw) return [d0, d1];

  if (a < d0) {
    a = d0;
    b = d0 + w;
  }
  if (b > d1) {
    b = d1;
    a = d1 - w;
  }
  return [a, b];
};

const xToYear = (xPx: number, widthPx: number, view: Range) => {
  const [v0, v1] = view;
  const t = clamp(xPx / Math.max(1, widthPx), 0, 1);
  return v0 + t * (v1 - v0);
};

const zoomView = (
  view: Range,
  domain: Range,
  anchorYear: number,
  scale: number,
  minWindowYears = 10
): Range => {
  const [v0, v1] = view;
  const w = v1 - v0;
  const dw = domain[1] - domain[0];

  const newW = clamp(w * scale, minWindowYears, dw);
  const anchorT = (anchorYear - v0) / w; // 0..1 in current view
  const nv0 = anchorYear - anchorT * newW;
  const nv1 = nv0 + newW;
  return clampRange([nv0, nv1], domain);
};

const panView = (view: Range, domain: Range, deltaYears: number): Range => {
  const [v0, v1] = view;
  return clampRange([v0 + deltaYears, v1 + deltaYears], domain);
};

const TimeSlider: React.FC<TimeSliderProps> = ({
  selectedYear,
  setSelectedYear,
  windowRange = [1200, 2025],
  setSelectedMovement,
  movements,
}) => {
  // domain (global)
  const domainRange: Range = windowRange;
  const [domainMin, domainMax] = domainRange;

  // ✅ new: zoom/pan window (view)
  const [viewRange, setViewRange] = useState<Range>(() => clampRange(windowRange, domainRange));
  const [viewMin, viewMax] = viewRange;
  const viewTotalRange = viewMax - viewMin;

  // Keep view valid if parent changes windowRange
  useEffect(() => {
    setViewRange((prev) => {
      // if domain changed drastically, prefer new windowRange
      return clampRange(prev, windowRange);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainMin, domainMax]);

  // If selectedYear goes outside view, clamp it into view (optional but feels better)
  useEffect(() => {
    if (selectedYear < viewMin) setSelectedYear(Math.round(viewMin));
    else if (selectedYear > viewMax) setSelectedYear(Math.round(viewMax));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMin, viewMax]);

  const step = useMemo(() => {
    const span = viewMax - viewMin;
    if (span <= 50) return 1;
    if (span <= 200) return 10;
    if (span <= 500) return 30;
    if (span <= 1500) return 70;
    if (span <= 2500) return 100;
    return 200;
  }, [viewMin, viewMax]);

  // Positions now based on view (NOT domain)
  const getLeftPercent = (year: number): number => ((year - viewMin) / viewTotalRange) * 100;

  const getWidthPercent = (year: number, n_year: number): number =>
    ((n_year - year) / step) * 100;

  // ▶️ Play state + interval (uses VIEW bounds for loop)
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

      if (next > viewMax) {
        setSelectedYear(viewMin);
        yearRef.current = viewMin;
      } else {
        setSelectedYear(next);
        yearRef.current = next;
      }
    }, 100);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isPlaying, viewMin, viewMax, setSelectedYear]);

  useEffect(() => {
    if (isPlaying && selectedYear >= viewMax) setIsPlaying(false);
  }, [isPlaying, selectedYear, viewMax]);

  const handlePlayAction = () => setIsPlaying((p) => !p);

  const stopAndSetSelectedYear = (n_year: number) => {
    setIsPlaying(false);
    setSelectedYear(n_year);
  };

  // ✅ zoom + pan handlers
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<null | { active: boolean; startX: number; startView: Range }>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const anchorYear = xToYear(x, rect.width, viewRange);

      // zoom direction: deltaY > 0 => zoom out
      const zoomIntensity = 0.0015; // feel
      const scale = Math.exp(e.deltaY * zoomIntensity);

      setViewRange((prev) => zoomView(prev, domainRange, anchorYear, scale, 10));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [domainRange, viewRange]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!el) return;
    dragRef.current = { active: true, startX: e.clientX, startView: viewRange };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const el = trackRef.current;
    const d = dragRef.current;
    if (!el || !d?.active) return;

    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const [sv0, sv1] = d.startView;
    const wYears = sv1 - sv0;

    const dx = e.clientX - d.startX;
    const deltaYears = -(dx / Math.max(1, width)) * wYears;

    setViewRange(panView(d.startView, domainRange, deltaYears));
  };

  const onMouseUp = () => {
    if (dragRef.current) dragRef.current.active = false;
  };

  // Optional: double click resets view to full domain
  const onDoubleClickReset = () => setViewRange([domainMin, domainMax]);

  return (
    <div className="time-container">
      <div className="play-button">
        <button onClick={handlePlayAction}>{isPlaying ? "⏸" : "▶"}</button>
      </div>

      <div className="time-slider">
        {/* ✅ attach zoom/pan to this wrapper */}
        <div
          ref={trackRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onDoubleClick={onDoubleClickReset}
          title="Wheel: zoom • Drag: pan • Double click: reset"
          style={{ position: "relative" }}
        >
          <div className="year-labels">
            {Array.from({ length: Math.floor((viewMax - viewMin) / step) + 1 }, (_, index) => {
              const year = viewMin + index * step;
              const next_year = viewMin + (index + 1) * step;

              const isActive = selectedYear >= year && selectedYear < year + step;
              const left = getLeftPercent(year);
              const w = getWidthPercent(year, next_year < viewMax ? next_year : viewMax);

              return (
                <div
                  key={year}
                  className={`year-label ${isActive ? "active" : ""}`}
                  style={{ left: `${left}%`, width: `${w}%` }}
                >
                  <strong>|</strong> {Math.round(year)}
                </div>
              );
            })}
          </div>

          <div className="slider-wrapper">
            <input
              type="range"
              min={Math.round(viewMin)}
              max={Math.round(viewMax)}
              step={1}
              value={selectedYear}
              onChange={(e) => stopAndSetSelectedYear(Number(e.target.value))}
            />

            {movements && movements.length > 0 && (
              <div className="movements-wrapper">
                {movements
                  .filter(
                    (item) =>
                      item.start_date !== null &&
                      item.end_date !== null &&
                      item.start_date <= viewMax &&
                      item.start_date >= viewMin &&
                      item.count > 10
                  )
                  .map((item) => {
                    const left = getLeftPercent(item.start_date!);
                    return (
                      <div
                        className="milestone"
                        key={item.id}
                        style={{ left: `${left}%` }}
                        title={`Jump to ${item.name}`}
                        onClick={() => setSelectedMovement(item)}
                      >
                        {item.name}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* küçük info satırı (istersen kaldır) */}
        <div style={{ fontSize: 11, color: "#777", marginTop: 6 }}>
          View: {Math.round(viewMin)}–{Math.round(viewMax)} (domain: {domainMin}–{domainMax})
        </div>
      </div>
    </div>
  );
};

export default TimeSlider;
