import csv
import re, time, sqlite3, requests
from entities.Event import Event
from entities.Location import Location
from entities.EventLocation import EventLocation

import pandas as pd
import numpy as np
import json

OUTPUT_CSV = "new_field_lookup_results_06.csv"
DB_PATH = "birdview.db"

def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")

def load_events(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path, low_memory=False)
    return df

def build_description(row):
    return json.dumps({
        "participants": [p.strip() for p in str(row.Participants).split(",") if p.strip()],
        "winner": row.Winner,
        "loser": row.Loser,
        "massacre": row.Massacre,
        "scale": int(row.scale),
    })

def add_events(file_path):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["battle", "war", "Result"])

        df = load_events(file_path)
        total = len(df)
        batch = 0

        for row in df.itertuples(index=False, name="EventRow"):
            try:
                war = row.War
                battle = row.Battle
                lat = row.Latitude
                lon = row.Longitude
                country = row.Country
                year = row.Year

                # --- Event işlemleri ---
                event = Event(id=None, name=war, cursor=cursor)
                if event.id is None:
                    event.set_data({
                        "name": war,
                        "description": None,
                        "start_date": year,
                        "end_date": year,
                        "type_id": 1,  # war
                        "qid": None
                    })
                    log_results(writer, event.id, war, "is added")
                else:
                    new_start = year if event.start_date is None or event.start_date > year else event.start_date
                    new_end = year if event.end_date is None or event.end_date < year else event.end_date
                    event.update({"start_date": new_start, "end_date": new_end})
                    # log_results(writer, event.id, war, "is updated")

                # --- Location işlemleri ---
                location = Location(id=None, name=battle, lat=lat, lon=lon, country=country, cursor=cursor)
                if location.id is None:
                    location.set_data({
                        "name": battle,
                        "lat": lat,
                        "lon": lon,
                        "country_label": country
                    })
                    log_results(writer, location.id, battle, " battle is added")
                else:

                    location.update({
                        "lat": lat,
                        "lon": lon,
                        "country_label": country
                    })
                    log_results(writer, location.id, battle, " battle is updated")

                # --- EventLocation işlemleri ---
                event_location = EventLocation(
                    id=None,
                    event_id=event.id,
                    location_id=location.id,
                    cursor=cursor
                )
                if event_location.id is None:
                    event_location.set_data({
                        "event_id": event.id,
                        "location_id": location.id,
                        "start_date": year,
                        "end_date": year,
                        "relationship_type_id": 1,  # battle
                        "description_json": build_description(row)
                    })
                    log_results(writer, location.name, war, "is linked")
                else:
                    log_results(writer, location.name, war, "is already linked")
                

                batch += 1
                if batch % 10 == 0:
                    conn.commit()

            except Exception as e:
                print(f"❌ Hata (war={war}, battle={battle}): {e}")

        conn.commit()
    conn.close()

if __name__ == "__main__":
    add_events("data/war_battles_locations.csv")
