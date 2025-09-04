import sqlite3
from entities.LocationType import LocationType

DB_PATH = "birdview.db"


class Location:
    def __init__(
        self, id=None, qid=None, name=None, latitude=None, longitude=None, cursor=None
    ):
        self.id = id
        self.qid = qid
        self.name = name
        self.description = ""
        self.image_url = ""
        self.latitude = latitude
        self.longitude = longitude
        self.type_id = None

        self.cursor = cursor

        self._getFromTable()

    def _getFromTable(self):
        conn = None
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        row = None

        # 1️⃣ Önce qid varsa, onunla eşleşeni ara
        if self.qid:
            self.cursor.execute(
                """
                SELECT id, name, lat, lon, qid, type_id
                FROM locations
                WHERE qid = ?
                LIMIT 1
            """,
                (self.qid,),
            )
            row = self.cursor.fetchone()

        # 2️⃣ qid yoksa veya eşleşme bulunamadıysa, name + lat + lon ile ara
        if (
            not row
            and self.name
            and self.latitude is not None
            and self.longitude is not None
        ):
            self.cursor.execute(
                """
                SELECT id, name, lat, lon, qid, type_id
                FROM locations
                WHERE name = ? AND lat = ? AND lon = ?
                LIMIT 1
            """,
                (self.name, self.latitude, self.longitude),
            )
            row = self.cursor.fetchone()

        if row:
            self.id = row["id"]
            self.name = row["name"]
            self.latitude = row["lat"]
            self.longitude = row["lon"]
            self.qid = row["qid"]
            self.type_id = row["type_id"]

        if conn:
            conn.close()

    def setData(self, data):
        conn = None
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        if data["instance_label"]:
            locationtype_database_entity = LocationType(
                label=data["instance_label"], cursor=self.cursor
            )
            if locationtype_database_entity.id is None:
                try:
                    locationtype_database_entity.setData(
                        {"label": data["instance_label"]}
                    )
                except Exception as e:
                    if conn:
                        conn.close()
                    print(f"Error setting location type: {e}")
                    return None

            create_fields = []
            placeholders = []
            create_values = []

            if data["qid"]:
                create_fields.append("qid")
                placeholders.append("?")
                create_values.append(data["qid"])

            if locationtype_database_entity.id:
                create_fields.append("type_id")
                placeholders.append("?")
                create_values.append(locationtype_database_entity.id)

            if data["latitude"] is not None:
                lat = round(data["latitude"], 7)
                create_fields.append("lat")
                placeholders.append("?")
                create_values.append(lat)

            if data["longitude"] is not None:
                lon = round(data["longitude"], 7)
                create_fields.append("lon")
                placeholders.append("?")
                create_values.append(lon)

            if data["name"] is not None:
                create_fields.append("name")
                placeholders.append("?")
                create_values.append(data["name"])

            if data["description"] is not None:
                create_fields.append("description")
                placeholders.append("?")
                create_values.append(data["description"])

            if data["image_url"] is not None:
                create_fields.append("image_url")
                placeholders.append("?")
                create_values.append(data["image_url"])

            if create_fields:
                create_sql = f"""
                    INSERT INTO locations ({", ".join(create_fields)})
                    VALUES ({", ".join(placeholders)})
                """
                self.cursor.execute(create_sql, create_values)

                self.id = self.cursor.lastrowid

                print("self.id ", self.id)

        if conn:
            conn.commit()
            conn.close()

    def updateData(self, updateData, conditionalData):
        conn = None
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        update_fields = []
        update_values = []

        if updateData.get("qid"):
            update_fields.append("qid = ?")
            update_values.append(updateData["qid"])

        if updateData.get("latitude") is not None:
            lat = round(updateData["latitude"], 7)
            update_fields.append("lat = ?")
            update_values.append(lat)

        if updateData.get("longitude") is not None:
            lon = round(updateData["longitude"], 7)
            update_fields.append("lon = ?")
            update_values.append(lon)

        if updateData.get("name") is not None:
            update_fields.append("name = ?")
            update_values.append(updateData["name"])

        if updateData.get("description") is not None:
            update_fields.append("description = ?")
            update_values.append(updateData["description"])

        if updateData.get("image_url") is not None:
            update_fields.append("image_url = ?")
            update_values.append(updateData["image_url"])

        conditions = []
        params = []

        if conditionalData.get("id"):
            conditions.append("id = ?")
            params.append(conditionalData["id"])

        if conditionalData.get("qid"):
            conditions.append("qid = ?")
            params.append(conditionalData["qid"])

        if conditionalData.get("latitude") is not None:
            lat = round(conditionalData["latitude"], 7)
            conditions.append("lat = ?")
            params.append(lat)

        if conditionalData.get("longitude") is not None:
            lon = round(conditionalData["longitude"], 7)
            conditions.append("lon = ?")
            params.append(lon)

        if conditionalData.get("name") is not None:
            conditions.append("name = ?")
            params.append(conditionalData["name"])

        if conditionalData.get("description") is not None:
            conditions.append("description = ?")
            params.append(conditionalData["description"])

        if conditionalData.get("image_url") is not None:
            conditions.append("image_url = ?")
            params.append(conditionalData["image_url"])

        if conditions and update_fields:
            create_sql = f"""
                UPDATE locations SET {", ".join(update_fields)}
                WHERE {" AND ".join(conditions)}
            """

            self.cursor.execute(create_sql, tuple(update_values + params))

            # UPDATE işlemlerinde lastrowid yerine rowcount kullanılır
            updated_count = self.cursor.rowcount
            print(updated_count)

        if conn:
            conn.commit()
            conn.close()

    def __repr__(self):
        desc = (
            (self.description[:40] + "...") if self.description else "(no description)"
        )
        return f"<Location {self.qid or self.id}: {desc}>"
