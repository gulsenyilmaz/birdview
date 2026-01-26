from entities.BaseEntity import BaseEntity


class HumanOccupation(BaseEntity):
    TABLE_NAME = "human_occupation"
    FIELDS = [
        "id",
        "occupation_id", 
        "human_id",
        "is_primary"
    ]
