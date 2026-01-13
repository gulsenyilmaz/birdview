import pandas as pd
import sqlite3
import csv  
from entities.Human import Human
from entities.Nationality import Nationality


OUTPUT_CSV = "nationality_mapping_results.csv"
DB_PATH = "birdview.db"


def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")

def list_nationalities():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """SELECT id, name
        FROM nationalities;"""
    )

    results = cursor.fetchall()
    rows = [dict(row) for row in results]

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "migration_id"])

        for row in rows:
            
            id = row["id"]
            nation = Nationality(id=id, cursor=cursor, w=writer)
            if nation.id is not None:
                log_results(writer, id, nation.name, "")
                continue

            
            

        conn.close()


def load_nationalities_mapping(file_path):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    df = pd.read_csv(file_path, low_memory=False)
    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "migration_id"])
   
        for row in df.itertuples(index=False, name="NationalityRow"):
            id = row.id
            name = row.name
            migration_id = row.migration_id if not pd.isna(row.migration_id) else None
            if migration_id is not None:        
                
                cursor.execute(
                    """SELECT id, name
                    FROM humans 
                    WHERE nationality_id == ?;""", (id,)
                )
                results = cursor.fetchall()
                human_rows = [dict(row) for row in results]
                if not human_rows:
                    log_results(writer, id, name, "❌ Human with this nationality not found")
                    continue
                for human_row in human_rows:
                    human = Human(id=human_row["id"], cursor=cursor, w=writer)
                    if human.id is not None:
                        human.update({"nationality_id": int(migration_id)})
                conn.commit()

        
    conn.close()


def delete_nationalities_unused():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """SELECT id, name
        FROM nationalities;"""
    )
    results = cursor.fetchall()
    nationality_rows = [dict(row) for row in results]

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "migration_id"])
   
        for nationality_row in nationality_rows:
            id = nationality_row["id"]
            name = nationality_row["name"]

            cursor.execute(
                """SELECT id, name
                FROM humans 
                WHERE nationality_id == ?;""", (id,)
            )
            results = cursor.fetchall()
            human_rows = [dict(row) for row in results]
            if not human_rows:
                log_results(writer, id, name, "❌ Human with this nationality not found")
                cursor.execute(
                    """DELETE FROM nationalities
                    WHERE id == ?;""", (id,)
                )   
                continue
            
        conn.commit()

        
    conn.close()


if __name__ == "__main__":
    delete_nationalities_unused()