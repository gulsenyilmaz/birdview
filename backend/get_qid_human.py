import sqlite3
import csv
import time
import requests


import pandas as pd
import numpy as np

OUTPUT_CSV = "new_field_lookup_results_03.csv"
DB_PATH = "birdview.db"

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

HEADERS = {
    "User-Agent": "AliveThen-WikidataLookup/1.0 (gulsenyilmaz9@gmail.com)",
    "Accept": "application/sparql-results+json",
}


def get_wikidata_qid(name, birth_year):
    query = f"""
    SELECT ?person WHERE {{
      ?person wdt:P31 wd:Q5;
              rdfs:label "{name}"@en;
    }}
    LIMIT 1
    """

    if birth_year:
        query = f"""
        SELECT ?person WHERE {{
          ?person wdt:P31 wd:Q5;
                  rdfs:label "{name}"@en;
                  wdt:P569 ?birthDate.
          FILTER(YEAR(?birthDate) = {birth_year})
        }}
        LIMIT 1
        """
    response = requests.get(WIKIDATA_ENDPOINT, headers=HEADERS, params={"query": query})
    print(f"Executing query: {response.status_code}\n")
    if response.status_code != 200:
        print(f"❌ HTTP error {response.status_code} for query:\n{query}\n")
        return None
    print(f"Executing query: {query}\n")
    try:
        data = response.json()
        print(f"Response JSON: {data}")  # Debugging line
    except Exception as e:
        print("❌ JSON decode failed:", e)
        print("Response content:", response.text)
        return None

    results = data.get("results", {}).get("bindings", [])
    print(f"Found {len(results)} results for query:\n{query}\n")
    if results:
        qid = results[0]["person"]["value"].split("/")[-1]
        return print(f"Executing query: {qid}\n")
    if not birth_year:
        return None

    get_wikidata_qid(name, None)


if __name__ == "__main__":
    get_wikidata_qid("Anjali Monteiro")  # Örnek kullanım
