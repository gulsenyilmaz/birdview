import type { RelatedHuman } from "./RelatedHuman";

export interface RelatedHumanEnriched extends RelatedHuman {
  age: number;
  lonOffsetSource:number;
  latOffsetSource:number;

}