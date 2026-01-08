from entities.BaseEntity import BaseEntity


class HumanLocation(BaseEntity):
    TABLE_NAME = "human_location"
    FIELDS = [
        "id", 
        "human_id", 
        "location_id", 
        "relationship_type_id", 
        "start_date", 
        "end_date"
    ]


