
import { FaSearch } from "react-icons/fa";
import "./NavBar.css";

interface NavBarProps {
  setActiveCategory: (obj: string) => void;
  activeCategory: string;
}

const NavBar: React.FC<NavBarProps> = ({ 
    setActiveCategory, 
    activeCategory  

}) => {
  const categories = ["Occupations", "Genders", "Nationalities", "Movements"];

  return (

    <div className="nav-bar">
        <div className="nav-left">
            {categories.map((cat) => (
            <button
                key={cat}
                className={`nav-button ${activeCategory === cat.toLowerCase() ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.toLowerCase())}
            >
                {cat.toUpperCase()}
            </button>
            ))}
        </div>

        <div className="nav-right">
            <button
                className={`nav-button search-btn ${activeCategory === "searchbar" ? "active" : ""}`}
                onClick={() => setActiveCategory("searchbar")}
            >
             <FaSearch />
            </button>
        </div>
    </div>
    );
};

export default NavBar;
