from dataparsers.HumanFromWikidata import HumanFromWikidata
from dataparsers.LocationFromWikidata import LocationFromWikidata
from dataparsers.EntityFromWikidata import EntityFromWikidata
from dataparsers.MovementFromWikidata import MovementFromWikidata

from entities.HumanLocation import HumanLocation
from entities.HumanLocationType import HumanLocationType
from entities.Location import Location
from entities.Occupation import Occupation
from entities.HumanOccupation import HumanOccupation
from entities.Gender import Gender
from entities.Movement import Movement
from entities.HumanMovement import HumanMovement

import sqlite3
import csv
import time

OUTPUT_CSV = "new_field_lookup_results.csv"
DB_PATH = "alive_then.db"


def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name}({id}) result: {message}")


def update_human_gender(h_id, h_name, data, cur, w):
    if data.gender:
        gender_database_entity = Gender(name=data.gender.lower(), cursor=cur)
        if gender_database_entity.id is None:
            try:
                gender_database_entity.setData({"name": data.gender.lower()})
            except Exception as e:
                log_results(w, "", data.gender.lower(), e)
                return

        create_sql = f"""
            UPDATE humans SET gender_id = ?  WHERE id = ?
        """
        try:
            cur.execute(create_sql, (gender_database_entity.id, h_id))
            log_results(
                w, h_id, h_name, f"✅ basic data updated gender: {data.gender.lower()}"
            )
        except Exception as e:
            log_results(w, "", h_name, e)
            return


def update_human_basicdata(h_id, h_name, data, cur, w):
    create_fields = []
    create_values = []

    if data.description:
        create_fields.append("description=?")
        create_values.append(data.description)

    if data.image_url is not None:
        create_fields.append("img_url=?")
        create_values.append(data.image_url)

    if data.birth_date is not None:
        create_fields.append("birth_date=?")
        create_values.append(data.birth_date)

    if data.death_date is not None:
        create_fields.append("death_date=?")
        create_values.append(data.death_date)

    if create_fields:
        create_sql = f"""
            UPDATE humans SET {", ".join(create_fields)} WHERE id = ?
        """
        create_values.append(h_id)
        try:
            cur.execute(create_sql, create_values)
            log_results(
                w,
                h_id,
                h_name,
                f"✅ basic data updated desc: {data.description} img: {data.image_url} death_date: {data.death_date} birth_date: {data.birth_date}",
            )
        except Exception as e:
            log_results(w, "", h_name, e)
            return


def update_location_basicdata(l_id, l_name, data, cur, w):
    create_fields = []
    create_values = []

    if data.description:
        create_fields.append("description=?")
        create_values.append(data.description)

    if data.image_url is not None:
        create_fields.append("image_url=?")
        create_values.append(data.image_url)

    if data.logo_url is not None:
        create_fields.append("logo_url=?")
        create_values.append(data.logo_url)

    if data.inception is not None:
        create_fields.append("inception=?")
        create_values.append(data.inception)

    if data.country_label is not None:
        create_fields.append("country_label=?")
        create_values.append(data.country_label)

    if create_fields:
        create_sql = f"""
            UPDATE locations SET {", ".join(create_fields)} WHERE id = ?
        """
        create_values.append(l_id)
        try:
            cur.execute(create_sql, create_values)
            log_results(
                w,
                l_id,
                l_name,
                f"✅ basic data updated desc: {data.description} image_url: {data.image_url} logo_url: {data.logo_url} inception: {data.inception}",
            )
        except Exception as e:
            log_results(w, "", l_name, e)
            return


def update_human_signature(h_id, h_name, data, cur, w):
    if data.signature_url:
        create_sql = f"""
            UPDATE humans SET signature_url = ? WHERE id = ?
        """
        try:
            cur.execute(create_sql, (data.signature_url, h_id))
            log_results(
                w,
                h_id,
                h_name,
                f"✅ basic data updated signature_url: {data.signature_url}",
            )
        except Exception as e:
            log_results(w, "", h_name, e)
            return


