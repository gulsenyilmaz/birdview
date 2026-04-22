import type { Work } from "../../entities/Work";
import "./Modal.css";

interface ModalProps {
  works: Work[];
  selectedIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const Modal: React.FC<ModalProps> = ({
  works,
  selectedIndex,
  onClose,
  onPrev,
  onNext,
}) => {
  const selectedWork = works[selectedIndex];

  if (!selectedWork) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {works.length > 1 && (
          <>
            <button className="modal-nav modal-nav-left" onClick={onPrev}>
              ‹
            </button>
            <button className="modal-nav modal-nav-right" onClick={onNext}>
              ›
            </button>
          </>
        )}

        {selectedWork.image_url ? (
          <img
            src={selectedWork.image_url}
            alt={selectedWork.title || "Artwork"}
            className="modal-image"
          />
        ) : (
          <div className="modal-no-image">Image not available</div>
        )}

        <div className="modal-caption">
            {selectedWork.title && (
                <div className="modal-title">{selectedWork.url ? (<a href={selectedWork.url} target="_blank" rel="noopener noreferrer">
                  {selectedWork.title}
                </a>) : (
                  selectedWork.title
                )}</div>
            )}

            <div className="modal-meta">
                {selectedWork.created_date ? (
                <span>{selectedWork.created_date}</span>
                ) : null}

                {selectedWork.collection_name ? (
                <span> · {selectedWork.collection_name}</span>
                ) : null}
            </div>

            {selectedWork.description ? (
                <div className="modal-description">
                {selectedWork.description}
                </div>
            ) : null}
            </div>
      </div>
    </div>
  );
};

export default Modal;