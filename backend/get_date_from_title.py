import re
import sqlite3

DB_PATH = "birdview.db"

# Q12273558 gibi isimleri atlamak için
def is_qid_like(text: str) -> bool:
    if not text:
        return False
    return re.fullmatch(r"[Qq]\d{3,}", text.strip()) is not None

# Başlık/description içindeki yıl pattern’leri
PATTERNS = [
    # 1694-1696 or 1694–1696
    re.compile(r'(?P<start>\d{3,4})\s*[–-]\s*(?P<end>\d{3,4})'),

    # (1942)
    re.compile(r'\((?P<year>\d{3,4})\)'),

    # Leading year: 1981 Battle of X
    re.compile(r'^(?P<year>\d{3,4})\b'),

    # Ending year: ... 1942
    re.compile(r'(?P<year>\d{3,4})$'),

    # of 1857
    re.compile(r'\bof\s+(?P<year>\d{3,4})\b', re.IGNORECASE),

    # 🔚 Fallback: metnin herhangi bir yerindeki yıl
    # Örn: "April 1945 US war crime in Germany"
    #      "battle during the 2023 Ukrainian counteroffensive"
    re.compile(r'\b(?P<year>\d{3,4})\b'),
]

def extract_years_from_text(text: str):
    """
    Metinden (name/description) yıl ya da yıl aralığı çıkar.
    Dönüş: (start_year, end_year)
    - Aralık varsa: (1694, 1696)
    - Tek yıl varsa: (1942, None)
    """
    if not text:
        return None, None
    
    for pattern in PATTERNS:
        m = pattern.search(text)
        if m:
            gd = m.groupdict()
            if "start" in gd and "end" in gd and gd["start"] and gd["end"]:
                print(f"  Matched range: {gd['start']} - {gd['end']}")
                return int(gd["start"]), int(gd["end"])
            if "year" in gd and gd["year"]:
                y = int(gd["year"])
                return y, y
    return None, None

def year_to_iso(year: int | None) -> str | None:
    """
    Yılı ISO datetime formatına çevirir:
    1590 -> '1590-01-01T00:00:00Z'
    - yıl 0 veya negatifse None
    - yıl 2025'ten büyükse None (filtre)
    """
    if year is None:
        return None
    if year <= 0 or year > 2025:
        return None
    return f"{year:04d}-01-01T00:00:00Z"


def fill_times_from_name_or_description():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, description
        FROM military_events
        WHERE start_time IS NULL
          AND point_in_time IS NULL
          
    """)
    rows = cursor.fetchall()

    updated = 0

    for event_id, name, desc in rows:
        # QID olmayanlardan başlayarak deneyeceğimiz metinler
        texts_to_try = []
        

        if name and not is_qid_like(name):
             texts_to_try.append(name)

        if desc and not is_qid_like(desc):
            texts_to_try.append(desc)

        start_year = end_year = None

        for text in texts_to_try:
            s, e = extract_years_from_text(text)
            if s is not None or e is not None:
                start_year, end_year = s, e
                break  # ilk bulduğu pattern'i kullan

        if start_year is None and end_year is None:
            continue  # bu event için yapacak bir şey yok

        start_iso = end_iso = point_iso = None

        if start_year is not None and end_year is not None:
            # yıl aralığı: start_time / end_time
            start_iso = year_to_iso(start_year)
            end_iso = year_to_iso(end_year)
            point_iso = year_to_iso(start_year)

        elif start_year is not None and end_year is None:
            # tek yıl: point_in_time
            point_iso = year_to_iso(start_year)

        # Hepsi 2025 filtresinde elenmiş olabilir
        if not start_iso and not end_iso and not point_iso:
            continue

        cursor.execute("""
             UPDATE military_events
            SET start_time    = COALESCE(start_time, ?),
                end_time      = COALESCE(end_time, ?),
                point_in_time = COALESCE(point_in_time, ?)
            WHERE id = ?
                       
        """, (start_iso, end_iso, point_iso, event_id))
        conn.commit()
        updated += 1

        print(f"[OK] id={event_id} | desc='{desc}' | "
              f"start_time={start_iso}, end_time={end_iso}, point_in_time={point_iso}")

    conn.close()
    print("Bitti. Güncellenen event sayısı:", updated)

if __name__ == "__main__":
    fill_times_from_name_or_description()
