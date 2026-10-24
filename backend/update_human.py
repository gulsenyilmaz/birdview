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
        WHERE num_of_identifiers > 100 AND id NOT IN (SELECT human_id FROM human_human) AND id IN (SELECT human_id FROM human_collection)
        ORDER BY num_of_identifiers DESC;
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

def parse_year(value):
    if value is None or value == "":
        return None
    return int(str(value).split("-")[0])

def add_human_location(human_id, file_path):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    try:
        with open(file_path, newline="", encoding="utf-8-sig") as input_file:
            rows = list(csv.DictReader(input_file))

        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow(["id", "name", "Result"])

            human = Human(id=human_id, cursor=cursor, w=writer)

            if human.id is None:
                log_results(writer, human_id, "", "Human not found")
                return

            locations = []

            for row in rows:
                qid = (row.get("location_qid") or "").strip()

                if not qid:
                    continue

                locations.append({
                    "qid": qid,
                    "relation_type": "traveled_to",
                    "start_date": parse_year(row.get("start_date")),
                    "end_date": parse_year(row.get("end_date")),
                    "source_url": row.get("source_url") or "",
                    "visit_order": int(row["visit_order"]) if row.get("visit_order") else None
                })

            human.update_locations(locations)
            conn.commit()

            print(f"Processed {len(locations)} location records")

    except Exception:
        conn.rollback()
        raise

    finally:
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
    add_human_location(151506,"data/hadrian_notables_wikidata_125_route_with_names.csv")
