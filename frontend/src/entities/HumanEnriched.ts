import type { Human } from "./Human";

export interface HumanEnriched extends Human {
  fillColor: [number, number, number, number];
  fillTColor: [number, number, number, number];
  lonOffsetSource:number;
  latOffsetSource:number;
  lonOffsetTarget:number;
  latOffsetTarget:number;
}