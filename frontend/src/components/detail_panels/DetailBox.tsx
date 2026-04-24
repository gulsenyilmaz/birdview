import './DetailBox.css';


interface DetailBoxProps {
  
  detailMode: boolean;
  setDetailMode: (obj: boolean) => void;
  children: React.ReactNode;
}

const DetailBox: React.FC<DetailBoxProps> = ({
  
  detailMode,
  setDetailMode,
  children
}) => {
  return (
    <div className="detail-box">
    
      
      <button
        className="detail-close"
        onClick={() => setDetailMode(false)}
      > ✕
      </button>
      

      {detailMode && (
        <div className="detail-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default DetailBox;