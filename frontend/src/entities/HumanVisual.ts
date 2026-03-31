export interface HumanVisual {
  age: number;
  fillColor: [number, number, number, number];
  fillTColor: [number, number, number, number];
  lonOffsetSource: number;
  latOffsetSource: number;
  lonOffsetTarget: number;
  latOffsetTarget: number;
}

export type Enriched<T> = T & HumanVisual;