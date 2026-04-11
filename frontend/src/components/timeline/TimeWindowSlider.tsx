
import { useEffect } from "react";
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
  detailMode?: boolean; // detay modu (varsayılan false)

};

export default function TimeWindowSlider({
  fullRange, 
  windowRange, 
  setWindowRange, 
  selectedYear, 
  setSelectedYear, 
  detailMode
}: Props) {

  const [minYear, maxYear] = fullRange;
  const [wStart, wEnd] = windowRange;

   useEffect(() => {
    let newYear = selectedYear;
    if (selectedYear < wStart) newYear = wStart;
    else if (selectedYear > wEnd) newYear = wEnd;

    if (newYear !== selectedYear) {
      setSelectedYear(newYear);
    }
  }, [selectedYear, wStart, wEnd]); 

  return (
    <div className={`tw-container ${detailMode ? "hide" : ""}`}>
  
          <div className="tw-window">
            <div className="tw-year-label" style={{left: 0 }}>
              <span>{minYear}</span>
            </div>

            <Slider
                range              
                min={minYear}
                max={maxYear}
                step={10}
                value={[wStart, wEnd]}
                onChange={(vals) => {
                    const [start, end] = vals as [number, number];
                    setWindowRange([start, end]);
                }}

              
                allowCross={true}
                pushable={maxYear-minYear<100?maxYear-minYear:100}

                railStyle={{ backgroundColor: "#827b7b74",  borderRadius:0, height: 10 }}
                trackStyle={[{ backgroundColor: "#50a6ff88", borderRadius:0, height: 10 }]}
                handleStyle={[
                    { borderColor: "#50a6ff", borderRadius:0, backgroundColor: "#50a6ff", width: 5, height: 20 },
                    { borderColor: "#50a6ff", borderRadius:0, backgroundColor: "#50a6ff", width: 5, height: 20 }
                ]}
                />
            <div className="tw-year-label"
                  style={{
                    position: "absolute",
                  left: `${((wStart - minYear) / (maxYear - minYear)) * 100}%`}}>
                    <span>{wStart}</span>
            </div>
            <div className="tw-year-label"
                 style={{
                    position: "absolute",
                    right: `${(1 - (wEnd - minYear) / (maxYear - minYear)) * 100}%`}}>
                    <span>{wEnd}</span>
            </div>

            <div className="tw-year-label"
                style={{
                      right: 0 }}>
                <span>{maxYear}</span>
            </div>
          </div>
          <div className="tw-period" style={{width: "3%"}}>

                {/* <h2>WORLD 101</h2>     */}
          </div>
    </div>
  );
}
