import csv
import json
import re
import sqlite3

from entities.Human import Human

INPUT_FILE = "ssm_artists_vocabulary.json"
OUTPUT_FILE = "ssm_artists.csv"
DB_PATH = "birdview.db"


def log_results(
    writer,
    source_id,
    name,
    qid,
    birth_date,
    death_date,
    is_human,
    birdview_id=None,
):
    writer.writerow([
        source_id,
        birdview_id,
        name,
        qid,
        birth_date,
        death_date,
        is_human,
    ])

    print(
        f"🎨 {source_id} | "
        f"birdview_id={birdview_id} | "
        f"{name} | {qid} | {is_human}"
    )


def parse_artist(value: str):
    value = value.strip()

    match = re.match(
        r"^(.*?)\s*\((\d{4})\s*-\s*(\d{4}|\?)?\s*\)\s*$",
        value,
    )

    if not match:
        return value, None, None

    name = match.group(1).strip()
    birth_date = int(match.group(2))

    death_raw = match.group(3)

    death_date = (
        int(death_raw)
        if death_raw and death_raw.isdigit()
        else None
    )

    return name, birth_date, death_date


def find_entity_qid():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    with open(
        OUTPUT_FILE,
        mode="w",
        newline="",
        encoding="utf-8-sig",
    ) as file:

        writer = csv.writer(file)

        writer.writerow([
            "source_id",
            "birdview_id",
            "name",
            "qid",
            "birth_date",
            "death_date",
            "is_human",
        ])

        for item in data:

            if isinstance(item, str):
                source_key = item.strip()

            elif isinstance(item, dict):
                source_key = str(
                    item.get("term")
                    or item.get("name")
                    or item.get("value")
                    or ""
                ).strip()

            else:
                continue

            if not source_key:
                continue

            # SSM artist ID vermiyor.
            # Bizim external/source identifier'ımız bu string.
            source_id = source_key

            name, birth_date, death_date = parse_artist(
                source_key
            )

            # Unknown artist'i Human olarak arama
            if (
                "artist unknown" in name.lower()
                or "sanatcisi bilinmiyor" in name.lower()
            ):
                log_results(
                    writer,
                    source_id,
                    name,
                    "",
                    birth_date,
                    death_date,
                    0,
                    None,
                )
                continue

            human = Human(
                name=name,
                cursor=cursor,
                w=writer,
            )

            print(
                "Searching:",
                name,
                "→",
                human.name,
                human.id,
                human.qid,
            )

            birdview_id = human.id
            qid = human.qid

            # DB'de QID bulunamamışsa Wikidata'da ara
            if qid is None:
                qid = human.get_wikidata_qid_by_langs()

            if qid is None:
                log_results(
                    writer,
                    source_id,
                    human.name or name,
                    "",
                    birth_date,
                    death_date,
                    2,
                    birdview_id,
                )
                continue

            log_results(
                writer,
                source_id,
                human.name or name,
                qid,
                birth_date,
                death_date,
                1,
                birdview_id,
            )

    conn.close()


if __name__ == "__main__":
    find_entity_qid()