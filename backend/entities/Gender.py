import sqlite3

DB_PATH = "alive_then.db"

class Gender:
    def __init__(self, name=None, cursor=None):
        
        self.id = None
        self.name = name

        self.cursor = cursor

        self._getFromTable()

    def _getFromTable(self):

        conn = None

        if not self.name:
            return
        
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()
        
        query = "SELECT id, name FROM genders WHERE name = ?"
        self.cursor.execute(query, (self.name,))
        row = self.cursor.fetchone()

        if row:
            self.id = row["id"]
            self.name = row["name"]
        
        if conn:
            conn.close()

    def setData(self, data):

        conn = None
        
        name = data.get("name")
        if not name:
            return
        
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        self.cursor.execute(
            "INSERT INTO genders (name) VALUES (?)",
            (data["name"],)
        )
        
        self.id = self.cursor.lastrowid

        if conn:
            conn.commit()
            conn.close()

    def __repr__(self):
        return f"<Gender {self.id or self.name}>"

