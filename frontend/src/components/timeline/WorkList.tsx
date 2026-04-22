
import type { Work } from "../../entities/Work";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "./Modal";
// import { extractSortedDates } from "../utils/dateUtils";
// import './WorkList.css';


interface WorkListProps {
  filteredWorks: Work[];
}

const WorkList: React.FC<WorkListProps> = ({ filteredWorks }) => {

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const worksWithImages = useMemo(
    () => filteredWorks.filter((w) => w.title),
    [filteredWorks]
  );

  const openModal = (index: number) => {
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedIndex(null);
  };

  const goPrev = () => {
    setSelectedIndex((prev) => {
      if (prev === null) return prev;
      return prev === 0 ? worksWithImages.length - 1 : prev - 1;
    });
  };

  const goNext = () => {
    setSelectedIndex((prev) => {
      if (prev === null) return prev;
      return prev === worksWithImages.length - 1 ? 0 : prev + 1;
    });
  };

    // const handleUpdateWorkDetails = async (w_id: number) => {
     
    //   setIsUpdating(true);
    //   setUpdateError(null);

    //   try {
    //     // 🔧 endpoint’i backend’ine göre değiştir
    //     const res = await fetch(
    //       `${backendUrl}/works/${w_id}/update`,
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

         {worksWithImages.map((a, index) => (
          <div key={a.id} className="timeline-item" data-year={a.created_date}>
            {a.image_url ? (
            <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="timeline-item-title"
              >
                <strong>{a.title}</strong>
              </a>) : ( <strong>{a.title}</strong>)  
            }
            {a.image_url ? (
              <img
                src={a.image_url}
                alt={a.title}
                className="timeline-item-img"
                onClick={() => openModal(index)}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <strong>NO IMAGE</strong>
            )}
          </div>
          ))}

        {selectedIndex !== null &&
          createPortal(
            <Modal
              works={worksWithImages}
              selectedIndex={selectedIndex}
              onClose={closeModal}
              onPrev={goPrev}
              onNext={goNext}
            />,
            document.body
          )}

           {/* {a.qid ? (
                    
                    <a href={`https://www.wikidata.org/wiki/${a.qid}`} target="_blank" rel="noreferrer" className="timeline-item-meta">
                        <span> <strong>{a.qid}</strong></span>
                    </a>
                  ):""} */}
                  

                  {/* <div className="timeline-item-meta">
                     · {a.created_date} · {a.description} 
                  </div> */}
                   {/* <button
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
                    )} */}
     

      
    </>
  );
};

export default WorkList;


