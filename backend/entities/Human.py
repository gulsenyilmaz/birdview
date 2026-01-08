from dataparsers.StateFromWikidata import StateFromWikidata
from dataparsers.LocationFromWikidata import LocationFromWikidata
from dataparsers.EntityFromWikidata import EntityFromWikidata
from dataparsers.MovementFromWikidata import MovementFromWikidata

from entities.HumanLocation import HumanLocation
from entities.HumanLocationType import HumanLocationType
from entities.Location import Location
from entities.Occupation import Occupation
from entities.HumanOccupation import HumanOccupation
from entities.Collection import Collection
from entities.HumanCollection import HumanCollection
from entities.Gender import Gender
from entities.Movement import Movement
from entities.HumanMovement import HumanMovement

from entities.Nationality import Nationality
from entities.State import State
from entities.Citizenship import Citizenship
from entities.BaseEntity import BaseEntity


class Human(BaseEntity):
    TABLE_NAME = "humans"
    FIELDS = [
        "id",
        "name",
        "birth_date",
        "death_date",
        "nationality_id",
        "gender_id",
        "qid",
        "num_of_identifiers",
        "description",
        "img_url",
        "signature_url",
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        SPARQL_QUERY = f"""
            SELECT ?qid 
            WHERE {{
                ?person wdt:P31 wd:Q5;
                rdfs:label "{self.name}"@en;
                BIND(STRAFTER(STR(?person), "entity/") AS ?qid)
            }}
            LIMIT 1
            
            """
        self.SPARQL_QUERY = SPARQL_QUERY
    


    def update_gender(self, gender):
        gender_str = "NOT_FOUND"

        if gender:
            gender_str = gender.lower()
        else:
            self.log_results(self.id, self.name, f"❌ gender not provided.")

        gender_database_entity = Gender(
            name=gender_str, 
            cursor=self.cursor, 
            w=self.w
        )

        if gender_database_entity.id is None:
            gender_database_entity.set_data(
                {
                    "name": gender_str
                }
            )
        
        self.update({"gender_id":gender_database_entity.id})
        


    def update_nationality(self, nationality):
        nationality_str = "NOT_FOUND"

        if nationality:
            nationality_str = nationality
        else:
            self.log_results(self.id, self.name, f"❌ nationality not provided.")

        nationality_database_entity = Nationality(
            name=nationality_str, 
            cursor=self.cursor, 
            w=self.w
        )

        if nationality_database_entity.id is None:
            nationality_database_entity.set_data(
                {
                    "name": nationality_str
                }
            )

        self.update({"nationality_id":nationality_database_entity.id})



    def update_occupations(self, occupations):

        if not occupations:
            self.log_results(self.id, "", "ℹ️ no occupations")
            return
        
        for occupation in occupations:

            if not occupation:
                continue

            print("occupations-------------------------------------------------")
            occupation_wiki_entity = EntityFromWikidata(occupation)

            occupation_database_entity = Occupation(
                name=occupation_wiki_entity.name, 
                cursor=self.cursor,
                w=self.w
            )

            if occupation_database_entity.id is None:
                
                occupation_database_entity.set_data(
                    {
                        "name": occupation_wiki_entity.name
                    }
                )
                
            human_occupations_database_entity = HumanOccupation(
                human_id=self.id,
                occupation_id=occupation_database_entity.id,
                cursor=self.cursor ,
                w=self.w
            )

            if human_occupations_database_entity.id is None:
                
                human_occupations_database_entity.set_data(
                    {
                        "human_id": self.id,
                        "occupation_id": occupation_database_entity.id,
                    }
                )
                        
                


    def update_movements(self, movements):

        if not movements:
            self.log_results(self.id, "", "ℹ️ no movements")
            return

        for movement in movements:

            if not movement:
                    continue
            
            print("movements-------------------------------------------------")
            movement_wiki_entity = MovementFromWikidata(movement)
            
            movement_database_entity = Movement(
                name=movement_wiki_entity.name, 
                cursor=self.cursor,
                w=self.w 
            )
            if movement_database_entity.id is None:

                movement_database_entity.set_data(movement_wiki_entity.to_dict())

            human_movement_database_entity = HumanMovement(
                human_id = self.id, 
                movement_id = movement_database_entity.id, 
                cursor = self.cursor,
                w=self.w 
            )

            if human_movement_database_entity.id is None:
                
                human_movement_database_entity.set_data(
                    {
                        "human_id": self.id, 
                        "movement_id": movement_database_entity.id
                    }
                )
            


    def update_locations(self, locations):
        if not locations:
            self.log_results(self.id, "", "❌ Failed to fetch locations")
            return

        for location in locations:
            if  not location:
                continue
            print("locations-------------------------------------------------")

            qid = location.get("qid")

            if not qid:
                continue

            location_wiki_entity = LocationFromWikidata(qid)
            location_database_entity = Location(
                qid=qid,
                cursor=self.cursor,
                w=self.w
            )

            if location_database_entity.id is None:
                
                location_database_entity.set_data(location_wiki_entity.to_dict())
                    
            humanlocationtype_database_entity = HumanLocationType(
                name=location["relation_type"], 
                cursor=self.cursor,
                w=self.w 
            )

            if humanlocationtype_database_entity.id is None:
                
                humanlocationtype_database_entity.set_data(
                    {
                        "name": location["relation_type"]
                    }
                )
            
            humanlocation_database_entity = HumanLocation(
                human_id=self.id,
                location_id=location_database_entity.id,
                relationship_type_id=humanlocationtype_database_entity.id,
                cursor=self.cursor,
                w=self.w
            )
            if humanlocation_database_entity.id is None:
                
                humanlocation_database_entity.set_data(
                    {
                        "human_id": self.id,
                        "location_id": location_database_entity.id,
                        "relationship_type_id": humanlocationtype_database_entity.id,
                        "start_date": location["start_date"],
                        "end_date": location["end_date"],
                    }
                )
                    



    def update_uniqueplace(self, unique_place_type_id, place_qid, date):
        if not place_qid:
            self.log_results(self.id, "", "❌ Failed to fetch place")
            return

        location_wiki_entity = LocationFromWikidata(place_qid)

        print(place_qid, location_wiki_entity.name, "------------------------------------------------")
        location_database_entity = Location(
            qid=place_qid,
            cursor=self.cursor,
            w=self.w
        )

        if location_database_entity.id is None:
            location_database_entity.set_data(location_wiki_entity.to_dict())
    
        humanlocation_database_entity = HumanLocation(
                    human_id=self.id,
                    relationship_type_id=unique_place_type_id,
                    cursor=self.cursor,
                    w=self.w
                )
        if humanlocation_database_entity.id:

            humanlocation_database_entity.update(
                    {
                        "location_id": location_database_entity.id
                    }
                )
            
        else:
            
            humanlocation_database_entity.set_data(
                {
                    "human_id": self.id,
                    "location_id": location_database_entity.id,
                    "relationship_type_id": unique_place_type_id,
                    "start_date": date,
                    "end_date": date,
                }
            )
        
    def update_citizenships(self, citizenships):

        if not citizenships:
            self.log_results(self.id, "", "❌ Failed to fetch citizenships")
            return

        for state in citizenships:
            if  not state:
                continue
            print("citizenships-------------------------------------------------")

            state_wiki_entity = StateFromWikidata(state)
            state_database_entity = State(
                name=state_wiki_entity.name,
                qid=state_wiki_entity.qid,
                cursor=self.cursor,
                w=self.w 
            )

            if state_database_entity.id is None:
                
                state_database_entity.set_data(state_wiki_entity.to_dict())
                    
            
            citizenship_database_entity = Citizenship(
                human_id=self.id,
                state_id=state_database_entity.id,
                cursor=self.cursor,
                w=self.w
            )
            if citizenship_database_entity.id is None:
                
                citizenship_database_entity.set_data(
                    {
                        "human_id": self.id,
                        "state_id": state_database_entity.id
                    }
                )

    def update_collections(self, collection_ids):

        if not collection_ids:
            self.log_results(self.id, "", "❌ Failed to fetch collection_ids")
            return

        for collection_id in collection_ids:
            if  not collection_id:
                continue
            print("collections-------------------------------------------------")

            
            collection_database_entity = Collection(
                id=collection_id,
                cursor=self.cursor,
                w=self.w
            )
            if collection_database_entity.id is None:
                self.log_results(self.id, collection_database_entity.id, "❌ Failed to fetch this collection_id")
                continue

            human_collection_database_entity = HumanCollection(
                human_id=self.id,
                collection_id=collection_database_entity.id,
                cursor=self.cursor,
                w=self.w
            )
            if human_collection_database_entity.id is None:
                
                human_collection_database_entity.set_data(
                    {
                        "human_id": self.id,
                        "collection_id": collection_database_entity.id
                    }
                )

    def add_collection(self, collection_id):

        if not collection_id:
            self.log_results(self.id, "", "❌ Failed to fetch collection_id")
            return

            
        collection_database_entity = Collection(
            id=collection_id,
            cursor=self.cursor,
            w=self.w
        )
        
        if collection_database_entity.id is None:
            self.log_results(self.id, collection_database_entity.id, "❌ Failed to fetch this collection_id")
            return

        human_collection_database_entity = HumanCollection(
            human_id=self.id,
            collection_id=collection_database_entity.id,
            cursor=self.cursor,
            w=self.w
        )

        if human_collection_database_entity.id:
            self.log_results(self.id, human_collection_database_entity.id, "connection is already established")
            return
       
        human_collection_database_entity.set_data(
            {
                "human_id": self.id,
                "collection_id": collection_database_entity.id
            }
        )

    def update_from_wikidata(self, human_wiki_entity):
        self.update({
            "name": human_wiki_entity.name,
            "birth_date": human_wiki_entity.birth_date,
            "death_date": human_wiki_entity.death_date,
            "description": human_wiki_entity.description,
            "img_url": human_wiki_entity.image_url,
            "signature_url": human_wiki_entity.signature_url,
            "num_of_identifiers": human_wiki_entity.num_of_identifiers
        })
        self.update_nationality(human_wiki_entity.nationality)
        self.update_gender(human_wiki_entity.gender)        
        self.update_citizenships(human_wiki_entity.citizenships)
        self.update_locations(human_wiki_entity.locations)
        self.update_movements(human_wiki_entity.movements)
        self.update_occupations(human_wiki_entity.occupations)
        self.update_uniqueplace(4, human_wiki_entity.birth_place, human_wiki_entity.birth_date)
        self.update_uniqueplace(5, human_wiki_entity.death_place, human_wiki_entity.death_date)    


    

    # def update_notable_works(self, notable_works):

    #     if not notable_works:
    #         self.log_results(self.id, "", "❌ Failed to fetch notable_works")
    #         return

    #     for work in notable_works:
    #         if  not work:
    #             continue
    #         print("citizenships-------------------------------------------------")

    #         work_wiki_entity = WorkFromWikidata(work)
    #         work_database_entity = Work(
    #             name=state_wiki_entity.name,
    #             qid=state_wiki_entity.qid,
    #             cursor=self.cursor,
    #             w=self.w 
    #         )

    #         if state_database_entity.id is None:
                
    #             state_database_entity.set_data(state_wiki_entity.to_dict())
                    
            
    #         citizenship_database_entity = Citizenship(
    #             human_id=self.id,
    #             state_id=state_database_entity.id,
    #             cursor=self.cursor,
    #             w=self.w
    #         )
    #         if citizenship_database_entity.id is None:
                
    #             citizenship_database_entity.set_data(
    #                 {
    #                     "human_id": self.id,
    #                     "state_id": state_database_entity.id
    #                 }
    #             )

