import { useEffect, useState } from "react";
import type { Human } from "../entities/Human";
import type { Location } from "../entities/Location";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import type { Movement } from "../entities/Movement";
import { isHuman, isLocation, isMilitaryEvent, isMovement } from "../utils/typeGuards";

export function useAppSelection(
  selectedObject: any,
  humanFullRange: [number, number],
  militaryFullRange: [number, number]
) {
  const [detailMode, setDetailMode] = useState(false);
  const [manuelMode, setManuelMode] = useState(false);

  const [selectedHuman, setSelectedHuman] = useState<Human | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedMilitaryEvent, setSelectedMilitaryEvent] = useState<MilitaryEvent | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);

  const [humanLocations, setHumanLocations] = useState<Location[]>([]);

  const [windowRange, setWindowRange] = useState<[number, number]>([-800, 1950]);

  useEffect(() => {
    setManuelMode(false);

    if (!selectedObject) {
      setDetailMode(false);
      return;
    }

    setDetailMode(true);

    if (isHuman(selectedObject)) {
      setWindowRange(humanFullRange);
      setSelectedHuman(selectedObject);
      setSelectedLocation(null);
      setSelectedMilitaryEvent(null);
      setSelectedMovement(null);
    } else if (isLocation(selectedObject)) {
      setWindowRange(humanFullRange);
      setSelectedLocation(selectedObject);
      setHumanLocations([selectedObject]);
      setSelectedHuman(null);
      setSelectedMilitaryEvent(null);
      setSelectedMovement(null);
    } else if (isMilitaryEvent(selectedObject)) {
      setWindowRange(militaryFullRange);
      setSelectedMilitaryEvent(selectedObject);
      setSelectedHuman(null);
      setSelectedLocation(null);
      setSelectedMovement(null);
      setHumanLocations([]);
    } else if (isMovement(selectedObject)) {
      setWindowRange([
        selectedObject.start_date ?? humanFullRange[0],
        selectedObject.end_date ?? humanFullRange[1],
      ]);
      setSelectedMovement(selectedObject);
      setSelectedHuman(null);
      setSelectedLocation(null);
      setSelectedMilitaryEvent(null);
      setHumanLocations([]);
    } else {
      setSelectedHuman(null);
      setSelectedLocation(null);
      setSelectedMilitaryEvent(null);
      setSelectedMovement(null);
      setDetailMode(false);
    }
  }, [selectedObject, humanFullRange, militaryFullRange]);

  return {
    detailMode,
    setDetailMode,
    manuelMode,
    setManuelMode,
    selectedHuman,
    selectedLocation,
    selectedMilitaryEvent,
    selectedMovement,
    humanLocations,
    setHumanLocations,
    windowRange,
    setWindowRange,
    setSelectedHuman,
    setSelectedLocation,
    setSelectedMilitaryEvent,
    setSelectedMovement,
  };
}