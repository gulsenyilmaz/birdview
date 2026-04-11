import { Suspense, lazy } from "react";
import type { Human } from "../entities/Human";
import type { HumanRelative } from "../entities/HumanRelative";
import type { Location } from "../entities/Location";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import type { Work } from "../entities/Work";
import type { SelectedObject } from "../hooks/useAppSelection";


const MapScene = lazy(() => import("./map/MapScene"));

interface MapSectionProps {
  humanLocations: Location[];
  humans: Human[];
  militaryEvents: MilitaryEvent[];
  works: Work[];
  humanRelatives: HumanRelative[];
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
  humanRelatives,
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
    <div className="scene">
      <Suspense fallback={<div>fsşlkjfsd</div>}>
        <MapScene
          humanLocations={humanLocations}
          humans={humans}
          militaryEvents={militaryEvents}
          works={works}
          humanRelatives={humanRelatives}
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
      </Suspense>
    </div>
  );
};

export default MapSection;