from entities.BaseEntity import BaseEntity
from dataparsers.WorkFromWikidata import WorkFromWikidata
from dataparsers.LocationFromWikidata import LocationFromWikidata
from entities.WorkType import WorkType
from entities.Location import Location
from fastapi import HTTPException


class Work(BaseEntity):
    TABLE_NAME = "works"
    FIELDS = [
        "id",
        "title",
        "creator_id",
        "date",
        "description",
        "image_url",
        "url",
        "created_date",
        "collection_id",
        "type_id",
        "qid",
        "constituent_id",
        "location_id"
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        SPARQL_QUERY =""""""

        if self.title is not None and self.qid is None:
            SPARQL_QUERY = f"""
                SELECT ?qid 
                WHERE {{
                    BIND(wd:Q38757 AS ?author)
                    ?book wdt:P50 ?author .
                    ?book rdfs:label ?lbl .
                    FILTER(LANG(?lbl)="en" && LCASE(STR(?lbl)) = "{self.title.lower()}")  
                    FILTER NOT EXISTS {{ ?book wdt:P31 ?bType. 
                                        VALUES ?bType {{
                                        wd:Q3331189
                                        wd:Q7777570
                                        wd:Q125309905
                                        wd:Q21112633
                                        wd:Q7553
                                        }} 
                                    }} 

                    BIND(STRAFTER(STR(?book), "entity/") AS ?qid)
                    BIND(xsd:integer(SUBSTR(?qid, 2)) AS ?qidNum)

                    }}
                ORDER BY ASC(?qidNum)
                LIMIT 1
                
                """
        self.SPARQL_QUERY = SPARQL_QUERY

    def update_from_wikidata(self, work_wiki_entity):
        try:
            work_qid = self.get_wikidata_qid()
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"Work {self.id} not found"
            )
        self.update({
            "qid": work_wiki_entity.qid,
            "description": work_wiki_entity.description,
            "image_url": work_wiki_entity.image_url,
            "created_date": work_wiki_entity.inception,
            
        })
    
    def update_type(self, type_name):
        
        if type_name is None:
            return
        
        work_type = WorkType(
                label=type_name, 
                cursor=self.cursor,
                w=self.w 
            )
        
        if work_type.id is None:
            work_type.set_data({
                "label": type_name
            })

        self.update({
            "type_id": work_type.id
        })
    
    def update_location(self, location_name):
      
            if  not location_name:
                return
            print("locations-------------------------------------------------")

            location_database_entity = Location(
                name=location_name,
                cursor=self.cursor,
                w=self.w
            )

            if location_database_entity.id is None:

                l_qid = location_database_entity.get_wikidata_qid()
                location_wiki_entity = LocationFromWikidata(l_qid)

                if location_wiki_entity is None:
                    self.log_results(
                        self.id,
                        location_name,
                        "❌ Failed to fetch location"
                    )
                    return
                else:
                    location_database_entity.set_data(location_wiki_entity.to_dict())

            self.update({
                "location_id": location_database_entity.id
            })
                    

         
   