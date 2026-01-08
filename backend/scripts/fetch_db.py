import os
import urllib.request

DB_PATH = os.getenv("DB_PATH", "/app/birdview.db")
DB_URL = os.getenv("DB_URL")

if not DB_URL:
    raise RuntimeError("DB_URL is not set")

if not os.path.exists(DB_PATH):
    print(f"Downloading DB to {DB_PATH} ...")
    urllib.request.urlretrieve(DB_URL, DB_PATH)
    print("DB downloaded.")
else:
    print("DB already exists:", DB_PATH)
