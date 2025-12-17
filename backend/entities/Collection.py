from entities.BaseEntity import BaseEntity


class Collection(BaseEntity):
    TABLE_NAME = "collections"
    FIELDS = [
        "id", 
        "name",
        "qid",
        "location_id",
        "type_id",
        "url"
    ]