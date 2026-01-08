from entities.BaseEntity import BaseEntity


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
        "qid"
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
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
        self.update({
            "qid": work_wiki_entity.qid,
            "description": work_wiki_entity.description,
            "image_url": work_wiki_entity.image_url,
            "created_date": work_wiki_entity.inception,
            
        })
         
   