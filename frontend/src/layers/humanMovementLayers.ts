import { ArcLayer } from "@deck.gl/layers";

import type { Location } from "../entities/Location";
import AnimatedArcLayer from "./AnimatedArcLayer";


type HumanMove = {
  from: Location;
  to: Location;
  year: number;
};


type HumanMovementLayerParams = {
  humanLocations: Location[];
  selectedYear: number;
  animationProgress: number;
};


/**
 * Location kayıtlarını kronolojik şehir hareketlerine çevirir.
 *
 * Örnek:
 * Istanbul -> Paris -> London
 *
 * [
 *   { from: Istanbul, to: Paris },
 *   { from: Paris, to: London }
 * ]
 */
function createHumanMoves(
  humanLocations: Location[]
): HumanMove[] {

  const orderedLocations = [...humanLocations]
    .filter(
      location =>
        location.start_date != null &&
        Number.isFinite(location.loc_lon) &&
        Number.isFinite(location.loc_lat)
    )
    .sort(
      (a, b) =>
        a.start_date - b.start_date
    );


  const moves: HumanMove[] = [];


  for (let i = 1; i < orderedLocations.length; i++) {

    const from = orderedLocations[i - 1];
    const to = orderedLocations[i];


    // Aynı koordinatsa hareket olarak kabul etme.
    if (
      from.loc_lon === to.loc_lon &&
      from.loc_lat === to.loc_lat
    ) {
      continue;
    }


    moves.push({
      from,
      to,
      year: to.start_date
    });
  }


  return moves;
}


export function createHumanMovementLayers({
  humanLocations,
  selectedYear,
  animationProgress
}: HumanMovementLayerParams) {

    

  const layers = [];

  const humanMoves =
    createHumanMoves(humanLocations);


  // Seçili yılda gerçekleşen hareket.
  const currentMove = humanMoves.find(
    move => move.year === selectedYear
  );


  // Seçili yıla kadar gerçekleşmiş tüm hareketler.
  const visibleMoves = humanMoves.filter(
    move => move.year <= selectedYear
  );


  /*
   * Geçmiş rotalar:
   * Altta, daha ince ve sabit olarak duruyorlar.
   */
  if (visibleMoves.length > 0) {

    layers.push(
      new ArcLayer<HumanMove>({
        id: "human-movement-arc-layer",

        data: visibleMoves,

        getSourcePosition: move => [
          move.from.loc_lon,
          move.from.loc_lat
        ],

        getTargetPosition: move => [
          move.to.loc_lon,
          move.to.loc_lat
        ],

        getSourceColor: [
          220,
          50,
          220,
          100
        ],

        getTargetColor: [
          0,
          220,
          50,
          0
        ],

        getWidth: 1.5,

        widthMinPixels: 1,

        getHeight: 0.25,

        pickable: true
      })
    );
  }


  /*
   * Seçili yılda bir şehir değişimi varsa,
   * aynı rotanın üzerinde parlak hareket eden arc göster.
   */
  if (currentMove) {

    layers.push(
      new AnimatedArcLayer<HumanMove>({
        id: "human-current-movement-arc-layer",

        data: [currentMove],

        getSourcePosition: move => [
          move.from.loc_lon,
          move.from.loc_lat
        ],

        getTargetPosition: move => [
          move.to.loc_lon,
          move.to.loc_lat
        ],

        getSourceColor: [
          255,
          255,
          255,
          255
        ],

        getTargetColor: [
          255,
          255,
          255,
          255
        ],

        getWidth: 3,

        widthMinPixels: 2,

        getHeight: 0.25,

        progress: animationProgress,

        trailLength: 0.25,

        pickable: false
      })
    );
  }


  return layers;
}