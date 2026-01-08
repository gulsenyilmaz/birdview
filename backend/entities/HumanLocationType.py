from entities.BaseEntity import BaseEntity


class HumanLocationType(BaseEntity):
    TABLE_NAME = "human_location_types"
    FIELDS = [
        "id", 
        "name"
    ]

