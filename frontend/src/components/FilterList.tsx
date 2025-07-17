import React, { useState, useEffect} from 'react';

import './FilterList.css';
// import "react-widgets/styles.css";
import NavBar from './NavBar';
import type { Movement } from "../entities/Movement";
import type { Nationality } from "../entities/Nationality";
import type { Gender } from "../entities/Gender";
import type { Occupation } from "../entities/Occupation";
import type { Human } from "../entities/Human";
import type { Location } from "../entities/Location";

interface Results{

    humans: Human[];
    locations: Location[];
}
interface FilterListProps {
  setSelectedOccupation: (obj: Occupation) => void;
  setSelectedGender: (obj: Gender) => void;
  setSelectedNationality: (obj: Nationality) => void;
  setSelectedMovement: (obj: Movement) => void;
  setSelectedObject: (obj: any) => void;
  backendUrl:string;
}

const FilterList: React.FC<FilterListProps> = ({
    setSelectedOccupation, 
    setSelectedGender,
    setSelectedNationality,
    setSelectedMovement,

    setSelectedObject,
    backendUrl

    }) => {

    const [occupations, setOccupations] = useState<Occupation[]>([]); 
    const [genders, setGenders] = useState<Gender[]>([]); 
    const [nationalities, setNationalities] = useState<Nationality[]>([]); 
    const [movements, setMovements] = useState<Movement[]>([]); 
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchResults, setSearchResults] = useState<Results | null>(null);

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [listSearchInput, setListSearchInput] = useState<string>("");
    const [listData, setListData] = useState<any[]>([]);    


    useEffect(() => {
    
        if (searchTerm.length < 2) {
            setSearchResults(null); 
            return;
        }
        else
        {
            fetch(`${backendUrl}/search?q=${encodeURIComponent(searchTerm)}`)
                .then(res => res.json())
                .then(data => {
                
                setSearchResults(data); // backend tarafında hem humans hem locations döndür
                });
        }
    }, [searchTerm]);

    useEffect(() => {

        fetch(`${backendUrl}/movements/`)
        .then(res => res.json())
        .then(data => {
            setMovements(data.movements);  // 👈 dikkat!
        });
    }, []);

    useEffect(() => {

        fetch(`${backendUrl}/occupations/`)
        .then(res => res.json())
        .then(data => {
            setOccupations(data.occupations);  // 👈 dikkat!
        });
    }, []);

    useEffect(() => {

        fetch(`${backendUrl}/genders/`)
        .then(res => res.json())
        .then(data => {
            setGenders(data.genders);  // 👈 dikkat!
        });
    }, []);

    useEffect(() => {

        fetch(`${backendUrl}/nationalities/`)
        .then(res => res.json())
        .then(data => {
            setNationalities(data.nationalities);  // 👈 dikkat!
        });
    }, []);

    

    useEffect(() => {

        switch (activeCategory) {
            case "occupations":
                setListData(occupations);
                break;
            case "genders":
                setListData(genders);
                break;
            case "nationalities":
                setListData(nationalities);
                break;
            case "movements":
                setListData(movements);
                break;
            default:
                setListData([]);
                break;
        }
        setSelectedItem(null)
        setListSearchInput("");
        
    }, [activeCategory]);


    useEffect(() => {
        
        if (activeCategory){
            
            setSearchResults(null);
            if (selectedItem) {
                
                switch (activeCategory) {
                    case "occupations":
                        setSelectedOccupation(selectedItem);
                        break;
                    case "genders":
                        setSelectedGender(selectedItem);
                        break;
                    case "nationalities":
                        setSelectedNationality(selectedItem);
                        break;
                    case "movements":
                        setSelectedMovement(selectedItem);
                        break;
                    default:
                        break;
                }
                setListData([]);
                setActiveCategory("");
                setListSearchInput("");
                setSearchTerm("");
            }    
        }
    }, [selectedItem]);

    const getSearhResultPage = (result: any) => {
        setSelectedObject(result)
        setSearchResults(null); 
        setSearchTerm("");
    };


  return (
    <>
    <div className="filter_list_panel_container">
        <NavBar
            activeCategory={activeCategory}
            setActiveCategory = {setActiveCategory}
        />
      <div className="filter_list_panel">
        {/* 🔍 SEARCH BAR */}
        {activeCategory=="searchbar" && (
            <input
                type="text"
                className="search-bar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search people or places..."
                style={{ marginBottom: "0.5rem" }}
                />
        )}
        {activeCategory && activeCategory !== "searchbar" && (
            <input
                type="text"
                placeholder={`Search ${activeCategory}...`}
                value={listSearchInput}
                onChange={(e) => setListSearchInput(e.target.value)}
                className="search-bar"
                style={{ marginBottom: "0.5rem" }}
                />
        )}
        {listData && listData.length>0 && (
            <div className="category-list">
                <ul>
                    {listData
                    .filter((item) =>
                        item.name.toLowerCase().includes(listSearchInput.toLowerCase())
                    )
                    .map((item) => (
                        <li
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={selectedItem?.id === item.id ? "selected" : ""}
                        >
                        {item.name} ({item.count})
                        </li>
                    ))}
                </ul>
            </div>
        )}
        {/* SEARCH RESULTS */}
        {searchResults && (
            <div className="search-results">
                {searchResults.humans?.length > 0 && (
                    <>
                    <h4>People</h4>
                    <ul>
                        {searchResults.humans.map((result) => (
                       <li key={`human-${result.id}`} onClick={() => getSearhResultPage(result)}>
                            👤 <strong>{result.name}</strong>
                        </li>
                        ))}
                    </ul>
                    </>
                )}

                {searchResults.locations?.length > 0 && (
                    <>
                    <h4>Places</h4>
                    <ul>
                        {searchResults.locations.map((result) => (
                        <li key={`location-${result.id}`} onClick={() => getSearhResultPage(result)}>
                            📍 <strong>{result.name}</strong>
                        </li>
                        ))}
                    </ul>
                    </>
                )}
                </div>
        )}
        {/* END OF SEARCH RESULTS */}
        </div> 
      </div>
    </>
  );
}

export default FilterList;