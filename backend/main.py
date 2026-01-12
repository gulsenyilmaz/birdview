from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import sqlite3
from collections import Counter

import json

from dataparsers.LocationFromWikidata import LocationFromWikidata
from dataparsers.HumanFromWikidata import HumanFromWikidata
from dataparsers.WorkFromWikidata import WorkFromWikidata

from entities.Human import Human
from entities.MilitaryEvent import MilitaryEvent
from entities.Location import Location
from entities.Work import Work


import os
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DB_PATH = os.getenv("DB_PATH", "birdview.db")


@app.get("/allhumans")
def get_humans(request: Request):
    qp = request.query_params

    human_id = qp.get("human_id")
    occupation_id = qp.get("occupation_id")
    movement_id = qp.get("movement_id")
    gender_id = qp.get("gender_id")
    nationality_id = qp.get("nationality_id")
    location_id = qp.get("location_id")
    relationship_type_id = qp.get("relationship_type_id")  # optional

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    base_query = """
        SELECT 
            h.id, h.name, h.birth_date, h.death_date,
            n.name AS nationality, g.name AS gender,
            l.lat AS lat, l.lon AS lon, l.name AS city, l.id AS city_id,
            h.num_of_identifiers, h.qid, h.img_url,
            EXISTS (
                SELECT 1
                FROM works w
                WHERE w.creator_id = h.id
                AND w.type_id = 19
            ) AS awarded
        FROM humans h
        INNER JOIN human_location hl ON hl.human_id = h.id
        INNER JOIN locations l ON hl.location_id = l.id
        INNER JOIN genders g ON g.id = h.gender_id
        INNER JOIN nationalities n ON n.id = h.nationality_id
        WHERE 
            h.birth_date IS NOT NULL
            AND h.birth_date != 0
            AND hl.relationship_type_id = 4
    """

    params = []

    if location_id:
        base_query += """
            AND h.id IN (
                SELECT human_id FROM human_location AS filtered_hl WHERE filtered_hl.location_id = ?
        """
        params.append(location_id)

        if relationship_type_id:
            base_query += " AND filtered_hl.relationship_type_id = ?"
            params.append(relationship_type_id)

        base_query += """
            )
        """
    if movement_id:
        base_query += """
            AND h.id IN (
                SELECT human_id FROM human_movement WHERE movement_id = ?
            )
        """
        params.append(movement_id)

    if occupation_id:
        base_query += """
            AND h.id IN (
                SELECT human_id FROM human_occupation WHERE occupation_id = ?
            )
        """
        params.append(occupation_id)

    if gender_id:
        base_query += " AND h.gender_id = ?"
        params.append(gender_id)

    if nationality_id:
        base_query += " AND h.nationality_id = ?"
        params.append(nationality_id)

    if human_id:
        base_query += " AND h.id = ?"
        params.append(human_id)

    base_query += """
        ORDER BY city_id, h.birth_date  ASC"""

    results = cur.execute(base_query, params).fetchall()
    conn.close()

    humans = [dict(row) for row in results]
    city_counter = Counter()
    for h in humans:
        h["entity_type"] = "human"
        h["awarded"] = bool(h["awarded"])
        if h["city"] and h["birth_date"]:
            key = f"{h['city']}_{h['birth_date']}"
            city_counter[key] += 1
            h["city_index"] = city_counter[key]

    return JSONResponse({"humans": humans})


