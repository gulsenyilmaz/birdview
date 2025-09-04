from entities.BaseEntity import BaseEntity

class State(BaseEntity):
    TABLE_NAME = "states"
    FIELDS = [
        "id",
        "name",
        "qid",
        "inception",
        "dissolution",
        "type"
    ]