from entities.BaseEntity import BaseEntity


class HumanRelationshipType(BaseEntity):
    TABLE_NAME = "human_relationship_types"
    FIELDS = [
        "id",
        "name",
        "inverse_name"
    ]