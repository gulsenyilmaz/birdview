import pandas as pd
import sqlite3
import csv  
from entities.Human import Human


OUTPUT_CSV = "MET_artist_list_update_report.csv"
DB_PATH = "birdview.db"


def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")

def update_humans():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """SELECT id, name, num_of_identifiers, birth_date 
        FROM humans 
        WHERE description IS NOT NULL AND description != '';"""
    )

    results = cursor.fetchall()
    rows = [dict(row) for row in results]

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        for row in rows:
            
            id = row["id"]
            human = Human(id=id, cursor=cursor, w=writer)
            if human.id is not None:
                nationality_name = human.description.split(" ")[0]
                
                human.update_nationality(nationality_name) 

                # human.update_from_wikidata_birth_death_place()
                conn.commit()
                continue

            log_results(writer, id, human.name, "❌ Added successfully")
            

        conn.close()


if __name__ == "__main__":
    update_humans()