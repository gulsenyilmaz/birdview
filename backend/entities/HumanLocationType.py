import sqlite3

DB_PATH = "alive_then.db"

class HumanLocationType:
    def __init__(self, id=None, name=None, cursor=None):
       
        self.id = None
        self.name = name

        self.cursor = cursor

        self._getFromTable()

    def _getFromTable(self):

        conn = None
        conditions = []
        params = []

        if self.id:
            conditions.append("id = ?")
            params.append(self.id)
        if self.name:
            conditions.append("name = ?")
            params.append(self.name)

        if not conditions:
            return
        
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        query = f"""
            SELECT id, name FROM human_location_types WHERE  {' AND '.join(conditions)}
        """    

        self.cursor.execute(query, params)
        row = self.cursor.fetchone()

        if row:
            self.id = row["id"]
            self.name = row["name"]
        
        if conn:
            conn.close()
    
    def setData(self, data):

        conn = None
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        print(data["name"])

        self.cursor.execute("INSERT INTO human_location_types (name) VALUES (?)", (data["name"],)) 
        print("self.cursor.lastrowid")
        self.id = self.cursor.lastrowid

        print("self.cursor.lastrowid", self.cursor.lastrowid)

        if conn:
            conn.commit()     
            conn.close()

    def __repr__(self):
        desc = ( "...") 
        return f"<HumanLocationType {self.id or self.name}: {desc}>"
