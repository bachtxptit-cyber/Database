import sqlite3
from pathlib import Path

DB = 'fashion_store_v2.db'
SQL = Path('schema.sql').read_text(encoding='utf-8')
conn = sqlite3.connect(DB)
cur = conn.cursor()
try:
    cur.executescript(SQL)
    conn.commit()
    print('executed schema.sql successfully')
    print('NhanVien count', cur.execute('select count(*) from NhanVien').fetchone()[0])
    print('Kho count', cur.execute('select count(*) from Kho').fetchone()[0])
except Exception as e:
    print('ERROR', type(e).__name__, e)
finally:
    conn.close()
