
from entities.BaseEntity import BaseEntity

class Citizenship(BaseEntity):
    TABLE_NAME = "citizenships"
    FIELDS = [
        "id",
        "human_id",
        "state_id"
    ]