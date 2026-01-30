import './MapScene.css';
import React, { useEffect, useState, useMemo } from "react";
import { FlyToInterpolator } from '@deck.gl/core';
import type {Color} from '@deck.gl/core';
import { DeckGL } from "@deck.gl/react";
import maplibregl from 'maplibre-gl';
import { Map } from 'react-map-gl/maplibre'; 
import {MapView} from '@deck.gl/core';
import {scaleLog,scaleLinear,scaleSqrt} from 'd3-scale';

import { ScatterplotLayer } from "@deck.gl/layers";
import { IconLayer } from "@deck.gl/layers";
import { ArcLayer } from "@deck.gl/layers";
import { TextLayer } from '@deck.gl/layers';
import { CollisionFilterExtension } from '@deck.gl/extensions';
import type {CollisionFilterExtensionProps} from '@deck.gl/extensions';
import type { Location } from "../entities/Location";
import type { Human } from "../entities/Human";
// import type { Work } from "../entities/Work";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import type { HumanEnriched } from "../entities/HumanEnriched";
//import type { Layer } from "../layers/Layer";
import { getColorForGender, getColorForAge, getColorForLabel, getColorForRelationType } from "../utils/colorUtils";
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

const ICON_MISSING = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iLTQtNCA4IDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSByPSI0IiBmaWxsPSIjY2NjIi8+PHRleHQgeT0iLjUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNmZmYiPj88L3RleHQ+PC9zdmc+';
const ICON_SIZE = 50;


// const grayColorScale = scaleLog<Color>()
//   .domain([1, 426])
//   .range([
//     [80, 80, 80, 150],  // Açık gri (az tanınan)
//     [40, 40, 40, 255]      // Koyu gri (tanınmış)
//   ]).clamp(true);  


// const ageColorScale = scaleLog<Color>()
//   .domain([1, 80])
//   .range([
//     [5, 5, 5, 150],
//     [70, 70, 70,10]
//   ]).clamp(true); 

const fillColorScale = scaleLog<Color>()    
  .domain([1, 80, 100])
  .range([  

    [255, 200, 200, 100],
    [255, 100, 100, 50],
    [160, 180, 180, 15] 
  ]).clamp(true);

const colorScale = scaleLog<Color>()
  .domain([1, 80, 100])
  .range([
    [255,  30,  30, 250], 
    [255,  60, 100, 150],
    [150, 150, 150, 0]
  ]).clamp(true); 

// 1 yıl → küçük, 200 yıl → büyük
const radiusByDuration = scaleSqrt<number, number>()
  .domain([1, 25])          // min–max duration (yıl)
  .range([10000, 400000])    // metre cinsinden base radius
  .clamp(true);

// zaman içindeki ilerlemeye göre çarpan
// 0   → start_date
// 1   → end_date
// 1.25 → end_date + duration*0.25
const timeFactorScale = scaleLinear<number, number>()
  .domain([0, 1, 1.25])
  .range([1, 0.5, 0.5])      // başta 1, bitişte 0.5, sonra sabit
  .clamp(true);


const getDuration = (d: MilitaryEvent) => { 
  let duration = d.end_date - d.start_date;
  if (!isFinite(duration) || duration <= 0) {
    duration = 8; // güvenlik için
  }
  return duration;
};

const getRawProgressForEvent = (start:number,duration:number, selectedYear: number) => {  

  const rawProgress = (selectedYear - start) / duration;
  return Math.min(rawProgress, 1);
};


const getRadiusForEvent = (d: MilitaryEvent, selectedYear: number, zoom: number) => {

  const duration = getDuration(d);

  const progress = getRawProgressForEvent(d.start_date, duration, selectedYear);
  const baseRadius = radiusByDuration(duration);   // sadece süreden
  const timeFactor = timeFactorScale(progress);    // zaman içindeki konum

  const radius = (baseRadius * timeFactor) / zoom; // zoom’a göre ayarla

  return radius;
};



interface MapSceneProps {

  locations:Location[];
  humans:Human[];
  militaryEvents:MilitaryEvent[];
  // works:Work[];
  selectedYear:number;
  setSelectedObject: (obj: any) => void;
  colorFilterType:string;
  detailMode:Boolean;
  selectedObjectThumbnail:string | null;


}

