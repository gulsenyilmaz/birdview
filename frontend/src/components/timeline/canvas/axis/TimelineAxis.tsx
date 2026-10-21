import React, { useRef } from "react";

import type {
  TimelineXScale,
} from "../../timelineTypes";

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

  setWindowRange: (
    range: [number, number]
  ) => void;
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
  const svgRef =
    useRef<SVGSVGElement>(null);

  /* ==========================================================
     RANGE
  ========================================================== */

  const [
    alltimeMinYear,
    alltimeMaxYear,
  ] = fullRange;

  const totalRange =
    maxYear - minYear;

  /* ==========================================================
     SELECTED YEAR
  ========================================================== */

  const yearLineX =
    xScale(selectedYear);

  /* ==========================================================
     LABEL DRAG

     Yıl etiketleri alanını sürükleyerek
     timeline window'unu sağa / sola taşıyoruz.
  ========================================================== */

  const isDraggingLabels =
    useRef(false);

  const labelDragStart =
    useRef<{
      x: number;
      min: number;
      max: number;
    } | null>(null);

  const handleLabelPointerDown = (
    event: React.PointerEvent<SVGGElement>
  ) => {
    isDraggingLabels.current = true;

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
    if (
      !isDraggingLabels.current ||
      !labelDragStart.current ||
      chartWidth <= 0
    ) {
      return;
    }

    const dx =
      event.clientX -
      labelDragStart.current.x;

    /*
     * Gerçek chart genişliğine göre
     * pixel → year dönüşümü.
     */
    const yearsPerPixel =
      totalRange /
      chartWidth;

    /*
     * Sağa sürükleme → geçmişe
     * Sola sürükleme → geleceğe
     */
    const yearDelta =
      -dx *
      yearsPerPixel;

    /*
     * Hareketi mevcut timeline step'ine oturt.
     */
    const snappedDelta =
      Math.round(
        yearDelta /
          yearStep
      ) *
      yearStep;

    if (
      snappedDelta === 0
    ) {
      return;
    }

    let newMin =
      labelDragStart.current.min +
      snappedDelta;

    let newMax =
      labelDragStart.current.max +
      snappedDelta;

    /*
     * Sol sınır.
     */
    if (
      newMin <
      alltimeMinYear
    ) {
      newMin =
        alltimeMinYear;

      newMax =
        newMin +
        totalRange;
    }

    /*
     * Sağ sınır.
     */
    if (
      newMax >
      alltimeMaxYear
    ) {
      newMax =
        alltimeMaxYear;

      newMin =
        newMax -
        totalRange;
    }

    setWindowRange([
      newMin,
      newMax,
    ]);
  };

  const handleLabelPointerUp = (
    event: React.PointerEvent<SVGGElement>
  ) => {
    isDraggingLabels.current = false;

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

     Kırmızı handle'ı sürükleyerek selectedYear değişiyor.
  ========================================================== */

  const sliderDragRect =
    useRef<DOMRect | null>(null);

  const handleSliderPointerDown = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    const svg =
      svgRef.current;

    if (!svg) return;

    event.preventDefault();
    event.stopPropagation();

    sliderDragRect.current =
      svg.getBoundingClientRect();

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  const handleSliderPointerMove = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    const rect =
      sliderDragRect.current;

    if (
      !rect ||
      !event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      return;
    }

    const relativeX =
      event.clientX -
      rect.left;

    const svgX =
      relativeX *
      (
        chartWidth /
        rect.width
      );

    const clampedX =
      Math.max(
        0,
        Math.min(
          chartWidth,
          svgX
        )
      );

    const year =
      Math.round(
        xScale.invert(
          clampedX
        )
      );

    setSelectedYear(
      year
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

     Slider'ın herhangi bir noktasına tıklayınca
     selectedYear doğrudan o yıla geçiyor.
  ========================================================== */

  const handleSvgClick = (
    event: React.MouseEvent<SVGSVGElement>
  ) => {
    const svg =
      svgRef.current;

    if (!svg) return;

    const rect =
      svg.getBoundingClientRect();

    const x =
      (
        event.clientX -
        rect.left
      ) *
      (
        chartWidth /
        rect.width
      );

    const y =
      (
        event.clientY -
        rect.top
      ) *
      (
        AXIS_H /
        rect.height
      );

    /*
     * Yalnızca slider row click kabul ediyor.
     * Label row drag için ayrılmış durumda.
     */
    if (
      y < 0 ||
      y >
        SLIDER_ROW_H
    ) {
      return;
    }

    const clampedX =
      Math.max(
        0,
        Math.min(
          chartWidth,
          x
        )
      );

    const year =
      Math.round(
        xScale.invert(
          clampedX
        )
      );

    setSelectedYear(
      year
    );
  };

  /* ==========================================================
     YEAR LABELS
  ========================================================== */

  const years: number[] = [];

  /*
     * Örn:
     *
     * minYear = 1837
     * step = 20
     *
     * ilk label = 1840
  */

  const firstYear =
    Math.ceil(
      minYear /
        yearStep
    ) *
    yearStep;

  for (
    let year = firstYear;
    year <= maxYear;
    year += yearStep
  ) {
    years.push(year);
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
      onClick={
        handleSvgClick
      }
    >
      {/* ====================================================
          SLIDER ROW
      ==================================================== */}

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
          x={
            yearLineX -
            9
          }
          y={0}
          width={18}
          height={
            SLIDER_ROW_H
          }
          onPointerDown={
            handleSliderPointerDown
          }
          onPointerMove={
            handleSliderPointerMove
          }
          onPointerUp={
            handleSliderPointerUp
          }
          onPointerCancel={
            handleSliderPointerUp
          }
        />
      </g>

      {/* ====================================================
          YEAR LABEL ROW
      ==================================================== */}

      <g
        className="timeline-year-labels"
        onPointerDown={
          handleLabelPointerDown
        }
        onPointerMove={
          handleLabelPointerMove
        }
        onPointerUp={
          handleLabelPointerUp
        }
        onPointerCancel={
          handleLabelPointerUp
        }
      >
        <rect
          className="timeline-year-label-background"
          x={0}
          y={
            SLIDER_ROW_H
          }
          width={
            chartWidth
          }
          height={
            LABEL_ROW_H
          }
        />

        {years.map(
          (year) => {
            const x =
              xScale(year);

            const isActive =
              selectedYear >=
                year &&
              selectedYear <
                year +
                  yearStep;

            return (
              <g
                key={
                  year
                }
              >
                <line
                  className={
                    isActive
                      ? "timeline-year-tick active"
                      : "timeline-year-tick"
                  }
                  x1={x}
                  y1={
                    SLIDER_ROW_H +
                    2
                  }
                  x2={x}
                  y2={
                    AXIS_H -
                    2
                  }
                />

                <text
                  className={
                    isActive
                      ? "timeline-year-text active"
                      : "timeline-year-text"
                  }
                  x={
                    x + 3
                  }
                  y={
                    AXIS_H -
                    3
                  }
                >
                  {year}
                </text>
              </g>
            );
          }
        )}
      </g>

      {/* ====================================================
          SELECTED YEAR LINE
      ==================================================== */}

      <line
        className="timeline-year-line"
        x1={
          yearLineX
        }
        y1={0}
        x2={
          yearLineX
        }
        y2={
          AXIS_H
        }
      />
      {/* Handle ve yıl çizgisi için ortak, geniş sürükleme alanı */}
      <rect
        className="timeline-year-drag-area"
        x={yearLineX - 12}
        y={0}
        width={24}
        height={AXIS_H}
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