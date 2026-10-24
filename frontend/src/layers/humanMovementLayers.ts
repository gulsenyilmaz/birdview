
import { ArcLayer } from "@deck.gl/layers";

import type { Location } from "../entities/Location";
import AnimatedArcLayer from "./AnimatedArcLayer";

import { getColorForRelationType } from "../utils/colorUtils";


type MovementLocation = Location & {
  visit_order?: number | null;
};

type HumanMove = {
  from: MovementLocation;
  to: MovementLocation;
  year: number;
};

type HumanMovementLayerParams = {
  humanLocations: MovementLocation[];
  selectedYear: number;
  animationProgress: number;
};


/**
 * Location kayıtlarını kronolojik hareketlere çevirir.
 *
 * Önce start_date, aynı yıl içinde visit_order
 * kullanılarak sıralanır.
 */
export function createHumanMoves(
  humanLocations: MovementLocation[]
): HumanMove[] {

  const orderedLocations = [...humanLocations]
    .filter(
      location =>
        location.start_date != null &&
        Number.isFinite(location.loc_lon) &&
        Number.isFinite(location.loc_lat)
    )
    .sort((a, b) => {

      const yearDiff =
        a.start_date - b.start_date;

      if (yearDiff !== 0) {
        return yearDiff;
      }

      const orderA =
        a.visit_order ?? Number.MAX_SAFE_INTEGER;

      const orderB =
        b.visit_order ?? Number.MAX_SAFE_INTEGER;

      return orderA - orderB;
    });


  const moves: HumanMove[] = [];

  for (let i = 1; i < orderedLocations.length; i++) {

    const from = orderedLocations[i - 1];
    const to = orderedLocations[i];

    // Aynı koordinatsa hareket oluşturma.
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


/**
 * Bir yıl içindeki hareketlerden hangisinin
 * animasyonda aktif olduğunu hesaplar.
 *
 * Örneğin 4 hareket varsa:
 *
 * 0.00 - 0.25 : hareket 1
 * 0.25 - 0.50 : hareket 2
 * 0.50 - 0.75 : hareket 3
 * 0.75 - 1.00 : hareket 4
 */
export function getAnimationState(
  moves: HumanMove[],
  animationProgress: number
) {

  if (moves.length === 0) {
    return {
      currentMove: null,
      completedMoves: [] as HumanMove[],
      localProgress: 0
    };
  }

  const progress = Number.isFinite(animationProgress)
    ? Math.max(0, Math.min(1, animationProgress))
    : 0;

  const totalMoves = moves.length;

  const scaledProgress = progress * totalMoves;

  const currentIndex = Math.min(
    Math.floor(scaledProgress),
    totalMoves - 1
  );

  const localProgress = Math.min(
    1,
    scaledProgress - currentIndex
  );

  return {
    currentMove: moves[currentIndex],
    completedMoves: moves.slice(0, currentIndex),
    localProgress
  };
}


/**
 * Human Movement Layers
 */
export function createHumanMovementLayers({
  humanLocations,
  selectedYear,
  animationProgress
}: HumanMovementLayerParams) {

  const layers = [];

  const humanMoves = createHumanMoves(humanLocations);


  // Seçili yıldan önceki tüm hareketler.
  const previousMoves = humanMoves.filter(
    move => move.year < selectedYear
  );


  // Yalnızca seçili yıldaki hareketler.
  const currentYearMoves = humanMoves.filter(
    move => move.year === selectedYear
  );


  // Seçili yılın animasyon durumu.
  const {
    currentMove,
    completedMoves,
    localProgress
  } = getAnimationState(
    currentYearMoves,
    animationProgress
  );


  // Geçmiş yıllar + bu yıl tamamlanan hareketler.
  const visibleMoves = [
    ...previousMoves,
    ...completedMoves
  ];


  /*
   * GEÇMİŞ ROTALAR
   *
   * Daha belirgin mor tonları.
   * Tamamlanmış hareketler sabit kalır.
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

        getSourceColor: move =>
          getColorForRelationType(
            move.from.relationship_type_name,
            210
          ),

        getTargetColor: move =>
          getColorForRelationType(
            move.to.relationship_type_name,
            210
          ),

        getWidth: 2.5,

        widthMinPixels: 2,

        getHeight: 0.25,

        pickable: true
      })
    );
  }


  /*
   * AKTİF HAREKET
   *
   * Seçili yılın aktif arc'ı.
   * Bir yıl içinde birden fazla hareket varsa
   * progress bunların arasında paylaştırılır.
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

        getSourceColor: move =>
          getColorForRelationType(
            move.from.relationship_type_name,
            255
          ),

        getTargetColor: move =>
          getColorForRelationType(
            move.to.relationship_type_name,
            255
          ),

        getWidth: 4,

        widthMinPixels: 3,

        getHeight: 0.25,

        progress: localProgress,

        trailLength: 0.30,

        pickable: false
      })
    );
  }

  return layers;
}
