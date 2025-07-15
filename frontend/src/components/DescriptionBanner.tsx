import React, { useState, useEffect} from 'react';

import './DescriptionBanner.css';
// import "react-widgets/styles.css";
import type { Movement } from '../entities/Movement';
import type { Human } from "../entities/Human";
import type { Location } from "../entities/Location";
import type { Nationality } from "../entities/Nationality";
import type { Gender } from "../entities/Gender";
import type { Occupation } from "../entities/Occupation";


interface DescriptionBannerProps{
    selectedMovement:Movement | null;
    selectedOccupation:Occupation| null;
    selectedGender:Gender| null;
    selectedNationality:Nationality| null;
    onClearFilter:(key:string)=> void;

}

const DescriptionBanner: React.FC<DescriptionBannerProps> = ({ 

                selectedMovement,
                selectedOccupation,
                selectedGender,
                selectedNationality,
                onClearFilter
    
     }) => {

        const parts = [];

        if (selectedNationality) parts.push(selectedNationality.name);
        if (selectedGender) parts.push(selectedGender.name.toLowerCase());
        if (selectedOccupation) parts.push(selectedOccupation.name.toLowerCase());

        const mainPart = parts.length > 0
            ? `You are viewing `
            : `You are viewing all individuals.`;

        const renderLabel = (
                idx:number,
                key: string,
                label: string
                ) => {
                    

                if(key !="movement") return label+ (parts.length==idx+1?"s.":" ");
                return ` Affiliated with ${label}`;
        
            };
        


        const tags = [];

        if (selectedNationality) {
            tags.push({
            label:selectedNationality.name,
            key: "nationality",
            });
        }

        if (selectedGender) {
            tags.push({
            label: selectedGender.name.toLowerCase(),
            key: "gender",
            });
        }

        if (selectedOccupation) {
            tags.push({
            label: selectedOccupation.name.toLowerCase(),
            key: "occupation",
            });
        }

        if (selectedMovement) {
            tags.push({
            label: selectedMovement.name,
            key: "movement",
            });
        }



  return (
    
    <div className="description-container">
        <div className="filter-tags-container">
            <span className="filter-tag">{mainPart}</span>
            { tags.map((tag, idx) => 
                
                <span className="filter-tag" key={tag.key}>
              
               {renderLabel(idx, tag.key, tag.label)}
                <button
                    className="remove-btn"
                    onClick={() => onClearFilter(tag.key)}
                    title="Remove"
                >
                    ×
                </button>
                </span>
            )}
        </div>
    </div>
    
  );
}

export default DescriptionBanner;