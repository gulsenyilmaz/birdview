from entities.BaseEntity import BaseEntity

class Event(BaseEntity):
    TABLE_NAME = "events"
    FIELDS = [
        "id", 
        "name", 
        "qid", 
        "description", 
        "start_date", 
        "end_date", 
        "type_id"
    ]
