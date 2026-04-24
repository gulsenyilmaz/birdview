import "./App.css"; // Import your CSS file
import LoadingOverlay from './components/LoadingOverlay'
import { useEffect, useState, useMemo } from "react";

import type { RelatedHuman } from "./entities/RelatedHuman";
import type { Movement } from "./entities/Movement";
import type { Nationality } from "./entities/Nationality";
import type { Gender } from "./entities/Gender";
import type { Occupation } from "./entities/Occupation";
import type { Collection } from "./entities/Collection";

import { useHumanLayer } from "./layers/useHumanLayer";
import { useMilitaryEventLayer } from "./layers/useMilitaryEventLayer";
import { useWorkLayer} from "./layers/useWorkLayer"

import { unionRanges } from "./utils/dateUtils";
import { useAppSelection, type SelectedObject } from "./hooks/useAppSelection";

import BottomTimelineSection from "./components/BottomTimelineSection";
// import MapSection from "./components/MapSection";
import AppPanels from "./components/AppPanels";
import MapScene from "./components/map/MapScene";


function App() {
  
  const [isInitiated, setIsInitiated] = useState(false);
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  

  const [selectedYear, setSelectedYear] = useState<number>(1600);
  const [selectedObject, setSelectedObject] = useState<SelectedObject>(null);
  const detailMode = !!selectedObject;
  
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation| null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender| null>(null);
  const [selectedNationality, setSelectedNationality] = useState<Nationality| null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  
  const [windowRange, setWindowRange] = useState<[number, number]>([-800, 1950]);
  const [movements, setMovements] = useState<Movement[]>([]); 
  const [humanRelations, setHumanRelations] = useState<RelatedHuman[]>([]);

  const [showHumans, setShowHumans] = useState(true);
  const [showEvents, setShowEvents] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showWorks, setShowWorks] = useState(false);
  const [showDisasters, setShowDisasters] = useState(false);

  const {
    manualMode,
    setManualMode,
    selectedHuman,
    selectedLocation,
    selectedMilitaryEvent,
    selectedMovement,
    humanLocations,
    setHumanLocations
  } = useAppSelection(
    selectedObject
  );

  const humanLayer = useHumanLayer({
    active: showHumans, // şimdilik hep açık
    backendUrl,
    filters: {
      human_id: selectedHuman?.id,
      occupation_id: selectedOccupation?.id,
      gender_id: selectedGender?.id,
      nationality_id: selectedNationality?.id,
      movement_id: selectedMovement?.id,
      collection_id: selectedCollection?.id,
      location_id: selectedLocation?.id,
      relationship_type_name: selectedLocation?.relationship_type_name,

    },
    selectedYear,
  });

  const militaryLayer = useMilitaryEventLayer({
    active: showEvents, // şimdilik hep açık
    backendUrl,
    filters: {
      military_event_depth_index: selectedMilitaryEvent?.depth_index,
    },
    selectedYear,
  });

  const workLayer = useWorkLayer({
    active: showWorks, // şimdilik hep açık
    backendUrl,
    filters: {
      human_id: selectedHuman?.id,
    },
    selectedYear,
  });

  const activeFullRange = useMemo(
    () =>
      unionRanges([
        humanLayer.fullRange,
        showEvents ? militaryLayer.fullRange : null,
        // workLayer.fullRange,
      ]),
    [humanLayer.fullRange, militaryLayer.fullRange, showEvents]
  );


  useEffect(() => {
    let nextRange: [number, number] | null = null;

    if (!selectedObject) {
      nextRange = activeFullRange;
    } else if (selectedHuman) {
      setShowWorks(true);
      
      nextRange = humanLayer.fullRange;
      // setShowHumans(false);
    } else if (selectedLocation) {
      setShowWorks(false);
      setShowHumans(true);
      nextRange = humanLayer.fullRange;
    } else if (selectedMilitaryEvent) {
      setShowEventDetails(true);
      nextRange = militaryLayer.fullRange;
    } else if (selectedMovement) {
      nextRange = [
        selectedMovement.start_date ?? humanLayer.fullRange[0],
        selectedMovement.end_date ?? humanLayer.fullRange[1],
      ];
    }

    if (
      nextRange &&
      (windowRange[0] !== nextRange[0] || windowRange[1] !== nextRange[1])
    ) {
      setWindowRange(nextRange);
    }
  }, [
    selectedObject,
    selectedHuman,
    selectedLocation,
    selectedMilitaryEvent,
    selectedMovement,
    activeFullRange,
    humanLayer.fullRange,
    militaryLayer.fullRange,
    
  ]);

  return (
    <div className="app-container">
      <div className="main-content">
        {!isInitiated && 
          <LoadingOverlay 
            humanDataLoading={humanLayer.loadingHumans}
            eventDataLoading={militaryLayer.loadingEvents}
            onInitialize={() => {
              setIsInitiated(true);
            }
          } />
          }
          <div className="scene">
          {/* <MapSection
            humanLocations={humanLocations}
            humans={humanLayer.filteredHumans}
            militaryEvents={militaryLayer.filteredMilitaryEvents}
            works={workLayer.filteredWorks}
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
          /> */}

          <div className="map-shell">
            <MapScene
              humanLocations={humanLocations}
              humans={humanLayer.filteredHumans}
              militaryEvents={militaryLayer.filteredMilitaryEvents}
              // works={workLayer.filteredWorks}
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
        </div>
        <div className="overlay-layer">
        <AppPanels
          selectedYear={selectedYear}
          detailMode={detailMode}
          setDetailMode={(value) => {
            if (!value) {
              setShowHumans(true);
              setShowWorks(false);
              setSelectedObject(null);
            }
          }}
          isInitiated={isInitiated}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
          selectedHuman={selectedHuman}
          selectedLocation={selectedLocation}
          selectedMilitaryEvent={selectedMilitaryEvent}
          selectedMovement={selectedMovement}
          setHumanLocations={setHumanLocations}
          setHumanRelations={setHumanRelations}
          selectedOccupation={selectedOccupation}
          selectedGender={selectedGender}
          selectedNationality={selectedNationality}
          selectedCollection={selectedCollection}
          setSelectedOccupation={setSelectedOccupation}
          setSelectedGender={setSelectedGender}
          setSelectedNationality={setSelectedNationality}
          setSelectedCollection={setSelectedCollection}
          backendUrl={backendUrl}
          movements={movements}
          setMovements={setMovements}
          filteredHumans={humanLayer.filteredHumans}
          // filteredMilitaryEvents={militaryLayer.filteredMilitaryEvents}
          setManualMode={setManualMode}
        />

        <BottomTimelineSection
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          activeFullRange={activeFullRange}
          windowRange={windowRange}
          setWindowRange={setWindowRange}
          // detailMode={detailMode}
          humanRelations={humanRelations}
          humanLocations={humanLocations}
          movements={movements}
          setSelectedObject={setSelectedObject}
          setManualMode={setManualMode}
          selectedMilitaryEvent={selectedMilitaryEvent}
          selectedHuman={selectedHuman}
          selectedLocation={selectedLocation}
          filteredHumans={humanLayer.filteredHumans}
          showWorks={showWorks}
          setShowWorks={setShowWorks}
          showHumans={showHumans}
          setShowHumans={setShowHumans}
          showEvents={showEvents}
          setShowEvents={setShowEvents}
          showEventDetails={showEventDetails}
          setShowEventDetails = {setShowEventDetails}
          showDisasters={showDisasters}
          setShowDisasters={setShowDisasters}
          filteredWorks={workLayer.filteredWorks}
          filteredMilitaryEvents={militaryLayer.filteredMilitaryEvents}
          workCounts={workLayer.workCounts}
          humanAliveCounts={humanLayer.aliveCounts}
          militaryEventCounts={militaryLayer.eventCounts}
        />
       </div>
       

        
       
      </div>
    </div>
  );
    
}

export default App;