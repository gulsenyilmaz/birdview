import React, { useMemo } from "react";



import {
  HIST_ROW_H,
} from "../../../timelineConstants";

import type {
  HistogramLayerConfig,
  TimelineXScale,
} from "../../../timelineTypes";

interface HistogramLayerProps {
  layer: HistogramLayerConfig;

  chartWidth: number;

  minYear: number;
  maxYear: number;

  selectedYear: number;

  xScale: TimelineXScale;

  setSelectedYear: (
    year: number
  ) => void;
}
interface HistogramBin {
  start: number;
  end: number;
  center: number;
  value: number;
}



const HistogramLayer: React.FC<HistogramLayerProps> = ({
  layer,
  chartWidth,
  minYear,
  maxYear,
  selectedYear,
  xScale,
  setSelectedYear,
}) => {
  /* ==========================================================
     RANGE
  ========================================================== */

  const totalRange = maxYear - minYear;

  /* ==========================================================
     BIN SIZE

     TimelineCanvas'ın işi değil.
     Histogramın kendi görselleştirme kararı olduğu için
     burada tutuluyor.
  ========================================================== */

  const binSize = useMemo(() => {
    if (totalRange <= 100) return 1;
    if (totalRange <= 150) return 2;
    if (totalRange <= 500) return 5;
    if (totalRange <= 1500) return 10;

    return 10;
  }, [totalRange]);

  /* ==========================================================
     BINS
  ========================================================== */

  const { bins, maxVal } = useMemo(() => {
    const counts = layer.counts ?? [];
    const aggregation =
      layer.binAggregation ?? "sum";

    if (counts.length === 0) {
      return {
        bins: [] as HistogramBin[],
        maxVal: 0,
      };
    }

    /*
     * Görünen window için dense year array oluşturuyoruz.
     *
     * Örn:
     *
     * 1900 → 4
     * 1901 → 7
     * 1902 → 0
     * 1903 → 2
     */
    const dense = new Array(
      maxYear - minYear + 1
    ).fill(0);

    for (const { year, count } of counts) {
      if (
        year >= minYear &&
        year <= maxYear
      ) {
        dense[year - minYear] = count;
      }
    }

    const result: HistogramBin[] = [];

    let peak = 0;

    /*
     * Bin sınırlarının düzgün yıllardan başlamasını sağlıyor.
     *
     * Örn binSize = 10 ise:
     *
     * 1870
     * 1880
     * 1890
     * ...
     */
    const firstBinStart =
      Math.floor(minYear / binSize) *
      binSize;

    for (
      let start = firstBinStart;
      start <= maxYear;
      start += binSize
    ) {
      let sum = 0;
      let yearCount = 0;

      const visibleStart =
        Math.max(start, minYear);

      const visibleEnd =
        Math.min(
          start + binSize - 1,
          maxYear
        );

      for (
        let year = visibleStart;
        year <= visibleEnd;
        year++
      ) {
        sum += dense[year - minYear];
        yearCount++;
      }

      const value =
        aggregation === "avg" &&
        yearCount > 0
          ? sum / yearCount
          : sum;

      const end = Math.min(
        start + binSize,
        maxYear
      );

      result.push({
        start,
        end,
        center:
          start + binSize / 2,
        value,
      });

      peak = Math.max(
        peak,
        value
      );
    }

    return {
      bins: result,
      maxVal: peak,
    };
  }, [
    layer.counts,
    layer.binAggregation,
    minYear,
    maxYear,
    binSize,
  ]);

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
      className="timeline-layer-svg"
      width={chartWidth}
      height={HIST_ROW_H}
      viewBox={`0 0 ${chartWidth} ${HIST_ROW_H}`}
    >
      {/* ================================================
          TOP SEPARATOR
      ================================================ */}

      <line
        x1={0}
        y1={0}
        x2={chartWidth}
        y2={0}
        stroke="#b8b7b1"
        strokeWidth={0.5}
      />

      {/* ================================================
          HISTOGRAM BARS
      ================================================ */}

      {bins.map((bin) => {
        /*
         * Burada bin'in başlangıç ve bitiş yıllarını
         * doğrudan xScale ile pixel'e çeviriyoruz.
         *
         * Responsive davranışın esas noktası burası.
         */
        const x1 = xScale(
          Math.max(bin.start, minYear)
        );

        const x2 = xScale(
          Math.min(bin.end, maxYear)
        );

        const width = Math.max(
          1,
          x2 - x1
        );

        const percentage =
          maxVal > 0
            ? bin.value / maxVal
            : 0;

        const barHeight =
          bin.value > 0
            ? Math.max(
                2,
                percentage *
                  (HIST_ROW_H - 4)
              )
            : 0;

        return (
          <rect
            key={`${layer.id}-${bin.start}`}
            x={x1}
            y={
              HIST_ROW_H -
              barHeight
            }
            width={width}
            height={barHeight}
            fill={layer.color}
            opacity={0.75}
            style={{
              cursor:
                bin.value > 0
                  ? "pointer"
                  : "default",
            }}
            onClick={
              bin.value > 0
                ? (event) => {
                    event.stopPropagation();

                    /*
                     * Histogram barına basınca
                     * ilgili bin'in ilk yılını seçiyoruz.
                     */
                    setSelectedYear(
                      Math.max(
                        minYear,
                        bin.start
                      )
                    );
                  }
                : undefined
            }
          />
        );
      })}

      {/* ================================================
          SELECTED YEAR LINE
      ================================================ */}

      <line
        x1={yearLineX}
        y1={0}
        x2={yearLineX}
        y2={HIST_ROW_H}
        stroke="#202020"
        strokeWidth={1.5}
        pointerEvents="none"
      />
    </svg>
  );
};

export default HistogramLayer;