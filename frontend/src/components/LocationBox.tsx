import React, { useState, useEffect} from 'react';
import type { Location } from "../entities/Location";
import './LocationBox.css';

interface LocationBoxProps {
  location:Location;
  setSelectedObjectThumbnail: (str:string) => void;
}

interface LocationDetails {
  description: string;
  img_url?: string;
  logo_url?: string;
  country_label?:string;
  inception?:number
 
}

const LocationBox: React.FC<LocationBoxProps> = ({location, setSelectedObjectThumbnail}) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);

    useEffect(() => {
        if (location) {
             fetch(`${backendUrl}/location/${location.id}`)
              .then(res => res.json())
              .then(data => {
                setLocationDetails(data.details)
                setSelectedObjectThumbnail(data.img_url)
              })
              .catch(err => console.error("Location details fetch error:", err));
         }
    }, [location]);



    return (
      <>
        {locationDetails && (
          
            <div className="location-details-container ">
              <h2>{location.name}- {location.qid}</h2>

                {locationDetails.logo_url && (
                  <img src={locationDetails.logo_url} alt="portrait" className="portrait" />
                )}
                {locationDetails.img_url && (
                  <img src={locationDetails.img_url} alt="portrait" className="portrait" />
                )}
                
                <p>{locationDetails.description}</p>
                {locationDetails.country_label && (<p>IN COUNTRY: {locationDetails.country_label}</p>)}
                {locationDetails.inception && (<p>INCEPTION: {locationDetails.inception}</p>)}

                
                
            </div>
            )}
      </> 
    );
};

export default LocationBox;