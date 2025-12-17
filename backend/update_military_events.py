
from entities.MilitaryEvent import MilitaryEvent

import sqlite3
import csv
import time

DB_PATH = "birdview.db"
OUTPUT_CSV = "update_military_events_02.csv"

def log_results(w, id, context, message):
    w.writerow([message , id, context ])
    print(f" {message} {id}")
    print(f" {context}")


def process_all_military_events():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM military_events WHERE descendant_count != 0 ORDER BY descendant_count DESC;"
    )

    rows = cursor.fetchall()

    print(f"🔎 Found {len(rows)} military events to update.\n")

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow(["Result", "name", "Context"])

        for row in rows:
            event_id = row["id"]
            military_event = MilitaryEvent(id=event_id, cursor=cursor, w=writer)
            # military_event.update_descendant_count()
            military_event.fit_descendants_data()
            # military_event.update_parent_id()

            
            
    conn.commit()    
    conn.close()

if __name__ == "__main__":
    process_all_military_events()