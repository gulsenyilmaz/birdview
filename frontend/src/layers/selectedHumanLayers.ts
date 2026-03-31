import { IconLayer, LineLayer } from "@deck.gl/layers";
import { TextLayer } from '@deck.gl/layers';
import { CollisionFilterExtension } from "@deck.gl/extensions";
import type { CollisionFilterExtensionProps } from "@deck.gl/extensions";

import type { HumanRelativeEnriched } from "../entities/HumanRelativeEnriched";
import type { Human } from "../entities/Human";
import type { Location } from "../entities/Location";
import {getColorForRelationType } from "../utils/colorUtils";
import { existsThatYear } from "../utils/dateUtils"



type SelectedHumanLayerParams = {
  processedHumanRelatives: HumanRelativeEnriched[];
  humanLocations:Location[];
  selectedYear: number;
  selectedObject:Human;
  fontSize: number;
  sizeMinPixels: number;
  sizeMaxPixels: number;
};

export function createSelectedHumanLayers({
  processedHumanRelatives,
  humanLocations,
  selectedYear,
  selectedObject,
  fontSize,
  sizeMinPixels,
  sizeMaxPixels
}: SelectedHumanLayerParams) {
  const layers = [];
//   const SCATTER_FACTOR = 0.04 * 111320;

  
    layers.push(
      new IconLayer<Location>(
            {
            id: 'IconLayer',
            data: humanLocations,
            getColor: (d: Location) => getColorForRelationType(d.relationship_type_name, existsThatYear(d.start_date, d.end_date, selectedYear)?250:20),
            getIcon: () => 'marker',
            getPosition: (d: Location) => [d.loc_lon, d.loc_lat],
            getSize: 40,
            iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
            iconMapping: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.json',
            pickable: true,
            updateTriggers: { getColor: [selectedYear] }
            }
        )
    );

    

    layers.push(
      new LineLayer<HumanRelativeEnriched>(
          {
            id: 'HumanLineLayer',
            data: processedHumanRelatives,
            
            getColor: (d: HumanRelativeEnriched) => getColorForRelationType(d.relationship_type_name, existsThatYear(d.start_date, d.end_date, selectedYear)?100:50), 
            getSourcePosition: (d: HumanRelativeEnriched) => [d.lon, d.lat],
            getTargetPosition: (d: HumanRelativeEnriched) => [d.lonOffsetSource, d.latOffsetSource],
            getWidth: 1,
            pickable: true
      
          }
        )
    );

    layers.push(
      new TextLayer<HumanRelativeEnriched, CollisionFilterExtensionProps<HumanRelativeEnriched>>({
        id: 'humans-relatives-text-layer',
        data: processedHumanRelatives,
        characterSet: 'auto',
        fontSettings: { buffer: 8, sdf: true },

        getText: d => {
          const diedText =
            d.death_date && d.death_date < selectedYear
              ? ` (died in ${d.death_date})`
              : '';
          return ` ${d.name}${diedText}`;
        },

        getPosition: d => [d.lonOffsetSource, d.latOffsetSource],

        getColor: d => {
          const start = d.start_date ?? d.birth_date;
          const end = d.end_date ?? d.death_date;
          const isActive = existsThatYear(start, end, selectedYear);
          return getColorForRelationType(d.relationship_type_name, isActive ? 255 : 150);
        },

        getSize: d => Math.max(Math.log10(Math.max(d.age, 1)) / 3, 0.2),

        sizeScale: fontSize,
        sizeMinPixels,
        sizeMaxPixels,
        maxWidth: 20 * 12,
        background: true,

        getBackgroundColor: d => {
          const start = d.start_date ?? d.birth_date;
          const end = d.end_date ?? d.death_date;
          const isActive = existsThatYear(start, end, selectedYear);
          return [250, 250, 250, isActive ? 100 : 70];
        },

        pickable: true,
        collisionEnabled: false,
        getCollisionPriority: d => Math.max(d.age*d.index, 0),

        collisionTestProps: {
          sizeScale: fontSize * 2,
          sizeMaxPixels: sizeMaxPixels * 2,
          sizeMinPixels: sizeMinPixels * 2
        },

        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        extensions: [new CollisionFilterExtension()]
      })
    );

    const filteredLocation = humanLocations.filter(
              (h) =>
                h.start_date <= selectedYear &&
                (!h.end_date || h.end_date >= selectedYear) &&
                selectedYear - h.start_date < 100
            );

    // layers.push(
    //   new LineLayer<Location>(
    //       {
    //         id: 'SelectedLineLayer',
    //         data: filteredLocation,
            
    //         getColor: (d: Location) => getColorForRelationType(d.relationship_type_name), 
    //         getSourcePosition: (d: Location) => [d.loc_lon, d.loc_lat],
    //         getTargetPosition: (d: Location) => [d.loc_lon+1, d.loc_lat-1],
    //         getWidth: 1,
    //         pickable: true
      
    //       }
    //     )
    // );

    layers.push(
        new TextLayer<Location, CollisionFilterExtensionProps<Location>>({
          id: 'humans-relatives-text-layer',
          data: filteredLocation,
          characterSet: 'auto',
          fontSettings: { buffer: 8, sdf: true },

          getText: d => ".\n\n\n\n\n\n" +selectedObject.name+" \n\n" + d.relationship_type_name.toLocaleUpperCase(),
          getPosition: d => [d.loc_lon, d.loc_lat],
          getColor: d => getColorForRelationType(d.relationship_type_name),
          getSize: () => 0.2,
          sizeScale: fontSize,
          sizeMinPixels,
          sizeMaxPixels,
          maxWidth: 64 * 12,
          background: false,
          getBackgroundColor: () => [250, 250, 250, 250],
          pickable: true,

          collisionEnabled: true,
          getCollisionPriority: () => 1,
          collisionTestProps: {
            sizeScale: fontSize * 2,
            sizeMaxPixels: sizeMaxPixels * 2,
            sizeMinPixels: sizeMinPixels * 2
          },

          getTextAnchor: 'start',
          getAlignmentBaseline: 'center',
          extensions: [new CollisionFilterExtension()]
        })
    );

    
  

  return layers;
}