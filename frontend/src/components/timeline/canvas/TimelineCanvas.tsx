import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as d3 from "d3";

import "./TimelineCanvas.css";

import LayerRow from "./layer/LayerRow";
import TimelineAxis from "./axis/TimelineAxis";
import ZoomControl from "./ZoomControl";

import type {
  TimelineCanvasProps,
  TimelineXScale,
} from "../timelineTypes";

import {
  DEFAULT_MIN_ZOOM_RANGE,
} from "../timelineConstants";

const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  selectedYear,
  setSelectedYear,
  fullRange,
  windowRange,
  setWindowRange,
  layers,
}) => {
  /* ==========================================================
     RESPONSIVE CHART WIDTH

     CSS grid sol chart kolonunun genişliğini belirliyor.
     Biz o gerçek genişliği ölçüyoruz.

     Artık:
       containerWidth - SIDE_W

     hesabına gerek yok.
  ========================================================== */

  const chartMeasureRef = useRef<HTMLDivElement>(null);

  const [chartWidth, setChartWidth] =
    useState(0);

  useEffect(() => {
    const element =
      chartMeasureRef.current;

    if (!element) return;

    const updateWidth = () => {
      setChartWidth(
        element.getBoundingClientRect().width
      );
    };

    updateWidth();

    const resizeObserver =
      new ResizeObserver((entries) => {
        const entry = entries[0];

        if (!entry) return;

        setChartWidth(
          entry.contentRect.width
        );
      });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /* ==========================================================
     RANGE
  ========================================================== */

  const [
    alltimeMinYear,
    alltimeMaxYear,
  ] = fullRange;

  const [
    minYear,
    maxYear,
  ] = windowRange;

  const totalRange =
    maxYear - minYear;

  const alltimeTotalRange =
    alltimeMaxYear -
    alltimeMinYear;

  /* ==========================================================
     SHARED X SCALE
  ========================================================== */

  const xScale =
    useMemo<TimelineXScale>(() => {
      return d3
        .scaleLinear()
        .domain([
          minYear,
          maxYear,
        ])
        .range([
          0,
          chartWidth,
        ])
        .clamp(true);
    }, [
      minYear,
      maxYear,
      chartWidth,
    ]);

  /* ==========================================================
     YEAR STEP
  ========================================================== */

  const yearStep =
    useMemo(() => {
      if (totalRange <= 50)
        return 2;

      if (totalRange <= 250)
        return 5;

      if (totalRange <= 500)
        return 20;

      if (totalRange <= 1500)
        return 50;

      if (totalRange <= 2500)
        return 100;

      if (totalRange <= 5000)
        return 200;

      if (totalRange <= 7000)
        return 500;

      return 1000;
    }, [totalRange]);

  /* ==========================================================
     VISIBLE LAYERS
  ========================================================== */

  const visibleLayers =
    useMemo(
      () =>
        layers.filter(
          (layer) =>
            layer.show
        ),
      [layers]
    );

  /* ==========================================================
     RANGE CLAMPING
  ========================================================== */

  const clampWindowRange =
    useCallback(
      (
        requestedRange: [
          number,
          number
        ]
      ): [
        number,
        number
      ] => {
        let [
          newMin,
          newMax,
        ] =
          requestedRange;

        const requestedSpan =
          newMax - newMin;

        if (
          requestedSpan >=
          alltimeTotalRange
        ) {
          return [
            alltimeMinYear,
            alltimeMaxYear,
          ];
        }

        if (
          newMin <
          alltimeMinYear
        ) {
          const difference =
            alltimeMinYear -
            newMin;

          newMin +=
            difference;

          newMax +=
            difference;
        }

        if (
          newMax >
          alltimeMaxYear
        ) {
          const difference =
            newMax -
            alltimeMaxYear;

          newMin -=
            difference;

          newMax -=
            difference;
        }

        return [
          Math.round(newMin),
          Math.round(newMax),
        ];
      },
      [
        alltimeMinYear,
        alltimeMaxYear,
        alltimeTotalRange,
      ]
    );

  /* ==========================================================
     WINDOW RANGE CHANGE
  ========================================================== */

  const handleWindowRangeChange =
    useCallback(
      (
        requestedRange: [
          number,
          number
        ]
      ) => {
        setWindowRange(
          clampWindowRange(
            requestedRange
          )
        );
      },
      [
        clampWindowRange,
        setWindowRange,
      ]
    );

  /* ==========================================================
     SELECTED YEAR
  ========================================================== */

  const handleSelectedYearChange =
    useCallback(
      (year: number) => {
        const clampedYear =
          Math.round(
            Math.max(
              alltimeMinYear,
              Math.min(
                alltimeMaxYear,
                year
              )
            )
          );

        setSelectedYear(
          clampedYear
        );
      },
      [
        alltimeMinYear,
        alltimeMaxYear,
        setSelectedYear,
      ]
    );

  /* ==========================================================
     ZOOM
  ========================================================== */

  const minZoomRange =
    Math.min(
      DEFAULT_MIN_ZOOM_RANGE,
      alltimeTotalRange
    );

  const handleZoomChange =
    useCallback(
      (
        requestedRange: number
      ) => {
        const newTotalRange =
          Math.max(
            minZoomRange,
            Math.min(
              alltimeTotalRange,
              requestedRange
            )
          );

        let centerYear =
          (
            minYear +
            maxYear
          ) / 2;

        if (
          selectedYear <
            minYear ||
          selectedYear >
            maxYear
        ) {
          centerYear =
            selectedYear;
        }

        const halfRange =
          newTotalRange / 2;

        let newMin =
          centerYear -
          halfRange;

        let newMax =
          centerYear +
          halfRange;

        if (
          newMin <
          alltimeMinYear
        ) {
          newMin =
            alltimeMinYear;

          newMax =
            newMin +
            newTotalRange;
        }

        if (
          newMax >
          alltimeMaxYear
        ) {
          newMax =
            alltimeMaxYear;

          newMin =
            newMax -
            newTotalRange;
        }

        handleWindowRangeChange([
          newMin,
          newMax,
        ]);
      },
      [
        minZoomRange,
        alltimeTotalRange,
        minYear,
        maxYear,
        selectedYear,
        alltimeMinYear,
        alltimeMaxYear,
        handleWindowRangeChange,
      ]
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
  <div className="timeline-canvas">
    {/* =========================
        SCROLLABLE LAYERS
    ========================= */}

    <div className="timeline-layers-scroll">
      {chartWidth > 0 &&
        visibleLayers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            chartWidth={chartWidth}
            minYear={minYear}
            maxYear={maxYear}
            selectedYear={selectedYear}
            xScale={xScale}
            setSelectedYear={
              handleSelectedYearChange
            }
          />
        ))}
    </div>

    {/* =========================
        FIXED TIMELINE + ZOOM
    ========================= */}
  <div className="timeline-bottom-gutter">
    <div className="timeline-bottom-row">
      <div
        ref={chartMeasureRef}
        className="timeline-axis-cell"
      >
        {chartWidth > 0 && (
          <TimelineAxis
            chartWidth={chartWidth}
            selectedYear={selectedYear}
            minYear={minYear}
            maxYear={maxYear}
            fullRange={fullRange}
            yearStep={yearStep}
            xScale={xScale}
            setSelectedYear={
              handleSelectedYearChange
            }
            setWindowRange={
              handleWindowRangeChange
            }
          />
        )}
      </div>

      <div className="timeline-zoom-cell">
        <ZoomControl
          value={totalRange}
          min={minZoomRange}
          max={alltimeTotalRange}
          onChange={handleZoomChange}
        />
      </div>
    </div></div>
  </div>
);
};

export default TimelineCanvas;