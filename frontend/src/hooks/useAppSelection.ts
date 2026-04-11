import { useEffect, useState } from "react";
import type { Human } from "../entities/Human";
import type { Location } from "../entities/Location";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import type { Movement } from "../entities/Movement";
import {
  isHuman,
  isLocation,
  isMilitaryEvent,
  isMovement,
} from "../utils/typeGuards";

export type SelectedObject = Human | Location | MilitaryEvent | Movement | null;

export function useAppSelection(selectedObject: SelectedObject) {
  const [manualMode, setManualMode] = useState(false);

  const [selectedHuman, setSelectedHuman] = useState<Human | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedMilitaryEvent, setSelectedMilitaryEvent] = useState<MilitaryEvent | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);

  const [humanLocations, setHumanLocations] = useState<Location[]>([]);

  const clearSelectionStates = () => {
    setSelectedHuman(null);
    setSelectedLocation(null);
    setSelectedMilitaryEvent(null);
    setSelectedMovement(null);
    setHumanLocations([]);
  };

  useEffect(() => {
    setManualMode(false);

    if (!selectedObject) {
      clearSelectionStates();
      return;
    }

    if (isHuman(selectedObject)) {
      clearSelectionStates();
      setSelectedHuman(selectedObject);
      return;
    }

    if (isLocation(selectedObject)) {
      clearSelectionStates();
      setSelectedLocation(selectedObject);
      setHumanLocations([selectedObject]);
      return;
    }

    if (isMilitaryEvent(selectedObject)) {
      clearSelectionStates();
      setSelectedMilitaryEvent(selectedObject);
      return;
    }

    if (isMovement(selectedObject)) {
      clearSelectionStates();
      setSelectedMovement(selectedObject);
      return;
    }

    clearSelectionStates();
  }, [selectedObject]);

  return {
    manualMode,
    setManualMode,
    selectedHuman,
    selectedLocation,
    selectedMilitaryEvent,
    selectedMovement,
    humanLocations,
    setHumanLocations,
  };
}