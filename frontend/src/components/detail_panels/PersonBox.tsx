import React, { useState, useEffect} from 'react';
import type { Human } from "../../entities/Human";
import type { RelatedHuman } from "../../entities/RelatedHuman";
import type { Location } from "../../entities/Location";
// import Legend from "../Legend";
// import { getColorForRelationTypeString } from "../../utils/colorUtils";
import './PersonBox.css';
// import { resolveCommonsThumb } from "../../utils/commons"

interface PersonBoxProps {
  person:Human;
  setHumanLocations: (arr: Location[]) => void;
  setHumanRelations:(arr: RelatedHuman[]) => void;
//   setSelectedObjectThumbnail: (str:string | null) => void;
  setManualMode:(obj: boolean) => void
  
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
  family: RelatedHuman[];
  professional: RelatedHuman[];
  intellectual: RelatedHuman[];
  social: RelatedHuman[];
  political: RelatedHuman[];
  nationality: string;
  gender: string;
}

const PersonBox: React.FC<PersonBoxProps> = ({person, setHumanLocations, setHumanRelations, setManualMode}) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
    const [cv_locations, setCvLocations] = useState<Location[]>([]);
    const [museums, setMuseums] = useState<Location[]>([]);
    const [family, setFamily] = useState<RelatedHuman[]>([]);
    const [professional, setProfessional] = useState<RelatedHuman[]>([]);
    const [intellectual, setIntellectual] = useState<RelatedHuman[]>([]);
    const [social, setSocial] = useState<RelatedHuman[]>([]);
    const [political, setPolitical] = useState<RelatedHuman[]>([]);    
    // const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);
   
    const [selectedTab, setSelectedTab] = useState<"cv" | "family"| "professional"| "museums">("cv");
    const [fallbackImage, setFallbackImage] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);


   
    
    // const renderList = (
    //     locations: any[] | undefined
    //     ) => {
    //     if (!locations || locations.length === 0) return null;

    //     return (
    //         <ul>
    //             {locations.map((loc, idx) => (
    //                 <li key={idx}>
    //                 {loc.start_date} 
    //                 {loc.start_date==loc.end_date? "" :` - ${loc.end_date} ` }   {loc.name} {loc.qid}— <em style={{ color: getColorForRelationTypeString(loc.relationship_type_name) }}>
    //                     {loc.relationship_type_name}
    //                     </em>
    //                 </li>
    //             ))}
    //         </ul>
    //     );
    // };

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
                            setFamily(data.family);
                            setProfessional(data.professional);
                            setIntellectual(data.intellectual);
                            setSocial(data.social);
                            setPolitical(data.political);

                            // setUniqueTypes( Array.from(
                            //     new Set(
                            //         cv_locs.map(l => l.relationship_type_name)
                            //     )
                            // ))
                        }
                        // setSelectedObjectThumbnail(data.img_url);
                        if (!data.img_url) {
                            getWikipediaImage(person.name).then(setFallbackImage);
                        }
                    })
            }
        }
    }, [person, isUpdating]);


    // useEffect(() => {
    //     (async () => {
    //         if (!personDetails?.img_url) { 
    //             // setSelectedObjectThumbnail(null); 
    //             return; 
    //         }
                
    //             const url = await resolveCommonsThumb(personDetails.img_url, 256);

                
    //             // setSelectedObjectThumbnail(url);
    //     })();
    // }, [personDetails]);


    useEffect(() => {


        if (selectedTab=="cv") {
            setManualMode(false)
            setHumanRelations([]);
            setHumanLocations(cv_locations);
            
            // setUniqueTypes( Array.from(
            //     new Set(
            //         cv_locations.map(l => l.relationship_type_name)
            //     )
            // ))
           
         }
         else if(selectedTab=="family"){
            setManualMode(false)
            setHumanLocations([]);
            setHumanRelations(family)
            // setUniqueTypes( Array.from(
            //     new Set(
            //         family.map(l => l.relationship_type_name)
            //     )
            // ))
         }
         else if(selectedTab=="professional"){
            
            setManualMode(false)
            setHumanLocations([]);
            setHumanRelations(intellectual.concat(professional).concat(social).concat(political))
            
            // setUniqueTypes( Array.from(
            //     new Set(
            //         professional.map(l => l.relationship_type_name)
            //     )
            // ))
         }
         else if(selectedTab=="museums"){
            setManualMode(false)
            setHumanRelations([]);
            setHumanLocations(museums);
            // setUniqueTypes( Array.from(
            //     new Set(
            //         museums.map(l => l.relationship_type_name)
            //     )
            // ))
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
                        className={selectedTab === "professional" ? "active" : ""}
                        onClick={() => setSelectedTab("professional")}
                    >
                        Professional Life
                    </button>
                    {museums.length>0 && (
                        <>
                        <button
                            className={selectedTab === "museums" ? "active" : ""}
                            onClick={() => setSelectedTab("museums")}
                        >
                            Museums
                        </button></>
                    )}
                        
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

            </div>
        )}
        
    </> 

    );
    
  

};

export default PersonBox;