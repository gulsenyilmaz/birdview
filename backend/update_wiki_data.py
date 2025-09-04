from dataparsers.HumanFromWikidata import HumanFromWikidata
from dataparsers.LocationFromWikidata import LocationFromWikidata
from entities.Human import Human
from entities.Location import Location

import sqlite3
import csv
import time

OUTPUT_CSV = "new_field_lookup_results_10.csv"
DB_PATH = "birdview.db"


def log_results(w, id, context, message):
    w.writerow([message , id, context ])
    print(f" {message} {id}")
    print(f" {context}")



def process_all_artists():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name, qid FROM humans WHERE num_of_identifiers<=100 AND num_of_identifiers>50 AND qid IS NOT 'NOT_FOUND' AND qid IS NOT NULL ORDER BY num_of_identifiers DESC;"
    )
    rows = cursor.fetchall()

    print(f"🔎 Found {len(rows)} artists to update.\n")

    # return

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow(["Result", "id", "Context"])

        for human_id, name, qid in rows:
            try:
                human_wiki_entity = HumanFromWikidata(qid)
                log_results(writer,  human_id, name, "🔎 FOUND to fetch entity",)
            except Exception as e:
                log_results(writer, human_id, name, "❌ Failed to fetch entity")
                continue

            human_entity = Human(id=human_id, cursor=cursor, w=writer)
            human_entity.update_birthplace(human_wiki_entity.birth_place, human_wiki_entity.birth_date)
            human_entity.update_citizenships(human_wiki_entity.citizenships)

            conn.commit()
            time.sleep(0.4)

    
def process_all_locations():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, qid FROM locations WHERE lat is NULL AND qid IS NOT 'NOT_FOUND';")
    rows = cursor.fetchall()

    print(f"🔎 Found {len(rows)} locations to update.\n")

    # return

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow(["Result", "id", "Context"])

        for location_id, name, qid in rows:
            try:
                location_wiki_entity = LocationFromWikidata(qid)
                log_results(writer, location_id, name, "✅ Found to fetch entity")
            except Exception as e:
                log_results(writer, location_id, name, "❌ Failed to fetch entity")
                continue

            location_entity = Location(id=location_id, cursor=cursor, w=writer)

            print("Updating location:", location_entity.id, location_entity.name)
            print("Fetched data:", location_wiki_entity.lat, location_wiki_entity.lon)
            location_entity.update({"lat": location_wiki_entity.lat, "lon": location_wiki_entity.lon})

            conn.commit()
            time.sleep(0.3)


    conn.close()
    print("\n✅ Done. Results saved to", OUTPUT_CSV)





if __name__ == "__main__":
    process_all_artists()
