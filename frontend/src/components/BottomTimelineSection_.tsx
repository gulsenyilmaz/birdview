import TimeSlider from "./timeline/TimeSlider";
import React from "react";

import TimeWindowSlider from "./timeline/TimeWindowSlider";
import LayerHistogram from "./timeline/LayerHistogram";
import BarTimeline from "./timeline/BarTimeline";

import Timeline from "./timeline/Timeline";
import WorkList from "./timeline/WorkList";
import HumanList from "./timeline/HumanList";

import type { SelectedObject } from "../hooks/useAppSelection";
import type { Work } from "../entities/Work";
import type { Movement } from "../entities/Movement";
import type { Human } from "../entities/Human";
import type { RelatedHuman } from "../entities/RelatedHuman";
import type { Location } from "../entities/Location";
import YearLine from "./timeline/YearLine";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import MilitaryEventDetail from "./detail_panels/MilitaryEventDetail";

import { getLayerColor, getColorForLabelString, getColorForRelationTypeString } from "../utils/colorUtils"



type CountItem = {
  year: number;
  count: number;
};

interface BottomTimelineSectionProps {

  humanRelations:RelatedHuman[];
  humanLocations:Location[];
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  activeFullRange: [number, number];
  windowRange: [number, number];
  setWindowRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  
  // detailMode: boolean;
  filteredWorks: Work[];
  filteredMilitaryEvents: MilitaryEvent[];
  filteredHumans: Human[];

  movements: Movement[];
  setSelectedObject: React.Dispatch<React.SetStateAction<SelectedObject>>;
  setManualMode: React.Dispatch<React.SetStateAction<boolean>>;

  selectedHuman: Human | null;
  selectedMilitaryEvent: MilitaryEvent | null;
  selectedLocation: Location | null;

  showWorks: boolean;
  setShowWorks: React.Dispatch<React.SetStateAction<boolean>>;
  showHumans: boolean;
  setShowHumans: React.Dispatch<React.SetStateAction<boolean>>;
  showEventDetails: boolean;
  setShowEventDetails: React.Dispatch<React.SetStateAction<boolean>>;
  showEvents: boolean;
  setShowEvents: React.Dispatch<React.SetStateAction<boolean>>;
  showDisasters: boolean;
  setShowDisasters: React.Dispatch<React.SetStateAction<boolean>>;

  workCounts: CountItem[];
  humanAliveCounts: CountItem[];
  militaryEventCounts: CountItem[];
}

const BottomTimelineSection: React.FC<BottomTimelineSectionProps> = ({
  selectedYear,
  setSelectedYear,
  activeFullRange,
  filteredWorks,
  filteredMilitaryEvents,
  filteredHumans,
  humanRelations,
  humanLocations,
  windowRange,
  setWindowRange,
  // detailMode,
  movements,
  setSelectedObject,
  setManualMode,
  selectedMilitaryEvent,
  selectedHuman,
  selectedLocation,

  showWorks,
  setShowWorks,
  showHumans,
  setShowHumans,
  showEvents,
  setShowEvents,
  showEventDetails,
  setShowEventDetails,
  showDisasters,
  setShowDisasters,
  workCounts,
  humanAliveCounts,
  militaryEventCounts,
}) => {

  
  return (
    <div className="bottom-panel-slot" >
      <div className={`bottom-worklist-panel ${(selectedHuman && showWorks) || (selectedMilitaryEvent && showEventDetails) || selectedLocation ? "open" : "hide"}`}>
        <Timeline selectedYear={selectedYear} windowRange={windowRange}>
          {selectedHuman && (
            
              <WorkList filteredWorks={filteredWorks} />
            
          )}

          {selectedMilitaryEvent && (
              <MilitaryEventDetail
                selectedYear={selectedYear}
                militaryEvents={filteredMilitaryEvents}
                setSelectedObject={setSelectedObject}
                setShowEventDetails={setShowEventDetails}
              />
            )}

          {selectedLocation && (
              <HumanList
                humans={filteredHumans}
                setSelectedObject={setSelectedObject}
                
              />
            )}
        </Timeline>
      </div>
      <div className="bottom-panel">
        <div className="component-container">

          <YearLine 
            selectedYear={selectedYear} 
            windowRange={windowRange} /> 

           
        
          {selectedHuman && (
            <>
              {workCounts.length > 0 && (
                <LayerHistogram
                  setSelectedYear={setSelectedYear}
                  windowRange={windowRange}
                  aliveCounts={workCounts}
                  binAggregation="sum"
                  layerTypeName="WORKS"
                  layerColor= {getLayerColor("WORKS")}
                  showLayer={showWorks}
                  setShowLayer={setShowWorks}
                />
              )}

              <BarTimeline
                windowRange={windowRange}
                layerTypeName="RELATIONS"
                layerColor= {getLayerColor("RELATIONS")}
                objectColor ={getColorForRelationTypeString}
                currentData={humanRelations.length > 0 ? humanRelations : humanLocations}
                setSelectedData={setSelectedObject}
              />
            </>
          )}

        <TimeSlider
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          fullRange={activeFullRange}
          windowRange={windowRange}
          setWindowRange={setWindowRange}
          setSelectedMovement={setSelectedObject}
          setManualMode={setManualMode}
          // timelineHeight={timelineHeight}
        />

        {!selectedHuman && (
            <LayerHistogram
              setSelectedYear={setSelectedYear}
              windowRange={windowRange}
              aliveCounts={humanAliveCounts}
              binAggregation="sum"
              layerColor= {getLayerColor("HUMANS")}
              layerTypeName="HUMANS"
              showLayer={showHumans}
              setShowLayer={setShowHumans}
            />
        )}

        <LayerHistogram
          setSelectedYear={setSelectedYear}
          windowRange={windowRange}
          aliveCounts={militaryEventCounts}
          binAggregation="sum"
          layerTypeName="WARS"
          layerColor= {getLayerColor("WARS")}
          showLayer={showEvents}
          setShowLayer={setShowEvents}
        />

        <LayerHistogram
          setSelectedYear={setSelectedYear}
          windowRange={windowRange}
          aliveCounts={militaryEventCounts}
          binAggregation="sum"
          layerTypeName="DISASTERS"
          layerColor= {getLayerColor("DISASTERS")}
          showLayer={showDisasters}
          setShowLayer={setShowDisasters}
        />

        <BarTimeline
          windowRange={windowRange}
          layerTypeName="MOVEMENTS"
          layerColor= {getLayerColor("MOVEMENTS")}
          objectColor = {getColorForLabelString}
          currentData={movements.filter(m => m.start_date && m.end_date)}
          setSelectedData={setSelectedObject}
        />

        {!selectedHuman && (

          <TimeWindowSlider
            fullRange={activeFullRange}
            windowRange={windowRange}
            setWindowRange={setWindowRange}
            setSelectedYear={setSelectedYear}
            selectedYear={selectedYear}
            
          />
          
        )}

        </div>
      </div>
  </div>
  );
};

export default BottomTimelineSection;