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
// import type { Event } from "./entities/Event";
import type { MilitaryEvent } from "./entities/MilitaryEvent";

import { getFullRange } from "./utils/dateUtils";
import { isHuman, isLocation, isEvent, isMilitaryEvent } from "./utils/typeGuards";
import Dashboard from "./components/Dashboard";
import FilterList from "./components/FilterList";
import DescriptionBanner from "./components/DescriptionBanner"
import DetailBox from "./components/DetailBox";
import PersonBox from './components/PersonBox';
import LocationBox from './components/LocationBox';
// import EventBox from './components/EventBox';
import MilitaryEventBox from './components/MilitaryEventBox';
import HumanList from './components/HumanList';
import MilitaryEventDetail from './components/MilitaryEventDetail';
import WorkList from './components/WorkList';
import ContentStrip from "./components/ContentStrip";
import { buildAliveCounts, buildEventCounts } from "./utils/buildCounts";


function App() {
  const [colorFilterType, setColorFilterType] = useState<"gender" | "age" | "nationality">("nationality");
  const [selectedYear, setSelectedYear] = useState<number>(1921);
  const [detailMode, setDetailMode] = useState<boolean>(false);
  const [eventDetailMode, setEventDetailMode] = useState<boolean>(false);
  
  const [humans, setHumans] = useState<Human[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  // const [events, setEvents] = useState<Event[]>([]);
  const [militaryEvents, setMilitaryEvents] = useState<MilitaryEvent[]>([]);
  const [filteredMilitaryEvents, setFilteredMilitaryEvents] = useState<MilitaryEvent[]>([]);
  // const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filteredHumans, setFilteredHumans] = useState<Human[]>([]);
  const [distinctDates, setDistinctDates] = useState<number[]>([]);
  const [aliveCounts, setAliveCounts] = useState<{ year: number; count: number }[]>([]);
  const [eventCounts, setEventCounts] = useState<{ year: number; count: number }[]>([]);
  const [fullRange, setFullRange] = useState<[number, number]>([-1600, 2025]); // başlangıç ve bitiş tarihleri
  const [windowRange, setWindowRange] = useState<[number, number]>([1850, 1950]);

  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [selectedObjectThumbnail, setSelectedObjectThumbnail]= useState<string | null>(null);

  const [selectedHuman, setSelectedHuman] = useState<Human | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  // const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedMilitaryEvent, setSelectedMilitaryEvent] = useState<MilitaryEvent | null>(null);

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
         
        setFullRange(getFullRange(data.humans, "birth_date", "death_date", "humans"));
        // setDistinctDates(extractSortedDates(data.humans, "birth_date"));   
        setHumans(data.humans)
        
      })  
      .catch(err => console.error("API error:", err));

  }, [selectedHuman, selectedLocation, selectedOccupation, selectedGender, selectedNationality, selectedMovement]);


  // useEffect(() => {
  //   const queryParams = new URLSearchParams();
  //   if (selectedEvent) queryParams.append("event_id", String(selectedEvent.id));
     
  //   fetch(`${backendUrl}/allevents?${queryParams.toString()}`)
  //     .then(res => res.json())
  //     .then(data => {
  //       setEvents(data.events)
  //     })  
  //     .catch(err => console.error("API error:", err));

  // }, [selectedEvent]);

  useEffect(() => {
    const queryParams = new URLSearchParams();
    if (selectedMilitaryEvent) {
      queryParams.append("military_event_depth_index", String(selectedMilitaryEvent.depth_index));
    }
     
    fetch(`${backendUrl}/allmilitaryevents?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        setMilitaryEvents(data.military_events)
        
        setFullRange(getFullRange(data.military_events , "start_date", "end_date","events"));
        console.log("Fetched military events:", data.military_events);
      })  
      .catch(err => console.error("API error:", err));

  }, [selectedMilitaryEvent]);


  useEffect(() => {

    setWindowRange(fullRange);
    if (humans.length > 1) {

      setAliveCounts(buildAliveCounts(humans, fullRange, { maxAge: 100 }));
      setDistinctDates([]);  
    }
    else {

      setAliveCounts([]);
    }

    if (militaryEvents.length > 1) {
      setEventCounts(buildEventCounts(militaryEvents, fullRange));
    }
    else {
      setEventCounts([]);
    }


  }, [fullRange]);


  useEffect(() => {

    const filteredH = humans.filter(h =>
      h.birth_date <= selectedYear &&
      (!h.death_date || h.death_date >= selectedYear) &&
      (selectedYear-h.birth_date)<100
    );
    setFilteredHumans(filteredH);

    // const filteredE = events.filter(e =>
    //   e.start_date <= selectedYear && (e.start_date+e.scale+2) > selectedYear
    // );
    // setFilteredEvents(filteredE);


    const filteredME = militaryEvents.filter(me =>
     me.start_date && me.start_date <= selectedYear 
    //  && (!me.end_date || me.end_date >= selectedYear)
    );
    
    setFilteredMilitaryEvents(filteredME);

  }, [selectedYear, humans, militaryEvents]);

  useEffect(() => {

    if(selectedObject){
      

      setDetailMode(true);
      setEventDetailMode(false);

      if(isHuman(selectedObject)){

        setSelectedHuman(selectedObject);
        setSelectedLocation(null);
        // setSelectedEvent(null);
        setSelectedMilitaryEvent(null);
      }
      else if(isLocation(selectedObject)){

        setSelectedLocation(selectedObject);
        setSelectedHuman(null);
        setLocations([selectedObject]);
        // setSelectedEvent(null);
        setSelectedMilitaryEvent(null);

      }
      else if(isEvent(selectedObject)){

        setSelectedLocation(null);
        setSelectedHuman(null);
        setLocations([]);
        // setSelectedEvent(selectedObject);
        setSelectedMilitaryEvent(null);

      }
      else if(isMilitaryEvent(selectedObject)){
        setEventDetailMode(true);
        // setDetailMode(false);

        
        setSelectedLocation(null);
        setSelectedHuman(null);
        setLocations([]);
        setSelectedMilitaryEvent(selectedObject);
        // setSelectedEvent(null);

      }
      
      else{
        setSelectedHuman(null);
        setSelectedLocation(null);
        // setSelectedEvent(null);
        setSelectedMilitaryEvent(null);
        setSelectedObject(null);
        setDetailMode(false);
        setEventDetailMode(false);
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
      setSelectedMilitaryEvent(null);
    }

  }, [detailMode]);

   

  return (
    <div className="app-container">
      <div className="main-content">
        
          <div className={`left-panel ${detailMode? "open" : ""}`}>
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
                <LocationBox 
                    location={selectedLocation}
                    setSelectedObjectThumbnail = {setSelectedObjectThumbnail} />
              )}
              {/* {selectedEvent && (
                <EventBox 
                    event={selectedEvent}
                    setSelectedObjectThumbnail = {setSelectedObjectThumbnail} />
              )} */}
              {selectedMilitaryEvent && (
               
                <MilitaryEventBox 
                    militaryEvent={selectedMilitaryEvent} 
                />
              )}
            </DetailBox>
          </div>

          <div className={`top-panel ${detailMode ? (eventDetailMode?"open":"open") : ""}`}>
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
                     
                      {selectedMilitaryEvent && (
                        <MilitaryEventDetail
                            selectedYear={selectedYear}
                            militaryEvents={militaryEvents}
                            setSelectedObject = {setSelectedObject}
                            // selectedMilitaryEvent={selectedMilitaryEvent}
                        />
                        
                      )}
                      
                </ContentStrip>
              )}
              
          </div>

          <div className={`top-filter_description-bar ${detailMode? "close" : ""}`} >
              
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

          {/* <div className={`top-event-bar ${eventDetailMode ? "open" : ""}`} >
               {selectedMilitaryEvent && (
                        <MilitaryEventTree
                            selectedYear={selectedYear}
                            militaryEvents={militaryEvents}
                            setSelectedObject = {setSelectedObject} />
                      )}
          </div> */}

          <div className="scene">

            <MapScene
              locations={locations}
              humans = {filteredHumans} 
              // events={filteredEvents}
              militaryEvents={filteredMilitaryEvents}
              selectedYear={selectedYear}
              setSelectedObject={setSelectedObject}
              colorFilterType={colorFilterType}
              detailMode={detailMode}
              selectedObjectThumbnail ={selectedObjectThumbnail}
            />

          </div>
          <div className={`right-panel ${detailMode? "hide" : ""}`}>
            
            <Dashboard
                humans = {filteredHumans} 
                setColorFilterType= {setColorFilterType}
                colorFilterType={colorFilterType}
              />

          </div>
           <div className={`bottom-panel ${detailMode&&eventDetailMode ? "squeezed" : ""}`}>

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
                  aliveCounts={eventCounts.length>0?eventCounts:aliveCounts}          // ⬅️ histogram artık “o yıl hayatta olanlar”
                         // ⬅️ histogram artık “o yıl aktif olan eventler”
                  binAggregation="sum"               // istersen "sum"
                  distinctDates= {distinctDates}            // opsiyonel
                />

          </div>
      </div>
    </div>
  );
  
     
    
}

export default App;