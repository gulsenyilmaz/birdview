import React, { useState, useEffect, useRef} from 'react';
import './FilterList.css';
// import "react-widgets/styles.css";
import NavBar from './NavBar';
import type { Movement } from "../entities/Movement";
import type { Nationality } from "../entities/Nationality";
import type { Gender } from "../entities/Gender";
import type { Occupation } from "../entities/Occupation";
import type { Human } from "../entities/Human";
import type { Location } from "../entities/Location";
import type { Collection } from "../entities/Collection";

interface Results{

    humans: Human[];
    locations: Location[];
    events: any[];
}
interface FilterListProps {
    selectedOccupation:Occupation| null;
    selectedGender:Gender| null;
    selectedNationality:Nationality| null;
    selectedMovement:Movement| null;
    selectedCollection:Collection| null;
    setSelectedOccupation: (obj: Occupation) => void;
    setSelectedGender: (obj: Gender) => void;
    setSelectedNationality: (obj: Nationality) => void;
    setSelectedMovement: (obj: Movement) => void;
    setSelectedCollection: (obj: Collection) => void;
    setSelectedObject: (obj: any) => void;
    backendUrl:string;
    setMovements: (movements: Movement[]) => void;
    movements: Movement[];
}

const FilterList: React.FC<FilterListProps> = ({
    selectedOccupation,
    selectedGender,
    selectedNationality,
    selectedMovement,
    selectedCollection,
    setSelectedOccupation, 
    setSelectedGender,
    setSelectedNationality,
    setSelectedMovement,
    setSelectedCollection,

    setSelectedObject,
    backendUrl,
    setMovements,
    movements

    }) => {

    const [occupations, setOccupations] = useState<Occupation[]>([]); 
    const [genders, setGenders] = useState<Gender[]>([]); 
    const [nationalities, setNationalities] = useState<Nationality[]>([]); 
    const [collections, setCollections] = useState<Collection[]>([]); 
    
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchResults, setSearchResults] = useState<Results | null>(null);

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [listSearchInput, setListSearchInput] = useState<string>("");
    const [listData, setListData] = useState<any[]>([]);    

    const panelRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

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

        const queryParams = new URLSearchParams();

        if (selectedOccupation) queryParams.append("occupation_id", String(selectedOccupation.id));
        if (selectedGender) queryParams.append("gender_id", String(selectedGender.id));
        if (selectedNationality) queryParams.append("nationality_id", String(selectedNationality.id));
        if (selectedCollection) queryParams.append("collection_id", String(selectedCollection.id));

        fetch(`${backendUrl}/movements/?${queryParams.toString()}`)
        .then(res => res.json())
        .then(data => {
            setMovements(data.movements);  // 👈 dikkat!
        });
    }, [selectedGender,selectedOccupation,selectedNationality,selectedCollection]);

    useEffect(() => {

        const queryParams = new URLSearchParams();

        if (selectedMovement) queryParams.append("movement_id", String(selectedMovement.id));
        if (selectedGender) queryParams.append("gender_id", String(selectedGender.id));
        if (selectedNationality) queryParams.append("nationality_id", String(selectedNationality.id));
        if (selectedCollection) queryParams.append("collection_id", String(selectedCollection.id));

        fetch(`${backendUrl}/occupations/?${queryParams.toString()}`)
        .then(res => res.json())
        .then(data => {
            setOccupations(data.occupations);  // 👈 dikkat!
        });
    }, [selectedGender,selectedNationality,selectedMovement,selectedCollection]);

    useEffect(() => {

        const queryParams = new URLSearchParams();

        if (selectedOccupation) queryParams.append("occupation_id", String(selectedOccupation.id));
        if (selectedMovement) queryParams.append("movement_id", String(selectedMovement.id));
        if (selectedNationality) queryParams.append("nationality_id", String(selectedNationality.id));
        if (selectedCollection) queryParams.append("collection_id", String(selectedCollection.id));

        fetch(`${backendUrl}/genders/?${queryParams.toString()}`)
        .then(res => res.json())
        .then(data => {
            setGenders(data.genders);  // 👈 dikkat!
        });
    }, [selectedMovement,selectedOccupation,selectedNationality,selectedCollection]);

    useEffect(() => {

        const queryParams = new URLSearchParams();

        if (selectedOccupation) queryParams.append("occupation_id", String(selectedOccupation.id));
        if (selectedGender) queryParams.append("gender_id", String(selectedGender.id));
        if (selectedMovement) queryParams.append("movement_id", String(selectedMovement.id));
        if (selectedCollection) queryParams.append("collection_id", String(selectedCollection.id));

        fetch(`${backendUrl}/nationalities/?${queryParams.toString()}`)
        .then(res => res.json())
        .then(data => {
            setNationalities(data.nationalities);  // 👈 dikkat!
        });
    }, [selectedGender, selectedMovement, selectedOccupation, selectedCollection]);

    useEffect(() => {

        const queryParams = new URLSearchParams();

        if (selectedOccupation) queryParams.append("occupation_id", String(selectedOccupation.id));
        if (selectedGender) queryParams.append("gender_id", String(selectedGender.id));
        if (selectedMovement) queryParams.append("movement_id", String(selectedMovement.id));
        if (selectedNationality) queryParams.append("nationality_id", String(selectedNationality.id));

        fetch(`${backendUrl}/collections/?${queryParams.toString()}`)
        .then(res => res.json())
        .then(data => {
            setCollections(data.collections);  // 👈 dikkat!
        });
    }, [selectedGender, selectedMovement, selectedOccupation, selectedNationality]);

    useEffect(() => {

        switch (activeCategory) {
            
            case "occupations":
                setListData(occupations);
                setSearchResults(null);  
                setSearchTerm("");
                break;
            case "genders":
                setListData(genders);
                setSearchResults(null);  
                setSearchTerm("");
                break;
            case "nationalities":
                setListData(nationalities);
                setSearchResults(null);  
                setSearchTerm("");
                break;
            case "movements":
                setListData(movements);
                setSearchResults(null);  
                setSearchTerm("");
                break;
            case "collections":
                setListData(collections);
                setSearchResults(null);  
                setSearchTerm("");
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
                    case "collections":
                        setSelectedCollection(selectedItem);
                        break;
                    default:
                        break;
                }
                clearAsInitial();
            }    
        }
    }, [selectedItem]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                clearAsInitial();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getSearhResultPage = (result: any) => {
        setSelectedObject(result)
        clearAsInitial();
    };

    const clearAsInitial = () => {

        setSearchTerm("");
        setSearchResults(null); 
        

        setListSearchInput("");
        setListData([]);

        setActiveCategory("");
    }


  return (
    <>
        <NavBar
            activeCategory={activeCategory}
            setActiveCategory = {setActiveCategory}
            panelRef={panelRef}
        >
 
        {activeCategory  && (
            <div className="filter_list_panel" >
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
                {activeCategory !== "searchbar" && (
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
                                    👤 <strong>{result.name}({result.id})</strong>
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

                        {searchResults.events?.length > 0 && (
                            <>
                            <h4>Events</h4>
                            <ul>
                                {searchResults.events.map((result) => (
                                <li key={`event-${result.id}`} onClick={() => getSearhResultPage(result)}>
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
        )}
      </NavBar>
    </>
  );
}

export default FilterList;