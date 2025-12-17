from entities.BaseEntity import BaseEntity

class MilitaryEvent(BaseEntity):
    TABLE_NAME = "military_events"
    FIELDS = [
            "id",          
            "qid",
            "name",
            "image_url",
            "description",
            "start_time",
            "end_time",
            "point_in_time",
            "wiki_url",
            "lat",
            "lon",
            "depth_index",
            "depth_level",
            "descendant_count",
            "parent_id"
    ]

    def get_parent_depth_index(self) -> str | None:
        """
        '109_38_16' -> '109_38'
        '109_38'    -> '109'
        '109'       -> None (root)
        """
        if not getattr(self, "depth_index", None):
            return None

        parts = self.depth_index.split("_")
        if len(parts) <= 1:
            return None
        return "_".join(parts[:-1])

    

    

    def get_descendants(self) -> list[dict]:
        """
        depth_index'i tam olarak self.depth_index'ten sonra '_' ile devam eden
        (yani çocuk + torun + torunun çocukları vb.)
        tüm eventleri döndürür.
        """

        # depth_index içindeki LIKE wildcardlarını kaçır
        prefix = self.depth_index

        # Önce backslash'ı, sonra '_' ve '%' yi escape edelim
        escaped_prefix = (
            prefix.replace("\\", "\\\\")
                .replace("_", r"\_")
                .replace("%", r"\%")
        )

        like_pattern = escaped_prefix + r"\_%"   # örn: '109\_3\_%'

        query = """
            SELECT id, qid, lat, lon, start_time, end_time, point_in_time, descendant_count
            FROM military_events
            WHERE depth_index LIKE ? ESCAPE '\\'
            AND id != ?
        """

        self.cursor.execute(query, (like_pattern, self.id))
        results = self.cursor.fetchall()

        return [dict(row) for row in results]
    
    def fit_descendants_data(self):
        descendants = self.get_descendants()

        if not descendants:
            self.log_results(
                getattr(self, "id", "-"),
                "No descendants found.",
                " fit_descendants_data skipped.",
            )
            return

        self.fit_descendant_coords(descendants)
        # self.fit_descendant_date(descendants)

    def fit_descendant_coords(self, descendants: list[dict]):

        # Sadece yaprak (descendant_count == 0) ve koordinatı olanları al
        leaf_coords = [
            (d["lon"], d["lat"])
            for d in descendants
            if d.get("lon") is not None
            and d.get("lat") is not None
            and d.get("descendant_count", 0) == 0
        ]

        # Eğer hiç koordinat yoksa dokunma
        if not leaf_coords:
            self.log_results(
                getattr(self, "id", "-"),
                "No valid descendant coordinates found.",
                "fit_descendant_coords skipped.",
            )
            return

        # Ortalama (mean) merkez
        lons = [lon for lon, _ in leaf_coords]
        lats = [lat for _, lat in leaf_coords]

        center_lon = sum(lons) / len(lons)
        center_lat = sum(lats) / len(lats)

        self.update({
            "lon": center_lon,
            "lat": center_lat,
        })

        self.log_results(
            getattr(self, "id", "-"),
            f"lon={center_lon}, lat={center_lat}",
            "fit_descendant_coords updated center (mean).",
        )
       
    
    def fit_descendant_date(self, descendants: list[dict]):
        # Boş olmayan değerleri topla
        start_times = [d["start_time"] for d in descendants if d.get("start_time") is not None]
        end_times = [d["end_time"] for d in descendants if d.get("end_time") is not None]
        point_in_times = [d["point_in_time"] for d in descendants if d.get("point_in_time") is not None]

        start_time = min(start_times) if start_times else None
        end_time = max(end_times) if end_times else None
        point_in_time = min(point_in_times) if point_in_times else None

        if start_time is None and end_time is None and point_in_time is None:
            self.log_results(
                getattr(self, "id", "-"),
                "No valid descendant dates found.",
                " fit_descendant_date skipped.",
            )
            return

        self.update({
            "start_time": start_time,
            "end_time": end_time,
            "point_in_time": point_in_time,
        })

    def year_to_iso(self, year: int | None) -> str | None:
        """
        Yılı ISO datetime formatına çevirir:
        1590 -> '1590-01-01T00:00:00Z'
        0    -> '0000-01-01T00:00:00Z'
        -58  -> '-0058-01-01T00:00:00Z'
        - yıl 2025'ten büyükse None (filtre)
        """
        if year is None:
            return None

        # sadece üst sınırı koruyoruz, 0 ve negatif serbest
        if year > 2025:
            return None

        if year >= 0:
            # 0 ve pozitifler: 4 hane
            year_str = f"{year:04d}"     # 0 -> '0000', 5 -> '0005', 1590 -> '1590'
        else:
            # negatifler: işaret + 4 hane
            year_str = f"{year:05d}"     # -58 -> '-0058', -5 -> '-0005', -1234 -> '-1234'

        return f"{year_str}-01-01T00:00:00Z"

    
    def update_time(self, data):
        """
        data: {"start_time": int|None, "end_time": int|None}
        """
        start_year = data.get("start_time")
        end_year   = data.get("end_time")

        start_iso = self.year_to_iso(start_year) if start_year is not None else None
        end_iso   = self.year_to_iso(end_year)   if end_year   is not None else None

        # Sadece başlangıç verildiyse, end_time'ı da aynı yıl yap
        if start_year is not None and end_year is None:
            end_iso = start_iso

        if start_year is not None and end_year is not None:
            self.update({
                "start_time": start_iso,
                "end_time": end_iso,
                "point_in_time": start_iso,
            })


    def update_coors(self, data):
        lat = data.get("lat")
        lon = data.get("lon")

        if lat is not None and lon is not None:
            self.update({
                "lat": lat,
                "lon": lon,
            }) 

    def update_parent(self, data):
        parent_id = data.get("parent_id")
        old_parent_id = self.parent_id  # mevcut parent

        if parent_id is None:
            self.update({
                "parent_id": None,
            })
            if old_parent_id is not None:
                old_parent = MilitaryEvent(
                    id=old_parent_id,
                    cursor=self.cursor,
                    w=getattr(self, "w", None),
                )
                old_parent.update_descendant_count()
                old_parent.update_parent_descendant_count()

            self.update_descendants_data()
            self.update_depth()
            
            return

        parent_event = MilitaryEvent(
            id = parent_id,
            cursor = self.cursor,
            w = getattr(self, "w", None),
        )

        if parent_event.id is None:
            self.log_results(
                getattr(self, "id", "-"),
                f"Parent event with id={parent_id} not found.",
                " update_parent skipped.",
            )
            return
        
        self.update({
            "parent_id": parent_event.id,
        })

        if old_parent_id is not None:
            old_parent = MilitaryEvent(
                id=old_parent_id,
                cursor=self.cursor,
                w=getattr(self, "w", None),
            )
            old_parent.update_descendant_count()
            old_parent.update_parent_descendant_count()
        
        self.update_descendants_data()
        self.update_depth()
       
        self.update_parent_descendant_count()

    def generate_depth_index(self):

        new_depth_index = str(self.id)  # varsayılan: root ise kendi id'si
        if self.parent_id:
            parent_event = MilitaryEvent(id=self.parent_id, cursor=self.cursor, w=getattr(self, "w", None),)
            new_depth_index = f"{parent_event.generate_depth_index()}_{new_depth_index}"

        return new_depth_index
    

    def update_depth(self):
        new_depth_index = self.generate_depth_index()
        new_depth_level = new_depth_index.count("_") + 1

        self.update({
            "depth_index": new_depth_index,
            "depth_level": new_depth_level
        }) 

    def update_descendants_data(self):
        descendants = self.get_descendants()

        if not descendants:
            self.log_results(
                getattr(self, "id", "-"),
                "No descendants found.",
                " update_desecendants_data skipped.",
            )
            return
        
        for descendant in descendants:
            event = MilitaryEvent(id=descendant["id"], cursor=self.cursor, w=getattr(self, "w", None),) 
            event.update_depth()

    def update_descendant_count(self):
        descendants = self.get_descendants()

        if not descendants:
            self.log_results(
                getattr(self, "id", "-"),
                "No descendants found.",
                " update_descendant_counts skipped.",
            )
            return
        
        self.update({
            "descendant_count": len(descendants)
        })

    def update_parent_descendant_count(self):
        print("Update parent descendant count...")
        parent_id = self.parent_id

        while parent_id:
            parent_event = MilitaryEvent(
                id=parent_id,
                cursor=self.cursor,
                w=getattr(self, "w", None),
            )

            parent_event.update_descendant_count()
            parent_id = parent_event.parent_id
       
                
                
               
            


       
