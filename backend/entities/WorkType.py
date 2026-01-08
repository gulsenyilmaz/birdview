from entities.BaseEntity import BaseEntity


class WorkType(BaseEntity):
    TABLE_NAME = "work_types"
    FIELDS = [
        "id", 
        "label"
    ]
