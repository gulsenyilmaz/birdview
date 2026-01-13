import pandas as pd
import sqlite3
import csv  
from entities.Human import Human


OUTPUT_CSV = "MET_artist_list_update_report.csv"
DB_PATH = "birdview.db"
ARTIST_OCCUPATIONS = ["sculptor","painter","writer","printmaker","photographer","filmmaker","cartoonist",
                    "ceramicist","muralist","miniaturist", "installation artist","musician","multimedia artist",
                    "visual artist","poet","novelist","engraver","performance artist","video artist","playwright","actor","screenwriter","composer", "dancer",
                    "actress","singer","film director","ukiyo-e artist"]

OTHER_OCCUPATIONS = ["fashion designer","industrial designer","architect","craftsman","textile artist","draftsman","silversmith","goldsmith",
                    "luthier","instrument maker","graphic designer", "vase painter",
                    "art director","poet","illustrator","calligrapher","art historian","curator","storyteller",
                    "jewelry designer","set designer","typographer","conservationist","physician",
                    "mathematician","anthropologist","ethnologist","cartographer","archaeologist","philologist","linguist","neurologist",
                    "philosopher","astrophysicist","nobel laureate", "geologist","biologist","naturalist","politician","philanthropist","revolutionary"]

GENERAL_OCCUPATIONS = [
                    "director","designer","historian","artist"
                   ]



def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")

def filter_occupations():

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
                log_results(writer, id, human.name, human.description.lower())
                
                
                # conn.commit()
                continue

            
            

        conn.close()


if __name__ == "__main__":
    filter_occupations()