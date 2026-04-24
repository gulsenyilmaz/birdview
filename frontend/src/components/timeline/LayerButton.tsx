import React from "react";
import "./LayerButton.css";

import { BiLayerMinus, BiLayerPlus } from "react-icons/bi";

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
            
            
            <button 
                className={`label-button ${showLayer ? "active" : ""}`} 
                onClick={handleShowAction}
                >
                {showLayer ? <BiLayerMinus /> : <BiLayerPlus />}
            </button>
            <div className={`label-title ${showLayer ? "active" : ""}`}>
                {layerTypeName}
            </div>
          </div>
       
    
    );
};

export default LayerButton;
