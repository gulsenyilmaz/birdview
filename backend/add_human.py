import pandas as pd
import sqlite3
import csv  
from entities.Human import Human


OUTPUT_CSV = "MET_artist_list_report.csv"
DB_PATH = "birdview.db"


def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")

def add_humans(file_path):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        df = pd.read_csv(file_path, low_memory=False)

        

        for row in df.itertuples(index=False, name="HumanRow"):
            
            qid = row.qid
            name = row.name
            constituent_id = row.constituent_id

            human = Human(qid=qid, cursor=cursor, w=writer)
            if human.id is not None:

                log_results(writer, qid, name, "Already exists")
                # human.add_collection(2, constituent_id)  # MET koleksiyonu
                
                continue

            # human.save_from_wikidata(qid)
            # human.add_collection(2, constituent_id)
            log_results(writer, qid, name, "Added successfully")
            # conn.commit()

        conn.close()


if __name__ == "__main__":
    add_humans("data/MET/MET_artist_list.csv")