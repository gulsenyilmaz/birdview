import pandas as pd
import sqlite3
import csv  
from entities.Human import Human
from dataparsers.HumanFromWikidata import HumanFromWikidata
import numpy


OUTPUT_CSV = "StoryofArt_report_02.csv"
DB_PATH = "birdview.db"


def log_results(w, constituent_id, name, qid, is_human):
    w.writerow([constituent_id, name, qid,is_human])
    print(f"🎨 {constituent_id}, {name}, {qid}, {is_human}")

def add_humans(file_path):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["constituent_id", "name", "qid","is_human"])

        df = pd.read_csv(file_path, low_memory=False)
        df = df.where(pd.notna(df), None)
        
       

        for row in df.itertuples(index=False, name="HumanRow"):
            
            qid = row.qid
            name = row.name
            constituent_id = row.constituent_id
            is_human=row.is_human

            if is_human!=2:
                log_results(writer, constituent_id, name, qid, is_human)
                continue
            

            human = Human(name=name, cursor=cursor, w=writer)
            print(human.name,human.id)

            if human.id is None: 
                print(qid)
                if qid is None:
                    qid = human.get_wikidata_qid_by_langs()
                    if qid is None:
                        log_results(writer, constituent_id, name, "", 2)
                        continue

                human = Human(qid=qid, cursor=cursor, w=writer)
            
            if human.id is not None: 

                log_results(writer, constituent_id, human.name, human.qid, 1)
                human.add_collection(7, constituent_id)  
                conn.commit()
                continue

            

            human.save_from_wikidata(qid)
            if human.id is None:
                log_results(writer, constituent_id, name, qid, 0)
                continue
            
            human.add_collection(7, constituent_id)
            log_results(writer, constituent_id, human.name, human.qid, 1)
            # log_results(writer, qid, name, "Added successfully")
            conn.commit()

        conn.close()

# def add_human_location

def delete_human(human_id):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        human = Human(id=human_id, cursor=cursor, w=writer)

        human.delete()
        conn.commit()
    conn.close()

def add_to_collection(human_id, collection_id, constituent_id):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        human = Human(id=human_id, cursor=cursor, w=writer)

        human.add_collection(collection_id, constituent_id)  
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
        print(human.name, human.id)

        if human.id is None:
            log_results(writer, qid,"", "There is no human")
        
        human_wiki_entity = HumanFromWikidata(qid)
        print(human_wiki_entity.relatives)
        human.update_relatives(human_wiki_entity.relatives)  
        conn.commit()

    conn.close()

if __name__ == "__main__":
    
    add_relatives("Q83229")

    # add_to_collection(591,2,5490)
    # delete_human(7127)
    

