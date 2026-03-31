import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { CollisionFilterExtension } from "@deck.gl/extensions";
import type { CollisionFilterExtensionProps } from "@deck.gl/extensions";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import type { Color } from "@deck.gl/core";
import { scaleLog, scaleLinear, scaleSqrt } from "d3-scale";

const fillColorScale = scaleLog<Color>()
  .domain([1, 80, 100])
  .range([
    [255, 200, 200, 100],
    [255, 100, 100, 50],
    [160, 180, 180, 15]
  ]).clamp(true);

const colorScale = scaleLog<Color>()
  .domain([1, 80, 100])
  .range([
    [255, 30, 30, 250],
    [255, 60, 100, 150],
    [150, 150, 150, 0]
  ]).clamp(true);

const radiusByDuration = scaleSqrt<number, number>()
  .domain([1, 25])
  .range([10000, 400000])
  .clamp(true);

const timeFactorScale = scaleLinear<number, number>()
  .domain([0, 1, 1.25])
  .range([1, 0.5, 0.5])
  .clamp(true);

const getDuration = (d: MilitaryEvent) => {
  let duration = d.end_date - d.start_date;
  if (!isFinite(duration) || duration <= 0) duration = 8;
  return duration;
};

const getRawProgressForEvent = (
  start: number,
  duration: number,
  selectedYear: number
) => {
  const rawProgress = (selectedYear - start) / duration;
  return Math.min(rawProgress, 1);
};

const getRadiusForEvent = (
  d: MilitaryEvent,
  selectedYear: number,
  zoom: number
) => {
  const duration = getDuration(d);
  const progress = getRawProgressForEvent(d.start_date, duration, selectedYear);
  const baseRadius = radiusByDuration(duration);
  const timeFactor = timeFactorScale(progress);
  return (baseRadius * timeFactor) / zoom;
};

type MilitaryEventLayerParams = {
  militaryEvents: MilitaryEvent[];
  selectedYear: number;
  zoom: number;
  fontSize: number;
  sizeMinPixels: number;
  sizeMaxPixels: number;
};

export function createMilitaryEventLayers({
  militaryEvents,
  selectedYear,
  zoom,
  fontSize,
  sizeMinPixels,
  sizeMaxPixels
}: MilitaryEventLayerParams) {
  const militaryEventLayer = new ScatterplotLayer<MilitaryEvent>({
    id: "military_events-layer0",
    data: militaryEvents.filter(me => me.descendant_count === 0),
    stroked: true,
    getPosition: d => [d.lon, d.lat],
    getRadius: d => getRadiusForEvent(d, selectedYear, zoom),
    getFillColor: d =>
      fillColorScale(
        (100 * (1 + selectedYear - d.start_date)) /
          ((1 + d.end_date - d.start_date) * 1.25)
      ),
    getLineColor: d =>
      colorScale(
        (100 * (1 + selectedYear - d.start_date)) /
          ((1 + d.end_date - d.start_date) * 1.25)
      ),
    lineWidthMinPixels: 2,
    pickable: true,
    radiusUnits: "meters"
  });

  const militaryEventTextLayer =
    new TextLayer<MilitaryEvent, CollisionFilterExtensionProps<MilitaryEvent>>({
      id: "military_events-layer1",
      data: militaryEvents.filter(
        me => me.depth_level <= Math.floor(zoom) && (!me.end_date || me.end_date >= selectedYear)
      ),
      characterSet: "auto",
      fontSettings: { buffer: 8, sdf: true },
      getText: d => d.name.toLocaleUpperCase(),
      getPosition: d => [d.lon, d.lat],
      getColor: [80, 80, 50, 250],
      getSize: d => Math.log2(d.descendant_count + 32) / 10,
      sizeScale: fontSize,
      sizeMinPixels,
      sizeMaxPixels,
      maxWidth: 64 * 12,
      background: true,
      getBackgroundColor: [255, 255, 255, 0],
      pickable: true,
      collisionEnabled: true,
      getCollisionPriority: d => Math.log2(d.descendant_count + 1),
      collisionTestProps: {
        sizeScale: fontSize * 2,
        sizeMaxPixels: sizeMaxPixels * 2,
        sizeMinPixels: sizeMinPixels * 2
      },
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      extensions: [new CollisionFilterExtension()]
    });

  return [militaryEventLayer, militaryEventTextLayer];
}