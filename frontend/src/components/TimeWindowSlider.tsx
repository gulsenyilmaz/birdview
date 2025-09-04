
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
  fullRange, windowRange, setWindowRange, selectedYear, setSelectedYear, detailMode
}: Props) {

  const [minYear, maxYear] = fullRange;
  const [wStart, wEnd] = windowRange;
 



  // pencere içinde kal
  useEffect(() => {
    if (selectedYear < wStart) {
      setSelectedYear(wStart);
    } // pencereyi güncelle
    else if (selectedYear > wEnd) {
      setSelectedYear(wEnd);

    }
      
   
  }, [wStart, wEnd]); // eslint-disable-line

  // pencere genişliğine göre tick adımı
  // const step = useMemo(() => {

   
  //   const span = maxYear - minYear;
    
  //   if (span <= 50) return 1;
  //   if (span <= 150) return 5;
  //   if (span <= 400) return 10;
  //   if (span <= 1000) return 25;
  //   if (span <= 2000) return 50;
  //   return 200;
  // }, [minYear, maxYear]);


  return (
    <div className={`tw-container ${detailMode ? "hide" : ""}`}>
    {/* OVERVIEW (pencere seçimi) */}
        <div className="tw-overview">
          <div className="tw-window">
            <div className="tw-year-label" style={{
                  left: 0 }}><span>{minYear}</span></div>
            
          
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
                pushable={maxYear-minYear<200?maxYear-minYear:200}

                railStyle={{ backgroundColor: "#2a2a2a74",  borderRadius:0, height: 15 }}
                trackStyle={[{ backgroundColor: "#50a6ff88", borderRadius:0, height: 15 }]}
                handleStyle={[
                    { borderColor: "#50a6ff", borderRadius:0, backgroundColor: "#50a6ff", width: 7, height: 25 },
                    { borderColor: "#50a6ff", borderRadius:0, backgroundColor: "#50a6ff", width: 7, height: 25 }
                ]}
                />

            {/* <div className="tw-window-fill"
                style={{
                left: `${((300 - minYear) / (maxYear - minYear)) * 100}%`,
                right: `${(1 - (400 - minYear) / (maxYear - minYear)) * 100}%`
               
                }}
            />

            <div className="tw-window-fill"
                style={{
                left: `${((1300 - minYear) / (maxYear - minYear)) * 100}%`,
                right: `${(1 - (1900 - minYear) / (maxYear - minYear)) * 100}%`
               
                }}
            /> */}

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
                  right: 0 }}><span>{maxYear}</span></div>
           
    
            </div>
        </div>
    </div>
  );
}
