import React, { useState, useEffect} from 'react';
import type { Movement } from "../entities/Movement";
import './MovementBox.css';

interface MovementBoxProps {
  movement:Movement;
}

interface MovementDetails {
  description: string;
  img_url?: string;
  qid?: string;
  instance_label?:string;
  inception?:number
 
}

const MovementBox: React.FC<MovementBoxProps> = ({movement}) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [movementDetails, setMovementDetails] = useState<MovementDetails | null>(null);
    // const [isUpdating, setIsUpdating] = useState(false);
    // const [updateError, setUpdateError] = useState<string | null>(null);

    useEffect(() => {
        if (movement) {
             fetch(`${backendUrl}/movement/${movement.id}`)
              .then(res => res.json())
              .then(data => {
                setMovementDetails(data.details)
              })
              .catch(err => console.error("Movement details fetch error:", err));
         }
    }, [movement]);

    // const handleUpdateMovementDetails = async () => {
    //   if (!movement) return;
    //   setIsUpdating(true);
    //   setUpdateError(null);

    //   try {
    //     // 🔧 endpoint’i backend’ine göre değiştir
    //     const res = await fetch(
    //       `${backendUrl}/movements/${movement.id}/update`,
    //       {
    //             method: "PUT",          
    //             headers: {
    //             "Content-Type": "application/json",
    //             },
    //         }
    //     );

    //     if (!res.ok) {
    //       throw new Error(`HTTP ${res.status}`);
    //     }

    //   } catch (err: any) {
    //     console.error(" update error:", err);
    //     setUpdateError("kaydedilirken bir hata oldu.");
    //   } finally {
    //     setIsUpdating(false);
    //   }
    // };

    return (
      <>
        {movementDetails && (
          
            <div className="movement-details-container ">
              <h2>{movement.name}-({movement.id})</h2>

                {movementDetails.img_url && (
                  <img src={movementDetails.img_url} alt="portrait" className="portrait" />
                )}
                <div className="movement-details">
                  
                  <div style={{height: 'auto'}}>
                    <a href={`https://www.wikidata.org/wiki/${movementDetails.qid}`} target="_blank" rel="noreferrer" className="timeline-item-title">{movementDetails.qid}</a>
                    {/* <button
                        onClick={handleUpdateMovementDetails}
                        disabled={isUpdating}
                        style={{ marginLeft:"0.4rem", marginTop: "0.4rem" }}
                      >
                        {isUpdating ? "UPDATING..." : "UPDATE"}
                    </button> 

                    {updateError && (
                    <p style={{ color: "red", marginTop: "0.3rem" }}>
                        {updateError}
                    </p>
                    )} */}
                    <p>{movementDetails.description}</p>
                    {movementDetails.instance_label && (<p><strong>INSTANCE:</strong> {movementDetails.instance_label}</p>)}
                    {movementDetails.inception && (<p><strong>INCEPTION:</strong> {movementDetails.inception}</p>)}
                  </div>
                  
                </div>
                
                
            </div>
            )}
      </> 
    );
};

export default MovementBox;