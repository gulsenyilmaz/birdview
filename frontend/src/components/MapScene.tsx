import './MapScene.css';
import React, { useEffect, useState } from "react";
import { FlyToInterpolator } from '@deck.gl/core';
import type {Color} from '@deck.gl/core';
import { DeckGL } from "@deck.gl/react";
import maplibregl from 'maplibre-gl';
import { Map } from 'react-map-gl/maplibre'; 
import {MapView} from '@deck.gl/core';
import {scaleLog} from 'd3-scale';

import { ScatterplotLayer, IconLayer } from "@deck.gl/layers";
import { ArcLayer } from "@deck.gl/layers";
import { TextLayer } from '@deck.gl/layers';
import { CollisionFilterExtension } from '@deck.gl/extensions';
import type {CollisionFilterExtensionProps} from '@deck.gl/extensions';
import type { Location } from "../entities/Location";
import type { Human } from "../entities/Human";
import type { Event } from "../entities/Event";
import type { HumanEnriched } from "../entities/HumanEnriched";
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
const ICON_SIZE = 200;


const grayColorScale = scaleLog<Color>()
  .domain([1, 426])
  .range([
    [160, 160, 160],  // Açık gri (az tanınan)
    [30, 30, 30]      // Koyu gri (tanınmış)
  ]).clamp(true);  // 0'dan küçük ya da 400'den büyük değerleri sınırla


const colorScale = scaleLog<Color>()
  .domain([1, 70, 101])
  .range([
    [200,  20,  30, 150], 
    [128,  0, 128, 50],
    [255, 247, 188, 10]
  ]).clamp(true); 

interface MapSceneProps {

  locations:Location[];
  humans:Human[];
  events:Event[];
  selectedYear:number;
  setSelectedObject: (obj: any) => void;
  colorFilterType:string;
  detailMode:Boolean;
  selectedObjectThumbnail:string | null

}

const MapScene: React.FC<MapSceneProps> = ({
                                              locations,
                                              humans,
                                              events,
                                              selectedYear,
                                              setSelectedObject,
                                              colorFilterType,
                                              detailMode,
                                              selectedObjectThumbnail
                                            }) => {

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE); 
  const [processedHumans, setProcessedHumans] = useState<HumanEnriched[]>([]);
  const [layers, setLayers] = useState<any[]>([]); 
  const [selectedLayerType, setSelectedLayerType] = useState<'arc' | 'text'>('text');
  const [showEvents, setShowEvents] = useState(true);
  const [showHumans, setShowHumans] = useState(true);

 

  useEffect(() => {
    const enrichedHumans: HumanEnriched[] = humans.map((h) => {

        let fillColor: [number, number, number, number];
        let fillTColor: [number, number, number, number];
        let [lonOffsetSource, latOffsetSource] = offsetFibonacciPosition(h.lon, h.lat, h.city_index, viewState.zoom/2 );
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
            const age = selectedYear - h.birth_date;
            fillColor = getColorForAge(age, 200);
            fillTColor = getColorForAge(age, 0);
            break;
        }

        return {
          ...h,
          fillColor,
          fillTColor,
          lonOffsetSource,
          latOffsetSource,
          lonOffsetTarget,
          latOffsetTarget
        };
      });

      setProcessedHumans(enrichedHumans);

  }, [humans, selectedYear, colorFilterType, viewState.zoom]);

  useEffect(() => {
    if (viewState.zoom>1) return;
    if (!humans.length && !locations.length) return;
    const combinedLocations = [
      ...humans.map(h => ({ lon: h.lon, lat: h.lat })),
      ...locations.map(l => ({ lon: l.loc_lon, lat: l.loc_lat }))
    ];

    const { centerLon, centerLat, zoom } = computeBounds(combinedLocations, detailMode);

    setViewState((prev) => ({
      ...prev,
      longitude: centerLon,
      latitude: centerLat,
      zoom: zoom,
      transitionInterpolator: new FlyToInterpolator({ speed: 1 }),
      transitionDuration: 'auto',
    }));

  }, [humans, locations, detailMode]);


useEffect(() => {

  const layersArray:any[] = [];
  if (showEvents) {
    const eventLayer = new ScatterplotLayer({
      id: "events-layer",
      data: events,
      stroked: true,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => 15000 * (d.scale + 3),
      getFillColor: (d) => colorScale(1+100*(selectedYear-d.start_date)/(d.scale+1)),//[200-d.scale*30, 100, 100, 100-100*(selectedYear-d.start_date)/(d.scale+1)],
      getLineColor: (d) => colorScale(1+100*(selectedYear-d.start_date)/(d.scale+1)),
      lineWidthMinPixels: 3,
      pickable: true,
      radiusUnits: "meters",
    });

    layersArray.push(eventLayer);
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
        anchorX: ICON_SIZE / 2, // merkeze sabitle
        anchorY: ICON_SIZE 
      }),
      loadOptions: { image: { crossOrigin: "anonymous" } },
      getSize: 30,
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
          getSourcePosition: (d) => [d.lonOffsetSource, d.latOffsetSource],
          getTargetPosition: (d) => [d.lonOffsetTarget, d.latOffsetTarget],
          getSourceColor: d => d.fillColor,
          getTargetColor: d => d.fillTColor,
          getWidth: 5,
          pickable: true
        });

        layersArray.push(humanArcLayer);

      } 
      else if (selectedLayerType === 'text') {

        const fontSize = 20;
        const scale = 2 ** viewState.zoom;
        const sizeMaxPixels = (scale / 3) * fontSize;
        const sizeMinPixels = Math.min(scale / 1000, 0.5) * fontSize;
        const data = processedHumans

        const humanTextLayer = new TextLayer<HumanEnriched, CollisionFilterExtensionProps<HumanEnriched>>(
          {
            id: 'humans-text-layer',
            data,
            characterSet: 'auto',
            fontSettings: { buffer: 8 },
            getColor: d =>  grayColorScale((d.num_of_identifiers ?? 0) + 1), 
            getPosition: d => [d.lonOffsetSource, d.latOffsetSource],
            getText: d => d.name,
            getSize: d => Math.pow((d.num_of_identifiers+7)*10000, 0.25) / 40,
            sizeScale: fontSize,
            sizeMinPixels: sizeMinPixels,
            sizeMaxPixels: sizeMaxPixels,
            maxWidth: 64 * 12,
            background: true,
            getBackgroundColor: [255, 255, 255, 150],
            pickable: true,
            collisionEnabled: true,
            getCollisionPriority: d =>  Math.log2(d.num_of_identifiers + 20),
            collisionTestProps: {
              sizeScale: fontSize * 2,
              sizeMaxPixels: sizeMaxPixels * 2,
              sizeMinPixels: sizeMinPixels * 2
            },
            extensions: [new CollisionFilterExtension()]
      
          }
        );
        layersArray.push(humanTextLayer);
  }

  }

  setLayers(layersArray);

}, [locations, processedHumans, viewState.zoom, selectedLayerType, selectedObjectThumbnail, showEvents]);




  
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
                      text: `${object.tooltip_text? object.tooltip_text : object.name }`,
                      style: { fontSize: "14px", color: "white" }
                    } : null
                  }
          onClick={({ object }) => {
                if (object) {
                  console.log("Clicked object:", object);
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
          </label></div>
            <hr className="divider" /><div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
            />
            WARS
        </label>
      </div>
        

        
      </div>
      
    </div>
  );
};

export default MapScene;
