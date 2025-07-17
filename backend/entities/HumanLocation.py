import sqlite3

DB_PATH = "alive_then.db"

class HumanLocation:
    def __init__(self, human_id=None, location_id=None, relationship_type_id=None, start_date=None, end_date=None, cursor=None):
        
        self.human_id = human_id
        self.location_id = location_id
        self.relationship_type_id = relationship_type_id
        self.start_date = start_date
        self.end_date = end_date
        self.id = None

        self.cursor = cursor

        self._getFromTable()

    def _getFromTable(self):

        conn = None
        conditions = []
        params = []

        if self.human_id is not None:
            conditions.append("human_id = ?")
            params.append(self.human_id)
        if self.location_id is not None:
            conditions.append("location_id = ?")
            params.append(self.location_id)
        if self.relationship_type_id is not None:
            conditions.append("relationship_type_id = ?")
            params.append(self.relationship_type_id)
        if self.start_date is not None:
            conditions.append("start_date = ?")
            params.append(self.start_date)
        if self.end_date is not None:
            conditions.append("end_date = ?")
            params.append(self.end_date)

        if not conditions:
            return
        
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        query = f"""
            SELECT id, human_id, location_id, relationship_type_id, start_date, end_date
            FROM human_location
            WHERE {' AND '.join(conditions)}
        """
        self.cursor.execute(query, tuple(params))
        row = self.cursor.fetchone()
        
        if row:
            self.id = row["id"]
            self.human_id = row["human_id"]
            self.location_id = row["location_id"]
            self.relationship_type_id = row["relationship_type_id"]
            self.start_date = row["start_date"]
            self.end_date = row["end_date"]

        if conn:
            conn.close()

    def setData(self, data):

        conn = None

        create_fields = []
        placeholders = []
        create_values = []

        create_fields.append("human_id")
        placeholders.append("?")
        create_values.append(data["human_id"])

        create_fields.append("location_id")
        placeholders.append("?")
        create_values.append(data["location_id"])

        if data.get("relationship_type_id") is not None:
            create_fields.append("relationship_type_id")
            placeholders.append("?")
            create_values.append(data["relationship_type_id"])

        if data.get("start_date") is not None:
            create_fields.append("start_date")
            placeholders.append("?")
            create_values.append(data["start_date"])

        if data.get("end_date") is not None:
            create_fields.append("end_date")
            placeholders.append("?")
            create_values.append(data["end_date"])

        if create_fields:
            create_sql = f"""
                INSERT INTO human_location ({', '.join(create_fields)})
                VALUES ({', '.join(placeholders)})
            """
            if self.cursor is None:
                conn = sqlite3.connect(DB_PATH)
                conn.row_factory = sqlite3.Row
                self.cursor = conn.cursor()
            self.cursor.execute(create_sql, create_values)
            self.id = self.cursor.lastrowid

            if conn:
                conn.commit()
                conn.close()

    def __repr__(self):
        return f"<HumanLocation {self.id}: human {self.human_id} @ location {self.location_id}>"
