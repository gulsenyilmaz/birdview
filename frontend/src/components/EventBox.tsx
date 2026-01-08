import React, { useState, useEffect} from 'react';
import type { Event } from "../entities/Event";
import './LocationBox.css';

interface EventBoxProps {
  event:Event;
  setSelectedObjectThumbnail: (str:string) => void;
}

interface EventDetails {
  description: string;
  img_url?: string;
  logo_url?: string;
  country_label?:string;
  inception?:number
 
}

const EventBox: React.FC<EventBoxProps> = ({event, setSelectedObjectThumbnail}) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);

    useEffect(() => {
        if (event) {
             fetch(`${backendUrl}/event/${event.id}`)
              .then(res => res.json())
              .then(data => {
                setEventDetails(data.details)
                setSelectedObjectThumbnail(data.img_url)
              })
              .catch(err => console.error("Event details fetch error:", err));
         }
    }, [event]);



    return (
      <>

      <h2>{event.name}- {event.id}</h2>
      <h3>{event.battle}</h3>
     
      
        {eventDetails && (
          
            <div className="event-details-container ">
              <h2>{event.name}- {event.id}</h2>

                {eventDetails.img_url && (
                  <img src={eventDetails.img_url} alt="portrait" className="portrait" />
                )}
                <div className="event-details">
                  {eventDetails.logo_url && (
                    <img src={eventDetails.logo_url} alt="logo" className="logo" />
                  )}
                  
                  <div style={{height: '1rem'}}>
                    <p>{eventDetails.description}</p>
                  {eventDetails.country_label && (<p><strong>IN COUNTRY:</strong> {eventDetails.country_label}</p>)}
                  {eventDetails.inception && (<p><strong>INCEPTION:</strong> {eventDetails.inception}</p>)}
                  </div>
                  
                </div>
                
                
            </div>
            )}
      </> 
    );
};

export default EventBox;