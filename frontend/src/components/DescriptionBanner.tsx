

import './DescriptionBanner.css';
// import "react-widgets/styles.css";
import type { Movement } from '../entities/Movement';
import type { Nationality } from "../entities/Nationality";
import type { Gender } from "../entities/Gender";
import type { Occupation } from "../entities/Occupation";
import type { Human } from "../entities/Human";
import type { Collection } from '../entities/Collection';


interface DescriptionBannerProps{
    humans: Human[];
    selectedMovement:Movement | null;
    selectedOccupation:Occupation| null;
    selectedGender:Gender| null;
    selectedNationality:Nationality| null;
    selectedCollection: Collection | null;
    onClearFilter:(key:string)=> void;

}

const DescriptionBanner: React.FC<DescriptionBannerProps> = ({ 

                humans,
                selectedMovement,
                selectedOccupation,
                selectedGender,
                selectedNationality,
                selectedCollection,
                onClearFilter
    
     }) => {

        const aliveCount = humans.length;
        const femaleCount = humans.filter((h) => h.gender === "female").length;
        const femalePct = aliveCount
            ? ((femaleCount / aliveCount) * 100).toFixed(1)
            : "0";

        const parts = [];

        if (selectedNationality) parts.push(selectedNationality.name);
        if (selectedGender) parts.push(selectedGender.name.toLowerCase());
        if (selectedOccupation) parts.push(selectedOccupation.name.toLowerCase());
        if (selectedCollection) parts.push(selectedCollection.name);


        const mainPart = parts.length > 0
            ? `You are viewing ${aliveCount} individuals, who are `
            : `You are viewing ${aliveCount} individuals. Only ${femaleCount} (${femalePct}%) of them are female.`;

        const renderLabel = (
                idx:number,
                key: string,
                label: string
                ) => {
                    if(key =="movement") {
                        return ` Affilated with ${label.toUpperCase()}.`;
                    }
                    if(key =="collection") {
                        return ` from ${label.toUpperCase()} Collection.`;
                    }
                    return label+ (parts.length==idx+1?".":" ");

                        
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
        if (selectedCollection) {
            tags.push({
                label: selectedCollection.name,
                key: "collection",
            });
        }



  return (
    
    <div className="description-container">
        <div className="filter-tags-container">
            <span className="filter-tag">{mainPart}</span>
            { tags.map((tag, idx) => 
                
                <span className="filter-tag" key={tag.key}>
              
               <strong>{renderLabel(idx, tag.key, tag.label)}</strong>
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