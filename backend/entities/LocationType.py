from entities.BaseEntity import BaseEntity


class LocationType(BaseEntity):
    TABLE_NAME = "location_types"
    FIELDS = [
        "id",
        "label"
    ]
    KEYWORDS = {
        # City group
        "city": "city",
        "town": "town",
        "capital": "city",
        "village": "village",
        "urban": "city",
        "metropolis": "city",
        "human settlement": "city",
        "locality": "district",
        "borough": "district",
        "quarter": "district",
        "arrondissement": "district",
        "neighborhood": "district",
        "suburb": "district",
        "local identity nucleus": "district",
        "cadastral populated place": "district",
        "principal area": "district",
        "area of london": "district",
        "stadtbezirk": "district",
        "Ortsteil": "district",
        "canton": "district",
        "settlement": "district",
        "établissement": "district",
        "ward of ": "district",
        "chef-lieu": "district",
        "cadastral area": "district",
        "rural community": "district",
        # Regional group
        "commune": "region",
        "province": "region",
        "district": "region",  # genel anlamda
        "county": "region",
        "region": "region",
        "state": "region",
        "municipality": "region",
        "municipal": "region",
        "department of": "region",
        "parish": "region",
        "federal territory": "region",
        "regency": "region",
        "territory": "region",
        "territorial": "region",
        "prefecture": "region",
        "unitary authority area": "region",
        "administrative centre": "region",
        "administrative division": "region",
        "federative entity": "region",
        "federative unit": "region",
        "seat of government": "region",
        "centre of oblast": "region",
        "oblast seat": "region",
        "civil parish": "region",
        "council": "region",
        "chef-lieu": "region",
        "neighbourhood of ": "region",
        # Infrastructure
        "railway": "infrastructure",
        "station": "infrastructure",
        "airport": "infrastructure",
        "dock": "infrastructure",
        "port": "infrastructure",
        "road": "infrastructure",
        "street": "infrastructure",
        "boulevard": "infrastructure",
        "square": "infrastructure",
        # Cultural / Institutional
        "art academy": "academy",
        "educational": "institution",
        "museum": "museum",
        "gallery": "museum",
        "university": "university",
        "college": "institution",
        "school": "school",
        "high school": "school",
        "École": "school",
        "kindergarten": "school",
        "institution": "institution",
        "institute": "institution",
        "faculty": "university",
        "academy": "academy",
        "conservatory": "conservatory",
        "gymnasium": "institution",
        "academy of fine arts": "academy",
        "technical university": "university",
        "école": "school",
        "lycée": "school",
        "liceo": "school",
        "Hochschule": "school",
        # Buildings
        "castle": "castle",
        "palace": "palace",
        "house": "building",
        "home": "building",
        "apartment": "building",
        "building": "building",
        "tower": "building",
        "studio": "studio",
        "mansion": "mansion",
        "villa": "building",
        # Landmarks
        "church": "landmark",
        "cemetery": "landmark",
        "monastery": "landmark",
        "park": "landmark",
        "abbey": "landmark",
        "temple": "landmark",
        # Geography / Natural
        "island": "island",
        "archipelago": "island",
        "peninsula": "geography",
        "cape": "geography",
        "valley": "geography",
        "hill": "geography",
        "mountain": "geography",
        "mountain range": "geography",
        "lake": "waterbody",
        "river": "waterbody",
        # Country-level
        "country": "country",
        "sovereign state": "country",
        "federal republic": "country",
        "republic": "country",
        "autonomous republic": "country",
        "commonwealth realm": "country",
        "crown colony": "country",
        "dominion": "country",
        "empire": "country",
    }

 

    def _normalize_location_type(self, label):
        if not label or not isinstance(label, str):
            return None

        label_lower = label.lower().strip()

        for keyword, norm_type in LocationType.KEYWORDS.items():
            if keyword in label_lower:
                return norm_type

        return None

    


def __repr__(self):
    return f"<LocationType {self.id or self.label}>"
