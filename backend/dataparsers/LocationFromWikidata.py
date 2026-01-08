import requests
from urllib.parse import quote

HEADERS = {"User-Agent": "AliveThen-HumanFetcher/1.0 (gulsenyilmaz9@gmail.com)"}


class LocationFromWikidata:
    def __init__(self, qid):
        self.qid = qid
        self.name = ""
        self.description = ""
        self.image_url = ""
        self.lat = None
        self.lon = None
        self.instance_label = ""
        self.instance_qid = None
        self.logo_url = ""
        self.inception = None
        self.country_qid = None
        self.country_label = ""

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

        # Inception (P571)
        # if "P571" in claims:
        #     inception_val = claims["P571"][0]["mainsnak"]["datavalue"]["value"]
        #     self.inception = inception_val.get("time")  # ISO formatta string olabilir

        # Country (P17)
        if "P17" in claims:
            self.country_qid = claims["P17"][0]["mainsnak"]["datavalue"]["value"]["id"]

            # Ülke adını da çek
            country_url = f"https://www.wikidata.org/wiki/Special:EntityData/{self.country_qid}.json"
            try:
                country_data = requests.get(country_url, headers=HEADERS).json()
                self.country_label = country_data["entities"][self.country_qid][
                    "labels"
                ]["en"]["value"]
            except:
                pass

        # coordinates (P625)
        coords = None
        if "P625" in claims:
            snak = claims["P625"][0].get("mainsnak", {})
            if snak.get("datatype") == "globe-coordinate":
                coords = snak.get("datavalue", {}).get("value")

                self.lat = coords.get("latitude") if coords else None
                self.lon = coords.get("longitude") if coords else None
                
        elif "P131" in claims:
            # Eğer koordinatlar yoksa, idari bölgeye bak
            admin_qid = claims["P131"][0]["mainsnak"]["datavalue"]["value"]["id"]
            admin_entity = LocationFromWikidata(admin_qid)
            self.lat = admin_entity.lat
            self.lon = admin_entity.lon

        elif "P361" in claims:
            # Eğer koordinatlar yoksa, bağlı olduğu yere bak
            partof_qid = claims["P361"][0]["mainsnak"]["datavalue"]["value"]["id"]
            partof_entity = LocationFromWikidata(partof_qid)
            self.lat = partof_entity.lat
            self.lon = partof_entity.lon

        elif "P36" in claims:
            # Eğer koordinatlar yoksa, başkent bilgisine bak
            capital_qid = claims["P36"][0]["mainsnak"]["datavalue"]["value"]["id"]
            capital_entity = LocationFromWikidata(capital_qid)
            self.lat = capital_entity.lat
            self.lon = capital_entity.lon
        elif "P17" in claims:
            # Eğer koordinatlar yoksa, ülkeye bak
            country_qid = claims["P17"][0]["mainsnak"]["datavalue"]["value"]["id"]
            country_entity = LocationFromWikidata(country_qid)
            self.lat = country_entity.lat
            self.lon = country_entity.lon

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
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "logo_url": self.logo_url,
            "lat": self.lat,
            "lon": self.lon,
            "inception": self.inception,
            "instance_label": self.instance_label,
            "instance_qid": self.instance_qid,
            "country_qid": self.country_qid,
            "country_label": self.country_label,
        }

    def __repr__(self):
        return f"<LocationFromWikidata {self.qid}: {self.description[:40]}...>"
