import React, { useState} from 'react';
import './ContentStrip.css';

import Timeline from './Timeline';


interface ContentStripProps {

  selectedYear:number;
  selectedObject:any;
  children: React.ReactNode;
}

const ContentStrip: React.FC<ContentStripProps> = ({
      selectedYear,
      selectedObject,
      children
    }) => {

  const [isOpen, setIsOpen] = useState(true);
  
    

  return (
    <>
        <div className="content-strip-tab" onClick={() => setIsOpen(isOpen?false:true)}>
            {isOpen ?  "⟨":"⟩" }
        </div>
        
        <div className="content-strip-content">
            {isOpen && (
              <Timeline>
                      {children}
              </Timeline>
              
           )} 
          
          <div className="content-strip-header">
            <strong className="person-name">{selectedObject? selectedObject.name: ""} in {selectedYear}</strong>
          </div>
        </div>
    </>
  );
};

export default ContentStrip;