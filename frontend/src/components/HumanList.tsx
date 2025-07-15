
import type { Human } from "../entities/Human";
// import './HumanList.css';


interface HumanListProps {

  humans:Human[];
  setSelectedObject: (obj: any) => void;
}

const HumanList: React.FC<HumanListProps> = ({humans, setSelectedObject}) => {

    
    
  return (
    <>
        {humans.map((a) =>
              a.img_url ? (
                <div key={a.id} className="timeline-item">
                  <img
                    src={a.img_url}
                    alt={a.name}
                    className="timeline-item-img"
                    onClick={() => setSelectedObject(a)}
                    style={{ cursor: "pointer" }}
                  />
                 
                  <div className="timeline-item-meta">
                   {a.name} - {a.birth_date} - {a.qid} 
                  </div>
                </div>
              ) : null
            )}
        
      
    </>
  );
};

export default HumanList;