
import type { Work } from "../entities/Work";
import type { Human } from "../entities/Human";
import { useEffect, useState } from "react";
import { extractSortedDates } from "../utils/dateUtils";
// import './WorkList.css';


interface WorkListProps {
  person:Human; 
  selectedYear:number;
  backendUrl:string;
  // setDistinctDates:(list: number[]) => void;
}

const WorkList: React.FC<WorkListProps> = ({person, 
  selectedYear, 
  backendUrl, 
  // setDistinctDates
}) => {
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [works, setWorks] = useState<Work[]>([]);
    const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);


    useEffect(() => {
        fetch(`${backendUrl}/works/${person.id}`)
                                .then(res => res.json())
                                .then(data => {
                                
                                // setDistinctDates(extractSortedDates(data, "created_date"));   
                                setWorks(data);
                                })
                                .catch(err => console.error("Works fetch error:", err));
    }, [person]);

    useEffect(() => {

        setFilteredWorks(works.filter(w => w.created_date == selectedYear));

    }, [selectedYear, works]);

    const openImageModal = (url: string) => {
        setModalImageUrl(url);
      };
    
    const closeImageModal = () => {
        setModalImageUrl(null);
      };

    const handleUpdateWorkDetails = async (w_id: number) => {
     
      setIsUpdating(true);
      setUpdateError(null);

      try {
        // 🔧 endpoint’i backend’ine göre değiştir
        const res = await fetch(
          `${backendUrl}/works/${w_id}/update`,
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
        { filteredWorks.map((a) =>
              a.title ? (
                <div key={a.id} className="timeline-item">
                  <div className="timeline-item-meta">
                     · From <strong>{a.collection_name}</strong>
                  </div>
                  {a.image_url ? ( 
                    <img
                      src={a.image_url}
                      alt={a.title}
                      className="timeline-item-img"
                      onClick={() => openImageModal(a.image_url)}
                      style={{ cursor: "pointer" }}
                      />
                      ) : <p>Image not available</p>}
                  <a href={a.url} target="_blank" rel="noreferrer" className="timeline-item-title">
                    <strong>{a.title}</strong>
                  </a>- {a.qid}
                  <div className="timeline-item-meta">
                     · {a.created_date} · {a.description} 
                  </div>
                   <button
                        onClick={() => handleUpdateWorkDetails(a.id)}
                        disabled={isUpdating}
                        style={{ marginLeft:"0.4rem", marginTop: "0.4rem" }}
                      >
                        {isUpdating ? "UPDATING..." : "UPDATE"}
                    </button>

                    {updateError && (
                    <p style={{ color: "red", marginTop: "0.3rem" }}>
                        {updateError}
                    </p>
                    )}
                </div>
              ) : null
          )}
        
          {modalImageUrl && (
            <div className="modal-overlay" onClick={closeImageModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <img src={modalImageUrl} alt="Artwork" className="modal-image" />
                <button className="modal-close" onClick={closeImageModal}>
                  ✕
                </button>
              </div>
            </div>
          )}
    </>
  );
};

export default WorkList;


