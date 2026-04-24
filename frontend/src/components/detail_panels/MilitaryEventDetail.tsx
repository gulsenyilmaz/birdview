import type { MilitaryEvent } from "../../entities/MilitaryEvent";
// import MilitaryEventBox from '../components/MilitaryEventBox';
import MilitaryEventTreeHorizontal from './MilitaryEventTreeHorizontal';
import './MilitaryEventDetail.css';



interface MilitaryEventDetailProps {
  selectedYear: number;
  militaryEvents:MilitaryEvent[];
  // selectedMilitaryEvent: MilitaryEvent;
  setSelectedObject: (obj: any) => void;
  setShowEventDetails: (ch: boolean) => void;
}

const MilitaryEventDetail: React.FC<MilitaryEventDetailProps> = ({
  selectedYear, 
  militaryEvents, 
  // selectedMilitaryEvent
  setShowEventDetails,
  setSelectedObject
}) => {
  return (
    
     <div className="military_event_detail_container">
      
       {/* <div className="military_event_details_box">
         <MilitaryEventBox 
              militaryEvent={selectedMilitaryEvent} 
          />
      </div> */}
      <div className="military_event_tree_box">
        <button
        className="detail-close"
        onClick={() => setShowEventDetails(false)}
      > ✕
      </button>
         <MilitaryEventTreeHorizontal
              selectedYear={selectedYear}
              militaryEvents={militaryEvents}
              setSelectedObject = {setSelectedObject}
          />
      </div>
    </div>
  );
};

export default MilitaryEventDetail;