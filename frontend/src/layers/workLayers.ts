import { ScatterplotLayer } from "@deck.gl/layers";
import type { Work } from "../entities/Work";

export function createWorkLayers(works: Work[]) {
  return [
    new ScatterplotLayer<Work>({
      id: "works-layer",
      data: works,
      getPosition: () => [0, 0],
      getRadius: 200000,
      getFillColor: [0, 0, 0],
      pickable: true,
      radiusUnits: "meters"
    })
  ];
}