from entities.BaseEntity import BaseEntity
from dataparsers.LocationFromWikidata import LocationFromWikidata
from fastapi import HTTPException

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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        SPARQL_QUERY = f"""
            SELECT ?qid 
            WHERE {{
                ?location
                rdfs:label "{self.name}"@en;
                BIND(STRAFTER(STR(?location), "entity/") AS ?qid)
            }}
            LIMIT 1
            
            """
        self.SPARQL_QUERY = SPARQL_QUERY

    def update_from_wikidata(self, location_wiki_entity):

        if self.qid is None:
            raise HTTPException(
                status_code=404,
                detail=f"Location {self.id} not found"
            )

        try:
            location_wiki_entity = LocationFromWikidata(self.qid)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Wikidata fetch failed: {str(e)}"
            )


        self.update({
            "name": location_wiki_entity.name,
            "lat": location_wiki_entity.lat,
            "lon": location_wiki_entity.lon,
            "description": location_wiki_entity.description,
            "image_url": location_wiki_entity.image_url,
            "logo_url": location_wiki_entity.logo_url,
            "inception": location_wiki_entity.inception
        })
     