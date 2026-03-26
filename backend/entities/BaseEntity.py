import sqlite3
import requests

DB_PATH = "birdview.db"

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

HEADERS = {
    "User-Agent": "AliveThen-WikidataLookup/1.0 (gulsenyilmaz9@gmail.com)",
    "Accept": "application/sparql-results+json",
}




class BaseEntity:
    SPARQL_QUERY = None
    TABLE_NAME = None
    FIELDS = ["id", "name"]  # subclasses should override

    def __init__(self, **kwargs):
        self.cursor = kwargs.get("cursor")
        self.w = kwargs.get("w")

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

        for field in self.FIELDS:
            value = getattr(self, field, None)
            if value is not None:
                conditions.append(f"{field} = ?")
                params.append(value)

        if not conditions:
            return

        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        try:
            query = f"""
                SELECT {", ".join(self.FIELDS)} FROM {self.TABLE_NAME}
                WHERE {" AND ".join(conditions)}
            """
            self.cursor.execute(query, params)
            row = self.cursor.fetchone()

            if row:
                for field in self.FIELDS:
                    setattr(self, field, row[field])

                # field_updates = ", ".join([f"{col}={repr(getattr(self, col, None))}" for col in self.FIELDS])

                # self.log_results(
                #     self.id if hasattr(self, "id") else "-",
                #     field_updates,
                #     f"✅ FOUND in {self.TABLE_NAME} table ",
                # )

        except Exception as e:
            self.log_results(
                f"❌ error dfsfsd in {self.TABLE_NAME} table: {str(e)}",
            )

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

        try:
            query = f"INSERT INTO {self.TABLE_NAME} ({col_string}) VALUES ({placeholders})"
            self.cursor.execute(query, values)

            self.id = self.cursor.lastrowid
            for key in columns:
                setattr(self, key, data[key])
            
            field_updates = ", ".join([f"{col}={repr(data[col])}" for col in columns])

            self.log_results(
                    f"✅ ADDED in {self.TABLE_NAME} table: {field_updates}",
                )   
        
        except Exception as e:
            self.log_results(
                f"❌ Error in {self.TABLE_NAME} table: {e}",
            )

        if conn:
            conn.commit()
            conn.close()

    def update(self, data: dict):
        if not getattr(self, "id", None):
            raise ValueError("Update requires 'id' to be set.")
        

        conn = None
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            self.cursor = conn.cursor()

        columns = [key for key in data if key in self.FIELDS and key != "id"]
        if not columns:
            raise ValueError("No valid fields provided for update.")

        set_clause = ", ".join([f"{col} = ?" for col in columns])
        values = [data[col] for col in columns]
        values.append(self.id)

        try:
            
            query = f"""
                UPDATE {self.TABLE_NAME}
                SET {set_clause}
                WHERE id = ?
            """
            self.cursor.execute(query, values)
             # güncel değerleri nesne üzerine de yaz
            for col in columns:
                setattr(self, col, data[col])
            
            field_updates = ", ".join([f"{col}={repr(data[col])}" for col in columns])

            self.log_results(
                    f"✅ UPDATED in {self.TABLE_NAME} table: {field_updates}",
                )
        
        except Exception as e:
            
            self.log_results(
                f"❌ error in {self.TABLE_NAME} table: {e}",
            )

        if conn:
            conn.commit()
            conn.close()


    def delete(self):
        if not getattr(self, "id", None):
            raise ValueError("Delete requires 'id' to be applied.")

        conn = None
        if self.cursor is None:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON;")
            self.cursor = conn.cursor()

        try:
            query = f"DELETE FROM {self.TABLE_NAME} WHERE id = ?"
            self.cursor.execute(query, (self.id,))  # ✅ kritik düzeltme

            self.log_results(f"✅ DELETED from {self.TABLE_NAME}")

            for field in self.FIELDS:
                setattr(self, field, None)

        except Exception as e:
            self.log_results(f"❌ error deleting from {self.TABLE_NAME}: {str(e)}")

        if conn:
            conn.commit()
            conn.close()

    

    def get_wikidata_qid(self):

        # print(f"Executing SPARQL query for {self.TABLE_NAME}:\n{self.SPARQL_QUERY}\n")
        
        response = requests.get(WIKIDATA_ENDPOINT, headers=HEADERS, params={"query": self.SPARQL_QUERY})
       
        if response.status_code != 200:
            print(f"❌ HTTP error {response.status_code} for query:\n{self.SPARQL_QUERY}\n")
            return None
        
        try:
            data = response.json()
            # print(f"Response JSON: {data}")  # Debugging line
        except Exception as e:
            print("❌ JSON decode failed:", e)
            print("Response content:", response.text)
            return None

        results = data.get("results", {}).get("bindings", [])
        if results:
            qid = results[0]["qid"]["value"]
            print(f"✅ Found QID: {qid} for {self.TABLE_NAME}")
            return qid
        
        return None

    def log_results(self, message):
        print("-------------------------------------------------")
        if hasattr(self, "w") and self.w:
            self.w.writerow([self.id, "" , message])
        # print(f" {message} {id}")
        print(f"{message}")
        

    def __repr__(self):
        if hasattr(self, "name"):
            return f"<{self.__class__.__name__} {self.id}: {self.name}>"
        return f"<{self.__class__.__name__} {self.id}>"
