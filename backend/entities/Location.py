from entities.BaseEntity import BaseEntity

class Location(BaseEntity):
    TABLE_NAME = "locations"
    FIELDS = [
        "id", 
        "name", 
        "lat", 
        "lon", 
        "qid", 
        "type_id", 
        "description", 
        "image_url", 
        "logo_url",  
        "country_label", 
        "inception"
    ]

    def update_from_wikidata(self, location_wiki_entity):
        self.update({
            "name": location_wiki_entity.name,
            "lat": location_wiki_entity.lat,
            "lon": location_wiki_entity.lon,
            "description": location_wiki_entity.description,
            "image_url": location_wiki_entity.image_url,
            "logo_url": location_wiki_entity.logo_url,
            "inception": location_wiki_entity.inception
        })
     