@app.get("/works/{creator_id}")
def get_works(creator_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT w.id, w.qid, w.title, w.created_date, w.description, w.image_url, w.url, c.name AS collection_name
        FROM works AS w
        JOIN collections AS c ON w.collection_id = c.id
        WHERE creator_id = ?
        ORDER BY created_date ASC
    """,
        (creator_id,),
    )

    results = [dict(row) for row in cur.fetchall()]
    conn.close()
    return results


@app.get("/person/{human_id}")
def get_person_details(human_id: int):
    print("get_person_details")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        "SELECT description, img_url, signature_url FROM humans WHERE id = ?",
        (human_id,),
    )
    row = cur.fetchone()
    if not row:
        return {"error": "person not found"}

    description, img_url, signature_url = row

    cur.execute(
        """
        SELECT l.id, l.name, hlt.name AS relationship_type_name, hl.start_date, hl.end_date, l.lat AS loc_lat, l.lon As loc_lon, l.qid
        FROM human_location AS hl
        JOIN locations AS l ON l.id = hl.location_id
        JOIN human_location_types AS hlt ON hlt.id = hl.relationship_type_id
        WHERE hl.human_id = ?
    """,
        (human_id,),
    )

    locs = [dict(row) for row in cur.fetchall()]

    cur.execute(
        """
        SELECT o.name AS name
        FROM human_occupation AS ho
        JOIN occupations AS o ON o.id = ho.occupation_id
        WHERE ho.human_id = ?
    """,
        (human_id,),
    )

    occs = [row["name"] for row in cur.fetchall()]

    cur.execute(
        """
        SELECT m.name AS name
        FROM human_movement AS hm
        JOIN movements AS m ON m.id = hm.movement_id
        WHERE hm.human_id = ?
    """,
        (human_id,),
    )

    movs = [row["name"] for row in cur.fetchall()]

    cur.execute(
        """
        SELECT cl.name AS name
        FROM human_collection AS hcl
        JOIN collections AS cl ON cl.id = hcl.collection_id
        WHERE hcl.human_id = ?
    """,
        (human_id,),
    )

    colls = [row["name"] for row in cur.fetchall()]


    cur.execute(
        """
        SELECT s.name AS name
        FROM citizenships AS c
        JOIN states AS s ON s.id = c.state_id
        WHERE c.human_id = ?
    """,
        (human_id,),
    )

    citizs = [row["name"] for row in cur.fetchall()]

    conn.close()

    return {
        "description": description,
        "img_url": img_url,
        "signature_url": signature_url,
        "locations": locs,
        "occupations": occs,
        "movements": movs,
        "collections": colls,
        "citizenships": citizs,
    }


@app.get("/location/{location_id}")
def get_location_details(location_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        "SELECT qid, description, image_url, logo_url, inception, country_label FROM locations WHERE id = ?",
        (location_id,),
    )
    row = cur.fetchone()
    if not row:
        return {"error": "location not found"}
    qid, description, img_url, logo_url, inception, country_label = row

    conn.close()

    return JSONResponse(
        {
            "details": {
                "qid": qid,
                "description": description,
                "img_url": img_url,
                "logo_url": logo_url,
                "inception": inception,
                "country_label": country_label,
            }
        }
    )


@app.get("/movements")
def get_movements(request: Request):
    qp = request.query_params

    occupation_id = qp.get("occupation_id")
    gender_id = qp.get("gender_id")
    nationality_id = qp.get("nationality_id")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    base_query = """
        SELECT 
           m.id, m.name, COUNT(hm.human_id) AS count
        FROM human_movement hm
        INNER JOIN movements m ON hm.movement_id = m.id
    """

    params = []
    conditions = []

    if occupation_id:
        conditions.append("""
            hm.human_id IN (
                SELECT human_id FROM human_occupation WHERE occupation_id = ?
            )
        """)
        params.append(occupation_id)

    if gender_id:
        conditions.append("""
            hm.human_id IN (
                SELECT id FROM humans WHERE gender_id = ?
            )
        """)
        params.append(gender_id)

    if nationality_id:
        conditions.append("""
            hm.human_id IN (
                SELECT id FROM humans WHERE nationality_id = ?
            )
        """)
        params.append(nationality_id)

    if conditions:
        base_query += f" WHERE {' AND '.join(conditions)}"

    base_query += """
        GROUP BY hm.movement_id
        ORDER BY count DESC
        LIMIT 200;
    """

    results = cur.execute(base_query, params).fetchall()
    conn.close()

    movements = [dict(row) for row in results]

    return JSONResponse({"movements": movements})


@app.get("/occupations")
def get_occupations(request: Request):
    qp = request.query_params

    movement_id = qp.get("movement_id")
    gender_id = qp.get("gender_id")
    nationality_id = qp.get("nationality_id")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    base_query = """
        SELECT 
           o.id, o.name, COUNT(ho.human_id) AS count
        FROM human_occupation ho
        INNER JOIN occupations o ON ho.occupation_id = o.id
        
    """
    params = []
    conditions = []

    if movement_id:
        conditions.append("""
            ho.human_id IN (
                SELECT human_id FROM human_movement WHERE movement_id = ?
            )
        """)
        params.append(movement_id)

    if gender_id:
        conditions.append("""
            ho.human_id IN (
                SELECT id FROM humans WHERE gender_id = ?
            )
        """)
        params.append(gender_id)

    if nationality_id:
        conditions.append("""
            ho.human_id IN (
                SELECT id FROM humans WHERE nationality_id = ?
            )
        """)
        params.append(nationality_id)

    if conditions:
        base_query += f" WHERE {' AND '.join(conditions)}"

    base_query += """
        GROUP BY ho.occupation_id
        ORDER BY count DESC
        LIMIT 500;
    """

    results = cur.execute(base_query, params).fetchall()
    conn.close()

    occupations = [dict(row) for row in results]

    return JSONResponse({"occupations": occupations})


@app.get("/genders")
def get_genders(request: Request):
    qp = request.query_params

    movement_id = qp.get("movement_id")
    occupation_id = qp.get("occupation_id")
    nationality_id = qp.get("nationality_id")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    base_query = """
       SELECT 
           g.id, g.name, COUNT(h.gender_id) AS count
        FROM genders g
        INNER JOIN humans h ON h.gender_id = g.id
       
        
    """
    params = []
    conditions = []

    if movement_id:
        conditions.append("""
            h.id IN (
                SELECT human_id FROM human_movement WHERE movement_id = ?
            )
        """)
        params.append(movement_id)

    if occupation_id:
        conditions.append("""
            h.id IN (
                SELECT human_id FROM human_occupation WHERE occupation_id = ?
            )
        """)
        params.append(occupation_id)

    if nationality_id:
        conditions.append("""
            h.id IN (
                SELECT id FROM humans WHERE nationality_id = ?
            )
        """)
        params.append(nationality_id)

    if conditions:
        base_query += f" WHERE {' AND '.join(conditions)}"

    base_query += """
        GROUP BY h.gender_id
        ORDER BY count DESC
    """

    results = cur.execute(base_query, params).fetchall()
    conn.close()

    genders = [dict(row) for row in results]

    return JSONResponse({"genders": genders})


@app.get("/nationalities")
def get_nationalities(request: Request):
    qp = request.query_params

    movement_id = qp.get("movement_id")
    occupation_id = qp.get("occupation_id")
    gender_id = qp.get("gender_id")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    base_query = """
       SELECT 
           n.id, n.name, COUNT(h.id) AS count
        FROM nationalities n
        INNER JOIN humans h ON h.nationality_id = n.id
        
    """
    params = []
    conditions = []

    if movement_id:
        conditions.append("""
            h.id IN (
                SELECT human_id FROM human_movement WHERE movement_id = ?
            )
        """)
        params.append(movement_id)

    if occupation_id:
        conditions.append("""
            h.id IN (
                SELECT human_id FROM human_occupation WHERE occupation_id = ?
            )
        """)
        params.append(occupation_id)

    if gender_id:
        conditions.append("""
            h.id IN (
                SELECT id FROM humans WHERE gender_id = ?
            )
        """)
        params.append(gender_id)

    if conditions:
        base_query += f" WHERE {' AND '.join(conditions)}"

    base_query += """
        GROUP BY n.id
        ORDER BY count DESC
    """

    results = cur.execute(base_query, params).fetchall()
    conn.close()

    nationalities = [dict(row) for row in results]

    return JSONResponse({"nationalities": nationalities})


@app.get("/search")
def search(q: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    results = {"humans": [], "locations": [], "events": []}

    if len(q) >= 2:
        cur.execute(
            """
            SELECT id, name, birth_date, death_date, qid FROM humans
            WHERE name LIKE ?
            ORDER BY 
            CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
            num_of_identifiers DESC,
            name
            LIMIT 10
        """,
            (f"%{q}%", f"{q}%"),
        )
        results["humans"] = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT id, name, lat AS loc_lat, lon AS loc_lon, qid FROM locations
            WHERE name LIKE ?
            ORDER BY 
            CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
            name
            LIMIT 10
        """,
            (f"%{q}%", f"{q}%"),
        )

        results["locations"] = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT * FROM military_events
            WHERE name LIKE ?
            ORDER BY 
            CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
            name
            LIMIT 10
        """,
            (f"%{q}%", f"{q}%"),
        )       
        results["events"] = [dict(r) for r in cur.fetchall()]

    return results



@app.get("/allevents")
def get_events(request: Request):
    qp = request.query_params

   

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    base_query = """
        SELECT 
            el.id, e.name AS name, l.name AS battle, el.start_date, el.end_date,
            l.lat AS lat, l.lon AS lon, el.description_json
        FROM events e
        INNER JOIN event_location el ON el.event_id = e.id
        INNER JOIN locations l ON el.location_id = l.id
    """

    

    results = cur.execute(base_query).fetchall()
    conn.close()

    events = [dict(row) for row in results]

    for e in events:
        e["entity_type"] = "event"

        try:
            desc = json.loads(e["description_json"]) if e["description_json"] else {}
        except json.JSONDecodeError:
            desc = {}

        

        e["scale"] = desc.get("scale", 1)
        e["tooltip_text"] = f"{e['name']} : {e['battle']}"
        # e["participants"] = desc.get("participants", [])
        # e["winner"] = desc.get("winner", "Unknown") if desc else "Unknown"
        # e["loser"] = desc.get("loser")
        # e["massacre"] = desc.get("massacre")
   
   

    return JSONResponse({"events": events})

def extract_year(val):
    
    if not val:
        return None

    s = str(val).strip()

    # MÖ için işaret
    sign = -1 if s.startswith('-') else 1

    # 4 rakam arka arkaya olan kısmı bul
    m = re.search(r"\d{4}", s)
    if m:
        year = int(m.group(0))   # "0053" -> 53
        return sign * year       # MÖ ise -53, değilse 53

    

@app.get("/allmilitaryevents")
def get_military_events(request: Request):
    qp = request.query_params

    military_event_depth_index = qp.get("military_event_depth_index")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    base_query = """
        SELECT 
           me.id, 
           me.qid, 
           me.name, 
           me.image_url,
           me.start_time, me.end_time, me.point_in_time, 
           me.lat, me.lon, 
           me.depth_index, me.descendant_count, me.depth_level, me.parent_id, 
           GROUP_CONCAT(et.name, ' | ') AS event_type
        FROM military_events AS me
        LEFT JOIN event_type_relation AS etr ON me.id = etr.event_id
        LEFT JOIN event_types AS et ON et.id = etr.type_id
        
    """

    params = []

    if military_event_depth_index:
        # depth_index içindeki '_' karakterlerini LIKE için escape et
        escaped_prefix = military_event_depth_index.replace("_", r"\_")
        like_pattern = escaped_prefix + r"\_%"

        base_query += """
            WHERE depth_index = ?
               OR depth_index LIKE ? ESCAPE '\\'
        """
        params.extend([military_event_depth_index, like_pattern])

    base_query += """
        GROUP BY me.id
        ORDER BY me.depth_level ASC, me.start_time ASC
    """

    results = cur.execute(base_query, params).fetchall()
    conn.close()

    military_events = [dict(row) for row in results]

    for e in military_events:
        e["entity_type"] = "military_event"
        
        start_date = extract_year(e.get("start_time"))
        point_in_time = extract_year(e.get("point_in_time"))
        end_date = extract_year(e.get("end_time"))
        e["start_date"] = start_date if start_date is not None else point_in_time
        e["end_date"] =  end_date if end_date is not None else e["start_date"]
       
    return JSONResponse({"military_events": military_events})




@app.get("/military_event/{military_event_id}")
def get_military_event_details(military_event_id: int):
    print("get_military_event_details")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT 
        me.id, 
        me.qid, 
        me.name, 
        me.start_time, me.end_time, me.point_in_time, 
        me.lat, me.lon, 
        me.depth_index, me.descendant_count, me.depth_level, 
        me.wiki_url, me.image_url, me.description,
        me.parent_id, parent_me.name AS parent_name, et.name AS event_type
          FROM military_events AS me 
        INNER JOIN event_type_relation AS etr ON me.id = etr.event_id
        INNER JOIN event_types AS et ON et.id = etr.type_id
        LEFT JOIN military_events AS parent_me ON me.parent_id = parent_me.id
        WHERE me.id = ?""",
        (military_event_id,),
    )
    row = cur.fetchone()
    if not row:
        return {"error": "military_event not found"}


    conn.close()

    return JSONResponse(
        {
            "details": {
                "id": row["id"],
                "qid": row["qid"],
                "name": row["name"],
                "image_url": row["image_url"],
                "description": row["description"],
                "start_time": row["start_time"],
                "end_time": row["end_time"],
                "point_in_time": row["point_in_time"],
                "wiki_url": row["wiki_url"],
                "depth_index": row["depth_index"],
                "descendant_count": row["descendant_count"],
                "depth_level": row["depth_level"],
                "parent_id": row["parent_id"],
                "parent_name": row["parent_name"] if row["parent_id"] else None,
                "event_type": row["event_type"]
            }
        }
    )


