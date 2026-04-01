import pandas as pd
import sqlite3
import csv  
import time
from entities.Human import Human
from entities.HumanLocation import HumanLocation
from dataparsers.HumanFromWikidata import HumanFromWikidata


OUTPUT_CSV = "relatives.csv"
DB_PATH = "birdview.db"


def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")

def update_humans():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    cursor.execute(
        """SELECT 
        id,
        qid
        FROM humans 
        WHERE num_of_identifiers > 100 AND id NOT IN (SELECT human_id FROM human_human)
        ORDER BY num_of_identifiers DESC
        LIMIT 100;
        """
    )

    results = cursor.fetchall()
    rows = [dict(row) for row in results]


    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        for row in rows:

            human = Human(qid=row["qid"], cursor=cursor, w=writer)

            if human.id is None:
                log_results(writer, row["qid"],"", "There is no human")
                continue

            log_results(writer, row["qid"],human.name, "relatives are updating...")
            human_wiki_entity = HumanFromWikidata(row["qid"])
            print(human_wiki_entity.relatives)
            human.update_relatives(human_wiki_entity.relatives)  
            conn.commit()

        conn.close()

def update_human_location_sources():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, human_id
            FROM human_location
            WHERE source_url IS NULL OR source_url = ''
        """)
        rows = [dict(row) for row in cursor.fetchall()]

        with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow(["id", "name", "Result"])

            for row in rows:
                human_location_id = row["id"]
                human_id = row["human_id"]

                human = Human(id=human_id, cursor=cursor, w=writer)
                if human.qid is None:
                    log_results(writer, human_location_id, "", "⚠️ Human qid is None")
                    continue

                human_location = HumanLocation(
                    id=human_location_id,
                    cursor=cursor,
                    w=writer
                )

                human_location.update(
                    {
                        "source_url": f"https://www.wikidata.org/wiki/{human.qid}"
                    }
                )

                log_results(
                    writer,
                    human_location.id,
                    "",
                    "✅ Updated successfully"
                )

        conn.commit()

    except Exception as e:
        conn.rollback()
        print(f"❌ Error in update_human_location_sources: {e}")

    finally:
        conn.close()

def add_human_location(human_id, file_path):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        df = pd.read_csv(file_path, low_memory=False)
        df = df.where(pd.notna(df), None)

        human = Human(id=human_id, cursor=cursor, w=writer)

        if human.name is None: 
            log_results(writer, human_id, "", f"❌ THERE IS NO HUMAN")
            return
        
        locations = []

        for row in df.itertuples(index=False, name="HumanRow"):
            relationship_type = row.relationship_type
            start_date = row.start_date
            end_date = row.end_date
            location_qid=row.location_qid
            source_url = row.source_url

            locations.append(
                {
                    "qid": location_qid,
                    "relation_type": relationship_type,
                    "start_date": start_date,
                    "end_date": end_date,
                    "source_url":source_url
                }
            )
        human.update_locations(locations)
        conn.commit()
    conn.close()

def add_relatives(qid):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        human = Human(qid=qid, cursor=cursor, w=writer)

        if human.id is None:
            log_results(writer, qid,"", "There is no human")
        
        human_wiki_entity = HumanFromWikidata("Q692")
        print(human_wiki_entity.relatives)
        human.update_relatives(human_wiki_entity.relatives)  
        conn.commit()

    conn.close()


def clean_double_entry_humans():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    cursor.execute(
        """SELECT 
        GROUP_CONCAT(id, ' | ') AS ids, 
        qid, 
        num_of_identifiers, 
        COUNT(*) 
        FROM humans 
        WHERE qid IS NOT NULL and qid NOT IN ("NOT_FOUND_AGAIN","NOT_FOUND") 
        GROUP BY qid HAVING COUNT(*) > 1 
        ORDER BY num_of_identifiers DESC
        LIMIT 1;
        """
    )

    results = cursor.fetchall()
    rows = [dict(row) for row in results]

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        for row in rows:
            
            ids = row["ids"].split(" | ")

            human_moma = Human(id=ids[0], cursor=cursor, w=writer)
            human_met = Human(id=ids[1], cursor=cursor, w=writer)

            print(ids[0], ids[1])
            print(human_moma.id, human_met.id)

            collections = human_moma.get_collections()
            for collection in collections:
                print(collection["collection_id"], collection["constituent_id"])
                human_met.add_collection(collection["collection_id"], human_moma.id)  

            cursor.execute(
                """UPDATE works SET creator_id=? WHERE creator_id=?;
                """,(human_met.id, human_moma.id)
            )
                    
                    
            log_results(writer, human_moma.qid, human_moma.id, f"❌ YOUHAVE TO DELETE THIS {human_moma.name}({human_moma.id})")
            human_moma.delete()

            conn.commit()
            log_results(writer, human_met.id, human_met.name, "✅ Updated successfully")
            
            continue  
            
          

        conn.close()




if __name__ == "__main__":
    update_humans()
