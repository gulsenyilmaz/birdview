from entities.BaseEntity import BaseEntity


class HumanHuman(BaseEntity):
    TABLE_NAME = "human_human"
    FIELDS = [
        "id",
        "human_id",
        "related_human_id",
        "relationship_type_id",
        "start_date",
        "end_date",
        "source_url",
        "description_json"
    ]