from entities.BaseEntity import BaseEntity


class MilitaryEventLocation(BaseEntity):
    TABLE_NAME = "militaryevent_location"
    FIELDS = [
        "id", 
        "event_id", 
        "location_id"
    ]
