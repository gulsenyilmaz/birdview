from dataparsers.StateFromWikidata import StateFromWikidata
from dataparsers.LocationFromWikidata import LocationFromWikidata
from dataparsers.EntityFromWikidata import EntityFromWikidata
from dataparsers.MovementFromWikidata import MovementFromWikidata
from dataparsers.HumanFromWikidata import HumanFromWikidata
from fastapi import HTTPException

from entities.HumanLocation import HumanLocation
from entities.HumanHuman import HumanHuman
from entities.HumanRelationshipType import HumanRelationshipType
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
       
        
        self.SPARQL_QUERY = self.build_label_query(self.name, "en")
    
    
    
    def build_label_query(self, name: str, lang: str) -> str:
        
        return f"""
            SELECT ?qid WHERE {{
                ?person wdt:P31 wd:Q5 .
                
                {{
                    ?person rdfs:label "{name}"@{lang}
                }}
                UNION
                {{
                    ?person skos:altLabel "{name}"@{lang}
                }}
                
                BIND(STRAFTER(STR(?person), "entity/") AS ?qid)
                }}
                LIMIT 1
        """
    
    def sparql_escape(self, s: str) -> str:
        return s.replace("\\", "\\\\").replace('"', '\\"')
    
    def get_wikidata_qid_by_langs(self):
        langs = ["en","tr","it","fr","de","es","pt","nl","ru","ar","fa","el","pl","sv","no","da","fi","cs","hu","ro","bg","uk","he","ja","zh","ko","sq","sr", "hr", "bs"]
        safe_name = self.sparql_escape(self.name)
        for lang in langs:
            print("looking for qid---------------------------", lang)
            self.SPARQL_QUERY = self.build_label_query(safe_name, lang)
            qid = self.get_wikidata_qid()   
            if qid:
                print("found a qid---------------------------", qid)
                return qid
        return None

    def update_gender(self, gender):
        gender_str = "NOT_FOUND"

        if gender:
            gender_str = gender.lower()
        else:
            self.log_results(f"❌ gender not provided.")

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
            nationality_str = nationality.split("-")[1].strip() if "-" in nationality else nationality
            nationality_str = nationality_str.split("–")[1].strip() if "–" in nationality_str else nationality_str
            nationality_str = nationality_str.split(",")[0].strip() if "," in nationality_str else nationality_str
            nationality_str = nationality_str.split(";")[0].strip() if ";" in nationality_str else nationality_str
        else:
            self.log_results(f"❌ nationality not provided.")

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

        if nationality_database_entity.id is None:

            self.log_results(f"❌ there is no {nationality_str} in the database.")
            return

        current_id = int(self.nationality_id) if self.nationality_id is not None else None
        new_id = int(nationality_database_entity.id)
        if current_id != new_id:

            self.update({"nationality_id":nationality_database_entity.id})
            return
        

    def check_primary_occupations(self, description):
        if not description:
            self.log_results("❌ Failed to fetch description for primary occupation")
            return
        
        found_occupations = []
        for occupation_name in Occupation.ARTIST_OCCUPATIONS + Occupation.OTHER_OCCUPATIONS + Occupation.GENERAL_OCCUPATIONS:
            if occupation_name in description:
                found_occupations.append(occupation_name)
      
        for key in Occupation.TO_CHANGE.keys():
            if key in description:
                found_occupations.append(Occupation.TO_CHANGE[key])

        if found_occupations:
            for occupation_name in found_occupations:
                    self.add_occupation(occupation_name, 1)


    def update_occupations(self, occupations, description):

        if not occupations:
            self.log_results("ℹ️ no occupations")
            return
        
        for occupation in occupations:

            if not occupation:
                continue

            print("occupations-------------------------------------------------")
            occupation_wiki_entity = EntityFromWikidata(occupation)
            is_primary = 0

            if occupation_wiki_entity.name in description:
                is_primary = 1

            self.add_occupation(occupation_wiki_entity.name,is_primary)

                        
    def add_occupation(self, occupation_name, is_primary=False):

        if not occupation_name:
            self.log_results("❌ Failed to fetch occupation_name")
            return
        
        for key in Occupation.TO_CHANGE.keys():
            if key in occupation_name:
                occupation_name = Occupation.TO_CHANGE[key]

            
        occupation_database_entity = Occupation(
            name=occupation_name,
            cursor=self.cursor,
            w=self.w
        )

        if occupation_database_entity.id is None:
            self.log_results("❌ Failed to fetch this occupation_id")

            occupation_database_entity.set_data(
                {
                    "name": occupation_name
                }
            )   
           
        human_occupation_database_entity = HumanOccupation(
            human_id=self.id,
            occupation_id=occupation_database_entity.id,
            cursor=self.cursor,
            w=self.w
        )

        if human_occupation_database_entity.id:
            human_occupation_database_entity.update(
                {"is_primary": is_primary}
            )
            return
       
        human_occupation_database_entity.set_data(
            {
                "human_id": self.id,
                "occupation_id": occupation_database_entity.id,
                "is_primary": is_primary
            }
        )          


    def update_movements(self, movements):

        if not movements:
            self.log_results("ℹ️ no movements")
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
            self.log_results("ℹ️ no locations")
            return

        for location in locations:
            if  not location:
                continue
            print("locations-------------------------------------------------")

            qid = location.get("qid")

            if not qid:
                continue

            
            location_database_entity = Location(
                qid = qid,
                cursor = self.cursor,
                w = self.w
            )

            if location_database_entity.id is None:
                location_wiki_entity = LocationFromWikidata(qid)
                location_database_entity.set_data(location_wiki_entity.to_dict())
                    
            humanlocationtype_database_entity = HumanLocationType(
                name = location["relation_type"], 
                cursor = self.cursor,
                w = self.w 
            )

            if humanlocationtype_database_entity.id is None:
                
                humanlocationtype_database_entity.set_data(
                    {
                        "name": location["relation_type"]
                    }
                )
            
            humanlocation_database_entity = HumanLocation(
                human_id = self.id,
                location_id = location_database_entity.id,
                relationship_type_id = humanlocationtype_database_entity.id,
                cursor = self.cursor,
                w = self.w
            )
            if humanlocation_database_entity.id is None:
                
                humanlocation_database_entity.set_data(
                    {
                        "human_id": self.id,
                        "location_id": location_database_entity.id,
                        "relationship_type_id": humanlocationtype_database_entity.id,
                        "start_date": location["start_date"],
                        "end_date": location["end_date"],
                        "source_url": location["source_url"] if location["source_url"] else "",
                    }
                )

    def update_relatives(self, relatives):
        if not relatives:
            self.log_results("ℹ️ no relatives")
            return

        for relative in relatives:
            if  not relative:
                continue
            

            qid = relative.get("qid")

            if not qid:
                continue

            relative_database_entity = Human(
                qid = qid,
                cursor = self.cursor,
                w = self.w
            )

            if relative_database_entity.id is None:
                relative_database_entity.save_from_wikidata(qid)

            
                
                    
            humanrelationshiptype_database_entity = HumanRelationshipType(
                name = relative["relation_type"], 
                cursor = self.cursor,
                w = self.w 
            )

            if humanrelationshiptype_database_entity.id is None:
                
                humanrelationshiptype_database_entity.set_data(
                    {
                        "name": relative["relation_type"]
                    }
                )

            relative_database_entity.log_results(humanrelationshiptype_database_entity.name)
            
            humanhuman_database_entity = HumanHuman(
                human_id = self.id,
                related_human_id = relative_database_entity.id,
                relationship_type_id = humanrelationshiptype_database_entity.id,
                cursor = self.cursor,
                w = self.w
            )
            if humanhuman_database_entity.id is None:
                
                humanhuman_database_entity.set_data(
                    {
                        "human_id": self.id,
                        "related_human_id": relative_database_entity.id,
                        "relationship_type_id": humanrelationshiptype_database_entity.id,
                        "start_date": relative["start_date"],
                        "end_date": relative["end_date"],
                        "source_url": relative["source_url"] if relative["source_url"] else "",
                    }
                )                



    def update_uniqueplace(self, unique_place_type_id, place_qid, date):
        if not place_qid:
            
            self.log_results(f"ℹ️ no qid for unique place: {unique_place_type_id}")
            return

        
        location_database_entity = Location(
            qid=place_qid,
            cursor=self.cursor,
            w=self.w
        )

        if location_database_entity.id is None:
            location_wiki_entity = LocationFromWikidata(place_qid)

            print(place_qid, location_wiki_entity.name, "------------------------------------------------")
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
            self.log_results("ℹ️ no citizenships")
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
            self.log_results("❌ Failed to fetch collection_ids")
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
                self.log_results("❌ Failed to fetch this collection_id")
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

    def add_collection(self, collection_id, constituent_id):

        if not collection_id:
            self.log_results("❌ Failed to fetch collection_id")
            return

            
        collection_database_entity = Collection(
            id=collection_id,
            cursor=self.cursor,
            w=self.w
        )
        
        if collection_database_entity.id is None:
            self.log_results("❌ Failed to fetch this collection_id")
            return

        human_collection_database_entity = HumanCollection(
            human_id=self.id,
            collection_id=collection_database_entity.id,
            cursor=self.cursor,
            w=self.w
        )

        if human_collection_database_entity.id:
            human_collection_database_entity.update(
                {"constituent_id": constituent_id}
            )
            return
       
        human_collection_database_entity.set_data(
            {
                "human_id": self.id,
                "collection_id": collection_database_entity.id,
                "constituent_id": constituent_id
            }
        )

    def get_collections(self):

        try:
            if not self.id:
                return []
            query = f"""
                SELECT collection_id, constituent_id FROM human_collection
                WHERE human_id=?
            """
            self.cursor.execute(query, (self.id,))
            return [dict(row) for row in self.cursor.fetchall()]

        except Exception as e:
            self.log_results(
                f"❌ error in human_collection table:{str(e)}",
            )
            return []


        


    def save_from_wikidata(self, qid):

        if not qid:
            # self.log_results("", "", f"❌ {self.name}: qid id not given")
            return
        
        self.qid = qid

        try:
            human_wiki_entity = HumanFromWikidata(self.qid)

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Wikidata fetch failed: {str(e)}"
            )
        
        if human_wiki_entity.instance_qid != "Q5":
            # self.log_results("", "", f"❌ {self.name} is not human")
            
            
            return

        self.set_data(
            {   
                "name": human_wiki_entity.name,
                "qid": human_wiki_entity.qid,
                "description": human_wiki_entity.description,
                "img_url": human_wiki_entity.image_url,
                "signature_url": human_wiki_entity.signature_url,
                "birth_date": human_wiki_entity.birth_date,
                "death_date": human_wiki_entity.death_date,
                "num_of_identifiers": human_wiki_entity.num_of_identifiers
            }
        )  
        
        self.update_nationality(human_wiki_entity.nationality)
        self.update_gender(human_wiki_entity.gender)
        self.update_citizenships(human_wiki_entity.citizenships)
        self.update_locations(human_wiki_entity.locations)
        self.update_movements(human_wiki_entity.movements)
        self.update_occupations(human_wiki_entity.occupations,human_wiki_entity.description)
        self.check_primary_occupations(human_wiki_entity.description)
        self.update_uniqueplace(4, human_wiki_entity.birth_place, human_wiki_entity.birth_date)
        self.update_uniqueplace(5, human_wiki_entity.death_place, human_wiki_entity.death_date) 
        # self.update_relatives(human_wiki_entity.relatives)

    def update_from_wikidata(self):
        print("update_from_wikidata---------------------------",self.name)
        qid = self.qid

        if qid is None or qid == "NOT_FOUND":
            print("looking for qid---------------------------", "")
            qid = self.get_wikidata_qid_by_langs()
            
            if not qid:
                
                self.update({
                            "qid": "NOT_FOUND_AGAIN"
                        })
                return
            
        try:
            human_wiki_entity = HumanFromWikidata(qid)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Wikidata fetch failed: {str(e)}"
            )

        self.update(
            {
                "qid": human_wiki_entity.qid,
                "name": human_wiki_entity.name,
                "birth_date": human_wiki_entity.birth_date,
                "death_date": human_wiki_entity.death_date,
                "description": human_wiki_entity.description,
                "img_url": human_wiki_entity.image_url,
                "signature_url": human_wiki_entity.signature_url,
                "num_of_identifiers": human_wiki_entity.num_of_identifiers
            }
        )
        # self.update_nationality(human_wiki_entity.nationality)
        # self.update_gender(human_wiki_entity.gender)        
        # self.update_citizenships(human_wiki_entity.citizenships)
        self.update_locations(human_wiki_entity.locations)
        # self.update_movements(human_wiki_entity.movements)
        # self.update_occupations(human_wiki_entity.occupations, human_wiki_entity.description)
        # self.check_primary_occupations(human_wiki_entity.description)
        self.update_uniqueplace(4, human_wiki_entity.birth_place, human_wiki_entity.birth_date)
        self.update_uniqueplace(5, human_wiki_entity.death_place, human_wiki_entity.death_date) 
        self.update_relatives(human_wiki_entity.relatives)

    def update_from_wikidata_birth_death_place(self):
        print("update_from_wikidata---------------------------")
        qid = self.qid

        if qid is None or qid == "NOT_FOUND":
            qid = self.get_wikidata_qid()
            
            if  not qid:
                raise HTTPException(
                    status_code=404,
                    detail=f"Qid for human ({self.id}) not found"
                )
            print("qid---------------------------", qid)

        try:
            human_wiki_entity = HumanFromWikidata(qid)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Wikidata fetch failed: {str(e)}"
            )

        self.update_uniqueplace(4, human_wiki_entity.birth_place, human_wiki_entity.birth_date)
        self.update_uniqueplace(5, human_wiki_entity.death_place, human_wiki_entity.death_date)   
     
    def _delete_relations(self):
        """remove every row in the tables that refer to this human."""
        # add new relation‑classes here as you create them
        related = (
            HumanCollection,      # collections the person belongs to
            HumanLocation,        # places, birth/death …
            HumanMovement,        # e.g. “member of movement X”
            HumanOccupation,      # occupations
            Citizenship,          # states/citizenships
            # …etc.
        )

        for rel in related:
            rel_obj = rel(human_id=self.id,
                          cursor=self.cursor,
                          w=self.w)
            # keep deleting until no more rows for this human
            while rel_obj.id:
                rel_obj.delete()
                rel_obj = rel(human_id=self.id,
                              cursor=self.cursor,
                              w=self.w)
                

    def delete(self):
        # clear out all of the join tables first
        # self._delete_relations()

        # finally delete the human row itself
        return super().delete()
    

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

