import "./App.css"; // Import your CSS file
import { useEffect, useState } from "react";
import MapScene from './components/MapScene';
import TimeSlider from "./components/TimeSlider";
import type { Human } from "./entities/Human";
import type { Location } from "./entities/Location";
import type { Movement } from "./entities/Movement";
import type { Nationality } from "./entities/Nationality";
import type { Gender } from "./entities/Gender";
import type { Occupation } from "./entities/Occupation";

import { extractSortedDates, getDateRange } from "./utils/dateUtils";
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


function App() {
  const [colorFilterType, setColorFilterType] = useState<"gender" | "age" | "nationality">("nationality");
  const [selectedYear, setSelectedYear] = useState<number>(2020);
  const [detailMode, setDetailMode] = useState<boolean>(false);
  const [humans, setHumans] = useState<Human[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredHumans, setFilteredHumans] = useState<Human[]>([]);
  const [distinctDates, setDistinctDates] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<number[]>([]);
  const [selectedObject, setSelectedObject] = useState<any>(null);

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

    // Tüm human verilerini filtrelere göre getir
    fetch(`${backendUrl}/allhumans?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        setDateRange(getDateRange(data.humans));
        setDistinctDates(extractSortedDates(data.humans, "birth_date"));   
        setHumans(data.humans)
      })  
      .catch(err => console.error("API error:", err));

  }, [selectedHuman, selectedLocation, selectedOccupation, selectedGender, selectedNationality, selectedMovement]);

  useEffect(() => {

    const filtered = humans.filter(h =>
      h.birth_date <= selectedYear &&
      (!h.death_date || h.death_date >= selectedYear)
    );
    setFilteredHumans(filtered);

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
                />
              )}
              {selectedLocation && (
                <LocationBox location={selectedLocation} />
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
                selectedYear={selectedYear}
                setSelectedObject={setSelectedObject}
                colorFilterType={colorFilterType}
                detailMode={detailMode}
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
        
            <TimeSlider
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                distinctDates= {distinctDates}
                dateRange={dateRange}
                
              />

          </div>
      </div>
    </div>
  );
  
     
    
}

export default App;