const MapScene: React.FC<MapSceneProps> = ({
                                              locations,
                                              humans,
                                              militaryEvents,
                                              // works,
                                              selectedYear,
                                              setSelectedObject,
                                              colorFilterType,
                                              detailMode,
                                              selectedObjectThumbnail
                                            }) => {

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE); 
  const [processedHumans, setProcessedHumans] = useState<HumanEnriched[]>([]);
  // const [layers, setLayers] = useState<any[]>([]); 
  const [selectedLayerType, setSelectedLayerType] = useState<'arc' | 'text'>('text');
  const [showEvents, setShowEvents] = useState(false);
  const [showHumans, setShowHumans] = useState(true);
  const [manuelMode, setManuelMode] = useState(false)

 

  useEffect(() => {
    if(showHumans){
      const enrichedHumans: HumanEnriched[] = humans.map((h) => {
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
    // if (manuelMode) return;
    
    const combinedLocations:any[] = [];
    

    if(showHumans){
      combinedLocations.push(...humans.map(h => ({ lon: h.lon, lat: h.lat })));
      combinedLocations.push(...locations.map(l => ({ lon: l.loc_lon, lat: l.loc_lat })));
    }

    if (showEvents){
      combinedLocations.push(...militaryEvents.map(me =>({ lon: me.lon, lat: me.lat })));
    }

    const { centerLon, centerLat, zoom } = computeBounds(combinedLocations, detailMode);

    // const zoomME = showEvents && militaryEvents.length > 0? Math.min(...militaryEvents.map(me => me.depth_level)): zoom;

    setViewState((prev) => ({
      ...prev,
      longitude: centerLon,
      latitude: centerLat,
      zoom: zoom+0.2,
      transitionInterpolator: new FlyToInterpolator({ speed: 2 }),
      transitionDuration: 'auto',
    }));

  }, [humans, locations, militaryEvents, detailMode, showHumans, showEvents, manuelMode]);


const layers = useMemo(() => {

  const layersArray:any[] = [];
  const fontSize = 32;
  const scale = 2 ** viewState.zoom;
  const sizeMaxPixels = (scale / 3) * fontSize;
  const sizeMinPixels = Math.min(scale / 1000, 0.5) * fontSize;

  // console.log("sizeMaxPixels:", sizeMaxPixels, "sizeMinPixels:", sizeMinPixels);

  const SCATTER_FACTOR = 0.04 * 111320;
 

   
  if (showEvents) {

    const militaryEventLayer = new ScatterplotLayer<MilitaryEvent>({
      id: "military_events-layer0",
      data:militaryEvents.filter(me => me.descendant_count==0),
      stroked: true,
      getPosition: d => [d.lon ,d.lat],
      // getRadius: d => (d.end_date+3 >= selectedYear)?(50000/viewState.zoom)*(4-selectedYear+d.end_date):(150000/viewState.zoom)* (0.5),
      getRadius: d => getRadiusForEvent(d, selectedYear, viewState.zoom),

      getFillColor: (d) => fillColorScale(100*(1+selectedYear-d.start_date)/((1+d.end_date-d.start_date)*1.25)),
      getLineColor: (d) => colorScale(100*(1+selectedYear-d.start_date)/((1+d.end_date-d.start_date)*1.25)),
      lineWidthMinPixels: 2,
      pickable: true,
      radiusUnits: "meters",
    });
    layersArray.push(militaryEventLayer);

    const militaryEventTextLayer = new TextLayer<MilitaryEvent, CollisionFilterExtensionProps<MilitaryEvent>>(
      {
        id: "military_events-layer1",
        data: militaryEvents.filter(me => me.depth_level <= Math.floor(viewState.zoom)  && (!me.end_date || me.end_date >= selectedYear)),
        characterSet: 'auto',
        fontSettings: { buffer: 8, sdf: true },

        getText: d =>   d.name.toLocaleUpperCase(),
        getPosition: d => [d.lon, d.lat],
        getColor: [80, 80, 50, 250],
        getSize: d => Math.log2(d.descendant_count + 32) / 10,
        sizeScale: fontSize,
        sizeMinPixels,
        sizeMaxPixels,
        maxWidth: 64 * 12,
        background: true,
        getBackgroundColor: [255, 255, 255, 0],
        pickable: true,
        collisionEnabled: true,
        getCollisionPriority: d =>  Math.log2(d.descendant_count + 1),
          collisionTestProps: {
            sizeScale: fontSize * 2,
            sizeMaxPixels: sizeMaxPixels * 2,
            sizeMinPixels: sizeMinPixels * 2
        },
        getTextAnchor: 'middle',        
        getAlignmentBaseline: 'center',
        extensions: [new CollisionFilterExtension()]
      }
    );
    layersArray.push(militaryEventTextLayer);
  
  }

  const locationLayer = new ScatterplotLayer({
    id: "locations-layer",
    data: locations,
    getPosition: (d) => [d.loc_lon, d.loc_lat],
    getRadius: 200000 / Math.pow(viewState.zoom, 2),
    getFillColor: d => getColorForRelationType(d.relationship_type_name),
    pickable: true,
    radiusUnits: "meters",
  });
  layersArray.push(locationLayer);

  

  // const workLayer = new ScatterplotLayer({
  //   id: "works-layer",
  //   data: works,
  //   getPosition: (d) => [d.lon, d.lat],
  //   getRadius: 200000,
  //   getFillColor: [0, 0, 0],
  //   pickable: true,
  //   radiusUnits: "meters",
  // });
  // layersArray.push(workLayer);


  if (showHumans) {

    if(selectedObjectThumbnail){

      const filteredL = locations.filter(l =>
        l.start_date <= selectedYear &&
        (!l.end_date || l.end_date > selectedYear || (l.start_date == l.end_date && l.start_date == selectedYear )) &&
        (selectedYear-l.start_date)<100
      );
      
      const thumbnailLayer = new IconLayer({
        id: 'nodes',
        data: filteredL,
        getPosition: (d) => [d.loc_lon, d.loc_lat],
        getIcon: () => ({
          url: selectedObjectThumbnail || ICON_MISSING,
          width: ICON_SIZE,
          height: ICON_SIZE,
          anchorX: ICON_SIZE / 2, 
          anchorY: ICON_SIZE 
        }),
        loadOptions: { image: { crossOrigin: "anonymous" } },
        getSize: 10,
        sizeScale: viewState.zoom,
        pickable: true
      });

      layersArray.push(thumbnailLayer);
    }
    else{
      
        if (selectedLayerType === 'arc') {

          const humanArcLayer = new ArcLayer({
            id: 'humans-layer',
            data: processedHumans,
            getSourcePosition: (d) => [d.lon, d.lat],
            getTargetPosition: (d) => [d.lonOffsetTarget, d.latOffsetTarget],
            getSourceColor: d => d.fillColor,
            getTargetColor: d => d.fillTColor,
            getWidth: 5,
            pickable: true
          });

          layersArray.push(humanArcLayer);

        } 
        else if (selectedLayerType === 'text') {

          
          const data = processedHumans
          const lineLayer = new ScatterplotLayer<HumanEnriched>({
            id: 'ScatterplotLayer-for-lines',
            data:processedHumans,
            stroked: true,
            getPosition: (d) => [d.lon, d.lat],
            getRadius: (d) => (SCATTER_FACTOR/Math.log2(viewState.zoom)) * (d.age),
            getFillColor: [0, 0, 0,0],
            getLineColor: (d) => d.fillColor,
            lineWidthMinPixels: 0.1,
            pickable: true,
            radiusUnits: "meters"
          
          });
          layersArray.push(lineLayer);

          const humanTextLayer = new TextLayer<HumanEnriched, CollisionFilterExtensionProps<HumanEnriched>>(
            {
              id: 'humans-text-layer',
              data,
              characterSet: 'auto',
              fontSettings: { buffer: 8, sdf: true },

              getText: d => (d.awarded?"✨":" ")+d.name+" ",//+" ("+d.age +")",
              getPosition: d => [d.lonOffsetSource, d.latOffsetSource],
              // getColor: d =>  grayColorScale((d.num_of_identifiers ?? 0) + 1), 
              getSize: d => Math.pow((d.num_of_identifiers+10)*30*d.age, 0.25) / 40,
              sizeScale: fontSize,
              sizeMinPixels,
              sizeMaxPixels,
              maxWidth: 64 * 12,
              background: true,
              getBackgroundColor: [255, 255, 255, 250],
              pickable: true,
              collisionEnabled: true,
              getCollisionPriority: d =>  Math.log2(d.num_of_identifiers + 20),
              collisionTestProps: {
                sizeScale: fontSize * 2,
                sizeMaxPixels: sizeMaxPixels * 2,
                sizeMinPixels: sizeMinPixels * 2
              },
              getTextAnchor: 'middle',        
              getAlignmentBaseline: 'center',
              extensions: [new CollisionFilterExtension()]
        
            }
          );
          layersArray.push(humanTextLayer);
      }
    }

  }

  return layersArray;

}, [locations, processedHumans, viewState.zoom, selectedLayerType, selectedObjectThumbnail, showEvents, showHumans, militaryEvents]);

  return (
    <div>
      <div>
        <DeckGL
          views={new MapView({repeat: false})}
          layers={layers}
          initialViewState={viewState}
          onViewStateChange={( obj :any) => {
            
             setViewState({
                latitude: obj.viewState.latitude,
                longitude: obj.viewState.longitude,
                zoom: obj.viewState.zoom,
                pitch: obj.viewState.pitch,
                bearing: obj.viewState.bearing,
              });

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
                  console.log("Clicked object:", object);
                  setManuelMode(true);
                  setSelectedObject(object);
                }
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
         <div className="radio-group">
          <label>
            <input
              type="radio"
              value="arc"
              checked={selectedLayerType === 'arc'}
              onChange={() => setSelectedLayerType('arc')}
            />
            Arc Layer
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
        </div>
        <hr className="divider" />
        <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={showEvents}
                onChange={(e) => setShowEvents(e.target.checked)}
              />
              WARS
            </label>
            <label>
              <input
                type="checkbox"
                checked={showHumans}
                onChange={(e) => setShowHumans(e.target.checked)}
              />
              HUMANS
            </label>
        </div>
      </div>
      
    </div>
  );
};

export default MapScene;
