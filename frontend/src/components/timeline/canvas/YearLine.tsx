import React, { useRef } from "react";

import type { TimelineXScale } from "../timelineTypes";

interface YearLineProps {
  selectedYear: number;
  xScale: TimelineXScale;
  height: number;
  setSelectedYear: (year: number) => void;
}

const YearLine: React.FC<YearLineProps> = ({
  selectedYear,
  xScale,
  height,
  setSelectedYear,
}) => {
  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
  } | null>(null);

  const x = xScale(selectedYear);

  // Fare koordinatını SVG'nin kendi koordinatlarına çevirir.
  const getSvgX = (event: React.PointerEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();

    if (!svg || !matrix) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    return point.matrixTransform(matrix.inverse()).x;
  };

  const handlePointerDown = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    if (event.button !== 0 || dragRef.current) return;

    const pointerX = getSvgX(event);
    if (pointerX === null) return;

    event.preventDefault();
    event.stopPropagation();

    dragRef.current = {
      pointerId: event.pointerId,
      // Çizgi, tutulduğu noktadan fareye doğru sıçramasın.
      offsetX: pointerX - x,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const pointerX = getSvgX(event);
    if (pointerX === null) return;

    const range = xScale.range();
    const minX = Math.min(...range);
    const maxX = Math.max(...range);

    const nextX = Math.max(
      minX,
      Math.min(maxX, pointerX - drag.offsetX)
    );

    setSelectedYear(Math.round(xScale.invert(nextX)));
  };

  const handlePointerEnd = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;

    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <g>
      <line
        className="timeline-year-line"
        x1={x}
        y1={0}
        x2={x}
        y2={height}
      />

      <rect
        className="timeline-year-drag-area"
        x={x - 12}
        y={0}
        width={24}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        onClick={(event) => event.stopPropagation()}
      />
    </g>
  );
};

export default YearLine;