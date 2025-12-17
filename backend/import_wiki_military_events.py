import csv
import re, time, sqlite3, requests
from entities.MilitaryEvent import MilitaryEvent
from entities.EventType import EventType
from entities.EventTypeRelation import EventTypeRelation
from entities.Location import Location
from entities.MilitaryEventLocation import MilitaryEventLocation

import pandas as pd
import numpy as np
import math
from typing import Any, List


OUTPUT_CSV = "data/wars_output_03.csv"
DB_PATH = "birdview.db"

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

HEADERS = {
    "User-Agent": "BirdView-WikidataLookup/1.0 (gulsenyilmaz9@gmail.com)",
    "Accept": "application/sparql-results+json",
}

def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f" {name} ({id}) result: {message}")

def load_root_events(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path, low_memory=False)
    return df

def load_events(p_qid: str) -> pd.DataFrame:
    if not p_qid:
        return None
    data = get_from_wikidata(p_qid)
    if data is None:
        return None
    results = data.get("results", {}).get("bindings", [])
    if not results:
        return None
    df = pd.json_normalize(results) 

    df = df.rename(columns={
        "qid.value": "qid",
        "itemLabel.value": "itemLabel",
        "desc.value": "desc",
        "image.value": "image",
        "coord.value": "coord",
        "pTime.value": "pTime",
        "sTime.value": "sTime",
        "eTime.value": "eTime",
        "enWiki.value": "enWiki",
        "typeQids.value": "typeQids",
        "types.value": "types",
        "typeDescs.value": "typeDescs",
        "locs.value": "locs",
        "locQids.value": "locQids",
    })
    
    return df

def get_from_wikidata(p_qid):
    query = f"""
    SELECT  
      ?qid 
      ?itemLabel 
      ?sTime ?eTime 
      (SAMPLE(?pTime) AS ?pTime)
      (SAMPLE(?image) AS ?image)
      (SAMPLE(?desc) AS ?desc)
      (SAMPLE(?coord) AS ?coord)
      (SAMPLE(?article) AS ?enWiki)
      
      (GROUP_CONCAT(DISTINCT STRAFTER(STR(?type),"entity/"); SEPARATOR="|") AS ?typeQids)
      (GROUP_CONCAT(DISTINCT ?typeLabel; SEPARATOR="|") AS ?types)
      (GROUP_CONCAT(DISTINCT ?typeDesc; SEPARATOR="|") AS ?typeDescs)
 
      (GROUP_CONCAT(DISTINCT ?locLabel; SEPARATOR="|") AS ?locs)
      (GROUP_CONCAT(DISTINCT STRAFTER(STR(?loc),"entity/"); SEPARATOR="|") AS ?locQids)
  
    WHERE {{
                    
        ?item wdt:P361 wd:{p_qid} .
    
        BIND(STRAFTER(STR(?item),"entity/") AS ?qid)
        OPTIONAL {{ ?item wdt:P580 ?sTime. }}
        OPTIONAL {{ ?item wdt:P585 ?pTime. }}
        OPTIONAL {{ ?item wdt:P582 ?eTime. }}
    
        OPTIONAL {{ ?item wdt:P18 ?image. }}
        OPTIONAL {{ ?item schema:description ?desc FILTER(LANG(?desc)="en"). }}
    
        ?item wdt:P31 ?type . 
        OPTIONAL {{ ?type schema:description ?typeDesc FILTER(LANG(?typeDesc)="en"). }}
        # locations (+ coords)
        OPTIONAL {{
        ?item wdt:P276 ?loc .
        OPTIONAL {{ ?loc rdfs:label ?locLabel FILTER(LANG(?locLabel)="en") }}
        OPTIONAL {{ ?loc wdt:P625 ?locCoord. }}
        }}
    
    OPTIONAL {{ ?item wdt:P625 ?directCoord. }}
    BIND(COALESCE(?directCoord, ?locCoord) AS ?coord)
    
    OPTIONAL {{
        ?article schema:about ?item ;
                schema:isPartOf <https://en.wikipedia.org/> .
    }}
    
        

    SERVICE wikibase:label {{
        bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en,fr,es,tr,de,it" .
        ?item rdfs:label ?itemLabel .
        ?type rdfs:label ?typeLabel .
        }}
    }}
    GROUP BY ?qid ?itemLabel ?sTime ?eTime 
    ORDER BY ?sTime
    LIMIT 1000
    OFFSET 0
    """

    
    response = requests.get(WIKIDATA_ENDPOINT, headers=HEADERS, params={"query": query})
    
    if response.status_code != 200:
        print(f"❌ HTTP error {response.status_code} for query:\n{query}\n")
        return None
    time.sleep(0.3)  # Wikidata'ya aşırı yüklenmemek için kısa bir bekleme

    try:
        data = response.json()
        return data
        
    except Exception as e:
        print("❌ JSON decode failed:", e)
        print("Response content:", response.text)
        return None

    

