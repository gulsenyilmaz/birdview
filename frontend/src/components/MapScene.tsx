// src/components/MapScene.tsx
import React, { useEffect, useState } from "react";
import { FlyToInterpolator } from '@deck.gl/core';
import { DeckGL } from "@deck.gl/react";
import { Map } from "react-map-gl";

import { ScatterplotLayer } from "@deck.gl/layers";
import { ArcLayer } from "@deck.gl/layers";
import { TextLayer } from '@deck.gl/layers';
import {CollisionFilterExtension} from '@deck.gl/extensions';
import type {CollisionFilterExtensionProps} from '@deck.gl/extensions';
import type { Location } from "../entities/Location";
import type { Human } from "../entities/Human";
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

interface MapSceneProps {
  locations:Location[];
  humans:Human[];
  selectedYear:number;
  setSelectedObject: (obj: any) => void;
  colorFilterType:string;
  detailMode:Boolean;
}

const MapScene: React.FC<MapSceneProps> = ({
                                              locations,
                                              humans,
                                              selectedYear,
                                              setSelectedObject,
                                              colorFilterType,
                                              detailMode
                                            }) => {

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE); 
  const [processedHumans, setProcessedHumans] = useState<HumanEnriched[]>([]);
  const [layers, setLayers] = useState<any[]>([]); 

  useEffect(() => {
    const enrichedHumans: HumanEnriched[] = humans.map((h) => {
        let fillColor: [number, number, number, number];
        let fillTColor: [number, number, number, number];
        let [lonOffsetSource, latOffsetSource] = offsetFibonacciPosition(h.lon, h.lat, h.city_index, viewState.zoom );
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
  const locationLayer = new ScatterplotLayer({
    id: "locations-layer",
    data: locations,
    getPosition: (d) => [d.loc_lon, d.loc_lat],
    getRadius: 200000 / Math.pow(viewState.zoom, 2),
    getFillColor: d => getColorForRelationType(d.relationship_type_name),
    pickable: true,
    radiusUnits: "meters",
  });

  const humanArcLayer = new ArcLayer({
    id: 'humans-layer',
    data: processedHumans.filter(d => viewState.zoom < 2 ? d : null),
    getSourcePosition: (d) => [d.lonOffsetSource, d.latOffsetSource],
    getTargetPosition: (d) => [d.lonOffsetTarget, d.latOffsetTarget],
    getSourceColor: d => d.fillColor,
    getTargetColor: d => d.fillTColor,
    getWidth: 5,
    pickable: true
  });

  const humanTextLayer = new TextLayer<HumanEnriched, CollisionFilterExtensionProps>({
    id: 'humans-text-layer',
    data: processedHumans.filter(d => d.num_of_identifiers * viewState.zoom > 80),
    characterSet: 'auto',
    fontSettings: { buffer: 1 },
    getPosition: d => [d.lonOffsetSource, d.latOffsetSource],
    getText: d => d.name,
    getSize: d => 7 + (d.num_of_identifiers / 150) * viewState.zoom,
    sizeMinPixels: 14,
    sizeMaxPixels: 50,
    background: true,
    backgroundPadding: [4, 4],
    getBackgroundColor: [255, 255, 255, 0],
    getColor: [0, 0, 0],
    pickable: true,
    getCollisionPriority: d => d.num_of_identifiers,
    extensions: [new CollisionFilterExtension()],
    collisionEnabled: true,
    collisionTestProps: { size: true, text: true }
  });

  setLayers([locationLayer, humanArcLayer, humanTextLayer]);

}, [locations, processedHumans, viewState.zoom]);

  
  return (
    <div>
      
      <div>
        <DeckGL
          initialViewState={viewState}
          controller={true}
         
          onViewStateChange={( obj :any) => {
            
             setViewState({
                latitude: obj.viewState.latitude,
                longitude: obj.viewState.longitude,
                zoom: obj.viewState.zoom,
                pitch: obj.viewState.pitch,
                bearing: obj.viewState.bearing,
              });

          }}
          layers={layers}
          getTooltip={({ object }) =>
                    object ? {
                      text: `${object.tooltip_text? object.tooltip_text : object.name }`,
                      style: { fontSize: "14px", color: "white" }
                    } : null
                  }
          onClick={({ object }) => {
                if (object) {
                  setSelectedObject(object);
                  // setProcessedHumans([object]);
                }
            }}

          >
          <Map
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/light-v11"
            onLoad={(e: any) => {
              const map = e.target;

              map.on("style.load", () => {
                map.getStyle().layers.forEach((layer: any) => {
                  if (layer.id.includes("label")) {
                    map.setLayoutProperty(layer.id, "visibility", "none");
                  }
                });
              });
            }}
            
          />
        </DeckGL>
      </div>
    </div>
  );
};

export default MapScene;
