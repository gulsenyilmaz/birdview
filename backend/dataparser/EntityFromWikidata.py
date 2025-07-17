import requests

HEADERS = {
    "User-Agent": "AliveThen-HumanFetcher/1.0 (gulsenyilmaz9@gmail.com)"
}

class EntityFromWikidata:
    def __init__(self, qid):
        self.qid = qid
        self.name = ""
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

        self.name = entity.get("labels", {}).get("en", {}).get("value", "unknown")

    def to_dict(self):
        return {
            "qid": self.qid,
            "name": self.name,
        }

    def __repr__(self):
        return f"<EntityFromWikidata {self.qid or self.name}>"