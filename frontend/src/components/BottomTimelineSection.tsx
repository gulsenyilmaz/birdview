import TimeSlider from "./timeline/TimeSlider";
import TimeWindowSlider from "./timeline/TimeWindowSlider";
import LayerHistogram from "./timeline/LayerHistogram";
import RelationTimeline from "./timeline/RelationTimeline";
import MovementTimeline from "./timeline/MovementTimeline";

import Timeline from "./timeline/Timeline";
import WorkList from "./timeline/WorkList";

import type { SelectedObject } from "../hooks/useAppSelection";
import type { Work } from "../entities/Work";
import type { Movement } from "../entities/Movement";
import type { Human } from "../entities/Human";
import type { RelatedHuman } from "../entities/RelatedHuman";
import type { Location } from "../entities/Location";
import YearLine from "./timeline/YearLine";



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
  movements: Movement[];
  setSelectedObject: React.Dispatch<React.SetStateAction<SelectedObject>>;
  setManualMode: React.Dispatch<React.SetStateAction<boolean>>;

  selectedHuman: Human | null;

  showWorks: boolean;
  setShowWorks: React.Dispatch<React.SetStateAction<boolean>>;
  showHumans: boolean;
  setShowHumans: React.Dispatch<React.SetStateAction<boolean>>;
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
  humanRelations,
  humanLocations,
  windowRange,
  setWindowRange,
  // detailMode,
  movements,
  setSelectedObject,
  setManualMode,
  selectedHuman,
  showWorks,
  setShowWorks,
  showHumans,
  setShowHumans,
  showEvents,
  setShowEvents,
  showDisasters,
  setShowDisasters,
  workCounts,
  humanAliveCounts,
  militaryEventCounts,
}) => {
  return (
    <div className="bottom-panel-slot" >
      <div className={`bottom-worklist-panel ${selectedHuman && showWorks ? "open" : "hide"}`}>
          {selectedHuman && (
            <Timeline selectedYear={selectedYear} windowRange={windowRange}>
              <WorkList filteredWorks={filteredWorks} />
            </Timeline>
          )}
      </div>
      <div className="bottom-panel">
        <div className="component-container">

          <YearLine selectedYear={selectedYear} windowRange={windowRange} />
        
          {selectedHuman && (
            <>
              {workCounts.length > 0 && (
                <LayerHistogram
                  setSelectedYear={setSelectedYear}
                  windowRange={windowRange}
                  aliveCounts={workCounts}
                  binAggregation="sum"
                  layerTypeName="WORKS"
                  showLayer={showWorks}
                  setShowLayer={setShowWorks}
                />
              )}
            

              <RelationTimeline
                windowRange={windowRange}
                layerTypeName="RElATIONS"
                currentRelations={humanRelations.length > 0 ? humanRelations : humanLocations}
                // humanRelations={humanRelations}
                // humanLocations={humanLocations}
                showLayer={showHumans}
                setShowLayer={setShowHumans}
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
        />

        {!selectedHuman && (
            <LayerHistogram
              setSelectedYear={setSelectedYear}
              windowRange={windowRange}
              aliveCounts={humanAliveCounts}
              binAggregation="sum"
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
          showLayer={showEvents}
          setShowLayer={setShowEvents}
        />

        <LayerHistogram
          setSelectedYear={setSelectedYear}
          windowRange={windowRange}
          aliveCounts={militaryEventCounts}
          binAggregation="sum"
          layerTypeName="DISASTERS"
          showLayer={showDisasters}
          setShowLayer={setShowDisasters}
        />

         <MovementTimeline
              windowRange={windowRange}
              movements={movements}
              setSelectedMovement={setSelectedObject}
              layerTypeName="MOVEMENTS"
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