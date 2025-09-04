from entities.BaseEntity import BaseEntity


class Location(BaseEntity):
    TABLE_NAME = "locations"
    FIELDS = [
        "id", 
        "name", 
        "lat", 
        "lon", 
        "qid", 
        "type_id", 
        "description", 
        "image_url", 
        "logo_url",  
        "country_label", 
        "inception"
    ]
