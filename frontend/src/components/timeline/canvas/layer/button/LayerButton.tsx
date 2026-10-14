import React from "react";
import "./LayerButton.css";
import { IoIosAdd, IoIosClose } from "react-icons/io";

interface LayerButtonProps {
  layerColor:string;
  layerTypeName:string;
  showLayer?: boolean;
  setShowLayer: (ch: boolean) => void;
}

const LayerButton: React.FC<LayerButtonProps> = ({
  layerColor,
  layerTypeName,  
  showLayer,
  setShowLayer
}) => {

 
    const handleShowAction = () => {
      setShowLayer(showLayer ? false : true);
    };

    return (
   
          <div className="label-item" style={{color:layerColor }}>
            <div className={`label-title ${showLayer ? "active" : ""}`}>
                {layerTypeName}
            </div>
            
            <button 
                className={`label-button ${showLayer ? "active" : ""}`} 
                onClick={handleShowAction}
                >
                {showLayer ? <IoIosClose  /> : <IoIosAdd />}
                
            </button>
            
          </div>
       
    
    );
};

export default LayerButton;
