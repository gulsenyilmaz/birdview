import "./App.css"; // Import your CSS file
import { useEffect, useState } from "react";
import MapScene from './components/MapScene';
import TimeSlider from "./components/TimeSlider";
import TimeWindowSlider from "./components/TimeWindowSlider";

import type { Human } from "./entities/Human";
import type { Location } from "./entities/Location";
import type { Movement } from "./entities/Movement";
import type { Nationality } from "./entities/Nationality";
import type { Gender } from "./entities/Gender";
import type { Occupation } from "./entities/Occupation";
import type { Event } from "./entities/Event";

import { getFullRange } from "./utils/dateUtils";
import { isHuman, isLocation } from "./utils/typeGuards";
import Dashboard from "./components/Dashboard";
import FilterList from "./components/FilterList";
import DescriptionBanner from "./components/DescriptionBanner"
import DetailBox from "./components/DetailBox";
import PersonBox from './components/PersonBox';
import LocationBox from './components/LocationBox';
import HumanList from './components/HumanList';
import WorkList from './components/WorkList';
import ContentStrip from "./components/ContentStrip";
import { buildAliveCounts } from "./utils/buildAliveCounts";


function App() {
  const [colorFilterType, setColorFilterType] = useState<"gender" | "age" | "nationality">("nationality");
  const [selectedYear, setSelectedYear] = useState<number>(1944);
  const [detailMode, setDetailMode] = useState<boolean>(false);
  const [humans, setHumans] = useState<Human[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filteredHumans, setFilteredHumans] = useState<Human[]>([]);
  const [distinctDates, setDistinctDates] = useState<number[]>([]);
  const [aliveCounts, setAliveCounts] = useState<{ year: number; count: number }[]>([]);
  const [fullRange, setFullRange] = useState<[number, number]>([1200, 2025]); // başlangıç ve bitiş tarihleri
  const [windowRange, setWindowRange] = useState<[number, number]>([1850, 1950]);

  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [selectedObjectThumbnail, setSelectedObjectThumbnail]= useState<string | null>(null);

  const [selectedHuman, setSelectedHuman] = useState<Human | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const [selectedOccupation, setSelectedOccupation] = useState<Occupation| null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender| null>(null);
  const [selectedNationality, setSelectedNationality] = useState<Nationality| null>(null);
  const [selectedMovement, setSelectedMovement] = useState<Movement| null>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  useEffect(() => {
    const queryParams = new URLSearchParams();

    if (selectedHuman) queryParams.append("human_id", String(selectedHuman.id));
    if (selectedOccupation) queryParams.append("occupation_id", String(selectedOccupation.id));
    if (selectedGender) queryParams.append("gender_id", String(selectedGender.id));
    if (selectedNationality) queryParams.append("nationality_id", String(selectedNationality.id));
    if (selectedMovement) queryParams.append("movement_id", String(selectedMovement.id));

    if (selectedLocation) {
      queryParams.append("location_id", String(selectedLocation.id));
        
      if (selectedLocation.relationship_type_name) {
        queryParams.append("relationship_type_name", selectedLocation.relationship_type_name);
      }
    } 

    fetch(`${backendUrl}/allhumans?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        setFullRange(getFullRange(data.humans));
        // setDistinctDates(extractSortedDates(data.humans, "birth_date"));   
        setHumans(data.humans)
      })  
      .catch(err => console.error("API error:", err));

  }, [selectedHuman, selectedLocation, selectedOccupation, selectedGender, selectedNationality, selectedMovement]);


  useEffect(() => {
     
    fetch(`${backendUrl}/allevents`)
      .then(res => res.json())
      .then(data => {
       
        setEvents(data.events)
      })  
      .catch(err => console.error("API error:", err));

  }, [selectedHuman]);


  useEffect(() => {

    setWindowRange(fullRange);
    if (humans.length > 1) {

      setAliveCounts(buildAliveCounts(humans, fullRange, { maxAge: 100 }));
      setDistinctDates([]);  
    }
    else {

      setAliveCounts([]);
    }

  }, [fullRange]);


  useEffect(() => {

    const filteredH = humans.filter(h =>
      h.birth_date <= selectedYear &&
      (!h.death_date || h.death_date >= selectedYear) &&
      (selectedYear-h.birth_date)<100
    );
    setFilteredHumans(filteredH);

    const filteredE = events.filter(e =>
      e.start_date <= selectedYear && (e.start_date+e.scale+2) > selectedYear
    );
    setFilteredEvents(filteredE);

  }, [selectedYear, humans]);

  useEffect(() => {

    if(selectedObject){

      setDetailMode(true);

      if(isHuman(selectedObject)){

        setSelectedHuman(selectedObject);
        setSelectedLocation(null);
      }
      else if(isLocation(selectedObject)){

        setSelectedLocation(selectedObject);
        setSelectedHuman(null);
        setLocations([selectedObject]);

      }
      else{
        setSelectedHuman(null);
        setSelectedLocation(null);
        setSelectedObject(null);
        setDetailMode(false);
      }
    }

  }, [selectedObject]);

  useEffect(() => {

    if(!detailMode){
      setSelectedHuman(null);
      setSelectedLocation(null);
      setSelectedObject(null);
      setLocations([]);
      setSelectedObjectThumbnail(null);
    }

  }, [detailMode]);

   

  return (
    <div className="app-container">
      <div className="main-content">
        
          <div className={`left-panel ${detailMode ? "open" : ""}`}>
            <DetailBox
              selectedYear={selectedYear}
              detailMode={detailMode}
              setDetailMode={setDetailMode}
            >
              {selectedHuman && (
                <PersonBox
                  person={selectedHuman}
                  setLocations={setLocations}
                  setSelectedObjectThumbnail ={setSelectedObjectThumbnail}
                />
              )}
              {selectedLocation && (
                <LocationBox location={selectedLocation}
                            setSelectedObjectThumbnail = {setSelectedObjectThumbnail} />
              )}
            </DetailBox>
          </div>

          <div className={`top-panel ${detailMode ? "open" : ""}`}>
              {selectedObject &&(
                <ContentStrip 
                    selectedYear = {selectedYear}
                    selectedObject = {selectedObject}>
                      {selectedHuman && (
                        <WorkList
                          person={selectedHuman}
                          selectedYear={selectedYear}
                          backendUrl = {backendUrl}
                          setDistinctDates = {setDistinctDates}
                        />
                      )}
                      {selectedLocation && (
                        <HumanList
                          humans={filteredHumans}
                          setSelectedObject = {setSelectedObject}
                        />
                      )}
                </ContentStrip>
              )}

          </div>

          <div className={`top-filter_description-bar ${detailMode ? "close" : ""}`} >
              
            <DescriptionBanner
                selectedMovement ={selectedMovement}
                selectedOccupation= {selectedOccupation}
                selectedGender={selectedGender}
                selectedNationality={selectedNationality}
                onClearFilter={(key) => {
                console.log("Clearing filter for key:", key);
                switch (key) {
                  case "nationality": setSelectedNationality(null); break;
                  case "gender": setSelectedGender(null); break;
                  case "occupation": setSelectedOccupation(null); break;
                  case "movement": setSelectedMovement(null); break;
                  default: break;
                }
              }}
            />

            <FilterList
                selectedOccupation = {selectedOccupation}
                selectedGender  = {selectedGender}
                selectedNationality = {selectedNationality}
                selectedMovement = {selectedMovement}
                setSelectedOccupation= {setSelectedOccupation}
                setSelectedGender = {setSelectedGender}
                setSelectedNationality= {setSelectedNationality}
                setSelectedMovement= {setSelectedMovement}
                setSelectedObject={setSelectedObject}
                backendUrl={backendUrl}
              />

          </div>
          <div className="scene">

            <MapScene
              locations={locations}
              humans = {filteredHumans} 
              events={filteredEvents}
              selectedYear={selectedYear}
              setSelectedObject={setSelectedObject}
              colorFilterType={colorFilterType}
              detailMode={detailMode}
              selectedObjectThumbnail ={selectedObjectThumbnail}
            />

          </div>
          <div className={`right-panel ${detailMode ? "hide" : ""}`}>
            
            <Dashboard
                humans = {filteredHumans} 
                setColorFilterType= {setColorFilterType}
                colorFilterType={colorFilterType}
              />

          </div>
           <div className={`bottom-panel ${detailMode ? "squeezed" : ""}`}>

            <TimeWindowSlider
              fullRange={fullRange}
              windowRange={windowRange}
              setWindowRange={setWindowRange}
              setSelectedYear={setSelectedYear}
              selectedYear={selectedYear}
              detailMode={detailMode}
            />

            {/* <TimeSlider
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                distinctDates= {distinctDates}
                windowRange={windowRange}
                histogramYears={humans.map(d => d.birth_date)}
                
              /> */}

              <TimeSlider
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  windowRange={windowRange}
                  aliveCounts={aliveCounts}          // ⬅️ histogram artık “o yıl hayatta olanlar”
                  binAggregation="sum"               // istersen "sum"
                  distinctDates= {distinctDates}            // opsiyonel
                />

          </div>
      </div>
    </div>
  );
  
     
    
}

export default App;