def convert_to_list(value: Any, sep: str = "|") -> List[str]:
    # None / NaN / boş string -> []
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return []
    if isinstance(value, str) and not value.strip():
        return []
    # Zaten liste/tuple ise
    if isinstance(value, (list, tuple)):
        parts = [str(v).strip() for v in value if str(v).strip()]
    else:
        parts = [v.strip() for v in str(value).split(sep) if v.strip()]
    # Boş parçaları at
    return parts


def parse_wkt_point(wkt):
    # Örn: "Point(-102.0 23.0)"
    if wkt is None or not isinstance(wkt, str) or not wkt.startswith("Point"):
        return None, None
    wkt = wkt.strip()

    # Parantez içini al
    inner = wkt[wkt.find("(")+1 : wkt.find(")")]
    lon_str, lat_str = inner.split()
    return float(lat_str), float(lon_str)   # database LAT, LON sırası istiyorsun


def make_depth_index(parent_depth_index: str | None, suffix: int) -> str:
    """
    parent_depth_index: '109', '109_38' veya None
    suffix: 1, 2, 16, 38 ...
    """
    if parent_depth_index is None:
        return str(suffix)
    return f"{parent_depth_index}_{suffix}"


def get_depth_level(depth_index: str) -> int:
    """
    '109' -> 1
    '109_38' -> 2
    '109_38_16' -> 3
    """
    return len(depth_index.split("_"))


def add_events(file_path):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    
    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["battle", "war", "Result"])

        df = load_root_events(file_path)
        total = len(df)
        
        for row in df.itertuples(index=False, name="EventRow"):
            parent_qid = convert_to_list(row.parentQids, sep="|")[0] if row.parentQids else None

            parent_event = MilitaryEvent(id=None, qid=parent_qid, cursor=conn.cursor(), w=writer)
            
            add_event(row, parent_event.id, parent_event.name, conn, writer)
           
            log_results(writer, f"event: {row.itemLabel}", f"parent: {parent_event.name}", " ------------------------------------")
        
        
           

