import type * as d3 from "d3";

/* ============================================================
   COMMON
============================================================ */

export type TimelineXScale =
  d3.ScaleLinear<number, number>;

export type YearRange = [
  number,
  number
];

export type LayerScope = "general" | "detail";


/* ============================================================
   HISTOGRAM DATA
============================================================ */

export interface CountItem {
  year: number;
  count: number;
}


/* ============================================================
   BAR DATA

   Timeline'da çizilebilmesi için bir objenin ihtiyacımız olan
   ortak alanları.

   Bazı bar objelerinde start/end,
   bazılarında birth/death,
   bazılarında ikisi birden olabilir.
============================================================ */

export interface TimelineBarItem {
  id?: string | number;

  name?: string;

  relationship_type_name?: string;

  start_date?: number | null;
  end_date?: number | null;

  birth_date?: number | null;
  death_date?: number | null;

  /*
   * Objelerin başka alanları olabilir.
   *
   * Örn:
   * human_id
   * relationship_id
   * qid
   * description
   * vb.
   *
   * Bunları kaybetmiyoruz ama artık `any` de kullanmıyoruz.
   */
 
}


/* ============================================================
   BASE LAYER
============================================================ */

interface BaseLayerConfig {
  id: string;

  label: string;
  color: string;
  scope: LayerScope;

  show: boolean;

  setShow: (
    value: boolean
  ) => void;
}


/* ============================================================
   HISTOGRAM LAYER
============================================================ */

export interface HistogramLayerConfig
  extends BaseLayerConfig {
  type: "histogram";

  counts: CountItem[];

  binAggregation?:
    | "avg"
    | "sum";
}


/* ============================================================
   BAR LAYER
============================================================ */

export interface BarLayerConfig
  extends BaseLayerConfig {
  type: "bar";

  data: TimelineBarItem[];

  objectColor?: (
    label: string
  ) => string;

  onSelect?: (
    item: any
  ) => void;
}


/* ============================================================
   LAYER

   Discriminated union.

   layer.type === "histogram"
       → HistogramLayerConfig

   layer.type === "bar"
       → BarLayerConfig
============================================================ */

export type LayerConfig =
  | HistogramLayerConfig
  | BarLayerConfig;


/* ============================================================
   TIMELINE CANVAS
============================================================ */

export interface TimelineCanvasProps {
  selectedYear: number;

  setSelectedYear: (
    year: number
  ) => void;

  fullRange: YearRange;

  windowRange: YearRange;

  setWindowRange: (
    range: YearRange
  ) => void;

  layers: LayerConfig[];
}