def to_int_or_none(value: str | None):
    if value is None:
        return None
    value = value.strip()
    if value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None   # veya hatayı loglayıp yine None dönebilirsin

def to_float_or_none(value: str | None):
    if value is None:
        return None
    value = value.strip()
    if value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


@app.put("/military_event/{event_id}/update")
def militaryevent_update(event_id: int, payload: dict):
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    start_time = to_int_or_none(payload.get("start_time"))
    end_time   = to_int_or_none(payload.get("end_time"))
    parent_id  = to_int_or_none(payload.get("parent_id"))
    lat        = to_float_or_none(payload.get("lat"))
    lon        = to_float_or_none(payload.get("lon"))

    event = MilitaryEvent(id=event_id, cursor=cur)
    if event.id is None:
        print("❌ Failed to add to humans - already exists")
        raise HTTPException(status_code=404, detail=f"MilitaryEvent {event_id} not found")
        
        
    
    event.update_time({"start_time":start_time,"end_time":end_time})
    event.update_parent({"parent_id":parent_id})
    event.update_coors({"lat":lat,"lon":lon})
    
    conn.commit()
    conn.close()
    return {"status": "success", "event_id": event_id}


@app.put("/humans/{human_id}/update")
def human_update(human_id: int):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    human = Human(id=human_id, cursor=cur)
    human.update_from_wikidata()

    conn.commit()
    conn.close()
    return {
        "status": "success",
        "human_id": human_id
    }



@app.put("/locations/{location_id}/update")
def location_update(location_id: int):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    location = Location(id=location_id, cursor=cur)
    location.update_from_wikidata()

    conn.commit()
    conn.close()
    return {
        "status": "success",
        "location_id": location_id
    }


@app.put("/works/{work_id}/update")
def work_update(work_id: int):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    work = Work(id=work_id, cursor=cur)
    work.update_from_wikidata()

    conn.commit()
    conn.close()
    return {
        "status": "success",
        "work_id": work_id
    }
