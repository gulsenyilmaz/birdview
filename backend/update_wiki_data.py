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
        "SELECT id, name, qid FROM humans WHERE name='Eugène-Emmanuel Viollet-le-Duc';"
    )

    # cursor.execute(
    #     "SELECT id, name, qid FROM humans WHERE num_of_identifiers<=50 AND qid IS NOT 'NOT_FOUND' AND qid IS NOT NULL AND id NOT IN(SELECT DISTINCT(human_id) FROM citizenships) ORDER BY num_of_identifiers DESC;"
    # )

    
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
          
            human_entity.update({"name": "Eugène Viollet-le-Duc"})
            

            conn.commit()
            time.sleep(0.4)
    
    conn.close()
    print("\n✅ Done. Results saved to", OUTPUT_CSV)

    
def process_all_locations():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, qid FROM locations WHERE id='Q16563';")
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



def fix_double_qid():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT qid, GROUP_CONCAT(id) AS ids, GROUP_CONCAT(name) AS names FROM humans WHERE qid <> 'NOT_FOUND' GROUP BY qid HAVING COUNT(id) > 1 ORDER BY qid LIMIT 1;"
    )
    
    rows = cursor.fetchall()

    print(f"🔎 Found {len(rows)} artists to update.\n")

    # return

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow(["Result", "id", "Context"])

        for qid, ids, names in rows:
            
            id_list = ids.split(",")
            name_list = names.split(",")
            log_results(writer, qid, names, "✅ is being updated")

            try:
            
                query = f"""
                    UPDATE works
                    SET creator_id = ?
                    WHERE creator_id = ?
                """
                cursor.execute(query, id_list)
                 
                log_results(writer, id_list[0], id_list[1], "✅ works table updated")
            
            except Exception as e:
                log_results(writer, id_list[0], id_list[1], "❌ Failed to update works")
                
            try:
                query = f"""
                    UPDATE human_collection
                    SET human_id = ?
                    WHERE human_id = ?
                """
                cursor.execute(query, id_list)
                 
                log_results(writer, id_list[0], id_list[1], "✅ human_collection table updated")
            
            except Exception as e:
                log_results(writer, id_list[0], id_list[1], "❌ Failed to update human_collection")


            try:
                query = f"""
                    DELETE FROM humans
                    WHERE id = ?
                """
                   
                cursor.execute(query, (id_list[1],))
                 
                log_results(writer, id_list[1], name_list[1], "✅ is deleted from humans table")
            
            except Exception as e:
                log_results(writer, e, name_list[1], "❌ Failed to delete from humans")

            conn.commit()
    
    conn.close()
    print("\n✅ Done. Results saved to", OUTPUT_CSV)


def add_new_human(qid):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name, qid FROM humans WHERE qid=?;", (qid,)
    )
    
    row = cursor.fetchone()

    if row:

        print(f"🔎 Found {row.name} is already in database.\n")

    else:

        with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)

            writer.writerow(["Result", "id", "Context"])

            
            try:
                human_wiki_entity = HumanFromWikidata(qid)
                log_results(writer,  qid, human_wiki_entity.name, "🔎 FOUND to fetch entity",)
            except Exception as e:
                log_results(writer, qid, "", "❌ Failed to fetch entity")
                return

            human_entity = Human(name=human_wiki_entity.name, cursor=cursor, w=writer)
            if not human_entity.id:
                human_entity.set_data(
                    {   
                        "name": human_wiki_entity.name,
                        "qid": human_wiki_entity.qid,
                        "description": human_wiki_entity.description,
                        "img_url": human_wiki_entity.image_url,
                        "signature_url": human_wiki_entity.signature_url,
                        "birth_date": human_wiki_entity.birth_date,
                        "death_date": human_wiki_entity.death_date,
                        "num_of_identifiers": human_wiki_entity.num_of_identifiers
                    }
                )   

             
                human_entity.update_nationality(human_wiki_entity.nationality)
                human_entity.update_gender(human_wiki_entity.gender)

                human_entity.update_citizenships(human_wiki_entity.citizenships)
                human_entity.update_collections([1])
                human_entity.update_locations(human_wiki_entity.locations)
                human_entity.update_movements(human_wiki_entity.movements)
                human_entity.update_occupations(human_wiki_entity.occupations)
                
                
           
                

                conn.commit()
                time.sleep(0.4)
    
    conn.close()
    print("\n✅ Done. Results saved to", OUTPUT_CSV)

if __name__ == "__main__":
    process_all_artists()
