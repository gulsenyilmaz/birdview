import requests
from urllib.parse import quote

HEADERS = {"User-Agent": "AliveThen-HumanFetcher/1.0 (gulsenyilmaz9@gmail.com)"}


class WorkFromWikidata:
    def __init__(self, qid):
        self.qid = qid
        self.title = ""
        self.description = ""
        self.image_url = ""
        self.inception = None
        self.instance_label = ""
        self.instance_qid = None
        

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
        self.description = entity.get("descriptions", {}).get("en", {}).get("value", "")

        # Image
        if "P18" in claims:
            img_sn = claims["P18"][0].get("mainsnak", {}).get("datavalue", {})
            img_name = img_sn.get("value")
            if isinstance(img_name, str):
                self.image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(img_name)}"

        # instance of (P31)
        if "P31" in claims:
            self.instance_qid = claims["P31"][0]["mainsnak"]["datavalue"]["value"]["id"]

        # Logo (P154)
        if "P154" in claims:
            logo_sn = claims["P154"][0].get("mainsnak", {}).get("datavalue", {})
            logo_name = logo_sn.get("value")

            if isinstance(logo_name, str):
                self.logo_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(logo_name)}"

        def _year_from_time(t):
            try:
                if not t:
                    return None
                # t formatı genelde "+1955-00-00T00:00:00Z"
                # print(f"Extracting year from time: {t}")
                y = int(t[:5])
                return y
            except Exception:
                return None
        # Inception (P571)
        if "P571" in claims:
            inception_val = claims["P571"][0]["mainsnak"]["datavalue"]["value"]
            self.inception = _year_from_time(inception_val.get("time"))  # ISO formatta string olabilir

        
        if self.instance_qid:
            label_url = f"https://www.wikidata.org/wiki/Special:EntityData/{self.instance_qid}.json"
            label_r = requests.get(label_url, headers=HEADERS)
            label_r.raise_for_status()
            label_data = label_r.json()
            self.instance_label = label_data["entities"][self.instance_qid]["labels"][
                "en"
            ]["value"]

    def to_dict(self):
        return {
            "qid": self.qid,
            "title": self.title,
            "description": self.description,
            "image_url": self.image_url,
            "inception": self.inception,
            "instance_label": self.instance_label,
            "instance_qid": self.instance_qid,
        }

    def __repr__(self):
        return f"<WorkFromWikidata {self.qid}: {self.description[:40]}...>"
