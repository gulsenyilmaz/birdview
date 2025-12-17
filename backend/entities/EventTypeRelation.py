from entities.BaseEntity import BaseEntity


class EventTypeRelation(BaseEntity):
    TABLE_NAME = "event_type_relation"
    FIELDS = [
        "id", 
        "event_id", 
        "type_id" 
    ]


