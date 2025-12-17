from entities.BaseEntity import BaseEntity


class EventType(BaseEntity):
    TABLE_NAME = "event_types"
    FIELDS = [
        "id", 
        "name", 
        "description", 
        "qid"
    ]
