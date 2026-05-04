import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import "./TimeSlider.css";
import LayerButton from "./LayerButton";

type CountItem = { year: number; count: number };

interface LayerConfig {
  id: string;
  type: "histogram" | "bar";
  label: string;
  color: string;
  show: boolean;
  setShow: (v: boolean) => void;
  counts?: CountItem[];
  binAggregation?: "avg" | "sum";
  data?: any[];
  objectColor?: (label: string) => string;
  onSelect?: (obj: any) => void;
}

interface TimelineCanvasProps {
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  fullRange: [number, number];
  windowRange: [number, number];
  setWindowRange: (r: [number, number]) => void;
  setManualMode: (v: boolean) => void;
  layers: LayerConfig[];
}

const LABEL_ROW_H = 12;
const SLIDER_ROW_H = 12;
const HIST_ROW_H = 15;
const BAR_ROW_H = 5;
const BAR_GAP = 1;
const SIDE_W = 120;
const SVG_W = 1200;

const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  selectedYear,
  setSelectedYear,
  fullRange,
  windowRange,
  setWindowRange,
  setManualMode,
  layers,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const yearRef = useRef(selectedYear);

  const [alltime_min, alltime_max] = fullRange;
  const [minYear, maxYear] = windowRange;
  const totalRange = maxYear - minYear;

  

  const step = useMemo(() => {
    const span = totalRange;
    if (span <= 50) return 2;
    if (span <= 250) return 5;
    if (span <= 500) return 20;
    if (span <= 1500) return 50;
    if (span <= 2500) return 100;
    if (span <= 5000) return 200;
    if (span <= 7000) return 500;
    return 1000;
  }, [totalRange]);

  const drawW = SVG_W;

  const xScale = useMemo(() =>
    d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([0, drawW]),
    [minYear, maxYear, drawW]
  );

  const binSize = useMemo(() => {
    if (totalRange <= 100) return 1;
    if (totalRange <= 150) return 2;
    if (totalRange <= 500) return 5;
    if (totalRange <= 1500) return 10;
    return 10;
  }, [totalRange]);

  const computeBins = useCallback((counts: CountItem[], agg: "avg" | "sum") => {
    if (!counts.length) return { bins: [] as any[], maxVal: 0 };
    const dense = new Array(maxYear - minYear + 1).fill(0);
    for (const { year, count } of counts) {
      if (year >= minYear && year <= maxYear)
        dense[year - minYear] = count;
    }
    const out: { start: number; end: number; center: number; value: number }[] = [];
    let peak = 0;
    const start = Math.floor(minYear / binSize) * binSize;
    for (let s = start; s <= maxYear; s += binSize) {
      let sum = 0; let n = 0;
      for (let y = Math.max(s, minYear); y <= Math.min(s + binSize - 1, maxYear); y++) {
        sum += dense[y - minYear]; n++;
      }
      const value = agg === "avg" && n > 0 ? sum / n : sum;
      out.push({
        start: s,
        end: Math.min(s + binSize, maxYear),
        center: s + binSize / 2,
        value
      });
      if (value > peak) peak = value;
    }
    return { bins: out, maxVal: peak };
  }, [minYear, maxYear, binSize]);

  const { svgH, layerLayouts, labelsY} = useMemo(() => {
    let y = 0;
    const layouts: { id: string; y: number; h: number }[] = [];

    for (const layer of layers) {
      if (!layer.show) {
        layouts.push({ id: layer.id, y, h: HIST_ROW_H });
        y += HIST_ROW_H;
        continue;
      }
      if (layer.type === "histogram") {
        layouts.push({ id: layer.id, y, h: HIST_ROW_H });
        y += HIST_ROW_H;
      } else {
        const count = layer.data?.filter((d: any) => {
          const s = d.start_date ?? d.birth_date ?? minYear;
          const e = d.end_date ?? d.death_date ?? maxYear;
          return s <= maxYear && e >= minYear;
        }).length ?? 0;
        const h = Math.max(HIST_ROW_H, count * (BAR_ROW_H + BAR_GAP));
        layouts.push({ id: layer.id, y, h });
        y += h;
      }
    }

    const labelsY = y;

    
    return {
      svgH: y + LABEL_ROW_H + SLIDER_ROW_H + 4,
      layerLayouts: layouts,
      labelsY
    };
  }, [layers, minYear, maxYear]);

  // Play
  useEffect(() => { yearRef.current = selectedYear; }, [selectedYear]);

  useEffect(() => {
    if (!isPlaying) return;
    intervalRef.current = window.setInterval(() => {
      const next = yearRef.current + 1;
      if (next > maxYear) { setSelectedYear(minYear); yearRef.current = minYear; }
      else { setSelectedYear(next); yearRef.current = next; }
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, minYear, maxYear]);

  useEffect(() => {
    if (isPlaying && selectedYear >= maxYear) setIsPlaying(false);
  }, [isPlaying, selectedYear, maxYear]);

  const isDragging = useRef(false);
  const dragStart = useRef<{ x: number; min: number; max: number } | null>(null);

  const handleLabelMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.pageX, min: minYear, max: maxYear };
  };

  const handleLabelMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !dragStart.current) return;
    const dx = e.pageX - dragStart.current.x;
    const walk = Math.round(dx / 100) * step;
    if (walk === 0) return;
    let newMin = Math.max(alltime_min, dragStart.current.min - walk);
    let newMax = Math.min(alltime_max, dragStart.current.max - walk);
    if (newMin === alltime_min) newMax = newMin + totalRange;
    else if (newMax === alltime_max) newMin = newMax - totalRange;
    setWindowRange([newMin, newMax]);
  };

  const handleLabelMouseUp = () => { isDragging.current = false; };

  const handleSliderDrag = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const onMove = (ev: MouseEvent) => {
      const x = (ev.clientX - rect.left) * scaleX;
      const year = Math.round(Math.max(minYear, Math.min(maxYear, xScale.invert(x))));
      setSelectedYear(year);
      setIsPlaying(false);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    if (x < 0 || x > drawW) return;
    const year = Math.round(Math.max(minYear, Math.min(maxYear, xScale.invert(x))));

    
    const clickY = (e.clientY - rect.top) * (svgH / rect.height);
    if (clickY > sliderY && clickY < sliderY + SLIDER_ROW_H) {
      setSelectedYear(year);
      setIsPlaying(false);
    }
  };

  const yearLineX = xScale(selectedYear);
  const sliderY = labelsY;
  const yearLabelsY = labelsY + SLIDER_ROW_H;

  // Layer yüksekliklerini px cinsinden hesapla (overlay hizalama için)
  const totalSvgH = svgH;

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", position: "relative", userSelect: "none", display: "flex", flexDirection: "row" }}
    >
      {/* ── SVG CANVAS ── */}
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${SVG_W} ${svgH}`}
          preserveAspectRatio="xMinYMin meet"
          style={{ display: "block", cursor: "default" }}
          onClick={handleSvgClick}
        >
         

          {/* ── LAYERS ── */}
          {layers.map((layer) => {
            const layout = layerLayouts.find(l => l.id === layer.id);
            if (!layout) return null;
            const { y: layerY, h: layerH } = layout;

            const separator = (
              <line key={`sep-${layer.id}`}
                x1={0} y1={layerY} x2={drawW} y2={layerY}
                stroke="#b8b7b1" strokeWidth={0.5} />
            );

            if (layer.type === "histogram") {
              const { bins, maxVal } = computeBins(
                layer.counts ?? [], layer.binAggregation ?? "sum"
              );
              return (
                <g key={layer.id}>
                  {separator}
                  {bins.map((b, i) => {
                    const w = Math.max(1, xScale(b.end) - xScale(b.start));
                    const x = xScale(b.center)-w;
                    const pct = maxVal > 0 ? b.value / maxVal : 0;
                    const bh = layer.show
                      ? (b.value > 0 ? Math.max(2, pct * (layerH - 4)) : 0)
                      : 0;
                    return (
                      <rect
                        key={i}
                        x={x} y={layerY + layerH - bh}
                        width={w} height={bh}
                        fill={layer.color}
                        opacity={layer.show ? 0.75 : 0.15}
                        style={{ cursor: layer.show ? "pointer" : "default" }}
                        onClick={layer.show && b.value > 0
                          ? (e) => { e.stopPropagation(); setSelectedYear(b.start); }
                          : undefined}
                      />
                    );
                  })}
                </g>
              );
            }

            if (layer.type === "bar") {
              const filtered = (layer.data ?? [])
                .filter((d: any) => {
                  const s = d.start_date ?? d.birth_date ?? minYear;
                  const en = d.end_date ?? d.death_date ?? maxYear;
                  return s <= maxYear && en >= minYear;
                })
                .map((d: any) => ({
                  ...d,
                  vs: Math.max(d.start_date ?? d.birth_date ?? minYear, minYear),
                  ve: Math.min(d.end_date ?? d.death_date ?? maxYear, maxYear),
                }));

              return (
                <g key={layer.id}>
                  {separator}
                  {layer.show && filtered.map((d: any, i: number) => {
                    const rowY = layerY + i * (BAR_ROW_H + BAR_GAP);
                    const x1 = xScale(d.vs);
                    const x2 = xScale(d.ve);
                    const bw = Math.max(3, x2 - x1);
                    const color = layer.objectColor
                      ? layer.objectColor(d.relationship_type_name ?? d.name)
                      : layer.color;
                    const xs1 = xScale(Math.max(d.birth_date ?? minYear, minYear));
                    const xs2 = xScale(Math.min(d.death_date ?? maxYear, maxYear));
                    const bsw = Math.max(4, xs2 - xs1);
                    return (
                      <g key={i}
                        onClick={(e) => { e.stopPropagation(); layer.onSelect?.(d); }}
                        style={{ cursor: "pointer" }}
                      >
                        <rect x={xs1} y={rowY} width={bsw} height={BAR_ROW_H}
                          fill={color} opacity={0.25} />
                        <rect x={x1} y={rowY} width={bw} height={BAR_ROW_H}
                          fill={color} opacity={0.75} />
                        <text x={x1 + 1} y={rowY + BAR_ROW_H - 1}
                          fontSize={4.5} fill="#fff" fontWeight={900}>
                          {d.name} {d.start_date ?? d.birth_date ?? "?"} – {d.end_date ?? d.death_date ?? "?"}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            }


            return null;
          })}

          {/* ── YEAR LABELS ── */}
          <g
            onMouseDown={handleLabelMouseDown}
            onMouseMove={handleLabelMouseMove}
            onMouseUp={handleLabelMouseUp}
            onMouseLeave={handleLabelMouseUp}
            style={{ cursor: "grab" }}
          >
            <rect x={0} y={yearLabelsY} width={drawW} height={LABEL_ROW_H}
              fill="rgba(172, 172, 172, 0.95)" />
            {Array.from({ length: Math.floor(totalRange / step) + 1 }, (_, i) => {
              const year = minYear + i * step;
              const x = xScale(year);
              const isActive = selectedYear >= year && selectedYear < year + step;
              return (
                <g key={year}>
                  <line
                    x1={x} y1={yearLabelsY + 2}
                    x2={x} y2={yearLabelsY + LABEL_ROW_H - 2}
                    stroke={isActive ? "#BA7517" : "#D3D1C7"}
                    strokeWidth={1}
                  />
                  <text
                    x={x + 3} y={yearLabelsY + LABEL_ROW_H - 3}
                    fontSize={7}
                    fontFamily="Georgia, serif"
                    fontWeight={isActive ? 600 : 400}
                    fill={isActive ? "#BA7517" : "#5F5E5A"}
                  >{year}</text>
                </g>
              );
            })}
          </g>
           {/* ── YEAR LINE ── */}
          <line
            x1={yearLineX} y1={0}
            x2={yearLineX} y2={svgH}
            stroke="#202020"
            strokeWidth={1.5}
            pointerEvents="none"
          />

          {/* ── SLIDER RAIL + HANDLE ── */}
          <g>
            {/* <rect
              x={0}
              y={labelsY }
              
              width={drawW} height={1}
              fill="#b19610"
            /> */}

            <line 
                x1={0} y1={labelsY} x2={drawW} y2={labelsY}
                stroke="#b8b7b1" strokeWidth={0.5} />
            
            <rect
              x={yearLineX - 6}
              y={sliderY}
              width={12}
              height={SLIDER_ROW_H}
              fill="#D85A30"
              stroke="#F0997B"
              strokeWidth={1}
              style={{ cursor: "col-resize" }}
              onMouseDown={handleSliderDrag}
            />
          </g>

        </svg>
      </div>

      {/* ── SIDE PANEL — LayerButton overlay ── */}
      <div style={{
        width: `${SIDE_W}px`,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid #E8E6DF",
      }}>

        {/* Layer butonları — layerLayouts'a göre hizalanmış */}
        {layers.map((layer) => {
          const layout = layerLayouts.find(l => l.id === layer.id);
          if (!layout) return null;
          return (
            <div
              key={layer.id}
              style={{
                height: `${(layout.h / totalSvgH) * 100}%`,
                display: "flex",
                alignItems: "flex-start",
                paddingTop: "2px",
                borderBottom: "1px solid #E8E6DF",
              }}
            >
              <LayerButton
                layerColor={layer.color}
                layerTypeName={layer.label}
                showLayer={layer.show}
                setShowLayer={layer.setShow}
              />
            </div>
          );
        })}

        {/* Play butonu — labels+slider satırına hizalanmış */}
        <div
          style={{
            height: `${((LABEL_ROW_H + SLIDER_ROW_H + 4) / totalSvgH) * 100}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "14px",
            color: "#8d8d8b",
            border: "1px solid #959695",
          }}
          onClick={() => { setIsPlaying(p => !p); setManualMode(false); }}
        >
          {isPlaying ? "⏸" : "▶"}
        </div>

      </div>
    </div>
  );
};

export default TimelineCanvas;