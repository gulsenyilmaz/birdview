import type { MilitaryEvent } from "../entities/MilitaryEvent";
// import MilitaryEventBox from '../components/MilitaryEventBox';
import MilitaryEventTreeHorizontal from '../components/MilitaryEventTreeHorizontal';
import './MilitaryEventDetail.css';



interface MilitaryEventDetailProps {
  selectedYear: number;
  militaryEvents:MilitaryEvent[];
  // selectedMilitaryEvent: MilitaryEvent;
  setSelectedObject: (obj: any) => void;
}

const MilitaryEventDetail: React.FC<MilitaryEventDetailProps> = ({
  selectedYear, 
  militaryEvents, 
  // selectedMilitaryEvent
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