import React, { useState, useEffect} from 'react';
import type { Location } from "../entities/Location";
import './LocationBox.css';

interface LocationBoxProps {
  location:Location;
  // setSelectedObjectThumbnail: (str:string) => void;
}

interface LocationDetails {
  description: string;
  img_url?: string;
  logo_url?: string;
  country_label?:string;
  inception?:number
 
}

const LocationBox: React.FC<LocationBoxProps> = ({location}) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    useEffect(() => {
        if (location) {
             fetch(`${backendUrl}/location/${location.id}`)
              .then(res => res.json())
              .then(data => {
                setLocationDetails(data.details)
                // setSelectedObjectThumbnail(data.img_url)
              })
              .catch(err => console.error("Location details fetch error:", err));
         }
    }, [location]);

    const handleUpdateLocationDetails = async () => {
      if (!location) return;
      setIsUpdating(true);
      setUpdateError(null);

      try {
        // 🔧 endpoint’i backend’ine göre değiştir
        const res = await fetch(
          `${backendUrl}/locations/${location.id}/update`,
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
        {locationDetails && (
          
            <div className="detail-box-container">
              <div className="detail-title">
                    <h2>{location.name}</h2>
                    <p>
                    {locationDetails.description} ({location.id}) (
                    <a
                        href={`https://www.wikidata.org/wiki/${location.qid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="timeline-item-title"
                    >
                        {location.qid}
                    </a>
                    )

                     <button
                        onClick={handleUpdateLocationDetails}
                        disabled={isUpdating}
                        className="update-button"
                    >
                        {isUpdating ? "UPDATING..." : "UPDATE"}
                    </button>

                    {updateError && <p className="update-error">{updateError}</p>}
                    </p>
                </div>
              

                
                <div className="content-details">

                  {locationDetails.img_url && (
                    <img src={locationDetails.img_url} alt="portrait" className="portrait" />
                  )}

                  {locationDetails.logo_url && (
                    <img src={locationDetails.logo_url} alt="logo" className="logo" />
                  )}
                  
                  <div style={{height: 'auto'}}>
                    {locationDetails.country_label && (<p><strong>IN COUNTRY:</strong> {locationDetails.country_label}</p>)}
                    {locationDetails.inception && (<p><strong>INCEPTION:</strong> {locationDetails.inception}</p>)}
                  </div>
                  
                </div>
                
                
            </div>
            )}
      </> 
    );
};

export default LocationBox;