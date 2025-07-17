import requests
from urllib.parse import quote

HEADERS = {
    "User-Agent": "AliveThen-HumanFetcher/1.0 (gulsenyilmaz9@gmail.com)"
}

class HumanFromWikidata:
    def __init__(self, qid):
        self.qid = qid
        self.description = ""
        self.image_url = ""
        self.locations = []  # dicts with qid, type, start_time, end_time
        self.occupations = []
        self.has_works_in = []
        self.birth_date = None
        self.birth_place = None
        self.death_date = None
        self.death_place = None
        self.fields_of_work = []
        self.movements = []
        self.gender = None
        self.signature_url = None

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

    def _parse_location_claims(self, claims, relation_type):
        results = []
        for claim in claims:
            value = claim["mainsnak"]["datavalue"]["value"]
            qid = value.get("id")
            qualifiers = claim.get("qualifiers", {})

            # Start time (P580)
            start_time = None
            if "P580" in qualifiers:
                start_time = qualifiers["P580"][0]["datavalue"]["value"].get("time")
                start_time = start_time.lstrip("+") if start_time else None

            # End time (P582)
            end_time = None
            if "P582" in qualifiers:
                end_time = qualifiers["P582"][0]["datavalue"]["value"].get("time")
                end_time = end_time.lstrip("+") if end_time else None

            results.append({
                "qid": qid,
                "relation_type": relation_type,
                "start_date": start_time,
                "end_date": end_time
            })
        return results

    def _extract_field_ids(self, claims, pid):
        values = []
        for claim in claims.get(pid, []):
            val = claim["mainsnak"].get("datavalue", {}).get("value")
            if isinstance(val, dict) and "id" in val:
                values.append(val["id"])
            else:
                values.append(val)
        return values

    def _fetch_and_parse(self):
        entity = self._fetch_entity()
        if not entity:
            return

        claims = entity.get("claims", {})
        self.description = entity.get("descriptions", {}).get("en", {}).get("value", "")

        # Image
        if "P18" in claims:
            img_name = claims["P18"][0]["mainsnak"]["datavalue"]["value"]
            self.image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(img_name)}"
        
        # Gender
        if "P21" in claims:
            val = claims["P21"][0]["mainsnak"].get("datavalue", {}).get("value", {})
            if isinstance(val, dict):
                self.gender = val.get("id")

        # Signature
        if "P109" in claims:
            sign_name = claims["P109"][0]["mainsnak"]["datavalue"]["value"]
            self.signature_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(sign_name)}"

        # Locations
        self.locations += self._parse_location_claims(claims.get("P551", []), "residence")
        self.locations += self._parse_location_claims(claims.get("P937", []), "work_location")
        self.locations += self._parse_location_claims(claims.get("P69", []), "educated_at")

        # Occupations and Collections
        self.occupations = self._extract_field_ids(claims, "P106")
        self.has_works_in = self._extract_field_ids(claims, "P6379")

       

        # Birth and Death info
        if "P569" in claims:
            dob = claims["P569"][0]["mainsnak"]["datavalue"]["value"].get("time", "")
            if dob:
                self.birth_date = int(dob.lstrip("+")[:4])

        if "P19" in claims:
            self.birth_place = claims["P19"][0]["mainsnak"]["datavalue"]["value"].get("id")

        if self.birth_place:
            self.locations.append({
                "qid": self.birth_place,
                "relation_type": "birth_place", 
                "start_date": self.birth_date,
                "end_date": self.birth_date 
            })

        if "P570" in claims:
            dod = claims["P570"][0]["mainsnak"]["datavalue"]["value"].get("time", "")
            if dod:
                self.death_date = int(dod.lstrip("+")[:4])

        if "P20" in claims:
            self.death_place = claims["P20"][0]["mainsnak"]["datavalue"]["value"].get("id")

       
        if self.death_place:
            self.locations.append({
                "qid": self.death_place,
                "relation_type": "death_place",
                "start_date": self.death_date,
                "end_date": self.death_date
            })

        if self.has_works_in:
            for hwi_qid in self.has_works_in:
                self.locations.append({
                    "qid": hwi_qid,
                    "relation_type": "has_works_in",
                    "start_date": None,
                    "end_date": None
                })

        # Field of work and Movement
        self.fields_of_work = self._extract_field_ids(claims, "P101")
        self.movements = self._extract_field_ids(claims, "P135")

    def to_dict(self):
        return {
            "qid": self.qid,
            "description": self.description,
            "image_url": self.image_url,
            "gender": self.gender,
            "signature_url": self.signature_url,
            "locations": self.locations,
            "occupations": self.occupations,
            "has_works_in": self.has_works_in,
            "birth_date": self.birth_date,
            "birth_place": self.birth_place,
            "death_date": self.death_date,
            "death_place": self.death_place,
            "fields_of_work": self.fields_of_work,
            "movements": self.movements
        }

    def __repr__(self):
        return f"<HumanFromWikidata {self.qid}: {self.description[:40]}...>"
