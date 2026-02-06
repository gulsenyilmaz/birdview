import "./App.css"; // Import your CSS file
import { useEffect, useState } from "react";


import type { Human } from "./entities/Human";
import type { Location } from "./entities/Location";
import type { Movement } from "./entities/Movement";
import type { Nationality } from "./entities/Nationality";
import type { Gender } from "./entities/Gender";
import type { Occupation } from "./entities/Occupation";
import type { MilitaryEvent } from "./entities/MilitaryEvent";
import type { Collection } from "./entities/Collection";

import { isHuman, isLocation, isMilitaryEvent } from "./utils/typeGuards";

import { useHumanLayer } from "./layers/useHumanLayer";
import { useMilitaryEventLayer } from "./layers/useMilitaryEventLayer";
import { useWorkLayer} from "./layers/useWorkLayer"

import MapScene from './components/MapScene';
import TimeSlider from "./components/TimeSlider";
import TimeWindowSlider from "./components/TimeWindowSlider";
import LayerHistogram from "./components/LayerHistogram";
import Dashboard from "./components/Dashboard";
// import DashboardAdvanced from "./components/DashboardAdvanced";

import FilterList from "./components/FilterList";
import DescriptionBanner from "./components/DescriptionBanner"

import DetailBox from "./components/DetailBox";
import PersonBox from './components/PersonBox';
import LocationBox from './components/LocationBox';
import MilitaryEventBox from './components/MilitaryEventBox';

import ContentStrip from "./components/ContentStrip";
import WorkList from './components/WorkList';
import HumanList from './components/HumanList';
import MilitaryEventDetail from './components/MilitaryEventDetail';

import { unionRanges } from "./utils/dateUtils";


