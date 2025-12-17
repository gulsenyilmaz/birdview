from entities.BaseEntity import BaseEntity


class HumanCollection(BaseEntity):
    TABLE_NAME = "human_collection"
    FIELDS = [
        "id",
        "human_id",
        "collection_id", 
        "constituent_id", 
        "url"
    ]