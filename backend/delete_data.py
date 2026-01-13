# import sqlite3

# DB_PATH = "birdview.db"

# conn = sqlite3.connect(DB_PATH)
# conn.execute("PRAGMA foreign_keys = ON;")

# with conn:
#     conn.execute("DELETE FROM military_events;")
#     conn.execute("DELETE FROM sqlite_sequence WHERE name IN ('military_events', 'event_type_relation', 'militaryevent_location');")

# conn.close()