import pandas as pd
import sqlite3
import csv  
from entities.Work import Work
from entities.Human import Human

import requests, random, time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


OUTPUT_CSV = "MET_artwork_list_report_qid_001.csv"
DB_PATH = "birdview.db"


MET_OBJECT_API = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{}"
HEADERS = {"User-Agent": "BirdView-MET-ThumbFetcher/1.0 (contact: you@example.com)"}


def log_results(w, id, name, message):
    w.writerow([id, name, message])
    print(f"🎨 {name} ({id}) result: {message}")

def make_session():
    s = requests.Session()
    # 403 ve 429 dahil tekrar denenmesi gereken durumlar
    retry = Retry(
        total=6,
        backoff_factor=0.8,  # 0.8, 1.6, 3.2, ...
        status_forcelist=[403, 429, 500, 502, 503, 504],
        allowed_methods={"GET"},
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    # Daha “insan” UA + JSON kabul et
    s.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/123.0 Safari/537.36 BirdView/1.0",
            "Accept": "application/json",
        }
    )
    return s



def fetch_met_thumb(session: requests.Session, object_id: str, max_tries: int = 4):
    """
    Otomatik retry (HTTPAdapter) + ek manuel backoff/jitter.
    403/429 gelirse biraz bekleyip tekrar dener.
    """
    last_err = None
    for attempt in range(1, max_tries + 1):
        try:
            r = session.get(MET_OBJECT_API.format(object_id), timeout=20)
            if r.status_code == 200:
                j = r.json()
                # önce küçük, yoksa büyük
                img = j.get("primaryImageSmall") or j.get("primaryImage") or None
                return img
            elif r.status_code in (403, 429):
                # limit/yasak → bekle + jitter
                wait = (2 ** (attempt - 1)) * 0.8 + random.uniform(0, 0.6)
                print(
                    f"⏳ {r.status_code} için bekleniyor ({wait:.2f}s) objectID={object_id}"
                )
                time.sleep(wait)
            else:
                # diğer durumlarda da bir kez daha deneyebiliriz
                last_err = f"{r.status_code} {r.reason}"
        except Exception as e:
            last_err = str(e)
            # ağ hataları → backoff
            wait = (2 ** (attempt - 1)) * 0.8 + random.uniform(0, 0.6)
            print(f"⚠️ ağ hatası (try {attempt}/{max_tries}): {e} → {wait:.2f}s bekle")
            time.sleep(wait)

    return None
    # buraya geldiyse olmadı
    raise requests.HTTPError(
        f"MET API thumb alınamadı (objectID={object_id}): {last_err}"
    )

def add_works(file_path):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        df = pd.read_csv(file_path, low_memory=False)
        session = make_session()

        for row in df.itertuples(index=False, name="HumanRow"):

            constituent_id = row.obj_id
            title = row.title
            creator_qid = row.creator_qid
            created_date = row.created_date
            description = row.description
            url = row.url
            artwork_qid = row.o_qid
            type = row.type
            location = row.location
            is_public_domain = row.is_public

            
           
            work = Work(qid=artwork_qid, cursor=cursor, w=writer)

            if work.id is None:

                work.set_data({
                    "title": title,
                    "creator_id": None,
                    "date": created_date,
                    "description": description,
                    "image_url": fetch_met_thumb(session, constituent_id) if is_public_domain else f"https://collectionapi.metmuseum.org/api/collection/v1/iiif/{constituent_id}/restricted",
                    "url": url,
                    "created_date": created_date,
                    "collection_id": 2,  # MET koleksiyonu      
                    "type_id": None,  # artwork
                    "qid": artwork_qid,
                    "constituent_id": constituent_id
                })
                log_results(writer, artwork_qid, title, f"Added successfully {is_public_domain} - constituent_id: {constituent_id}")

            else: 
                log_results(writer, artwork_qid, title, f"Already exists {is_public_domain} - constituent_id: {constituent_id} ")

            work.update_type(type)
            work.update_location(location)
            work.update({
                "qid": artwork_qid,
                "constituent_id": constituent_id
            })
                
            conn.commit()

        conn.close()

def update_works(file_path):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "Result"])

        df = pd.read_csv(file_path, low_memory=False)
        session = make_session()

        for row in df.itertuples(index=False, name="HumanRow"):

            constituent_id = row.obj_id
            title = row.title
            creator_qid = row.creator_qid
            created_date = row.created_date
            description = row.description
            url = row.url
            artwork_qid = row.o_qid
            type = row.type
            location = row.location
            is_public_domain = row.is_public

            work = Work(creator_qid=creator_qid, created_date=created_date, url=url, title=title, description=description,cursor=cursor, w=writer)

            if work.id is None:

                log_results(writer, creator_qid, title, f"No work exists {is_public_domain} - constituent_id: {constituent_id} ")

                return
            
            log_results(writer, artwork_qid, title, f"Already exists {is_public_domain} - constituent_id: {constituent_id} ")

           
            work.update({
                "qid": artwork_qid,
                "constituent_id": constituent_id
            })
                
            #conn.commit()

        conn.close()
          


if __name__ == "__main__":
    add_works("data/MET/MET_artworks_list_with_qid.csv")