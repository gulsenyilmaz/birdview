import type { HumanRelative } from "./HumanRelative";

export interface HumanRelativeEnriched extends HumanRelative {
  age: number;
  lonOffsetSource:number;
  latOffsetSource:number;

}