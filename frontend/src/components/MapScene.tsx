import './MapScene.css';
import React, { useEffect, useState, useMemo } from "react";
import { FlyToInterpolator } from '@deck.gl/core';

import { DeckGL } from "@deck.gl/react";
import maplibregl from 'maplibre-gl';
import { Map } from 'react-map-gl/maplibre'; 
import {MapView} from '@deck.gl/core';

import type { Location } from "../entities/Location";
import type { Human } from "../entities/Human";
import type { HumanRelative } from "../entities/HumanRelative";
import type { HumanEnriched } from "../entities/HumanEnriched";
import type { HumanRelativeEnriched } from "../entities/HumanRelativeEnriched";

import type { Work } from "../entities/Work";
import type { MilitaryEvent } from "../entities/MilitaryEvent";

import { isHuman } from "../utils/typeGuards";

import { createMilitaryEventLayers } from "../layers/militaryEventLayers";
import { createHumanLayers } from "../layers/humanLayers";
import { createWorkLayers } from "../layers/workLayers";
import { createSelectedHumanLayers } from "../layers/selectedHumanLayers"



import { getColorForGender, getColorForAge, getColorForLabel } from "../utils/colorUtils";
import { computeBounds, offsetFibonacciPosition } from "../utils/locationUtils"




type ViewStateType = {
  latitude: number;
  longitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

const INITIAL_VIEW_STATE: ViewStateType = {
  latitude: 20,
  longitude: 0,
  zoom: 1.5,
  pitch: 0,
  bearing: 0,
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

interface MapSceneProps {

  humanLocations:Location[];
  humans:Human[];
  humanRelatives:HumanRelative[];
  militaryEvents:MilitaryEvent[];
  works:Work[];
  selectedYear:number;
  setSelectedObject: (obj: any) => void;
  selectedObject:any;
  
  detailMode:Boolean;
  showEvents: boolean;
  showHumans: boolean;
  showWorks:boolean;
  manuelMode:boolean;
  setManuelMode:(obj: boolean) => void
}

const MapScene: React.FC<MapSceneProps> = ({
                                              humanLocations,
                                              humans,
                                              humanRelatives,
                                              militaryEvents,
                                              works,
                                              selectedYear,
                                              setSelectedObject,
                                              selectedObject,
                                              detailMode,
                                              showEvents,
                                              showHumans,
                                              showWorks,
                                              manuelMode,
                                              setManuelMode
                                            }) => {

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE); 
  const [processedHumans, setProcessedHumans] = useState<HumanEnriched[]>([]);
  const [processedHumanRelatives, setProcessedHumanRelatives] = useState<HumanRelativeEnriched[]>([]);
  
 
  const [selectedLayerType, setSelectedLayerType] = useState<'arc' | 'text' | 'circle'>('text');
  const [colorFilterType, setColorFilterType] = useState<"gender" | "age" | "nationality">("age");


  useEffect(() => {
    if(showHumans){
      const enrichedHumans: HumanEnriched[] = humans.filter(h => h.birth_date<1700 || h.num_of_identifiers>10).map((h) => {
          const age = selectedYear - h.birth_date;
          
          let fillColor: [number, number, number, number];
          let fillTColor: [number, number, number, number];
          let [lonOffsetSource, latOffsetSource] = offsetFibonacciPosition(h.lon, h.lat, age, viewState.zoom, h.city_index || 0);
          let lonOffsetTarget = lonOffsetSource + Math.random()*10;
          let latOffsetTarget = latOffsetSource + Math.random()*10;
          
          switch (colorFilterType) {
            case "gender":
              fillColor = getColorForGender(h.gender, 250);
              fillTColor = getColorForGender(h.gender, 0);
              break;
            case "nationality":
              fillColor = getColorForLabel(h.nationality || "", 200);
              fillTColor = getColorForLabel(h.nationality || "", 0);
              break;
            case "age":
            default:
              fillColor = getColorForAge(age, 200);
              fillTColor = getColorForAge(age, 0);
              break;
          }

          return {
            ...h,
            age,
            fillColor,
            fillTColor,
            lonOffsetSource,
            latOffsetSource,
            lonOffsetTarget,
            latOffsetTarget
          };
        });

        setProcessedHumans(enrichedHumans);
      }

  }, [showHumans, humans, selectedYear, colorFilterType, viewState.zoom]);

  useEffect(() => {
    if(isHuman(selectedObject)){
      const enrichedHumanRelatives: HumanRelativeEnriched[] = humanRelatives.filter(h => h.birth_date<selectedYear ).map((h) => {
          const age = (h.death_date && (selectedYear>h.death_date)?h.death_date:selectedYear) - h.birth_date;
          
          let [lonOffsetSource, latOffsetSource] = offsetFibonacciPosition(h.lon, h.lat, age*2, viewState.zoom, h.index*15 || 0);
          
          return {
            ...h,
            age,
            lonOffsetSource,
            latOffsetSource
          };
        });

        setProcessedHumanRelatives(enrichedHumanRelatives);
      }

  }, [selectedObject, humanRelatives, selectedYear, viewState.zoom]);

  useEffect(() => {
    if (manuelMode) return;
    
    const combinedLocations:any[] = [];
    

    if(showHumans){
      combinedLocations.push(...humans.map(h => ({ lon: h.lon, lat: h.lat })));
    }

    if(isHuman(selectedObject)){
      combinedLocations.push(...humanRelatives.map(l => ({ lon: l.lon, lat: l.lat })));
      combinedLocations.push(...humanLocations.map(l => ({ lon: l.loc_lon, lat: l.loc_lat })));
    }

    if (showEvents){
      combinedLocations.push(...militaryEvents.map(me =>({ lon: me.lon, lat: me.lat })));
    }

    const { centerLon, centerLat, zoom } = computeBounds(combinedLocations, detailMode);

    setViewState((prev) => ({
      ...prev,
      longitude: centerLon,
      latitude: centerLat,
      zoom: zoom,
      transitionInterpolator: new FlyToInterpolator({ speed: 2 }),
      transitionDuration: 'auto',
    }));

  }, [humans, humanLocations, militaryEvents, detailMode, showHumans, showEvents, manuelMode]);


const layers = useMemo(() => {

  const layersArray:any[] = [];
  const fontSize = 32;
  const scale = 2 ** viewState.zoom;
  const sizeMaxPixels = (scale / 3) * fontSize;
  const sizeMinPixels = Math.min(scale / 1000, 0.5) * fontSize;
   
  if (showEvents) {
    layersArray.push(
      ...createMilitaryEventLayers({
        militaryEvents,
        selectedYear,
        zoom: viewState.zoom,
        fontSize,
        sizeMinPixels,
        sizeMaxPixels
      })
    );
  }

  if (showWorks) {
    layersArray.push(...createWorkLayers(works));
  }

  if (showHumans) {
    layersArray.push(
      ...createHumanLayers({
        processedHumans,
        selectedLayerType,
        zoom: viewState.zoom,
        fontSize,
        sizeMinPixels,
        sizeMaxPixels
      })
    );
  }

  if(isHuman(selectedObject)){

    layersArray.push(
      ...createSelectedHumanLayers({
        processedHumanRelatives,
        humanLocations,
        selectedYear,
        // selectedObject,
        fontSize,
        sizeMinPixels,
        sizeMaxPixels
      })
    );
  }

  return layersArray;

}, [selectedObject, showEvents, showHumans, showWorks, humanLocations, processedHumanRelatives, processedHumans, viewState.zoom, selectedLayerType,  militaryEvents]);

  return (
    <div>
      <div>
        <DeckGL
          views={new MapView({repeat: false})}
          layers={layers}
          viewState={viewState}
          onViewStateChange={( obj :any) => {
            
             setViewState(
              obj.viewState
            );

          }}
          
          controller={true}
          
          getTooltip={({ object }) =>
                    object ? {
                      text: `${object.tooltip_text? object.tooltip_text :object.name?object.name:object.title }`,
                      style: { fontSize: "14px", color: "white" }
                    } : null
                  }
                  
          
          onClick={({ object }) => {
                if (object) {
                 
                  // setManuelMode(true);
                  setSelectedObject(object);
                }
            }}
          onDragStart={({ object }) => {
                
                  console.log("onDragStart object:",object);
                  setManuelMode(true);
                
            }}
          

          >
          <Map
            reuseMaps
            id="map"
            mapLib={maplibregl}
            mapStyle={MAP_STYLE}
          />
         
        </DeckGL>
        
      </div>
       <div className="layer-selector">
            <label>
              <span className="label-title">Manuel Mode    </span>
              <input
                  type="checkbox"
                  checked={manuelMode}
                  onChange={(e) => setManuelMode(e.target.checked)}
                />
            
            </label>
      </div>  
      {(showHumans && !detailMode) && (
          <div className="layer-selector">
            {/* <label>
              <span className="label-title">Manuel Mode    </span>
              <input
                  type="checkbox"
                  checked={manuelMode}
                  onChange={(e) => setManuelMode(e.target.checked)}
                />
            
            </label> */}
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="arc"
                  checked={selectedLayerType === "arc"}
                  onChange={() => setSelectedLayerType("arc")}
                />
                Arc
              </label>

              <label>
                <input
                  type="radio"
                  value="text"
                  checked={selectedLayerType === 'text'}
                  onChange={() => setSelectedLayerType('text')}
                />
                Text Layer
              </label>

              <label>
                <input
                  type="radio"
                  value="text"
                  checked={selectedLayerType === 'circle'}
                  onChange={() => setSelectedLayerType('circle')}
                />
                Circle Layer
              </label>
            </div>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="age"
                  checked={colorFilterType === "age"}
                  onChange={() => setColorFilterType("age")}
                />
                Age
              </label>

              <label>
                <input
                  type="radio"
                  value="gender"
                  checked={colorFilterType === "gender"}
                  onChange={() => setColorFilterType("gender")}
                />
                Gender
              </label>
              <label>
                <input
                  type="radio"
                  value="nationality"
                  checked={colorFilterType === "nationality"}
                  onChange={() => setColorFilterType("nationality")}
                />
                Nationality
              </label>
              {/* <hr className="divider" /> */}
            </div>
        </div>
      )}
  </div>
  );
};

export default MapScene;
