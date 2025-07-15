import React, { useRef, useState, useEffect } from "react";
import "./Timeline.css";

interface TimelineProps {
  children: React.ReactNode;
}

const Timeline: React.FC<TimelineProps> = ({ children }) => {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  

  const scrollAmount = 150;

  const scrollWorks = (direction: number) => {
    if (stripRef.current) {
      stripRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const updateScrollButtons = () => {
    const el = stripRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = stripRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
    }

    return () => {
      if (el) {
        el.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
      }
    };
  }, [children]);

 

  const isDragging = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stripRef.current;
    if (!el) return;

    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = stripRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  return (
    <>
      {/* {works.length > 0 ? ( */}
        <div className="timeline-strip-container">
          {canScrollLeft && (
            <button className="scroll-button left" onClick={() => scrollWorks(-1)}>
              ⟨
            </button>
          )}

          <div
            className="timeline-strip"
            ref={stripRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            {children}
          </div>

          {canScrollRight && (
            <button className="scroll-button right" onClick={() => scrollWorks(1)}>
              ⟩
            </button>
          )}
        </div>
      {/* ) : (
        <p className="no-works">No works found.</p>
      )} */}

      
    </>
  );
};

export default Timeline;