def update_human_occupations(h_id, occupations, cur, w):
    if occupations:
        for occupation in occupations:
            if occupation:
                occupation_wiki_entity = EntityFromWikidata(occupation)
                occupation_database_entity = Occupation(
                    name=occupation_wiki_entity.name, cursor=cur
                )
                if occupation_database_entity.id is None:
                    try:
                        occupation_database_entity.setData(
                            {"name": occupation_wiki_entity.name}
                        )
                        log_results(
                            w,
                            occupation_database_entity.id,
                            occupation_database_entity.name,
                            "is added occupations table",
                        )
                    except Exception as e:
                        log_results(w, "", occupation_wiki_entity.name, e)
                        continue
                log_results(
                    w,
                    occupation_database_entity.id,
                    occupation_database_entity.name,
                    "is found in occupations table",
                )

                human_occupations_database_entity = HumanOccupation(
                    human_id=h_id,
                    occupation_id=occupation_database_entity.id,
                    cursor=cur,
                )
                print(human_occupations_database_entity.occupation_id)
                if human_occupations_database_entity.id is None:
                    try:
                        human_occupations_database_entity.setData(
                            {
                                "human_id": h_id,
                                "occupation_id": occupation_database_entity.id,
                            }
                        )
                        log_results(
                            w,
                            human_occupations_database_entity.occupation_id,
                            human_occupations_database_entity.human_id,
                            "is added in human_occupation table",
                        )
                    except Exception as e:
                        log_results(w, h_id, occupation_database_entity.name, e)
                        continue

                log_results(
                    w,
                    human_occupations_database_entity.occupation_id,
                    human_occupations_database_entity.human_id,
                    "is found in human_occupation table",
                )
            else:
                continue


def update_human_movements(h_id, movements, cur, w):
    if movements:
        for movement in movements:
            if movement:
                print("-------------------------------------------------")
                movement_wiki_entity = MovementFromWikidata(movement)
                print(movement_wiki_entity.to_dict())
                movement_database_entity = Movement(
                    name=movement_wiki_entity.name, cursor=cur
                )
                if movement_database_entity.id is None:
                    try:
                        movement_database_entity.set_data(
                            movement_wiki_entity.to_dict()
                        )
                        log_results(
                            w,
                            movement_database_entity.id,
                            movement_database_entity.name,
                            "is added movements table",
                        )
                    except Exception as e:
                        log_results(w, "", movement_wiki_entity.name, e)
                        continue
                log_results(
                    w,
                    movement_database_entity.id,
                    movement_database_entity.name,
                    "is found in movements table",
                )

                human_movement_database_entity = HumanMovement(
                    human_id=h_id, occupation_id=movement_database_entity.id, cursor=cur
                )

                if human_movement_database_entity.id is None:
                    try:
                        human_movement_database_entity.set_data(
                            {
                                "human_id": h_id,
                                "movement_id": movement_database_entity.id,
                            }
                        )
                        log_results(
                            w,
                            human_movement_database_entity.movement_id,
                            human_movement_database_entity.human_id,
                            "is added in human_movement table",
                        )
                    except Exception as e:
                        log_results(w, h_id, movement_database_entity.name, e)
                        continue

                log_results(
                    w,
                    human_movement_database_entity.movement_id,
                    human_movement_database_entity.human_id,
                    "is found in human_movement table",
                )
            else:
                continue


