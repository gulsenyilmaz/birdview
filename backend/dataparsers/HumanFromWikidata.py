import requests
from urllib.parse import quote

HEADERS = {"User-Agent": "BirdView-HumanFetcher/1.0 (gulsenyilmaz9@gmail.com)"}


def _safe_pick_entity(data: dict, requested_qid: str):
    """EntityData JSON'undan güvenli şekilde entity seçer (redirect/missing handle)."""
    entities = data.get("entities", {}) or {}
    # 1) Tam istenen QID varsa ve missing değilse onu döndür
    ent = entities.get(requested_qid)
    if isinstance(ent, dict) and "missing" not in ent:
        return ent
    # 2) Yoksa ilk missing olmayanı döndür (redirect hedefi genelde burada olur)
    for e in entities.values():
        if isinstance(e, dict) and "missing" not in e:
            return e
    return None  # gerçekten bulunamadı


class HumanFromWikidata:
    def __init__(self, qid):
        self.qid = qid
        self.name = None
        self.description = ""
        self.image_url = ""
        self.citizenships = []
        self.locations = []
        self.occupations = []
        self.has_works_in = []
        self.birth_date = None
        self.birth_place = None
        self.death_date = None
        self.death_place = None
        self.fields_of_work = []
        self.movements = []
        self.gender = None
        self.nationality = None
        self.signature_url = None
        self.gender_qid = None
        self.nationality_qid = None
        self.num_of_identifiers = 0
        self.notable_works = []

        self._fetch_and_parse()

    def _fetch_entity(self):
        url = f"https://www.wikidata.org/wiki/Special:EntityData/{self.qid}.json"
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            r.raise_for_status()
            data = r.json()
            ent = _safe_pick_entity(data, self.qid)
            if not ent:
                raise KeyError(self.qid)
            return ent
        except Exception as e:
            print(f"❌ Error fetching {self.qid}: {e}")
            return None

    def _fetch_label(self, qid: str, lang: str = "en"):
        """QID için etiket döndürür; redirect/missing güvenli."""
        try:
            url = f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json"
            r = requests.get(url, headers=HEADERS, timeout=15)
            r.raise_for_status()
            ent = _safe_pick_entity(r.json(), qid)
            if not ent:
                return None
            return ent.get("labels", {}).get(lang, {}).get("value")
        except Exception:
            return None

    def _parse_location_claims(self, claims, relation_type):
        results = []
        for claim in claims:
            mainsnak = claim.get("mainsnak", {})
            dv = mainsnak.get("datavalue", {})
            val = dv.get("value")
            # bazen novalue/ somevalue olabilir
            if not isinstance(val, dict):
                continue
            qid = val.get("id")
            if not qid:
                continue

            qualifiers = claim.get("qualifiers", {})

            def _extract_time(pid):
                if pid in qualifiers:
                    t = (
                        qualifiers[pid][0]
                        .get("datavalue", {})
                        .get("value", {})
                        .get("time")
                    )
                    if t:
                        # print(f"Extracted time for {qid} ({relation_type}): {t}")

                        y = int(t[:5])
                        return y
                return None

            results.append(
                {
                    "qid": qid,
                    "relation_type": relation_type,
                    "start_date": _extract_time("P580"),
                    "end_date": _extract_time("P582"),
                }
            )
        return results

    def _extract_field_ids(self, claims, pid):
        out = []
        for claim in claims.get(pid, []):
            val = claim.get("mainsnak", {}).get("datavalue", {}).get("value")
            if isinstance(val, dict) and "id" in val:
                out.append(val["id"])
            elif val is not None:
                out.append(val)
        return out

    def _count_identifiers_from_entity(self, entity: dict) -> int:
        claims = entity.get("claims", {}) or {}
        count = 0
        for pid, statements in claims.items():
            if any(
                st.get("mainsnak", {}).get("datatype") == "external-id"
                for st in statements
            ):
                count += 1
        return count

    def _fetch_and_parse(self):
        entity = self._fetch_entity()
        if not entity:
            return

        claims = entity.get("claims", {}) or {}
        self.description = (
            entity.get("descriptions", {}).get("en", {}).get("value", "") or ""
        )

        self.name = entity.get("labels", {}).get("en", {}).get("value")

        # Image P18
        if "P18" in claims:
            img_sn = claims["P18"][0].get("mainsnak", {}).get("datavalue", {})
            img_name = img_sn.get("value")
            if isinstance(img_name, str):
                self.image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(img_name)}"

        # Gender P21
        if "P21" in claims:
            gval = (
                claims["P21"][0]
                .get("mainsnak", {})
                .get("datavalue", {})
                .get("value", {})
            )
            if isinstance(gval, dict):
                self.gender_qid = gval.get("id")
                if self.gender_qid:
                    self.gender = self._fetch_label(self.gender_qid, "en")

        # Nationality P27
        if "P27" in claims:
            nval = (
                claims["P27"][0]
                .get("mainsnak", {})
                .get("datavalue", {})
                .get("value", {})
            )
            if isinstance(nval, dict):
                self.nationality_qid = nval.get("id")
                if self.nationality_qid:
                    self.nationality = self._fetch_label(self.nationality_qid, "en")

        # Signature P109
        if "P109" in claims:
            sign_sn = claims["P109"][0].get("mainsnak", {}).get("datavalue", {})
            sign_name = sign_sn.get("value")
            if isinstance(sign_name, str):
                self.signature_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(sign_name)}"

        # Locations
        self.locations += self._parse_location_claims(
            claims.get("P551", []), "residence"
        )
        self.locations += self._parse_location_claims(
            claims.get("P937", []), "work_location"
        )
        self.locations += self._parse_location_claims(
            claims.get("P69", []), "educated_at"
        )

        # Occupations / Collections
        self.occupations = self._extract_field_ids(claims, "P106")
        self.has_works_in = self._extract_field_ids(claims, "P6379")

        # Birth/Death
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

        if "P569" in claims:
            dob_t = (
                claims["P569"][0]
                .get("mainsnak", {})
                .get("datavalue", {})
                .get("value", {})
                .get("time", "")
            )
            self.birth_date = _year_from_time(dob_t)

        if "P19" in claims:
            bp_val = (
                claims["P19"][0]
                .get("mainsnak", {})
                .get("datavalue", {})
                .get("value", {})
            )
            self.birth_place = bp_val.get("id")

        if self.birth_place:
            self.locations.append(
                {
                    "qid": self.birth_place,
                    "relation_type": "birth_place",
                    "start_date": self.birth_date,
                    "end_date": self.birth_date,
                }
            )

        if "P570" in claims:
            dod_t = (
                claims["P570"][0]
                .get("mainsnak", {})
                .get("datavalue", {})
                .get("value", {})
                .get("time", "")
            )
            self.death_date = _year_from_time(dod_t)

        if "P20" in claims:
            dp_val = (
                claims["P20"][0]
                .get("mainsnak", {})
                .get("datavalue", {})
                .get("value", {})
            )
            self.death_place = dp_val.get("id")

        if self.death_place:
            self.locations.append(
                {
                    "qid": self.death_place,
                    "relation_type": "death_place",
                    "start_date": self.death_date,
                    "end_date": self.death_date,
                }
            )

        if self.has_works_in:
            for hwi_qid in self.has_works_in:
                self.locations.append(
                    {
                        "qid": hwi_qid,
                        "relation_type": "has_works_in",
                        "start_date": None,
                        "end_date": None,
                    }
                )

        # Fields / Movements
        self.notable_works = self._extract_field_ids(claims, "P800")
        self.citizenships = self._extract_field_ids(claims, "P27")
        self.fields_of_work = self._extract_field_ids(claims, "P101")
        self.movements = self._extract_field_ids(claims, "P135")
        self.num_of_identifiers = self._count_identifiers_from_entity(entity)

    def to_dict(self):
        return {
            "qid": self.qid,
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "gender": self.gender,
            "nationality": self.nationality,
            "signature_url": self.signature_url,
            "citizenships":self.citizenships,
            "locations": self.locations,
            "occupations": self.occupations,
            "has_works_in": self.has_works_in,
            "birth_date": self.birth_date,
            "birth_place": self.birth_place,
            "death_date": self.death_date,
            "death_place": self.death_place,
            "fields_of_work": self.fields_of_work,
            "movements": self.movements,
            "num_of_identifiers": self.num_of_identifiers,
            "notable_works": self.notable_works,
        }
    
    

    def __repr__(self):
        return f"<HumanFromWikidata {self.qid}: {self.description[:70]}...>"
