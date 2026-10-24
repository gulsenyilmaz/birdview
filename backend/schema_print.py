import sqlite3

conn = sqlite3.connect("birdview.db")

result = conn.execute("""
    SELECT sql
    FROM sqlite_master
    WHERE type = 'table'
      AND name = 'human_location'
""").fetchone()

print(result[0] if result else "Table not found")

print("Indexes:")
for index in conn.execute("PRAGMA index_list('human_location')"):
    print(index)
    print(list(conn.execute(f'PRAGMA index_info("{index[1]}")')))

conn.close()