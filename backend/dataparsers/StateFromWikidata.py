import requests
from urllib.parse import quote
from dataparsers.EntityFromWikidata import EntityFromWikidata

HEADERS = {"User-Agent": "AliveThen-HumanFetcher/1.0 (gulsenyilmaz9@gmail.com)"}


class StateFromWikidata:
    def __init__(self, qid):
        self.qid = qid
        self.name = ""
        self.inception = None
        self.dissolution = None
        self.type = None
       

        self._fetch_and_parse()

    def _fetch_entity(self):
        url = f"https://www.wikidata.org/wiki/Special:EntityData/{self.qid}.json"
        try:
            response = requests.get(url, headers=HEADERS)
            response.raise_for_status()
            return response.json()["entities"][self.qid]
        except Exception as e:
            print(f"❌ Error fetching {self.qid}: {e}")
            return None

    def _fetch_and_parse(self):
        entity = self._fetch_entity()
        if not entity:
            return

        claims = entity.get("claims", {})

        self.name = entity.get("labels", {}).get("en", {}).get("value", "unknown")

        # Inception (P571)
        if "P571" in claims:
            inception_val = claims["P571"][0]["mainsnak"]["datavalue"]["value"]
            t = inception_val.get("time")# ISO formatta string olabilir
            if t:
                self.inception = int(t[:5])  

        # Dissolution (P576)
        if "P576" in claims:
            dissolution_val = claims["P576"][0]["mainsnak"]["datavalue"]["value"]
            t = dissolution_val.get("time")  # ISO formatta string olabilir   
            if t:
                self.dissolution = int(t[:5])   
                
        # Type (P31)
        if "P31" in claims:
            type_qid = claims["P31"][0]["mainsnak"]["datavalue"]["value"]["id"]
            type_entity = EntityFromWikidata(type_qid)
            self.type = type_entity.name

       


    def to_dict(self):
        return {
            "qid": self.qid,
            "name": self.name,
            "inception": self.inception,
            "dissolution": self.dissolution,
            "type": self.type,
        }

    def __repr__(self):
        return f"<StateFromWikidata {self.qid}: {self.name}>"
