import './DetailBox.css';


interface DetailBoxProps {
  selectedYear: number;
  detailMode: boolean;
  setDetailMode: (obj: boolean) => void;
  children: React.ReactNode;
}

const DetailBox: React.FC<DetailBoxProps> = ({
  selectedYear,
  detailMode,
  setDetailMode,
  children
}) => {
  return (
    <div className="detail-box">
      <div className={`year-box ${detailMode ? "up" : ""}`}>
        <label><strong>{selectedYear}</strong></label>
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