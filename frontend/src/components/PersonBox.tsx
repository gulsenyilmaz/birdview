import React, { useState, useEffect} from 'react';
import type { Human } from "../entities/Human";
import type { HumanRelative } from "../entities/HumanRelative";
import type { Location } from "../entities/Location";
import Legend from "./Legend";
import { getColorForRelationTypeString } from "../utils/colorUtils";
import './PersonBox.css';
import { resolveCommonsThumb } from "../utils/commons"

interface PersonBoxProps {
  person:Human;
  setHumanLocations: (arr: Location[]) => void;
  setHumanRelatives:(arr: HumanRelative[]) => void;
//   setSelectedObjectThumbnail: (str:string | null) => void;
  setManuelMode:(obj: boolean) => void
  
}

interface PersonDetails {
  description: string;
  img_url?: string;
  signature_url?: string;
  occupations: string[];
  movements: string[];
  collections: string[];
  citizenships: string[];
  locations: Location[];
  relatives:HumanRelative[];
  nationality: string;
  gender: string;
}

const PersonBox: React.FC<PersonBoxProps> = ({person, setHumanLocations, setHumanRelatives, setManuelMode}) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
    const [cv_locations, setCvLocations] = useState<Location[]>([]);
    const [museums, setMuseums] = useState<Location[]>([]);
    const [relatives, setRelatives] = useState<HumanRelative[]>([]);
    const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);
   
    const [selectedTab, setSelectedTab] = useState<"cv" | "family"| "profession"| "museums">("cv");
    const [fallbackImage, setFallbackImage] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);


   
    
    const renderLocationList = (
        locations: any[] | undefined,
        
        action: string
        ) => {
        if (!locations || locations.length === 0) return null;

        return (
            <ul>
                {locations.map((loc, idx) => (
                    <li key={idx}>
                    {loc.start_date} 
                    {loc.start_date==loc.end_date? "" :` - ${loc.end_date} ` }   {loc.name} {loc.qid}— <em style={{ color: getColorForRelationTypeString(loc.relationship_type_name) }}>
                        {action}
                        </em>
                    </li>
                ))}
            </ul>
        );
    };

    useEffect(() => {
        if(!isUpdating) {
            if (person) {
                fetch(`${backendUrl}/person/${person.id}`)
                    .then(res => res.json())
                    .then(data => {
                        console.log("setPersonDetails", data);
                        setPersonDetails(data);
                        if(data.locations && data.locations.length>0){
                            const cv_locs:Location[] = (data.locations as Location[])
                                    .filter(l => l.relationship_type_name !== "has_works_in");

                            const museum_locs:Location[] = (data.locations as Location[])
                                    .filter(l => l.relationship_type_name === "has_works_in");

                            setMuseums(museum_locs);
                            setCvLocations(cv_locs);                                                       
                            setHumanLocations(cv_locs);
                            setRelatives(data.relatives)
                        }
                        // setSelectedObjectThumbnail(data.img_url);
                        if (!data.img_url) {
                            getWikipediaImage(person.name).then(setFallbackImage);
                        }
                    })
            }
        }
    }, [person, isUpdating]);


    useEffect(() => {
        (async () => {
            if (!personDetails?.img_url) { 
                // setSelectedObjectThumbnail(null); 
                return; 
            }
                
                const url = await resolveCommonsThumb(personDetails.img_url, 256);

                console.log("selectedObjectThumbnail2: ", url)
                // setSelectedObjectThumbnail(url);
        })();
    }, [personDetails]);


    useEffect(() => {


        if (selectedTab=="cv") {
            setManuelMode(false)
            setHumanLocations(cv_locations);
            setHumanRelatives([]);
            setUniqueTypes( Array.from(
                new Set(
                    cv_locations.map(l => l.relationship_type_name)
                )
            ))
           
         }
         else if(selectedTab=="family"){
            setManuelMode(false)
            setHumanRelatives((relatives as HumanRelative[]).filter(l => l.relationship_type_name !== "influenced by"))
            setHumanLocations([]);
            setUniqueTypes( Array.from(
                new Set(
                    relatives.map(l => l.relationship_type_name)
                )
            ))
         }
         else if(selectedTab=="profession"){
            setManuelMode(false)
            setHumanRelatives((relatives as HumanRelative[]).filter(l => l.relationship_type_name === "influenced by"))
            setHumanLocations([]);
         }
         else if(selectedTab=="museums"){
            setManuelMode(false)
            setHumanLocations(museums);
            setHumanRelatives([]);
         }
         else{
            setHumanLocations([]);
         }

    }, [selectedTab]);


   async function getWikipediaImage(title: string, lang: string = "en") {
        const response = await fetch(
            `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&origin=*`
        );
        const data = await response.json();
        const pages = data.query.pages;
        const page = Object.values(pages)[0] as any;
        return page?.thumbnail?.source || null;
    }

    const handleUpdatePersonDetails = async () => {
      if (!person) return;
      setIsUpdating(true);
      setUpdateError(null);

      try {
        // 🔧 endpoint’i backend’ine göre değiştir
        const res = await fetch(
          `${backendUrl}/humans/${person.id}/update`,
          {
                method: "PUT",          
                headers: {
                "Content-Type": "application/json",
                },
            }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

      } catch (err: any) {
        console.error(" update error:", err);
        setUpdateError("kaydedilirken bir hata oldu.");
      } finally {
        setIsUpdating(false);
      }
    };

    
    return (
    <>
        {personDetails && (
            <div className="detail-box-container">
                <div className="detail-title">
                    <h2>{person.name}</h2>
                    <p> {personDetails.description}<i>({person.id})</i></p>
                </div>
                 <div className="admin-tools">
                        <a
                        href={`https://www.wikidata.org/wiki/${person.qid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="qid-link"
                        >
                        {person.qid}
                        </a>

                        <button
                        onClick={handleUpdatePersonDetails}
                        disabled={isUpdating}
                        className="update-button"
                        >
                        {isUpdating ? "..." : "↻"}
                        </button>

                        {updateError && <span className="update-error">!</span>}
                    </div>

                <div className="person-id-card">
                   
                    <div className="person-portrait">
                    {personDetails.img_url || fallbackImage ? (
                        <img
                        src={personDetails.img_url || fallbackImage!}
                        alt={`${person.name} portrait`}
                        className="portrait"
                        />
                    ) : (
                        <p className="image-fallback">IMAGE NOT AVAILABLE</p>
                    )}
                    </div>

                    <div className="person-data">
                    <p>
                        <strong>
                        {personDetails.nationality} - {personDetails.gender}
                        </strong>
                    </p>

                    {personDetails.citizenships && personDetails.citizenships.length > 0 && (
                        <p>
                        <strong>Citizenships:</strong> {personDetails.citizenships.join(", ")}
                        </p>
                    )}

                    <p>
                        <strong>Birth Date:</strong> {person.birth_date}
                    </p>

                    <p>
                        <strong>Death Date:</strong> {person.death_date ?? "—"}
                    </p>

                    {personDetails.signature_url && (
                        <img
                        src={personDetails.signature_url}
                        alt={`${person.name} signature`}
                        className="signature-image"
                        />
                    )}
                   
                    
                </div>
                </div>
                
                <div className="content-details">
                    {personDetails.occupations && personDetails.occupations.length > 0 && (
                            <p><strong>Occupations:</strong> {personDetails.occupations.join(", ")}</p>
                        )}
                    {personDetails.collections && personDetails.collections.length > 0 && (
                        <p><strong>Collections:</strong> {personDetails.collections.join(", ")}</p>
                    )}
                    {personDetails.movements && personDetails.movements.length > 0 && (
                        <p><strong>Movements:</strong> {personDetails.movements.join(", ")}</p>
                    )}

                   
                </div>
                        
                <div className="tab-buttons">
                        <button
                            className={selectedTab === "cv" ? "active" : ""}
                            onClick={() => setSelectedTab("cv")}
                        >
                            Curriculum Vitae
                        </button>
                        <button
                            className={selectedTab === "family" ? "active" : ""}
                            onClick={() => setSelectedTab("family")}
                        >
                            Family
                        </button>
                        <button
                            className={selectedTab === "profession" ? "active" : ""}
                            onClick={() => setSelectedTab("profession")}
                        >
                            Professional Life
                        </button>
                        <button
                            className={selectedTab === "museums" ? "active" : ""}
                            onClick={() => setSelectedTab("museums")}
                        >
                            Has Works In
                        </button>
                </div>

                    {selectedTab === "cv" && (
                        
                        <div className="cv_content">
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "birth_place"),  "was born here")}
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "residence"), "lived here")}

                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "educated_at"), "was educated here")}
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "work_location"), "worked here")}
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "death_place"), "passed away here")}
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "buried_at"), "buried at here")}
                        </div>
                    )}
                    {selectedTab === "family" && (
                        
                        <div className="cv_content">
                            {renderLocationList(relatives.filter(l => l.relationship_type_name == "mother"),  "mother")}
                            {renderLocationList(relatives.filter(l => l.relationship_type_name == "father"), "father")}

                            {renderLocationList(relatives.filter(l => l.relationship_type_name == "sibling"), "sibling")}
                            {renderLocationList(relatives.filter(l => l.relationship_type_name == "child"), "child")}
                            {renderLocationList(relatives.filter(l => l.relationship_type_name == "spouse"), "spouse")}
                            {renderLocationList(relatives.filter(l => l.relationship_type_name == "madigudisi"), "madigudisi")}
                        </div>
                    )}
                    {selectedTab === "profession" && (
                        
                        <div className="cv_content">
                            {renderLocationList(relatives.filter(l => l.relationship_type_name == "influenced by"),  "influenced by")}
                          
                        </div>
                    )}

                    {selectedTab === "museums" && (
                    <div className="cv_content">
                        {renderLocationList(museums, "has works here")}
                    </div>
                    )} 
                
                   
                <Legend items={uniqueTypes} />
            </div>
        )}
        
    </> 

    );
    
  

};

export default PersonBox;