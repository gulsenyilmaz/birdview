import TimelineCanvas from "./timeline/TimelineCanvas";

import React, { useMemo, useState } from "react";

import TimeWindowSlider from "./timeline/TimeWindowSlider";
// import LayerHistogram from "./timeline/LayerHistogram";
// import BarTimeline from "./timeline/BarTimeline";

import Timeline from "./timeline/Timeline";
import WorkList from "./timeline/WorkList";
import HumanList from "./timeline/HumanList";

import type { SelectedObject } from "../hooks/useAppSelection";
import type { Work } from "../entities/Work";
import type { Movement } from "../entities/Movement";
import type { Human } from "../entities/Human";
import type { RelatedHuman } from "../entities/RelatedHuman";
import type { Location } from "../entities/Location";
// import YearLine from "./timeline/YearLine";
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
  const [showMovements, setShowMovements] = useState(false);
  const layers = useMemo(() => {
    const result: any[] = [];

    if (selectedHuman) {
      if (workCounts.length > 0) {
        result.push({
          id: "works",
          type: "histogram",
          label: "WORKS",
          color: getLayerColor("WORKS"),
          show: showWorks,
          setShow: setShowWorks,
          counts: workCounts,
          binAggregation: "sum",
        });
      }
      result.push({
        id: "relations",
        type: "bar",
        label: "RELATIONS",
        color: getLayerColor("RELATIONS"),
        show: showHumans,
        setShow: setShowHumans,
        objectColor: getColorForRelationTypeString,
        data: humanRelations.length > 0 ? humanRelations : humanLocations,
        onSelect: setSelectedObject,
      });
    }

    if (!selectedHuman) {
      result.push({
        id: "humans",
        type: "histogram",
        label: "HUMANS",
        color: getLayerColor("HUMANS"),
        show: showHumans,
        setShow: setShowHumans,
        counts: humanAliveCounts,
        binAggregation: "sum",
      });
    }

    result.push({
      id: "wars",
      type: "histogram",
      label: "WARS",
      color: getLayerColor("WARS"),
      show: showEvents,
      setShow: setShowEvents,
      counts: militaryEventCounts,
      binAggregation: "sum",
    });

    result.push({
      id: "disasters",
      type: "histogram",
      label: "DISASTERS",
      color: getLayerColor("DISASTERS"),
      show: showDisasters,
      setShow: setShowDisasters,
      counts: militaryEventCounts,
      binAggregation: "sum",
    });

    result.push({
      id: "movements",
      type: "bar",
      label: "MOVEMENTS",
      color: getLayerColor("MOVEMENTS"),
      show: showMovements,
      setShow: setShowMovements,
      objectColor: getColorForLabelString,
      data: movements.filter(m => m.start_date && m.end_date),
      onSelect: setSelectedObject,
    });

    return result;
  }, [
    selectedHuman, workCounts, humanAliveCounts, militaryEventCounts,
    movements, humanRelations, humanLocations,
    showWorks, showHumans, showEvents, showDisasters,showMovements,
  ]);

  return (
    <div className="bottom-panel-slot">
      <div className={`bottom-worklist-panel ${
        (selectedHuman && showWorks) ||
        (selectedMilitaryEvent && showEventDetails) ||
        selectedLocation ? "open" : "hide"
      }`}>
        <Timeline selectedYear={selectedYear} windowRange={windowRange}>
          {selectedHuman && <WorkList filteredWorks={filteredWorks} />}
          {selectedMilitaryEvent && (
            <MilitaryEventDetail
              selectedYear={selectedYear}
              militaryEvents={filteredMilitaryEvents}
              setSelectedObject={setSelectedObject}
              setShowEventDetails={setShowEventDetails}
            />
          )}
          {selectedLocation && (
            <HumanList humans={filteredHumans} setSelectedObject={setSelectedObject} />
          )}
        </Timeline>
      </div>

      <div className="bottom-panel">
        <div className="component-container">
          <TimelineCanvas
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            fullRange={activeFullRange}
            windowRange={windowRange}
            setWindowRange={setWindowRange}
            setManualMode={setManualMode}
            layers={layers}
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