
import './LoadingOverlay.css';

interface LoadingOverlayProps {
    
    humanDataLoading?: boolean;
    eventDataLoading?: boolean;
    onInitialize?: () => void;
  
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
      
      humanDataLoading,
      eventDataLoading,
      onInitialize
    }) => {
  return (

    <div className="loading-screen">
      <div className="loading-content">
        <h1 className="loading-title">Being. There. Then.</h1>

        <div className="loading-status">
         {humanDataLoading && <p>human data loading...</p>}
          {eventDataLoading && <p>military events data loading...</p>}
        </div>
        {humanDataLoading || eventDataLoading ? null : (
          <button className="initialize-button" onClick={onInitialize}>
            Initialize System
          </button>
        )}
      </div>
    </div>
    // <div
    //   style={{
    //     position: "absolute",
    //     inset: 0,
    //     display: "flex",
    //     alignItems: "center",
    //     justifyContent: "center",
    //     background: "rgba(252, 252, 252, 0)",
    //     zIndex: 9999,
    //     pointerEvents: "none",
    //   }}
    // >
    //   <div
    //     style={{
    //       padding: "10px 14px",
    //       borderRadius: 10,
    //       background: "rgba(206, 201, 201, 0)",
    //       color: "rgba(255, 255, 255)",
    //       fontSize: 40,
    //     }} 
    //   ></div>
        
    //   <div
    //     style={{
    //       padding: "10px 14px",
    //       borderRadius: 10,
    //       background: "rgba(206, 201, 201, 0)",
    //       color: "rgba(255, 255, 255)",
    //       fontSize: 14,
    //     }} 
    //   >
    //     {humanDataLoading && <p>human data loading...</p>}
    //     {eventDataLoading && <p>military events data loading...</p>}
    //   </div>
    // </div>
  );
}

export default LoadingOverlay;
