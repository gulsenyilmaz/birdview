import './DetailBox.css';


interface DetailBoxProps {
  
  detailMode: boolean;
  setDetailMode: (obj: boolean) => void;
  children: React.ReactNode;
  selectedYear: number;
}

const DetailBox: React.FC<DetailBoxProps> = ({
  
  detailMode,
  setDetailMode,
  children,
  selectedYear
}) => {
  return (
    <div className="detail-box">
       <div className="year-display">
          <span className="year-display-value">in {selectedYear}</span>
        </div>
      
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