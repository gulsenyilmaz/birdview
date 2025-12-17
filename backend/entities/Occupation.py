from entities.BaseEntity import BaseEntity


class Occupation(BaseEntity):
    TABLE_NAME = "occupations"
    FIELDS = [
        "id", 
        "name"
    ]