function App() {
  
  const [selectedYear, setSelectedYear] = useState<number>(1921);
  const [detailMode, setDetailMode] = useState<boolean>(false);
  
  // const [distinctDates, setDistinctDates] = useState<number[]>([]);
  const [windowRange, setWindowRange] = useState<[number, number]>([1850, 1950]);

  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [selectedObjectThumbnail, setSelectedObjectThumbnail]= useState<string | null>(null);

  const [selectedHuman, setSelectedHuman] = useState<Human | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedMilitaryEvent, setSelectedMilitaryEvent] = useState<MilitaryEvent | null>(null);

  const [selectedOccupation, setSelectedOccupation] = useState<Occupation| null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender| null>(null);
  const [selectedNationality, setSelectedNationality] = useState<Nationality| null>(null);
  const [selectedMovement, setSelectedMovement] = useState<Movement| null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const [movements, setMovements] = useState<Movement[]>([]); 
  const [locations, setLocations] = useState<Location[]>([]);

  const [showEvents, setShowEvents] = useState(false);
  const [showHumans, setShowHumans] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const humanLayer = useHumanLayer({
    active: true, // şimdilik hep açık
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
    active: true, // şimdilik hep açık
    backendUrl,
    filters: {
      military_event_depth_index: selectedMilitaryEvent?.depth_index,
    },
    selectedYear,
  });

  const workLayer = useWorkLayer({
    active: true, // şimdilik hep açık
    backendUrl,
    filters: {
      human_id: selectedHuman?.id,
    },
    selectedYear,
  });

  const activeFullRange = unionRanges([
    humanLayer.fullRange,
   // militaryLayer.fullRange,
    //workLayer.fullRange
    // eventsLayer.fullRange,
  ]);


  useEffect(() => {

    if(!selectedObject){

      setWindowRange(activeFullRange);
      return ;

    }  

    setDetailMode(true);

    if(isHuman(selectedObject)){

      setWindowRange(humanLayer.fullRange)

      setSelectedHuman(selectedObject);

      setSelectedLocation(null);
      setSelectedMilitaryEvent(null);

    }
    else if(isLocation(selectedObject)){

      setSelectedLocation(selectedObject);
      setLocations([selectedObject]);

      setSelectedHuman(null);
      setSelectedMilitaryEvent(null);

    }
    else if(isMilitaryEvent(selectedObject)){

      setWindowRange(militaryLayer.fullRange)
      
      setSelectedLocation(null);
      setSelectedHuman(null);
      setLocations([]);
      setSelectedMilitaryEvent(selectedObject);

    }
    
    else{

      setSelectedHuman(null);
      setSelectedLocation(null);
      setSelectedMilitaryEvent(null);
      setSelectedObject(null);
      setDetailMode(false);

    }
    

  }, [selectedObject, humanLayer.fullRange, militaryLayer.fullRange]);

  useEffect(() => {

    if(!detailMode){

      setSelectedHuman(null);
      setSelectedLocation(null);
      setSelectedObject(null);
      setLocations([]);
      setSelectedObjectThumbnail(null);
      setSelectedMilitaryEvent(null);
      // setDistinctDates([]);

    }

  }, [detailMode]);

  return (
    <div className="app-container">
      <div className="main-content">
        <div className={`left-panel ${selectedObject? "open" : ""}`}>
          <DetailBox
            selectedYear={selectedYear}
            detailMode={detailMode}   
            setDetailMode={setDetailMode}>

            {selectedHuman && (
              <PersonBox
                person={selectedHuman}
                setLocations={setLocations}
                setSelectedObjectThumbnail ={setSelectedObjectThumbnail}
              />
            )}

            {selectedLocation && (
              <LocationBox 
                location={selectedLocation}
                setSelectedObjectThumbnail = {setSelectedObjectThumbnail} 
              />
            )}

            {selectedMilitaryEvent && (
              <MilitaryEventBox 
                militaryEvent={selectedMilitaryEvent} 
              />
            )}

          </DetailBox>
        </div>

        <div className={`top-panel ${selectedObject ? "open" : ""}`}>
          {selectedObject &&(
          <ContentStrip 
            selectedYear = {selectedYear}
            selectedObject = {selectedObject}>

            {selectedHuman && (
              <WorkList
                person={selectedHuman}
                selectedYear={selectedYear}
                backendUrl = {backendUrl}
                // setDistinctDates = {setDistinctDates}
              />
            )}

            {selectedLocation && (
              <HumanList
                humans={humanLayer.filteredHumans}
                setSelectedObject = {setSelectedObject}
              />
            )}

            {selectedMilitaryEvent && (
              <MilitaryEventDetail
                selectedYear={selectedYear}
                militaryEvents={militaryLayer.filteredMilitaryEvents}
                setSelectedObject = {setSelectedObject}
              />
            )}

          </ContentStrip>
          )}
        </div>
        {/* <div className={`left-panel-dashborad ${selectedObject ? "close" : ""}`}>
          
            <Dashboard
              humans={humanLayer.filteredHumans}
            />
           
          </div> */}

        <div className={`top-panel-timeWindowSlider ${selectedObject? "close" : ""}`} >
          <Dashboard
              humans={humanLayer.filteredHumans}
            />
          <DescriptionBanner
              humans={humanLayer.filteredHumans}
              selectedMovement ={selectedMovement}
              selectedOccupation= {selectedOccupation}
              selectedGender={selectedGender}
              selectedNationality={selectedNationality}
              selectedCollection={selectedCollection}
              onClearFilter={(key) => {
                console.log("Clearing filter for key:", key);
                switch (key) {
                  case "nationality": setSelectedNationality(null); break;
                  case "gender": setSelectedGender(null); break;
                  case "occupation": setSelectedOccupation(null); break;
                  case "movement": setSelectedMovement(null); break;
                  case "collection": setSelectedCollection(null); break;
                  default: break;
                  }
                }
              }
            />
          

        </div>

        <div className="scene">
          <MapScene
            locations={locations}
            humans={humanLayer.filteredHumans}
            militaryEvents={militaryLayer.filteredMilitaryEvents}
            works={workLayer.filteredWorks}
            selectedYear={selectedYear}
            setSelectedObject={setSelectedObject}
            detailMode={detailMode}
            selectedObjectThumbnail ={selectedObjectThumbnail}
            showEvents={showEvents}
            showHumans={showHumans}
          />
        </div>

        <div className={`right-panel ${selectedObject? "hide" : ""}`}>
         
          <FilterList
            selectedOccupation = {selectedOccupation}
            selectedGender  = {selectedGender}
            selectedNationality = {selectedNationality}
            selectedMovement = {selectedMovement}
            selectedCollection = {selectedCollection}
            setSelectedOccupation= {setSelectedOccupation}
            setSelectedGender = {setSelectedGender}
            setSelectedNationality= {setSelectedNationality}
            setSelectedMovement = {setSelectedMovement}
            setSelectedCollection = {setSelectedCollection}
            setSelectedObject={setSelectedObject}
            backendUrl={backendUrl}
            setMovements={setMovements}
            movements={movements}
          />
        </div>

        <div className={`bottom-panel ${selectedObject ? "squeezed" : ""}`}>
           <TimeWindowSlider
            fullRange={activeFullRange}
            windowRange={windowRange}
            setWindowRange={setWindowRange}
            setSelectedYear={setSelectedYear}
            selectedYear={selectedYear}
            detailMode={detailMode}
          />

          <TimeSlider
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            fullRange={activeFullRange}
            windowRange={windowRange}
            setWindowRange={setWindowRange}
            // distinctDates= {distinctDates}   
            setSelectedMovement= {setSelectedMovement}
            movements={movements}         
          >

          <LayerHistogram
            setSelectedYear={setSelectedYear}
            windowRange={windowRange}
            aliveCounts={militaryLayer.eventCounts}
            binAggregation="sum"   
            layerTypeName ="WARS" 
            showLayer={showEvents}
            setShowLayer={setShowEvents}  
          />

          {selectedHuman && workLayer.workCounts.length > 0  &&(
            <LayerHistogram
              setSelectedYear={setSelectedYear}
              windowRange={windowRange}
              aliveCounts={workLayer.workCounts}
              binAggregation="sum"   
              layerTypeName ="WORKS"   
            />
          )}

          {!selectedHuman && (
            <LayerHistogram
              setSelectedYear={setSelectedYear}
              windowRange={windowRange}
              aliveCounts={humanLayer.aliveCounts}
              binAggregation="sum" 
              layerTypeName ="HUMANS"  
              showLayer={showHumans}
              setShowLayer={setShowHumans}                      
            />
          )}
          </TimeSlider>
          
        </div>
      </div>
    </div>
  );
    
}

export default App;