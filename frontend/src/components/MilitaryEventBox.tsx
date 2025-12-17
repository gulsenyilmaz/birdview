import React, { useState, useEffect} from 'react';
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import './PersonBox.css';

interface MilitaryEventBoxProps {
  militaryEvent:MilitaryEvent;
}

interface MilitaryEventDetails {
    qid: string;
    name: string;
    start_time?: string;
    end_time?: string;
    point_in_time?: string;
    description: string;
    image_url?: string;
    wiki_url?: string;
    depth_index?: number;
    depth_level?: number;
    descendant_count?: number;
    parent_id?: number;
    parent_name?: string;
    event_type?: string;
    lat?: number;  
    lon?: number;  

}

const MilitaryEventBox: React.FC<MilitaryEventBoxProps> = ({militaryEvent}) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [militaryEventDetails, setMilitaryEventDetails] = useState<MilitaryEventDetails | null>(null);
    const [startTimeInput, setStartTimeInput] = useState<string >(""); 
    const [endTimeInput, setEndTimeInput] = useState<string>("");
    const [parentIdInput, setParentIdInput] = useState<string>("");
    const [latInput, setLatInput] = useState<string>("");
    const [lonInput, setLonInput] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (militaryEvent) {
          setStartTimeInput(String(militaryEvent.start_date ?? ""));
          setEndTimeInput(String(militaryEvent.end_date ?? ""));
          setParentIdInput(
            militaryEvent.parent_id != null ? String(militaryEvent.parent_id) : ""
          );
          setLatInput(
            militaryEvent.lat != null ? String(militaryEvent.lat) : ""
          );
          setLonInput(
            militaryEvent.lon != null ? String(militaryEvent.lon) : ""
          );

          fetch(`${backendUrl}/military_event/${militaryEvent.id}`)
            .then(res => res.json())
            .then(data => {
              setMilitaryEventDetails(data.details)
            })
            .catch(err => console.error("MilitaryEvent details fetch error:", err));
         }
    }, [militaryEvent, backendUrl]);

    const handleSaveEventDetails = async () => {
      if (!militaryEvent) return;
      setIsSaving(true);
      setSaveError(null);

      try {
        // 🔧 endpoint’i backend’ine göre değiştir
        const res = await fetch(
          `${backendUrl}/military_event/${militaryEvent.id}/update`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ start_time: startTimeInput, end_time: endTimeInput, parent_id: parentIdInput, lat: latInput, lon: lonInput }),
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

       
      } catch (err: any) {
        console.error(" update error:", err);
        setSaveError("kaydedilirken bir hata oldu.");
      } finally {
        setIsSaving(false);
      }
  };



    return (
      <>
      
        {militaryEventDetails && (
          
            <div className="person-details-container">
              <h2>{militaryEvent.name} ({militaryEvent.id})</h2>
              <a href={`https://www.wikidata.org/wiki/${militaryEvent.qid}`} target="_blank" rel="noreferrer" className="timeline-item-title">{militaryEvent.qid} - 
                <strong> Depth Info: {militaryEvent.depth_index} / {militaryEvent.depth_level} / {militaryEvent.descendant_count}</strong>
              </a>

              {militaryEventDetails.image_url && (
                <img src={militaryEventDetails.image_url} alt="portrait" className="portrait" />
              )}
              <div className="person-details">
                  <div style={{height: 'auto'}}>
                    <p>
                      {militaryEventDetails.parent_name && (
                          <strong>{militaryEventDetails.parent_name} / </strong> 
                      )}
                      <a href={militaryEventDetails.wiki_url} target="_blank" rel="noreferrer">
                      <strong>{militaryEvent.name} ({militaryEvent.event_type})</strong>
                      </a>
                    </p>
                    <p>{militaryEventDetails.description}</p>

                    <div style={{ marginBottom: "0.5rem" }}>
                      {/* Start Time */}
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem" }}>
                        <label style={{ width: "90px", fontWeight: 400 }}>Start Time:</label>
                        <input
                          type="text"
                          value={startTimeInput}
                          onChange={(e) => setStartTimeInput(e.target.value)}
                          placeholder={String(militaryEvent.start_date ?? "")}
                          style={{ flex: 1 }}
                        />
                      </div>

                      {/* End Time */}
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem" }}>
                        <label style={{ width: "90px", fontWeight: 400 }}>End Time:</label>
                        <input
                          type="text"
                          value={endTimeInput}
                          onChange={(e) => setEndTimeInput(e.target.value)}
                          placeholder={String(militaryEvent.end_date ?? "")}
                          style={{ flex: 1 }}
                        />
                      </div>

                      {/* Parent */}
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem" }}>
                        <label style={{ width: "90px", fontWeight: 400 }}>Parent:</label>
                        <input
                          type="text"
                          value={parentIdInput}
                          onChange={(e) => setParentIdInput(e.target.value)}
                          placeholder={String(militaryEvent.parent_id ?? "")}
                          style={{ flex: 1 }}
                        />
                      </div>

                      {/* Lat */}
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem" }}>
                        <label style={{ width: "90px", fontWeight: 400 }}>Lat:</label>
                        <input
                          type="text"
                          value={latInput}
                          onChange={(e) => setLatInput(e.target.value)}
                          placeholder={String(militaryEvent.lat ?? "")}
                          style={{ flex: 1 }}
                        />
                      </div>

                      {/* Lon */}
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem" }}>
                        <label style={{ width: "90px", fontWeight: 400 }}>Lon:</label>
                        <input
                          type="text"
                          value={lonInput}
                          onChange={(e) => setLonInput(e.target.value)}
                          placeholder={String(militaryEvent.lon ?? "")}
                          style={{ flex: 1 }}
                        />
                      </div>

                      <button
                        onClick={handleSaveEventDetails}
                        disabled={isSaving}
                        style={{ marginTop: "0.4rem" }}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>

                      {saveError && (
                        <p style={{ color: "red", marginTop: "0.3rem" }}>
                          {saveError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
            </div>
            )}
      </> 
    );
};

export default MilitaryEventBox;