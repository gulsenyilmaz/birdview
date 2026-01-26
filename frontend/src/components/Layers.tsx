
import LayerHistogram from "./LayerHistogram";

type YearCount = { year: number; count: number };
interface LayersProps {
    setSelectedYear: (year: number) => void;
    windowRange?: [number, number];
    aliveCounts?: YearCount[];
}

const Layers: React.FC<LayersProps> = ({
 setSelectedYear,
  windowRange = [1200, 2025],
  aliveCounts = [],   
 
}) => {

    return(

        <div className="layer-container">

            <LayerHistogram
                  
                  setSelectedYear={setSelectedYear}
                  windowRange={windowRange}
                  aliveCounts={aliveCounts}
                  binAggregation="sum"  
                  layerTypeName ="HUMANS"             
                           
                />
            <div>
                <label>
                    <input
                        type="checkbox"
                        
                    />
                    WARS
                    </label>
            </div>
             
        </div>
    )


    };

export default Layers;