
import { useEffect, useState } from "react";
import Slider from "rc-slider";
import "./TimeWindowSlider.css";
// import "./TimeSlider.css";
import "rc-slider/assets/index.css";


type Props = {
  fullRange: [number, number];       // tüm proje aralığı
  windowRange:[number, number];     // görünür pencere (örn. [1850, 1950])
  setWindowRange: (r: [number, number]) => void;
  selectedYear: number;                      // seçili yıl
  setSelectedYear: (y: number) => void;
  

};

export default function TimeWindowSlider({
  fullRange, 
  windowRange, 
  setWindowRange, 
  selectedYear, 
  setSelectedYear
 
}: Props) {

  const [alltime_minYear, alltime_maxYear] = fullRange;
  const [minYear, maxYear] = windowRange;
  const alltime_totalRange = alltime_maxYear - alltime_minYear;
  const totalRange = maxYear - minYear;
  const [zoom, setZoom] = useState(totalRange);

  useEffect(() => {
    let newYear = selectedYear;
    if (selectedYear < minYear) newYear = minYear;
    else if (selectedYear > maxYear) newYear = maxYear;

    if (newYear !== selectedYear) {
      setSelectedYear(newYear);
    }
  }, [selectedYear, minYear, maxYear]); 


  useEffect(() => {
    setZoom(maxYear - minYear);
  }, [minYear, maxYear]);
  
  const recalculateWindowRange = (n_totalRange:number) => {
    const centerYear = (minYear + maxYear) / 2;
    const halfRange = n_totalRange / 2;
    let newMin = Math.max(alltime_minYear, Math.floor(centerYear - halfRange));
    let newMax = Math.min(alltime_maxYear, Math.ceil(centerYear + halfRange));

    // Sınır kontrolleri
    if (newMin === alltime_minYear) {
      newMax = newMin + n_totalRange;
    } else if (newMax === alltime_maxYear) {
      newMin = newMax - n_totalRange;
    }

    // Eğer seçili yıl yeni aralığın dışındaysa, onu da ortala
    if (selectedYear < newMin || selectedYear > newMax) {
      const adjustedCenter = Math.min(
        Math.max(selectedYear, alltime_minYear + halfRange),
        alltime_maxYear - halfRange
      );
      newMin = Math.floor(adjustedCenter - halfRange);
      newMax = Math.ceil(adjustedCenter + halfRange);
    }

    setWindowRange([newMin, newMax]);
  }


  

  return (
    <div className="tw-container">
  
          <div className="tw-window">
            <div className="tw-year-label" style={{left: 0 }}>
              <span>{alltime_minYear}</span>
            </div>

            <Slider
                range              
                min={alltime_minYear}
                max={alltime_maxYear}
                step={10}
                value={[minYear, maxYear]}
                onChange={(vals) => {
                    const [start, end] = vals as [number, number];
                    setWindowRange([start, end]);
                }}

              
                allowCross={true}
                pushable={alltime_maxYear-alltime_minYear<100?alltime_maxYear-alltime_minYear:100}

                railStyle={{ backgroundColor: "#444441", borderRadius: 0, height: 4 }}
trackStyle={[{ backgroundColor: "#BA751560", borderRadius: 0, height: 4 }]}
                handleStyle={[
  {
    borderColor: "#EF9F27",
    borderRadius: 0,
    backgroundColor: "#2C2C2A",
    width: 10,
    height: 20,
    marginTop: -5,
    opacity: 1,
  },
  {
    borderColor: "#EF9F27",
    borderRadius: 0,
    backgroundColor: "#2C2C2A",
    width: 10,
    height: 20,
    marginTop: -5,
    opacity: 1,
  }
]}
                />
            <div className="tw-year-label"
                  style={{
                    position: "absolute",
                  left: `${((minYear - alltime_minYear) / (alltime_maxYear - alltime_minYear)) * 100}%`}}>
                    <span>{minYear}</span>
            </div>
            <div className="tw-year-label"
                 style={{
                    position: "absolute",
                    right: `${(1 - (maxYear - alltime_minYear) / (alltime_maxYear - alltime_minYear)) * 100}%`}}>
                    <span>{maxYear}</span>
            </div>

            <div className="tw-year-label"
                style={{
                      right: 0 }}>
                <span>{alltime_maxYear}</span>
            </div>
          </div>
          

          <div className="zoom-slider-wrapper">
            <span className="zoom-label"> - </span>
              <input
                  // className="zoom-slider"
                  type="range"
                  min= {100}
                  max={alltime_totalRange}
                  step={1}
                  value={zoom}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    // setZoom(v);
                    recalculateWindowRange(v);
                  }}
                />
            <span className="zoom-label"> + </span>
          </div>
          
    </div>
  );
}