def add_event(e_data, parent_id, parent_name, c, w):
    cursor = c.cursor()
    qid = e_data.qid

    try:
        
        if qid is None:
            log_results(w, "UNKNOWN_QID", "?", "❌ Missing qid, skipping")
            return
        
        # Güvenli attribute erişimi
        name          = getattr(e_data, "itemLabel", None)
        image_url     = getattr(e_data, "image", None)
        description   = getattr(e_data, "desc", None)
        start_time    = getattr(e_data, "sTime", None)
        end_time      = getattr(e_data, "eTime", None)
        point_in_time = getattr(e_data, "pTime", None)
        coord         = getattr(e_data, "coord", None)
        wiki_url      = getattr(e_data, "enWiki", None)

        lat, lon = parse_wkt_point(coord)

        types       = convert_to_list(getattr(e_data, "types", None))
        typeQids    = convert_to_list(getattr(e_data, "typeQids", None))
        typeDescs   = convert_to_list(getattr(e_data, "typeDescs", None))
        locations   = convert_to_list(getattr(e_data, "locs", None))
        locationQids= convert_to_list(getattr(e_data, "locQids", None))

        # --- Event işlemleri ---
        event = MilitaryEvent(id=None, qid=qid, cursor=cursor, w=w)
        
        if event.id is None:

            event.set_data({
                "qid": qid,
                "name": name,
                "image_url": image_url,
                "description": description,
                "start_time": start_time,
                "end_time": end_time,
                "point_in_time": point_in_time,
                "wiki_url": wiki_url,
                "lat": lat,
                "lon": lon,
                "descendant_count": 0,
                "parent_id": parent_id
            })

            event.update_depth()
            event.update_parent_descendant_count()


            for t_index, t_qid in enumerate(typeQids):
                event_type = EventType(id=None, qid=t_qid, cursor=cursor)
                type_name = types[t_index] if t_index < len(types) else None
                type_desc = typeDescs[t_index] if t_index < len(typeDescs) else None

                if event_type.id is None:
                    event_type.set_data({
                        "name": type_name,
                        "qid": t_qid, 
                        "description": type_desc
                    })
                    log_results(w, f"event_type.id: {event_type.id}", f"{event_type.qid}_{event_type.name}", "is added to event_types")
                else:
                    log_results(w, f"event_type.id: {event_type.id}", f"{event_type.qid}_{event_type.name}", "already exists in event_types")
                
                event_type_relation = EventTypeRelation(id=None, event_id=event.id, type_id=event_type.id, cursor=cursor)
                if event_type_relation.id is None:
                    event_type_relation.set_data({
                        "event_id": event.id,
                        "type_id": event_type.id
                    })
                    log_results(w, f"event_type_relation.id: {event_type_relation.id}", f"{event.name}_{event_type.name}", "is linked to event")
                else:
                    log_results(w, f"event_type_relation.id: {event_type_relation.id}", f"{event.name}_{event_type.name}", "already linked to event")
                
           
            for l_index, l_qid in enumerate(locationQids):
                    location = Location(id=None, qid=l_qid, cursor=cursor)
                    location_name = locations[l_index] if l_index < len(locations) else None
        
                    if location.id is None:
                        location.set_data({
                            "name": location_name,
                            "qid": l_qid
                        })
                        log_results(w, f"Location_id: {location.id}", f"{location.qid}_{location.name}", "is added to locations")
                    else:
                        log_results(w, f"Location_id: {location.id}", f"{location.qid}_{location.name}", "already exists in locations")
                    
                    event_location = MilitaryEventLocation(id=None, event_id=event.id, location_id=location.id, cursor=cursor)
                    if event_location.id is None:
                        event_location.set_data({
                            "event_id": event.id,
                            "location_id": location.id
                        })
                        log_results(w, f"event_location_id: {event_location.id}", f"{event.name}_{location.name}", "is linked to event")
                    else:
                        log_results(w, f"event_location_id: {event_location.id}", f"{event.name}_{location.name}", "already linked to event")
            
            c.commit()
            df = load_events(qid)
            if df is None:
                return
            log_results(w, parent_name, name, " SUCCESSFULLY PROCESSED -- LOOKING FOR CHILD EVENTS ")
            
            for row in df.itertuples(index=False, name="EventRow"):
                add_event(row, event.id, event.name, c, w)
            
            

        else:
            
            if event.parent_id is None:
                if parent_id is not None:

                    event.update({"parent_id": parent_id})
                    event.update_depth()
                    event.update_parent_descendant_count()
                    event.update_descendants_data()

                    c.commit()

                    c_df = load_events(qid)
                    if c_df is None:
                        return
                    log_results(w, parent_name, name, " SUCCESSFULLY PROCESSED -- LOOKING FOR CHILD EVENTS ")
                    
                    for row in c_df.itertuples(index=False, name="EventRow"):
                        add_event(row, event.id, event.name,  c, w)
                    
            else:
                if event.parent_id == parent_id:

                    log_results(
                        w,
                        event.qid,
                        f"{event.name}",
                        "already exists with same depth_index"
                    )
                else:
                
                    log_results(
                        w,
                        event.qid,
                        f"{event.name}",
                        "already exists with another parent_id"
                    )
     

        
               
        

    
    except Exception as e:
        log_results(w, qid, name, "❌ Failed to fetch entity")
        return


if __name__ == "__main__":
    add_events("data/child_military_camp_with.csv")