from fastapi import FastAPI, Query
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from collections import Counter
from fastapi.responses import JSONResponse

from collections import defaultdict
import os

app = FastAPI()




# CORS ayarı – Frontend'e veri göndermek için gerekli
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # sadece frontend adresinle sınırlandırabilirsin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DB_PATH = os.getenv("DB_PATH", "birdview.db")



@app.get("/allhumans")
def get_humans(
    request: Request
):
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
            l.lat AS lat, l.lon AS lon, l.name AS city,
            h.num_of_identifiers, h.qid, h.img_url
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

    base_query += " ORDER BY h.birth_date ASC"
    print(base_query)
    results = cur.execute(base_query, params).fetchall()
    conn.close()

    humans = [dict(row) for row in results]
    city_counter = Counter()
    for h in humans:
        h["entity_type"] = "human"
        if h["city"]:
            city_counter[h["city"]] += 1
            h["city_index"] = city_counter[h["city"]]

    return JSONResponse({"humans": humans})


@app.get("/works/{creator_id}")
def get_works(creator_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, created_date, description, image_url, url
        FROM works
        WHERE creator_id = ?
        ORDER BY created_date ASC
    """, (creator_id,))

    results = [dict(row) for row in cur.fetchall()]
    conn.close()
    return results

@app.get("/person/{human_id}")
def get_person_details(human_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT description, img_url, signature_url FROM humans WHERE id = ?", (human_id,))
    row = cur.fetchone()
    if not row:
        return {"error": "person not found"}

    description, img_url, signature_url = row

    cur.execute("""
        SELECT l.id, l.name, hlt.name AS relationship_type_name, hl.start_date, hl.end_date, l.lat, l.lon, l.qid
        FROM human_location AS hl
        JOIN locations AS l ON l.id = hl.location_id
        JOIN human_location_types AS hlt ON hlt.id = hl.relationship_type_id
        WHERE hl.human_id = ?
    """, (human_id,))

    # locs = defaultdict(list)

    locs =  [dict(row) for row in cur.fetchall()]
    # locs = [row["name"] for row in cur.fetchall()] 
    # for id, name, relationship_type_name, start, end, lat, lon, qid in cur.fetchall():
    #     locs[relationship_type_name].append({
    #         "id": id,
    #         "name": name,
    #         "start_date": start,
    #         "end_date": end,
    #         "relationship_type_name": relationship_type_name,
    #         "entity_type": "location",
    #         "lat": lat,
    #         "lon": lon,
    #         "qid" : qid
    #     })        

    cur.execute("""
        SELECT o.name AS name
        FROM human_occupation AS ho
        JOIN occupations AS o ON o.id = ho.occupation_id
        WHERE ho.human_id = ?
    """, (human_id,))

    occs = [row["name"] for row in cur.fetchall()] 

    cur.execute("""
        SELECT m.name AS name
        FROM human_movement AS hm
        JOIN movements AS m ON m.id = hm.movement_id
        WHERE hm.human_id = ?
    """, (human_id,))

    movs = [row["name"] for row in cur.fetchall()] 

    conn.close()

    return {
        "description": description,
        "img_url": img_url,
        "signature_url":signature_url,
        "locations": locs,
        "occupations":occs,
        "movements": movs
    }


@app.get("/location/{location_id}")
def get_location_details(location_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

   
    cur.execute("SELECT description, image_url, logo_url, inception, country_label FROM locations WHERE id = ?", (location_id,))
    row = cur.fetchone()
    if not row:
        return {"error": "location not found"}
    description, img_url, logo_url, inception, country_label = row

    conn.close()
       
    return JSONResponse({
        "details":{
            "description": description,
            "img_url": img_url,
            "logo_url": logo_url,
            "inception":inception,
            "country_label":country_label
        }
    }) 

@app.get("/movements")
def get_movements():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    query = """
        SELECT 
           m.id, m.name, COUNT(hm.human_id) AS count
        FROM human_movement hm
        INNER JOIN movements m ON hm.movement_id = m.id
        GROUP BY hm.movement_id
        ORDER BY count DESC
        LIMIT 200;
    """

    results = cur.execute(query).fetchall()
    conn.close()

    movements = [dict(row) for row in results]
    
       
    return JSONResponse({
        "movements": movements
    }) 

@app.get("/occupations")
def get_occupations():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    query = """
        SELECT 
           o.id, o.name, COUNT(ho.human_id) AS count
        FROM human_occupation ho
        INNER JOIN occupations o ON ho.occupation_id = o.id
        GROUP BY ho.occupation_id
        ORDER BY count DESC
        LIMIT 500;
    """

    results = cur.execute(query).fetchall()
    conn.close()

    occupations = [dict(row) for row in results]
    
       
    return JSONResponse({
        "occupations": occupations
    }) 

@app.get("/genders")
def get_genders():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    query = """
        SELECT 
           g.id, g.name, COUNT(h.gender_id) AS count
        FROM genders g
        INNER JOIN humans h ON h.gender_id = g.id
        GROUP BY h.gender_id
        ORDER BY count DESC
    """

    results = cur.execute(query).fetchall()
    conn.close()

    genders = [dict(row) for row in results]
    
       
    return JSONResponse({
        "genders": genders
    }) 


@app.get("/nationalities")
def get_nationalities():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    query = """
        SELECT 
           n.id, n.name, COUNT(h.id) AS count
        FROM nationalities n
        INNER JOIN humans h ON h.nationality_id = n.id
        WHERE h.nationality_id IS NOT NULL
        GROUP BY n.id
        ORDER BY count DESC
    """

    results = cur.execute(query).fetchall()
    conn.close()

    nationalities = [dict(row) for row in results]
    
    return JSONResponse({"nationalities": nationalities})

@app.get("/search")
def search(q: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    results = {
        "humans": [],
        "locations": []
    }

    if len(q) >= 2:
       
        cur.execute("""
            SELECT id, name, birth_date, death_date, qid FROM humans
            WHERE name LIKE ?
            ORDER BY 
            CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
            num_of_identifiers DESC,
            name
            LIMIT 10
        """, (f"%{q}%", f"{q}%"))
        results["humans"] = [dict(r) for r in cur.fetchall()]

       
        cur.execute("""
            SELECT id, name, lat, lon, qid FROM locations
            WHERE name LIKE ?
            ORDER BY 
            CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
            name
            LIMIT 10
        """, (f"%{q}%", f"{q}%"))
        
        
        results["locations"] = [dict(r) for r in cur.fetchall()]

    return results