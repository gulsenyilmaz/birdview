import requests
from urllib.parse import quote

HEADERS = {"User-Agent": "AliveThen-MovementFetcher/1.0 (gulsenyilmaz9@gmail.com)"}


class MovementFromWikidata:
    def __init__(self, qid):
        self.qid = qid
        self.name = ""
        self.description = ""
        self.image_url = ""
        self.instance_label = ""
        self.inception = None
        self.start_date = None
        self.end_date = None

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

    def _parse_time(self, claim):
        """Helper: extracts a year from a Wikidata time string like '+1880-00-00T00:00:00Z'"""
        time_str = (
            claim.get("mainsnak", {})
            .get("datavalue", {})
            .get("value", {})
            .get("time", "")
        )
        return time_str.lstrip("+")[:4] if time_str else None

    def _fetch_and_parse(self):
        entity = self._fetch_entity()
        if not entity:
            return

        claims = entity.get("claims", {})

        self.name = entity.get("labels", {}).get("en", {}).get("value", "unknown")
        self.description = entity.get("descriptions", {}).get("en", {}).get("value", "")

        # Image (P18)
        if "P18" in claims:
            img_name = claims["P18"][0]["mainsnak"]["datavalue"]["value"]
            self.image_url = (
                f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(img_name)}"
            )

        # Instance of (P31) label
        if "P31" in claims:
            instance_qid = claims["P31"][0]["mainsnak"]["datavalue"]["value"]["id"]
            try:
                label_url = f"https://www.wikidata.org/wiki/Special:EntityData/{instance_qid}.json"
                label_data = requests.get(label_url, headers=HEADERS).json()
                self.instance_label = label_data["entities"][instance_qid]["labels"][
                    "en"
                ]["value"]
            except:
                pass

        # Inception (P571)
        if "P571" in claims:
            self.inception = self._parse_time(claims["P571"][0])

        # Start time (P580)
        if "P580" in claims:
            self.start_date = self._parse_time(claims["P580"][0])

        # End time (P582)
        if "P582" in claims:
            self.end_date = self._parse_time(claims["P582"][0])

    def to_dict(self):
        return {
            "qid": self.qid,
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "instance_label": self.instance_label,
            "inception": self.inception,
            "start_date": self.start_date,
            "end_date": self.end_date,
        }

    def __repr__(self):
        return f"<MovementFromWikidata {self.qid}: {self.name}>"
