import sqlite3
import pathlib
p = pathlib.Path('fashion_store_v2.db')
print('exists', p.exists())
try:
    conn = sqlite3.connect(p, timeout=5)
    cur = conn.cursor()
    cur.execute('SELECT name FROM sqlite_master WHERE type="table" LIMIT 1')
    print('tables', cur.fetchall())
    conn.close()
except Exception as e:
    print('error', type(e).__name__, e)
