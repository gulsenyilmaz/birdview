import React, {   useLayoutEffect,
  useMemo,
  useRef,
  useState, } from "react";

import type { LayerConfig } from "./timeline/timelineTypes";

import TimelineCanvas from "./timeline/canvas/TimelineCanvas";
import LayerPicker from "./timeline/picker/LayerPicker";

import ContentTrack from "./timeline/content/ContentTrack";
import WorkList from "./timeline/content/types/WorkList";
import HumanList from "./timeline/content/types/HumanList";

import type { SelectedObject } from "../hooks/useAppSelection";
import type { Work } from "../entities/Work";
import type { Movement } from "../entities/Movement";
import type { Human } from "../entities/Human";
import type { RelatedHuman } from "../entities/RelatedHuman";
import type { Location } from "../entities/Location";
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
  humanSelectedDetail:string | null;
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
  selectedObject: SelectedObject;
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
  // showDisasters: boolean;
  // setShowDisasters: React.Dispatch<React.SetStateAction<boolean>>;

  workCounts: CountItem[];
  humanAliveCounts: CountItem[];
  militaryEventCounts: CountItem[];
}

const BottomTimelineSection: React.FC<BottomTimelineSectionProps> = ({
  selectedYear,
  setSelectedYear,
  activeFullRange,
  windowRange,
  setWindowRange,
  filteredWorks,
  filteredMilitaryEvents,
  filteredHumans,
  humanRelations,
  humanLocations,
  humanSelectedDetail,
  // detailMode,
  movements,
  selectedObject,
  setSelectedObject,
  // setManualMode,
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
  // showDisasters,
  // setShowDisasters,
  workCounts,
  humanAliveCounts,
  militaryEventCounts,
}) => {
  const [showMovements, setShowMovements] = useState(false);
  const bottomPanelRef = useRef<HTMLDivElement>(null);

useLayoutEffect(() => {
  const panel = bottomPanelRef.current;
  const scrollArea =
    panel?.querySelector<HTMLDivElement>(".timeline-layers-scroll");

  if (!panel || !scrollArea) return;

  const updateScrollbarWidth = () => {
    const style = getComputedStyle(scrollArea);

    const borderWidth =
      (parseFloat(style.borderLeftWidth) || 0) +
      (parseFloat(style.borderRightWidth) || 0);

    const scrollbarWidth = Math.max(
      0,
      scrollArea.offsetWidth -
        scrollArea.clientWidth -
        borderWidth
    );

    panel.style.setProperty(
      "--timeline-scrollbar-width",
      `${scrollbarWidth}px`
    );
  };

  updateScrollbarWidth();

  const observer = new ResizeObserver(updateScrollbarWidth);
  observer.observe(scrollArea);

  return () => observer.disconnect();
}, []);

  const layers = useMemo<LayerConfig[]>(() => {
     const result: LayerConfig[] = [];

    if (selectedHuman) {
      if (workCounts.length > 0) {
        result.push({
          id: "works",
          type: "histogram",
          scope: "detail",
          label: "WORKS",
          color: getLayerColor("WORKS"),
          show: showWorks,
          setShow: setShowWorks,
          counts: workCounts,
          binAggregation: "sum",
        });
      }
      if (humanSelectedDetail !== null) {
        result.push({
          id: "relations",
          type: "bar",
          scope: "detail",
          label: humanSelectedDetail,
          color: getLayerColor("RELATIONS"),
          show: showHumans,
          setShow: setShowHumans,
          objectColor: getColorForRelationTypeString,
          data:
            humanSelectedDetail === "CV"
              ? humanLocations
              : humanRelations,
          onSelect: setSelectedObject,
        });
      }
    }

    if (!selectedHuman) {
      result.push({
        id: "humans",
        type: "histogram",
        scope: "general",
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
      scope: "general",
      label: "WARS",
      color: getLayerColor("WARS"),
      show: showEvents,
      setShow: setShowEvents,
      counts: militaryEventCounts,
      binAggregation: "sum",
    });

    // result.push({
    //   id: "disasters",
    //   type: "histogram",
    //   scope: "general",
    //   label: "DISASTERS",
    //   color: getLayerColor("DISASTERS"),
    //   show: showDisasters,
    //   setShow: setShowDisasters,
    //   counts: militaryEventCounts,
    //   binAggregation: "sum",
    // });

    // result.push({
    //   id: "landmarks",
    //   type: "histogram",
    //   scope: "general",
    //   label: "LANDMARKS",
    //   color: getLayerColor("LANDMARKS"),
    //   show: showDisasters,
    //   setShow: setShowDisasters,
    //   counts: militaryEventCounts,
    //   binAggregation: "sum",
    // });

    // result.push({
    //   id: "cities",
    //   type: "histogram",
    //   scope: "general",
    //   label: "CITIES",
    //   color: getLayerColor("CITIES"),
    //   show: showDisasters,
    //   setShow: setShowDisasters,
    //   counts: militaryEventCounts,
    //   binAggregation: "sum",
    // });

    result.push({
      id: "movements",
      type: "bar",
      scope: "general",
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
    showWorks, showHumans, showEvents,showMovements,humanSelectedDetail
  ]);

  return (
   

    <div className={`bottom-panel-slot ${
            selectedObject ?"squeezed" : ""
        }`}
        >
          
      <div className={`bottom-worklist-panel ${
        (selectedHuman && showWorks) ||
        (selectedMilitaryEvent && showEventDetails) ||
        selectedLocation ? "open" : "hide"
      }`}>
        <ContentTrack selectedYear={selectedYear} windowRange={windowRange}>
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
        </ContentTrack>
      </div>

      <div className="bottom-panel" ref={bottomPanelRef}>
          <LayerPicker
            layers={layers}
          />
        
          <TimelineCanvas
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            fullRange={activeFullRange}
            windowRange={windowRange}
            setWindowRange={setWindowRange}
            // setManualMode={setManualMode}
            layers={layers}
          />
      </div>
    </div>
  );
};

export default BottomTimelineSection;