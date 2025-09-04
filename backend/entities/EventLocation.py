from entities.BaseEntity import BaseEntity


class EventLocation(BaseEntity):
    TABLE_NAME = "event_location"
    FIELDS = [
        "id", 
        "event_id", 
        "location_id", 
        "start_date", 
        "end_date", 
        "relationship_type_id",
        "description_json"
    ]
