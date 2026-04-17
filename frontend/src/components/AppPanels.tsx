import Dashboard from "./general_panels/Dashboard";
import DescriptionBanner from "./general_panels/DescriptionBanner";
import DetailBox from "./detail_panels/DetailBox";
import PersonBox from "./detail_panels/PersonBox";
import LocationBox from "./detail_panels/LocationBox";
import MilitaryEventBox from "./detail_panels/MilitaryEventBox";
import MovementBox from "./detail_panels/MovementBox";
import ContentStrip from "./timeline/ContentStrip";

import HumanList from "./timeline/HumanList";
import MilitaryEventDetail from "./detail_panels/MilitaryEventDetail";
import FilterList from "./general_panels/FilterList";

import type { Human } from "../entities/Human";
import type { HumanRelative } from "../entities/RelatedHuman";
import type { Location } from "../entities/Location";
import type { Movement } from "../entities/Movement";
import type { Nationality } from "../entities/Nationality";
import type { Gender } from "../entities/Gender";
import type { Occupation } from "../entities/Occupation";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import type { Collection } from "../entities/Collection";

import type { SelectedObject } from "../hooks/useAppSelection";

interface AppPanelsProps {
  selectedYear: number;
  isInitiated: boolean;
  detailMode: boolean;
  setDetailMode: (value: boolean) => void;

  selectedObject: SelectedObject;
  setSelectedObject: React.Dispatch<React.SetStateAction<SelectedObject>>;

  selectedHuman: Human | null;
  selectedLocation: Location | null;
  selectedMilitaryEvent: MilitaryEvent | null;
  selectedMovement: Movement | null;

 
  setHumanLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  setHumanRelations: React.Dispatch<React.SetStateAction<HumanRelative[]>>;

  selectedOccupation: Occupation | null;
  selectedGender: Gender | null;
  selectedNationality: Nationality | null;
  selectedCollection: Collection | null;

  setSelectedOccupation: React.Dispatch<React.SetStateAction<Occupation | null>>;
  setSelectedGender: React.Dispatch<React.SetStateAction<Gender | null>>;
  setSelectedNationality: React.Dispatch<React.SetStateAction<Nationality | null>>;
  setSelectedCollection: React.Dispatch<React.SetStateAction<Collection | null>>;

  backendUrl: string;
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;

  filteredHumans: Human[];
  filteredMilitaryEvents: MilitaryEvent[];
  

  setManualMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppPanels: React.FC<AppPanelsProps> = ({
  selectedYear,
  detailMode,
  isInitiated,
  setDetailMode,
  selectedObject,
  setSelectedObject,
  
  selectedHuman,
  selectedLocation,
  selectedMilitaryEvent,
  selectedMovement,
  setHumanLocations,
  setHumanRelations,
  selectedOccupation,
  selectedGender,
  selectedNationality,
  selectedCollection,
  setSelectedOccupation,
  setSelectedGender,
  setSelectedNationality,
  setSelectedCollection,
  backendUrl,
  movements,
  setMovements,
  filteredHumans,
  filteredMilitaryEvents,

  setManualMode,
}) => {
  const handleClearFilter = (key: string) => {
    switch (key) {
      case "nationality":
        setSelectedNationality(null);
        break;
      case "gender":
        setSelectedGender(null);
        break;
      case "occupation":
        setSelectedOccupation(null);
        break;
      case "movement":
        setSelectedObject(null);
        break;
      case "collection":
        setSelectedCollection(null);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className={`right-panel ${selectedObject ? "open" : ""}`}>
        <DetailBox
          selectedYear={selectedYear}
          detailMode={detailMode}
          setDetailMode={setDetailMode}
        >
          {selectedHuman && (
            <PersonBox
              person={selectedHuman}
              setHumanLocations={setHumanLocations}
              setHumanRelations={setHumanRelations}
              setManualMode={setManualMode}
            />
          )}

          {selectedLocation && <LocationBox location={selectedLocation} />}

          {selectedMilitaryEvent && (
            <MilitaryEventBox militaryEvent={selectedMilitaryEvent} />
          )}

          {selectedMovement && <MovementBox movement={selectedMovement} />}
        </DetailBox>
      </div>

      <div className={`top-panel ${selectedObject && selectedMilitaryEvent ? "open" : ""}`}>
        {selectedObject && !selectedMovement && (
          <ContentStrip selectedYear={selectedYear} selectedObject={selectedObject}>
            {selectedLocation && (
              <HumanList
                humans={filteredHumans}
                setSelectedObject={setSelectedObject}
              />
            )}

            {selectedMilitaryEvent && (
              <MilitaryEventDetail
                selectedYear={selectedYear}
                militaryEvents={filteredMilitaryEvents}
                setSelectedObject={setSelectedObject}
              />
            )}
          </ContentStrip>
        )}
      </div>
{isInitiated && ( <>
      <div className={`top-panel-dashboard ${
            selectedObject ? (selectedMovement ? "squeezed" : "close") : ""
        }`}
        >
        
            
            <Dashboard humans={filteredHumans} />
            <DescriptionBanner
                humans={filteredHumans}
                selectedMovement={selectedMovement}
                selectedOccupation={selectedOccupation}
                selectedGender={selectedGender}
                selectedNationality={selectedNationality}
                selectedCollection={selectedCollection}
                onClearFilter={handleClearFilter}
            />
            
        
        </div>

      <div className={`left-panel ${selectedObject && !selectedMovement ? "hide" : ""}`}>
        
            <FilterList
            selectedOccupation={selectedOccupation}
            selectedGender={selectedGender}
            selectedNationality={selectedNationality}
            selectedMovement={selectedMovement}
            selectedCollection={selectedCollection}
            setSelectedOccupation={setSelectedOccupation}
            setSelectedGender={setSelectedGender}
            setSelectedNationality={setSelectedNationality}
            setSelectedMovement={setSelectedObject}
            setSelectedCollection={setSelectedCollection}
            setSelectedObject={setSelectedObject}
            backendUrl={backendUrl}
            setMovements={setMovements}
            movements={movements}
            /> 
        
      </div></>
  )}

      {/* <div className={`bottom-worklist-panel ${selectedHuman && showWorks ? "open" : ""}`}>
        {selectedHuman && (
          <Timeline selectedYear={selectedYear} windowRange={windowRange}>
            <WorkList filteredWorks={filteredWorks} />
          </Timeline>
        )}
      </div> */}
    </>
  );
};

export default AppPanels;