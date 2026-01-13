import pandas as pd
import sqlite3
import csv  
from entities.Human import Human


OUTPUT_CSV = "MET_artist_list_report_delete.csv"
DB_PATH = "birdview.db"


def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")




if __name__ == "__main__":
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        # human = Human(id=1, cursor=cursor, w=writer)
        # human.add_collection(2, 16570)  # MET koleksiyonu
        conn.commit()
    conn.close()