import Dashboard from "./general_panels/Dashboard";
import DescriptionBanner from "./general_panels/DescriptionBanner";
import DetailBox from "./detail_panels/DetailBox";
import PersonBox from "./detail_panels/PersonBox";
import LocationBox from "./detail_panels/LocationBox";
import MilitaryEventBox from "./detail_panels/MilitaryEventBox";
import MovementBox from "./detail_panels/MovementBox";

import TimeWindowSlider from "./timeline/window/TimeWindowSlider";
import FilterList from "./general_panels/FilterList";

import type { Human } from "../entities/Human";
import type { RelatedHuman } from "../entities/RelatedHuman";
import type { Location } from "../entities/Location";
import type { Movement } from "../entities/Movement";
import type { Nationality } from "../entities/Nationality";
import type { Gender } from "../entities/Gender";
import type { Occupation } from "../entities/Occupation";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import type { Collection } from "../entities/Collection";

import type { SelectedObject } from "../hooks/useAppSelection";
import { useState } from "react";

interface AppPanelsProps {
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  activeFullRange: [number, number];
  windowRange: [number, number];
  setWindowRange: React.Dispatch<React.SetStateAction<[number, number]>>;
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
  setHumanRelations: React.Dispatch<React.SetStateAction<RelatedHuman[]>>;
  setHumanSelectedDetail: React.Dispatch<React.SetStateAction<string | null>>;
  selectedOccupation: Occupation | null;
  selectedGender: Gender | null;
  selectedNationality: Nationality | null;
  selectedCollection: Collection | null;

  setSelectedOccupation: React.Dispatch<React.SetStateAction<Occupation | null>>;
  setSelectedGender: React.Dispatch<React.SetStateAction<Gender | null>>;
  setSelectedNationality: React.Dispatch<React.SetStateAction<Nationality | null>>;
  setSelectedCollection: React.Dispatch<React.SetStateAction<Collection | null>>;
  setShowWorks:(obj: boolean) => void;
  hasWorks: boolean;
  backendUrl: string;
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;

  filteredHumans: Human[];
  // filteredMilitaryEvents: MilitaryEvent[];
  setManualMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppPanels: React.FC<AppPanelsProps> = ({
  selectedYear,
  setSelectedYear,
  activeFullRange,
  windowRange,
  setWindowRange,
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
  setHumanSelectedDetail,
  selectedOccupation,
  selectedGender,
  selectedNationality,
  selectedCollection,
  setSelectedOccupation,
  setSelectedGender,
  setSelectedNationality,
  setSelectedCollection,
  setShowWorks,
  hasWorks,
  backendUrl,
  movements,
  setMovements,
  filteredHumans,
  // filteredMilitaryEvents,

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

   const [dashboardMode, setDashboardMode] = useState(true);

  return (
    <>
      
    {isInitiated && ( <>
      <div className={`left_dashboard-panel ${!detailMode && dashboardMode? "open" : ""}`}>
        <Dashboard 
            humans={filteredHumans} 
            dashboardMode={dashboardMode}
            setDashboardMode={setDashboardMode}
          />
      </div>

      {/* <div className={`top-bar ${selectedObject ?"squeezed" : ""}`}>
        <DescriptionBanner
            humans={filteredHumans}
            selectedMovement={selectedMovement}
            selectedOccupation={selectedOccupation}
            selectedGender={selectedGender}
            selectedNationality={selectedNationality}
            selectedCollection={selectedCollection}
            onClearFilter={handleClearFilter}
        />
      </div> */}

        <div className={`right-panel ${selectedObject && !selectedMovement ? "hide" : ""}`}>
        
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
        
        </div>
      </>
      )}

      <div className={`left-panel ${detailMode ? "open" : ""}`}>
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
              setHumanSelectedDetail ={setHumanSelectedDetail}
              setShowWorks={setShowWorks}
              hasWorks={hasWorks}
              setManualMode={setManualMode}
            />
          )}

          {selectedLocation && 
            <LocationBox 
              location={selectedLocation} 
            />
          }

          {selectedMilitaryEvent && 
            <MilitaryEventBox 
              militaryEvent={selectedMilitaryEvent} 
            />
          }

          {selectedMovement && 
            <MovementBox 
              movement={selectedMovement} 
            />
          }
        </DetailBox>

      </div>

      <div className="top-panel">
       <DescriptionBanner
            humans={filteredHumans}
            selectedMovement={selectedMovement}
            selectedOccupation={selectedOccupation}
            selectedGender={selectedGender}
            selectedNationality={selectedNationality}
            selectedCollection={selectedCollection}
            onClearFilter={handleClearFilter}
        />
        <div className={`top-panel-child ${selectedObject ? "hide" : ""}`}>
          <TimeWindowSlider
            fullRange={activeFullRange}
            windowRange={windowRange}
            setWindowRange={setWindowRange}
            setSelectedYear={setSelectedYear}
            selectedYear={selectedYear}
          />
        </div>
        

      </div>
    </>
  );
};

export default AppPanels;