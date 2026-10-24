import React, { useEffect, useRef } from "react";

import type { TimelineXScale } from "../../timelineTypes";

import {
  SLIDER_ROW_H,
  LABEL_ROW_H,
  AXIS_H,
} from "../../timelineConstants";

interface TimelineAxisProps {
  chartWidth: number;
  selectedYear: number;
  minYear: number;
  maxYear: number;
  fullRange: [number, number];
  yearStep: number;
  xScale: TimelineXScale;
  setSelectedYear: (year: number) => void;
  setWindowRange: (range: [number, number]) => void;
}

const TimelineAxis: React.FC<TimelineAxisProps> = ({
  chartWidth,
  selectedYear,
  minYear,
  maxYear,
  fullRange,
  yearStep,
  xScale,
  setSelectedYear,
  setWindowRange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const yearDragAreaRef = useRef<SVGRectElement>(null);

  const currentYearRef = useRef(selectedYear);
  const sliderDragRect = useRef<DOMRect | null>(null);

  const labelDragStart = useRef<{
    x: number;
    min: number;
    max: number;
  } | null>(null);

  /* ==========================================================
     RANGE
  ========================================================== */

  const [alltimeMinYear, alltimeMaxYear] = fullRange;

  const totalRange = maxYear - minYear;

  const selectableMinYear = Math.ceil(
    Math.max(minYear, alltimeMinYear)
  );

  const selectableMaxYear = Math.floor(
    Math.min(maxYear, alltimeMaxYear)
  );

  /* ==========================================================
     SELECTED YEAR
  ========================================================== */

  const yearLineX = xScale(selectedYear);

  useEffect(() => {
    currentYearRef.current = selectedYear;
  }, [selectedYear]);

  const updateSelectedYear = (year: number) => {
    if (
      !Number.isFinite(year) ||
      selectableMinYear > selectableMaxYear
    ) {
      return;
    }

    const nextYear = Math.max(
      selectableMinYear,
      Math.min(selectableMaxYear, Math.round(year))
    );

    if (nextYear === currentYearRef.current) {
      return;
    }

    currentYearRef.current = nextYear;
    setSelectedYear(nextYear);
  };

  /* ==========================================================
     KEYBOARD

     Handle odaklıyken:
     ← / →          : 1 yıl
     Shift + ← / →  : 10 yıl
  ========================================================== */

  const handleYearKeyDown = (
    event: React.KeyboardEvent<SVGRectElement>
  ) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    let direction: number;

    if (event.key === "ArrowRight") {
      direction = 1;
    } else if (event.key === "ArrowLeft") {
      direction = -1;
    } else {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const step = event.shiftKey ? 10 : 1;

    updateSelectedYear(
      currentYearRef.current + direction * step
    );
  };

  /* ==========================================================
     MOUSE WHEEL

     Yalnızca handle / yıl çizgisi üzerindeyken:
     Yukarı : ileri
     Aşağı  : geri
     Shift  : 10 yıl

     passive: false sayesinde yıl değişirken sayfa kaymaz.
  ========================================================== */

  useEffect(() => {
    const element = yearDragAreaRef.current;

    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      // Tarayıcı zoom ve sistem kısayollarını koru.
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const delta =
        event.deltaY !== 0
          ? event.deltaY
          : event.deltaX;

      if (
        delta === 0 ||
        selectableMinYear > selectableMaxYear
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const direction = delta < 0 ? 1 : -1;
      const step = event.shiftKey ? 10 : 1;

      const nextYear = Math.max(
        selectableMinYear,
        Math.min(
          selectableMaxYear,
          Math.round(
            currentYearRef.current + direction * step
          )
        )
      );

      if (nextYear === currentYearRef.current) {
        return;
      }

      currentYearRef.current = nextYear;
      setSelectedYear(nextYear);
    };

    element.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [
    selectableMinYear,
    selectableMaxYear,
    setSelectedYear,
  ]);

  /* ==========================================================
     LABEL DRAG

     Yıl etiketlerini sürükleyerek görünür pencereyi taşı.
  ========================================================== */

  const handleLabelPointerDown = (
    event: React.PointerEvent<SVGGElement>
  ) => {
    if (event.button !== 0) return;

    event.preventDefault();

    labelDragStart.current = {
      x: event.clientX,
      min: minYear,
      max: maxYear,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  const handleLabelPointerMove = (
    event: React.PointerEvent<SVGGElement>
  ) => {
    const start = labelDragStart.current;

    if (
      !start ||
      chartWidth <= 0 ||
      yearStep <= 0 ||
      !event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      return;
    }

    const dx = event.clientX - start.x;
    const windowSize = start.max - start.min;
    const yearsPerPixel = windowSize / chartWidth;

    // Sağa sürükleme: geçmişe.
    // Sola sürükleme: geleceğe.
    const yearDelta = -dx * yearsPerPixel;

    const snappedDelta =
      Math.round(yearDelta / yearStep) * yearStep;

    let newMin = start.min + snappedDelta;
    let newMax = start.max + snappedDelta;

    if (windowSize >= alltimeMaxYear - alltimeMinYear) {
      setWindowRange([
        alltimeMinYear,
        alltimeMaxYear,
      ]);
      return;
    }

    if (newMin < alltimeMinYear) {
      newMin = alltimeMinYear;
      newMax = newMin + windowSize;
    }

    if (newMax > alltimeMaxYear) {
      newMax = alltimeMaxYear;
      newMin = newMax - windowSize;
    }

    setWindowRange([newMin, newMax]);
  };

  const handleLabelPointerUp = (
    event: React.PointerEvent<SVGGElement>
  ) => {
    labelDragStart.current = null;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  };

  /* ==========================================================
     SLIDER DRAG
  ========================================================== */

  const handleSliderPointerDown = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    if (event.button !== 0) return;

    const svg = svgRef.current;

    if (!svg || chartWidth <= 0) return;

    event.preventDefault();
    event.stopPropagation();

    yearDragAreaRef.current?.focus({
      preventScroll: true,
    });

    sliderDragRect.current =
      svg.getBoundingClientRect();

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  const handleSliderPointerMove = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    const rect = sliderDragRect.current;

    if (
      !rect ||
      rect.width <= 0 ||
      chartWidth <= 0 ||
      !event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      return;
    }

    const relativeX = event.clientX - rect.left;

    const svgX =
      relativeX * (chartWidth / rect.width);

    const clampedX = Math.max(
      0,
      Math.min(chartWidth, svgX)
    );

    updateSelectedYear(
      xScale.invert(clampedX)
    );
  };

  const handleSliderPointerUp = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    sliderDragRect.current = null;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  };

  /* ==========================================================
     SLIDER RAIL CLICK

     Slider satırına tıklayınca seçili yılı değiştir.
  ========================================================== */

  const handleSvgClick = (
    event: React.MouseEvent<SVGSVGElement>
  ) => {
    const svg = svgRef.current;

    if (!svg || chartWidth <= 0) return;

    const rect = svg.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const x =
      (event.clientX - rect.left) *
      (chartWidth / rect.width);

    const y =
      (event.clientY - rect.top) *
      (AXIS_H / rect.height);

    // Etiket satırı sürükleme için ayrılmıştır.
    if (y < 0 || y > SLIDER_ROW_H) {
      return;
    }

    const clampedX = Math.max(
      0,
      Math.min(chartWidth, x)
    );

    updateSelectedYear(
      xScale.invert(clampedX)
    );

    yearDragAreaRef.current?.focus({
      preventScroll: true,
    });
  };

  /* ==========================================================
     YEAR LABELS
  ========================================================== */

  const years: number[] = [];

  if (
    Number.isFinite(yearStep) &&
    yearStep > 0 &&
    Number.isFinite(minYear) &&
    Number.isFinite(maxYear) &&
    totalRange >= 0
  ) {
    const firstYear =
      Math.ceil(minYear / yearStep) * yearStep;

    for (
      let year = firstYear;
      year <= maxYear;
      year += yearStep
    ) {
      years.push(year);
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <svg
      ref={svgRef}
      className="timeline-axis"
      width={chartWidth}
      height={AXIS_H}
      viewBox={`0 0 ${chartWidth} ${AXIS_H}`}
      onClick={handleSvgClick}
    >
      {/* SLIDER ROW */}
      <g className="timeline-slider-row">
        <line
          className="timeline-layer-separator"
          x1={0}
          y1={0}
          x2={chartWidth}
          y2={0}
        />

        <rect
          className="timeline-year-handle"
          x={yearLineX - 9}
          y={0}
          width={18}
          height={SLIDER_ROW_H}
          pointerEvents="none"
        />
      </g>

      {/* YEAR LABEL ROW */}
      <g
        className="timeline-year-labels"
        style={{
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={handleLabelPointerDown}
        onPointerMove={handleLabelPointerMove}
        onPointerUp={handleLabelPointerUp}
        onPointerCancel={handleLabelPointerUp}
        onLostPointerCapture={() => {
          labelDragStart.current = null;
        }}
      >
        <rect
          className="timeline-year-label-background"
          x={0}
          y={SLIDER_ROW_H}
          width={chartWidth}
          height={LABEL_ROW_H}
        />

        {years.map((year) => {
          const x = xScale(year);

          const isActive =
            selectedYear >= year &&
            selectedYear < year + yearStep;

          return (
            <g key={year}>
              <line
                className={
                  isActive
                    ? "timeline-year-tick active"
                    : "timeline-year-tick"
                }
                x1={x}
                y1={SLIDER_ROW_H + 2}
                x2={x}
                y2={AXIS_H - 2}
              />

              <text
                className={
                  isActive
                    ? "timeline-year-text active"
                    : "timeline-year-text"
                }
                x={x + 3}
                y={AXIS_H - 3}
              >
                {year}
              </text>
            </g>
          );
        })}
      </g>

      {/* SELECTED YEAR LINE */}
      <line
        className="timeline-year-line"
        x1={yearLineX}
        y1={0}
        x2={yearLineX}
        y2={AXIS_H}
        pointerEvents="none"
      />

      {/* Handle ve yıl çizgisi için ortak etkileşim alanı */}
      <rect
        ref={yearDragAreaRef}
        className="timeline-year-drag-area"
        x={yearLineX - 12}
        y={0}
        width={24}
        height={AXIS_H}
        fill="transparent"
        pointerEvents="all"
        style={{
          cursor: "ew-resize",
          touchAction: "none",
        }}
        tabIndex={0}
        role="slider"
        aria-label="Selected year"
        aria-orientation="horizontal"
        aria-valuemin={selectableMinYear}
        aria-valuemax={selectableMaxYear}
        aria-valuenow={selectedYear}
        onKeyDown={handleYearKeyDown}
        onPointerDown={handleSliderPointerDown}
        onPointerMove={handleSliderPointerMove}
        onPointerUp={handleSliderPointerUp}
        onPointerCancel={handleSliderPointerUp}
        onLostPointerCapture={() => {
          sliderDragRect.current = null;
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      />
    </svg>
  );
};

export default TimelineAxis;