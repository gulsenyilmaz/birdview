import sqlite3

DB_PATH = "alive_then.db"

class BaseEntity:
    TABLE_NAME = None
    FIELDS = ["id", "name"]  # subclasses should override

    def __init__(self, **kwargs):
        self.cursor = kwargs.get("cursor")
        
        # Dinamik alan oluşturma
        for field in self.FIELDS:
            setattr(self, field, kwargs.get(field))

        if self.TABLE_NAME is None:
            raise NotImplementedError("Subclass must define TABLE_NAME")

        self._get_from_table()

    def _get_from_table(self):
        conn = None
        conditions = []
        params = []

        if getattr(self, "id", None):
            conditions.append("id = ?")
            params.append(self.id)
        elif getattr(self, "name", None):
            conditions.append("name = ?")
            params.append(self.name)
        else:
            return

        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        query = f"""
            SELECT {', '.join(self.FIELDS)} FROM {self.TABLE_NAME}
            WHERE {' AND '.join(conditions)}
        """    
        self.cursor.execute(query, params)
        row = self.cursor.fetchone()

        if row:
            for field in self.FIELDS:
                setattr(self, field, row[field])

        if conn:
            conn.close()

    def set_data(self, data):
        conn = None
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        columns = [key for key in data.keys() if key in self.FIELDS and key != "id"]
        values = [data[col] for col in columns]

        placeholders = ", ".join(["?"] * len(values))
        col_string = ", ".join(columns)

        query = f"INSERT INTO {self.TABLE_NAME} ({col_string}) VALUES ({placeholders})"
        self.cursor.execute(query, values)

        self.id = self.cursor.lastrowid
        for key in data:
            setattr(self, key, data[key])

        if conn:
            conn.commit()
            conn.close()

    def __repr__(self):
        if hasattr(self, "name"):
            return f"<{self.__class__.__name__} {self.id}: {self.name}>"
        return f"<{self.__class__.__name__} {self.id}>"
