from entities.BaseEntity import BaseEntity


class Gender(BaseEntity):
    TABLE_NAME = "genders"
    FIELDS = [
        "id", 
        "name"
    ]