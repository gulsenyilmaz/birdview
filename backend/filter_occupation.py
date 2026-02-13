import pandas as pd
import sqlite3
import csv  
from entities.Human import Human
from entities.HumanOccupation import HumanOccupation


OUTPUT_CSV = "filter_occupation.csv"
DB_PATH = "birdview.db"
ARTIST_OCCUPATIONS = ["sculptor","painter","writer","printmaker","photographer","cartoonist",
                    "ceramicist","muralist","miniaturist", "installation artist","musician","multimedia artist",
                    "visual artist","poet","novelist","performance artist","video artist","playwright","actor","screenwriter","composer", "dancer",
                    "actress","singer","film director","ukiyo-e artist","draftsperson"]

OTHER_OCCUPATIONS = ["king","fashion designer","industrial designer","architect","craftsman","textile artist","draftsman",
                    "instrument maker","graphic designer", "vase painter","photojournalist","inventor","caricaturist",
                    "art director","poet","illustrator","calligrapher","art historian","curator","storyteller","university teacher",
                    "jewelry designer","set designer","typographer","conservationist","physician","chemist","inventor","explorer",
                    "mathematician","anthropologist","ethnologist","cartographer","archaeologist","philologist","linguist","neurologist",
                    "philosopher","astrophysicist","physicist","nobel laureate", "geologist","biologist","naturalist","computer scientist","biophysicist","paleontologist",
                    "psychologist","sociologist","zoologist","economist","diplomat","activist","environmentalist","theologian","astronomist",
                    "journalist","politician","philanthropist", "revolutionary","producer","entrepreneur","lawyer","businessperson",]
GENERAL_OCCUPATIONS = [
                    "director","designer","historian","artist","scientist","engineer","educator","researcher"
                   ]

TO_CHANGE = {
    "drawer":"draftsperson",
    "etcher":"printmaker",
    "engraver":"printmaker",
    "lithographer":"printmaker",
    "pianist":"musician",
    "jazz trumpeter":"musician",
    "bassist":"musician",
    "violinist":"musician",
    "cellist":"musician",
    "conductor":"musician",
    "drummer":"musician",
    "guitarist":"musician",
    "saxophonist":"musician",
    "harpist":"musician",
    "flutist":"musician",
    "potter":"ceramicist",
    "ceramist":"ceramicist",
    "cabinet-maker":"craftsman",
    "cabinetmaker":"craftsman",
    "furniture maker":"craftsman",
    "quiltmaker":"textile artist",
    "clockmaker":"craftsman",
    "watchmaker":"craftsman",
    "medallist":"craftsman",
    "medallic artist":"craftsman",
    "comic book artist":"cartoonist",
    "comic artist":"cartoonist",
    "swordsmith":"craftsman",
    "blade smith":"craftsman",
    "blade-smith":"craftsman",
    "silversmith":"craftsman",
    "goldsmith":"craftsman",
    "gunsmith":"craftsman",
    "armourer":"craftsman",
    "armor maker":"craftsman",
    "luthier":"instrument maker",
    "violin maker":"instrument maker",
    "bow maker":"instrument maker",
    "Trumpet maker":"instrument maker",
    "filmmaker":"film director",
    "movie director":"film director",
    "author":"writer",
    "harphs maker":"instrument maker",
    "piano maker":"instrument maker",
    "harp maker":"instrument maker",
    "organ builder":"instrument maker",
    "guitar maker":"instrument maker",
    "businessman":"businessperson",
    "businesswoman":"businessperson",
    "co-founder":"entrepreneur",
    "badminton player":"sportsperson",
    "tennis player":"sportsperson",
    "cricketer":"sportsperson",
    "swimmer":"sportsperson",
    "runner":"sportsperson",
    "athlete":"sportsperson",
    "volleyball player":"sportsperson",
    "basketball player":"sportsperson",
    "baseball player":"sportsperson",
    "cyclist":"sportsperson",
    "football player":"sportsperson",
    "footballer":"sportsperson",
    "soccer player":"sportsperson",
    "boxer":"sportsperson",}      


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
        WHERE birth_date<400 AND description IS NOT NULL AND description != '';"""
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
                found_occupations = []
                for occupation_name in ARTIST_OCCUPATIONS:
                    if occupation_name in human.description.lower():
                        # log_results(writer, id, human.name, occupation)
                        
                        found_occupations.append(occupation_name)

                        # break
                
                for occupation_name in OTHER_OCCUPATIONS:
                    if occupation_name in human.description.lower():
                        # log_results(writer, id, human.name, "OTHER: " + occupation)
                        found_occupations.append(occupation_name)
                        # break
                
                for occupation_name in GENERAL_OCCUPATIONS:
                    if occupation_name in human.description.lower():
                        # log_results(writer, id, human.name, "GENERAL: " + occupation)
                        found_occupations.append(occupation_name)
                        # break
                for key in TO_CHANGE.keys():
                    if key in human.description.lower():
                        # log_results(writer, id, human.name, TO_CHANGE[key] + " (changed from " + key + ")")
                        found_occupations.append(TO_CHANGE[key])
                        # break
                if found_occupations:
                    log_results(writer, id, human.name, "--------------------------------------------------------")    
                    log_results(writer, id, human.name, f"✅ Artist occupations found: {', '.join(found_occupations)}")
                    for occupation_name in found_occupations:
                         human.add_occupation(occupation_name, 1)
                    conn.commit()
                    continue

                log_results(writer, id, human.name, "❌ No artist occupation found")
                
                continue

        conn.close()


def update_occupations():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """SELECT ho.id, h.name as h_name, o.name as o_name, ho.human_id AS human_id, ho.is_primary
            FROM human_occupation ho
            JOIN occupations o ON o.id = ho.occupation_id
            LEFT JOIN humans h ON h.id = ho.human_id
            WHERE ho.id IN (
                SELECT MIN(id)
                FROM human_occupation
                GROUP BY human_id
                ORDER BY id
            )
            AND ho.is_primary=0
            ORDER BY ho.id;"""
    )

    results = cursor.fetchall()
    rows = [dict(row) for row in results]

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        for row in rows:
            
            id = row["id"]
            human_id =  row["human_id"]
            h_name =  row["h_name"]
            occupation_name =  row["o_name"]
            log_results(writer, h_name, id, occupation_name)
            if occupation_name in ARTIST_OCCUPATIONS:
                human_occupation = HumanOccupation(id=id, cursor=cursor, w=writer)
                if human_occupation.id is not None:
                    human_occupation.update({"is_primary": 1})
            if occupation_name in OTHER_OCCUPATIONS + GENERAL_OCCUPATIONS:
                human_occupation = HumanOccupation(id=id, cursor=cursor, w=writer)
                if human_occupation.id is not None:
                    human_occupation.update({"is_primary": 1})

            for key in TO_CHANGE.keys():
                if key in occupation_name:
                    human = Human(id=human_id, cursor=cursor, w=writer)
                    if human.id is not None:
                        human.add_occupation(TO_CHANGE[key], 1)
                        log_results(writer, human.name, human.id, TO_CHANGE[key] + " (changed from " + key + ")")
                        
            # conn.commit()

            continue
                
                
                

        conn.close()


if __name__ == "__main__":
    filter_occupations()