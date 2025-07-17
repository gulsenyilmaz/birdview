import sqlite3

DB_PATH = "alive_then.db"

class HumanOccupation:
    def __init__(self, human_id=None, occupation_id=None, cursor=None):
        
        self.human_id = human_id
        self.occupation_id = occupation_id
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
        if self.occupation_id is not None:
            conditions.append("occupation_id = ?")
            params.append(self.occupation_id)

        if not conditions:
            return
        
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        query = f"""
            SELECT human_id, occupation_id
            FROM human_occupation
            WHERE {' AND '.join(conditions)}
        """
        
        try:
            self.cursor.execute(query, tuple(params))
            row = self.cursor.fetchone()
            print(row)
            if row:
                self.id = row["human_id"] +row["occupation_id"]
                self.human_id = row["human_id"]
                self.occupation_id = row["occupation_id"]
            
        except Exception as e:

            print("e",e)
            return 

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

        create_fields.append("occupation_id")
        placeholders.append("?")
        create_values.append(data["occupation_id"])

        if create_fields:
            create_sql = f"""
                INSERT OR IGNORE INTO human_occupation ({', '.join(create_fields)})
                VALUES ({', '.join(placeholders)})
            """
            if self.cursor is None:
                conn = sqlite3.connect(DB_PATH)
                conn.row_factory = sqlite3.Row
                self.cursor = conn.cursor()
            self.cursor.execute(create_sql, create_values)
            row = self.cursor.fetchone()
            print(row)
            if row:
                self.id = row["human_id"] +row["occupation_id"]
                self.human_id = row["human_id"]
                self.occupation_id = row["occupation_id"]

            if conn:
                conn.commit()
                conn.close()

    def __repr__(self):
        return f"<HumanOccupation {self.id}: human {self.human_id} @ occupation {self.occupation_id}>"
