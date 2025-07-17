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


  const locationLayer = new ScatterplotLayer({

      id: "loacations-layer",
      data: locations,
      getPosition: (d) => [d.loc_lon, d.loc_lat],
      getRadius: 200000/viewState.zoom^2,
      getFillColor: d => getColorForRelationType(d.relationship_type_name),
      pickable: true,
      radiusUnits: "meters",

  });

  const humanArcLayer = new ArcLayer({

    id: 'humans-layer',
    data: processedHumans.filter(d => viewState.zoom<3.1?d:null),
    getSourcePosition: (d) => [d.lonOffsetSource, d.latOffsetSource],
    getTargetPosition: (d) => [d.lonOffsetTarget, d.latOffsetTarget],
    getSourceColor:  d => d.fillColor,
    getTargetColor: d => d.fillTColor,
    getWidth: 5,
    pickable: true

  });

const humanTextLayer = new TextLayer<HumanEnriched, CollisionFilterExtensionProps>({

    id: 'humans--text-layer',
    data: processedHumans.filter(d => viewState.zoom>2.9?d:null),
    characterSet: 'auto',
    fontSettings: {
      buffer: 8
    },
    getPosition: d => [d.lonOffsetSource, d.latOffsetSource],
    getText: d => d.name,
    getSize: d => 12 + (d.num_of_identifiers / 15),
    getColor: [55, 55, 55],
    sizeMinPixels: 10,
    sizeMaxPixels: 30,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'top',
    background: true,
    backgroundPadding: [2, 2],
    getBackgroundColor: [22, 33, 44, 0],
    pickable: true,
    getCollisionPriority: d => d.num_of_identifiers,
    extensions: [new CollisionFilterExtension()],
    collisionEnabled: true,
    collisionTestProps: {
      size: true,
      text: true
    }

  });

  
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
          layers={[locationLayer, humanArcLayer, humanTextLayer]}
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
          />
        </DeckGL>
      </div>
    </div>
  );
};

export default MapScene;
