# import sqlite3

# DB_PATH = "birdview.db"

# conn = sqlite3.connect(DB_PATH)
# conn.row_factory = sqlite3.Row
# cur = conn.cursor()

# # 1) Root'ları çek: (depth_level = 1)
# cur.execute("""
#     SELECT id, depth_index
#     FROM military_events
#     WHERE depth_level = 1
# """)
# root_rows = cur.fetchall()

# # Eski root_prefix -> root_id map'i (örn: "10" -> 162)
# root_map = {row["depth_index"]: row["id"] for row in root_rows}

# print("Root map:", root_map)

# # 2) depth_level > 1 olanları güncelle
# cur.execute("""
#     SELECT id, depth_index
#     FROM military_events
#     WHERE depth_level > 1
# """)
# child_rows = cur.fetchall()

# for row in child_rows:
#     event_id = row["id"]
#     old_depth = row["depth_index"]

#     if not old_depth:
#         continue

#     parts = old_depth.split("_")
#     root_prefix = parts[0]         # örn: "10"
#     suffix = "_".join(parts[1:])   # örn: "3_1"

#     root_id = root_map.get(root_prefix)
#     if root_id is None:
#         # Bu durumda eski root_prefix için root bulamamışız, loglayıp atlayabilirsin
#         print(f"[WARN] No root found for prefix {root_prefix} (event id={event_id})")
#         continue

#     if suffix:
#         new_depth = f"{root_id}_{suffix}"
#     else:
#         new_depth = str(root_id)

#     print(f"Updating child id={event_id}: {old_depth} -> {new_depth}")
#     cur.execute(
#         "UPDATE military_events SET depth_index = ? WHERE id = ?",
#         (new_depth, event_id),
#     )

# cur.execute("""
#     UPDATE military_events
#     SET depth_index = CAST(id AS TEXT)
#     WHERE depth_level = 1
# """)

# conn.commit()
# conn.close()


