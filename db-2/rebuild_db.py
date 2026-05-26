import sqlite3
import os
from pathlib import Path

DB_PATH = 'fashion_store_v2_fixed.db'
SQL_PATH = 'schema.sql'

# Remove old database
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"✅ Deleted old database: {DB_PATH}")

# Read schema
sql_content = Path(SQL_PATH).read_text(encoding='utf-8')

# Create new database
conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA foreign_keys = ON")
conn.executescript(sql_content)
conn.commit()

# Verify
cur = conn.cursor()
print(f"✅ Database created successfully")
print(f"   - NhanVien count: {cur.execute('SELECT COUNT(*) FROM NhanVien').fetchone()[0]}")
print(f"   - SanPham count: {cur.execute('SELECT COUNT(*) FROM SanPham').fetchone()[0]}")
print(f"   - TonKho count: {cur.execute('SELECT COUNT(*) FROM TonKho').fetchone()[0]}")
print(f"   - Kho count: {cur.execute('SELECT COUNT(*) FROM Kho').fetchone()[0]}")

# Check TonKho structure
print(f"\n📋 TonKho columns: {[row[1] for row in cur.execute('PRAGMA table_info(TonKho)').fetchall()]}")
print(f"📋 SanPham columns: {[row[1] for row in cur.execute('PRAGMA table_info(SanPham)').fetchall()]}")

conn.close()
print("\n✅ Database rebuild complete!")
