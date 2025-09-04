from entities.BaseEntity import BaseEntity


class Movement(BaseEntity):
    TABLE_NAME = "movements"
    FIELDS = [
        "id",
        "qid",
        "name",
        "image_url",
        "description",
        "instance_label",
        "inception",
        "start_date",
        "end_date",
    ]
