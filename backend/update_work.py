import pandas as pd
import sqlite3
import csv  
from entities.Work import Work
from entities.Human import Human

OUTPUT_CSV = "MET_artwork_list_report.csv"
DB_PATH = "birdview.db"


def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")


def update_works():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()


    cursor.execute(
        "SELECT id, url FROM works WHERE collection_id=?;", (2,)
    )

    results = cursor.fetchall()
    rows = [dict(row) for row in results]

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        for row in rows:

            id = row["id"]
            url = row["url"]
            constituent_id = url.split("/")[-1] if url else None
            if constituent_id is None:  
                log_results(writer, id, constituent_id, f"❌")
                continue
            
            work = Work(id=id, cursor=cursor, w=writer)
            if work.id is not None:

                work.update({
                    "constituent_id": constituent_id
                })
                
            conn.commit()

        conn.close()

if __name__ == "__main__":
    update_works()
