from entities.BaseEntity import BaseEntity


class Nationality(BaseEntity):
    TABLE_NAME = "nationalities"
    FIELDS = [
        "id", 
        "name"
    ]
