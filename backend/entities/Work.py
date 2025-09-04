from entities.BaseEntity import BaseEntity


class Work(BaseEntity):
    TABLE_NAME = "works"
    FIELDS = [
        "id",
        "title",
        "creator_id",
        "date",
        "description",
        "image_url",
        "url",
        "created_date",
        "collection_id",
    ]
