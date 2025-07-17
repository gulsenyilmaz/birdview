from entities.BaseEntity import BaseEntity

class HumanMovement(BaseEntity):
    TABLE_NAME = "human_movement"
    FIELDS = ["id", "movement_id", "human_id"]