// import { Suspense, lazy } from "react";
import type { Human } from "../entities/Human";
import type { HumanRelative } from "../entities/HumanRelative";
import type { Location } from "../entities/Location";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import type { Work } from "../entities/Work";
import type { SelectedObject } from "../hooks/useAppSelection";
import './map/MapScene.css';
import MapScene from "./map/MapScene";

// const MapScene = lazy(() => import("./map/MapScene"));

interface MapSectionProps {
  humanLocations: Location[];
  humans: Human[];
  militaryEvents: MilitaryEvent[];
  works: Work[];
  humanRelations: HumanRelative[];
  selectedYear: number;
  setSelectedObject: React.Dispatch<React.SetStateAction<SelectedObject>>;
  selectedObject: SelectedObject;
  detailMode: boolean;
  showEvents: boolean;
  showHumans: boolean;
  showWorks: boolean;
  manualMode: boolean;
  setManualMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const MapSection: React.FC<MapSectionProps> = ({
  humanLocations,
  humans,
  militaryEvents,
  works,
  humanRelations,
  selectedYear,
  setSelectedObject,
  selectedObject,
  detailMode,
  showEvents,
  showHumans,
  showWorks,
  manualMode,
  setManualMode,
}) => {
  return (
   
        <div className="map-shell">
          <MapScene
            humanLocations={humanLocations}
            humans={humans}
            militaryEvents={militaryEvents}
            works={works}
            humanRelations={humanRelations}
            selectedYear={selectedYear}
            setSelectedObject={setSelectedObject}
            selectedObject={selectedObject}
            detailMode={detailMode}
            showEvents={showEvents}
            showHumans={showHumans}
            showWorks={showWorks}
            manualMode={manualMode}
            setManualMode={setManualMode}
          />
        </div>
   
  
  );
};

export default MapSection;