import sqlite3
import csv

from entities.Human import Human
from dataparsers.HumanFromWikidata import HumanFromWikidata


OUTPUT_CSV = "ssm_artist_report.csv"
DB_PATH = "birdview.db"
SSM_COLLECTION_ID = 8


def log_results(w, source_id, name, qid, is_human):
    w.writerow([source_id, name, qid,is_human])
    print(f"🎨 {source_id}, {name}, {qid}, {is_human}")

def add_humans(file_path):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    with open(
        OUTPUT_CSV,
        mode="w",
        newline="",
        encoding="utf-8"
    ) as output_file:

        writer = csv.writer(output_file)

        writer.writerow([
            "source_id",
            "name",
            "qid",
            "is_human"
        ])

        with open(
            file_path,
            mode="r",
            newline="",
            encoding="utf-8-sig"
        ) as input_file:

            reader = csv.DictReader(input_file)

            for row in reader:

                source_id = (row.get("source_id") or "").strip()
                human_id = (row.get("birdview_id") or "").strip()
                name = (row.get("name") or "").strip()
                qid = (row.get("qid") or "").strip()
                is_human = (row.get("is_human") or "").strip()

                # -------------------------
                # 1. BirdView ID zaten varsa
                # -------------------------

                if human_id:

                    # CSV'de 123 veya 123.0 biçiminde olabilir
                    human_id = int(float(human_id))

                    human = Human(
                        id=human_id,
                        cursor=cursor,
                        w=writer
                    )

                    human.add_collection(
                        SSM_COLLECTION_ID,
                        source_id
                    )

                    log_results(
                        writer,
                        source_id,
                        human.name,
                        human.qid,
                        1
                    )

                    conn.commit()
                    continue

                # -------------------------
                # 2. QID varsa
                # -------------------------

                if qid.startswith("Q"):

                    human = Human(
                        qid=qid,
                        cursor=cursor,
                        w=writer
                    )

                    # QID var ama kişi BirdView'de henüz yok
                    if human.id is None:

                        try:
                            human.save_from_wikidata(qid)

                        except Exception as e:
                            print(f"❌ {name}: {e}")

                            log_results(
                                writer,
                                source_id,
                                name,
                                qid,
                                0
                            )
                            continue

                    # Wikidata'dan ekleme de başarısız oldu
                    if human.id is None:

                        log_results(
                            writer,
                            source_id,
                            name,
                            qid,
                            0
                        )
                        continue

                    human.add_collection(
                        SSM_COLLECTION_ID,
                        source_id
                    )

                    log_results(
                        writer,
                        source_id,
                        human.name,
                        human.qid,
                        1
                    )

                    conn.commit()
                    continue

                # -------------------------
                # 3. Ne BirdView ID ne QID
                # -------------------------

                log_results(
                    writer,
                    source_id,
                    name,
                    "",
                    is_human
                )

    conn.close()


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
    

    add_humans("ssm_artists.csv")
    