def update_human_locations(h_id, locations, cur, w):
    if locations:
        for location in locations:
            if location["relation_type"] not in ["has_works_in"]:
                print("-------------------------------------------------")

                qid = location.get("qid")

                if qid == "Q641":
                    location_wiki_entity = LocationFromWikidata(location["qid"])
                    location_database_entity = Location(
                        qid=qid,
                        name=location_wiki_entity.name,
                        latitude=location_wiki_entity.latitude,
                        longitude=location_wiki_entity.longitude,
                        cursor=cur,
                    )
                    print(qid, location_database_entity.name)

                    if location_database_entity.id is None:
                        try:
                            location_database_entity.setData(
                                location_wiki_entity.to_dict()
                            )
                            log_results(
                                w,
                                location_database_entity.id,
                                location_database_entity.name,
                                "is added locations table",
                            )
                        except Exception as e:
                            log_results(
                                w,
                                location_database_entity.id,
                                location_database_entity.name,
                                e,
                            )
                            continue
                else:
                    continue

                log_results(
                    w,
                    location_database_entity.id,
                    location_database_entity.name,
                    "is found in locations table",
                )
                humanlocationtype_database_entity = HumanLocationType(
                    name=location["relation_type"], cursor=cur
                )

                if humanlocationtype_database_entity.id is None:
                    try:
                        humanlocationtype_database_entity.setData(
                            {"name": location["relation_type"]}
                        )
                        log_results(
                            w,
                            humanlocationtype_database_entity.id,
                            humanlocationtype_database_entity.name,
                            f"is added humanlocationtype table",
                        )
                    except Exception as e:
                        continue

                log_results(
                    w,
                    humanlocationtype_database_entity.id,
                    humanlocationtype_database_entity.name,
                    f"is found in humanlocationtype table",
                )
                humanlocation_database_entity = HumanLocation(
                    human_id=h_id,
                    location_id=location_database_entity.id,
                    relationship_type_id=humanlocationtype_database_entity.id,
                    cursor=cur,
                )
                if humanlocation_database_entity.id:
                    log_results(
                        w,
                        humanlocation_database_entity.human_id,
                        humanlocation_database_entity.location_id,
                        f"is already in humanlocation table",
                    )
                    continue
                else:
                    try:
                        humanlocation_database_entity.setData(
                            {
                                "human_id": h_id,
                                "location_id": location_database_entity.id,
                                "relationship_type_id": humanlocationtype_database_entity.id,
                                "start_date": location["start_date"],
                                "end_date": location["end_date"],
                            }
                        )
                        log_results(
                            w,
                            humanlocation_database_entity.human_id,
                            humanlocation_database_entity.location_id,
                            f"is added humanlocation table",
                        )

                    except Exception as e:
                        log_results(
                            w,
                            e,
                            humanlocation_database_entity.location_id,
                            "error in humanlocation table",
                        )
                        continue

            else:
                continue

    else:
        log_results(w, h_id, "", "❌ Failed to fetch locations")


def process_all_artists():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name, qid FROM humans WHERE num_of_identifiers < 151 AND qid IS NOT 'NOT_FOUND' AND qid IS NOT NULL ORDER BY num_of_identifiers DESC;"
    )
    rows = cursor.fetchall()

    print(f"🔎 Found {len(rows)} artists to update.\n")

    # return

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow(["id", "name", "Result"])

        for human_id, name, qid in rows:
            try:
                human_wiki_entity = HumanFromWikidata(qid)
                log_results(writer, human_id, name, "✅ Found to fetch entity")
            except Exception as e:
                log_results(writer, human_id, name, "❌ Failed to fetch entity")
                continue

            # update_human_signature(human_id, name, human_wiki_entity, cursor, writer)

            # update_human_basicdata(human_id, name, human_wiki_entity, cursor, writer)

            # update_human_locations(human_id, human_wiki_entity.locations, cursor, writer)

            # update_human_occupations(human_id, human_wiki_entity.occupations, cursor, writer)

            update_human_movements(
                human_id, human_wiki_entity.movements, cursor, writer
            )

            conn.commit()
            time.sleep(0.4)

    conn.close()
    print("\n✅ Done. Results saved to", OUTPUT_CSV)


def process_all_locations():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, qid FROM locations WHERE  qid IS NOT 'NOT_FOUND';")
    rows = cursor.fetchall()

    print(f"🔎 Found {len(rows)} locations to update.\n")

    # return

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow(["id", "name", "Result"])

        for location_id, name, qid in rows:
            try:
                location_wiki_entity = LocationFromWikidata(qid)
                log_results(writer, location_id, name, "✅ Found to fetch entity")
            except Exception as e:
                log_results(writer, location_id, name, "❌ Failed to fetch entity")
                continue

            update_location_basicdata(
                location_id, name, location_wiki_entity, cursor, writer
            )

            conn.commit()
            time.sleep(0.6)

    conn.close()
    print("\n✅ Done. Results saved to", OUTPUT_CSV)


if __name__ == "__main__":
    process_all_artists()
