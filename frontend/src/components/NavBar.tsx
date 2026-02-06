
import { FaSearch } from "react-icons/fa";
import "./NavBar.css";


interface NavBarProps {
  setActiveCategory: (obj: string) => void;
  activeCategory: string;
  panelRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  
}

const NavBar: React.FC<NavBarProps> = ({ 
    setActiveCategory, 
    activeCategory,
    panelRef,
    children  

}) => {
  const categories = ["Occupations", "Genders", "Nationalities", "Movements", "Collections"];

  return (

    <div className="nav-bar">
      
        {categories.map((cat) => (
            <div key={cat} className="nav-category">
                <button
                    
                    className={`nav-button ${activeCategory === cat.toLowerCase() ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat.toLowerCase())}
                >
                    {cat.toUpperCase()}
                </button>
                <div className={`nav-category-content ${activeCategory === cat.toLowerCase() ? "active" : ""}`} ref={activeCategory === cat.toLowerCase() ? panelRef : null}>
                    
                    {children}
                </div>
            </div>
            
        ))}

        <button
            className={`nav-button search-btn ${activeCategory === "searchbar" ? "active" : ""}`}
            onClick={() => setActiveCategory("searchbar")}
        >
            <FaSearch />
        </button>
        <div className={`nav-category-content ${activeCategory === "searchbar" ? "active" : ""}`}>
            {children}
        </div>
    </div>
    );
};

export default NavBar;
