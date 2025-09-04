import React, { useState, useEffect} from 'react';
import type { Human } from "../entities/Human";
import type { Location } from "../entities/Location";
import { getColorForRelationTypeString } from "../utils/colorUtils";
import './PersonBox.css';
import { resolveCommonsThumb } from "../utils/commons"

interface PersonBoxProps {
  person:Human;
  setLocations: (arr: Location[]) => void;
  setSelectedObjectThumbnail: (str:string | null) => void;
  
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
}

const PersonBox: React.FC<PersonBoxProps> = ({person, setLocations, setSelectedObjectThumbnail}) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
    const [cv_locations, setCvLocations] = useState<Location[]>([]);
    const [museums, setMuseums] = useState<Location[]>([]);
    const [selectedTab, setSelectedTab] = useState<"cv" | "museums">("cv");
    const [fallbackImage, setFallbackImage] = useState<string | null>(null);


    const renderLocationList = (
        locations: Location[] | undefined,
        
        action: string
        ) => {
        if (!locations || locations.length === 0) return null;

        return (
            <ul>
                {locations.map((loc, idx) => (
                    <li key={idx}>
                    {loc.start_date} 
                    {loc.start_date==loc.end_date? "" :` - ${loc.end_date} ` }   {loc.name} — <em style={{ color: getColorForRelationTypeString(loc.relationship_type_name) }}>
                        {action}
                        </em>
                    </li>
                ))}
            </ul>
        );
    };

    useEffect(() => {
        if (person) {
            fetch(`${backendUrl}/person/${person.id}`)
                .then(res => res.json())
                .then(data => {
                    setPersonDetails(data);
                    const cv_locs:Location[] = (data.locations as Location[])
                            .filter(l => l.relationship_type_name !== "has_works_in");

                    const museum_locs:Location[] = (data.locations as Location[])
                            .filter(l => l.relationship_type_name === "has_works_in");

                    setMuseums(museum_locs);
                    setCvLocations(cv_locs);                                                       
                    setLocations(cv_locs);
                    // setSelectedObjectThumbnail(data.img_url);
                    if (!data.img_url) {
                        getWikipediaImage(person.name).then(setFallbackImage);
                    }
                })
         }
    }, [person]);


    useEffect(() => {
        (async () => {
            if (!personDetails?.img_url) { setSelectedObjectThumbnail(null); return; }
                console.log("selectedObjectThumbnail1: ", personDetails.img_url)
                const url = await resolveCommonsThumb(personDetails.img_url, 256);

                console.log("selectedObjectThumbnail2: ", url)
                setSelectedObjectThumbnail(url);
        })();
    }, [personDetails]);


    useEffect(() => {
        if (selectedTab=="cv") {
           setLocations(cv_locations);
         }
         else if(selectedTab=="museums"){
            setLocations(museums);
         }
         else{
            setLocations([]);
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

    
    return (
    <>
        {personDetails && (
            <div className="person-details-container ">
                {(personDetails.img_url || fallbackImage) ? (
                    <img
                        src={personDetails.img_url || fallbackImage!}
                        alt="portrait"
                        className="portrait"
                    />
                ) : (<p>IMAGE NOT AVAILABLE</p>)}
                {personDetails.signature_url && (
                    <img
                        src={personDetails.signature_url}
                        alt="signature"
                        className="signature-image"
                        />
                )}
                <div className="person-details">
                    <h3><i>{personDetails.description} {person.qid}</i></h3>
                    <p><strong>Occupations:</strong> {personDetails.occupations.join(", ")}</p>
                    <p><strong> {person.nationality} -  {person.gender}</strong></p>

                    {personDetails.citizenships && personDetails.citizenships.length > 0 && (
                        <p><strong>Citizenships:</strong> {personDetails.citizenships.join(", ")}</p>
                    )}
                    {personDetails.collections && personDetails.collections.length > 0 && (
                        <p><strong>Collections:</strong> {personDetails.collections.join(", ")}</p>
                    )}
                    {personDetails.movements && personDetails.movements.length > 0 && (
                        <p><strong>Movements:</strong> {personDetails.movements.join(", ")}</p>
                    )}
                        
                    <div className="tab-buttons">
                        <button
                            className={selectedTab === "cv" ? "active" : ""}
                            onClick={() => setSelectedTab("cv")}
                        >
                            Curriculum Vitae
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
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "educated_at"), "was educated here")}
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "residence"), "lived here")}
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "work_location"), "worked here")}
                            {renderLocationList(cv_locations.filter(l => l.relationship_type_name == "death_place"), "passed away here")}
                        </div>
                    )}

                    {selectedTab === "museums" && (
                    <div className="museum_content">
                        {renderLocationList(museums, "has works here")}
                    </div>
                    )}
                </div>

                    

            </div>
        )}
        
    </> 

    );
    
  

};

export default PersonBox;