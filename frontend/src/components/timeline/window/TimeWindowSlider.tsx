import { useEffect, useRef } from "react";
import * as d3 from "d3";

import "./TimeWindowSlider.css";

type Props = {
  fullRange: [number, number];
  windowRange: [number, number];
  setWindowRange: (range: [number, number]) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
};

const SNAP_STEP = 10;
const HANDLE_W = 7;
const HANDLE_H = 30;
const TRACK_H = 20;
const GUIDE_H = 15;

const COLORS = {
  rail: "#D3D1C7",
  guide: "#b1afac84",
  track: "#6f827066",
  handle: "#6f8270",
  handleBorder: "#526653",
  label: "#D3D1C7",
};

export default function TimeWindowSlider({
  fullRange,
  windowRange,
  setWindowRange,
  selectedYear,
  setSelectedYear,
}: Props) {
  const [alltime_min, alltime_max] = fullRange;
  const [minYear, maxYear] = windowRange;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Seçili yıl, görünür pencerenin içinde kalsın.
  useEffect(() => {
    const nextYear = Math.max(
      minYear,
      Math.min(maxYear, selectedYear)
    );

    if (nextYear !== selectedYear) {
      setSelectedYear(nextYear);
    }
  }, [selectedYear, minYear, maxYear, setSelectedYear]);

  useEffect(() => {
    // Drag sırasında SVG'yi silip yeniden oluşturma.
    // Konumları drag handler'ları günceller.
    if (isDraggingRef.current) return;

    const svgElement = svgRef.current;
    const container = containerRef.current;

    if (!svgElement || !container) return;

    const svg = d3.select(svgElement);

    const W = container.clientWidth;
    const H = 22;
    const padX = HANDLE_W / 2;

    if (W <= HANDLE_W) return;

    svg.attr("width", W).attr("height", H);
    svg.selectAll("*").remove();

    const xScale = d3
      .scaleLinear()
      .domain([alltime_min, alltime_max])
      .range([padX, W - padX]);

    const snap = (value: number) =>
      Math.round(value / SNAP_STEP) * SNAP_STEP;

    const clamp = (value: number) =>
      Math.max(alltime_min, Math.min(alltime_max, value));

    // Arka plan rayı
    svg
      .append("rect")
      .attr("x", padX)
      .attr("y", H / 2 - TRACK_H / 2)
      .attr("width", W - HANDLE_W)
      .attr("height", TRACK_H)
      .attr("fill", COLORS.rail);

    // Yıl etiketlerinin arka planı
    svg
      .append("rect")
      .attr("x", padX)
      .attr("y", H / 2 + TRACK_H / 2)
      .attr("width", W - HANDLE_W)
      .attr("height", GUIDE_H)
      .attr("fill", COLORS.guide);

    // Seçili zaman aralığı
    const track = svg
      .append("rect")
      .attr("x", xScale(minYear))
      .attr("y", H / 2 - TRACK_H / 2)
      .attr("width", xScale(maxYear) - xScale(minYear))
      .attr("height", TRACK_H)
      .attr("fill", COLORS.track);

    // Başlangıç yılı etiketi
    const minLabel = svg
      .append("text")
      .attr("x", xScale(minYear) + 14)
      .attr("y", H / 2 + TRACK_H)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "'Inter', sans-serif")
      .attr("font-weight", 500)
      .attr("fill", COLORS.label)
      .attr("pointer-events", "none")
      .text(minYear);

    // Bitiş yılı etiketi
    const maxLabel = svg
      .append("text")
      .attr("x", xScale(maxYear) - 14)
      .attr("y", H / 2 + TRACK_H)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "'Inter', sans-serif")
      .attr("font-weight", 500)
      .attr("fill", COLORS.label)
      .attr("pointer-events", "none")
      .text(maxYear);

    // Sol tutamaç
    const minHandle = svg
      .append("rect")
      .attr("x", xScale(minYear) - HANDLE_W / 2)
      .attr("y", H / 2 - HANDLE_H / 2)
      .attr("width", HANDLE_W)
      .attr("height", HANDLE_H)
      .attr("fill", COLORS.handle)
      .attr("stroke", COLORS.handleBorder)
      .attr("stroke-width", 1)
      .attr("cursor", "ew-resize");

    // Sağ tutamaç
    const maxHandle = svg
      .append("rect")
      .attr("x", xScale(maxYear) - HANDLE_W / 2)
      .attr("y", H / 2 - HANDLE_H / 2)
      .attr("width", HANDLE_W)
      .attr("height", HANDLE_H)
      .attr("fill", COLORS.handle)
      .attr("stroke", COLORS.handleBorder)
      .attr("stroke-width", 1)
      .attr("cursor", "ew-resize");

    let currentMin = minYear;
    let currentMax = maxYear;

    const updateVisuals = () => {
      minHandle.attr(
        "x",
        xScale(currentMin) - HANDLE_W / 2
      );

      maxHandle.attr(
        "x",
        xScale(currentMax) - HANDLE_W / 2
      );

      track
        .attr("x", xScale(currentMin))
        .attr(
          "width",
          xScale(currentMax) - xScale(currentMin)
        );

      minLabel
        .attr("x", xScale(currentMin) + 14)
        .text(currentMin);

      maxLabel
        .attr("x", xScale(currentMax) - 14)
        .text(currentMax);
    };

    const endDrag = () => {
      isDraggingRef.current = false;

      setWindowRange([currentMin, currentMax]);
    };

    const dragMin = d3
      .drag<SVGRectElement, unknown>()
      .on("start", () => {
        isDraggingRef.current = true;
      })
      .on("drag", (event) => {
        const nextMin = clamp(
          snap(xScale.invert(event.x))
        );

        if (
          nextMin >= currentMax ||
          nextMin === currentMin
        ) {
          return;
        }

        currentMin = nextMin;

        updateVisuals();
        setWindowRange([currentMin, currentMax]);
      })
      .on("end", endDrag);

    const dragMax = d3
      .drag<SVGRectElement, unknown>()
      .on("start", () => {
        isDraggingRef.current = true;
      })
      .on("drag", (event) => {
        const nextMax = clamp(
          snap(xScale.invert(event.x))
        );

        if (
          nextMax <= currentMin ||
          nextMax === currentMax
        ) {
          return;
        }

        currentMax = nextMax;

        updateVisuals();
        setWindowRange([currentMin, currentMax]);
      })
      .on("end", endDrag);

    minHandle.call(dragMin);
    maxHandle.call(dragMax);

    // Tüm proje aralığının başlangıç yılı
    svg
      .append("text")
      .attr("x", padX + 14)
      .attr("y", H / 2 + TRACK_H)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "'Inter', sans-serif")
      .attr("fill", COLORS.label)
      .attr("pointer-events", "none")
      .text(alltime_min);

    // Tüm proje aralığının bitiş yılı
    svg
      .append("text")
      .attr("x", W - padX - 14)
      .attr("y", H / 2 + TRACK_H)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "'Inter', sans-serif")
      .attr("fill", COLORS.label)
      .attr("pointer-events", "none")
      .text(alltime_max);
  }, [
    fullRange,
    windowRange,
    alltime_min,
    alltime_max,
    minYear,
    maxYear,
    setWindowRange,
  ]);

  return (
    <div className="tw-window" ref={containerRef}>
      <svg
        ref={svgRef}
        style={{
          display: "block",
          overflow: "visible",
          userSelect: "none",
          touchAction: "none",
        }}
      />
    </div>
  );
}