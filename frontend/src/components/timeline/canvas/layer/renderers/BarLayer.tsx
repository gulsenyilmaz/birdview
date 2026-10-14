import React, {
  useMemo,
} from "react";

import type {
  BarLayerConfig,
  TimelineBarItem,
  TimelineXScale,
} from "../../../timelineTypes";

import {
  BAR_ROW_H,
  BAR_GAP,
  HIST_ROW_H,
} from "../../../timelineConstants";

interface BarLayerProps {
  layer: BarLayerConfig;

  chartWidth: number;

  minYear: number;
  maxYear: number;

  selectedYear: number;

  xScale: TimelineXScale;
}

interface VisibleBarItem {
  original: TimelineBarItem;

  activeStart: number;
  activeEnd: number;

  lifespanStart: number;
  lifespanEnd: number;
}

const BarLayer: React.FC<BarLayerProps> = ({
  layer,
  chartWidth,
  minYear,
  maxYear,
  selectedYear,
  xScale,
}) => {
  /* ==========================================================
     VISIBLE DATA
  ========================================================== */

  const visibleData =
  useMemo<VisibleBarItem[]>(() => {
    return layer.data
      .map((item) => {
        const rawActiveStart =
          item.start_date ??
          item.birth_date ??
          minYear;

        const rawActiveEnd =
          item.end_date ??
          item.death_date ??
          maxYear;

        const rawLifespanStart =
          item.birth_date ??
          item.start_date ??
          minYear;

        const rawLifespanEnd =
          item.death_date ??
          item.end_date ??
          maxYear;

        return {
          original: item,

          activeStart:
            rawActiveStart,

          activeEnd:
            rawActiveEnd,

          lifespanStart:
            rawLifespanStart,

          lifespanEnd:
            rawLifespanEnd,
        };
      })

      .filter((item) => {
        return (
          item.activeStart <=
            maxYear &&
          item.activeEnd >=
            minYear
        );
      })

      .map((item) => ({
        ...item,

        activeStart:
          Math.max(
            item.activeStart,
            minYear
          ),

        activeEnd:
          Math.min(
            item.activeEnd,
            maxYear
          ),

        lifespanStart:
          Math.max(
            item.lifespanStart,
            minYear
          ),

        lifespanEnd:
          Math.min(
            item.lifespanEnd,
            maxYear
          ),
      }));
  }, [
    layer.data,
    minYear,
    maxYear,
  ]);

  /* ==========================================================
     HEIGHT
  ========================================================== */

  const layerHeight = Math.max(
    HIST_ROW_H,
    visibleData.length *
      (BAR_ROW_H + BAR_GAP)
  );

  /* ==========================================================
     SELECTED YEAR
  ========================================================== */

  const yearLineX =
    xScale(selectedYear);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <svg
      className="timeline-layer-svg bar-layer"
      width={chartWidth}
      height={layerHeight}
      viewBox={`0 0 ${chartWidth} ${layerHeight}`}
    >
      {/* top separator */}

      <line
        className="timeline-layer-separator"
        x1={0}
        y1={0}
        x2={chartWidth}
        y2={0}
      />

      {/* bars */}

      {visibleData.map(
        (item, index) => {
          const data =
            item.original;

          const rowY =
            index *
            (BAR_ROW_H +
              BAR_GAP);

          /* ------------------------------------------
             Lifespan
          ------------------------------------------ */

          const lifespanX1 =
            xScale(
              item.lifespanStart
            );

          const lifespanX2 =
            xScale(
              item.lifespanEnd
            );

          const lifespanWidth =
            Math.max(
              4,
              lifespanX2 -
                lifespanX1
            );

          /* ------------------------------------------
             Active period
          ------------------------------------------ */

          const activeX1 =
            xScale(
              item.activeStart
            );

          const activeX2 =
            xScale(
              item.activeEnd
            );

          const activeWidth =
            Math.max(
              3,
              activeX2 -
                activeX1
            );

          /* ------------------------------------------
             Color
          ------------------------------------------ */

          const color =
            layer.objectColor
              ? layer.objectColor(
                  data.relationship_type_name ??
                    data.name ??
                    ""
                )
              : layer.color;

          /* ------------------------------------------
             Label
          ------------------------------------------ */

          const labelStart =
            data.start_date ??
            data.birth_date ??
            "?";

          const labelEnd =
            data.end_date ??
            data.death_date ??
            "?";

          const label = [
            data.name,
            data.relationship_type_name,
            `${labelStart} – ${labelEnd}`,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <g
              key={
                data.id ??
                `${layer.id}-${index}`
              }
              className={
                layer.onSelect
                  ? "bar-item clickable"
                  : "bar-item"
              }
              onClick={
                layer.onSelect
                  ? (event) => {
                      event.stopPropagation();

                      layer.onSelect?.(
                        data
                      );
                    }
                  : undefined
              }
            >
              {/* Lifespan */}

              <rect
                className="bar-lifespan"
                x={lifespanX1}
                y={rowY}
                width={
                  lifespanWidth
                }
                height={
                  BAR_ROW_H
                }
                fill={color}
              />

              {/* Active period */}

              <rect
                className="bar-active-period"
                x={activeX1}
                y={rowY}
                width={
                  activeWidth
                }
                height={
                  BAR_ROW_H
                }
                fill={color}
              />

              {/* Label */}

              <text
                className="bar-label"
                x={activeX1 + 2}
                y={
                  rowY +
                  BAR_ROW_H -
                  2
                }
              >
                {label}
              </text>

              <title>
                {label}
              </title>
            </g>
          );
        }
      )}

      {/* selected year */}

      <line
        className="timeline-year-line"
        x1={yearLineX}
        y1={0}
        x2={yearLineX}
        y2={layerHeight}
      />
    </svg>
  );
};

export default BarLayer;