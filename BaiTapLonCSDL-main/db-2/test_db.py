import sqlite3
import os

DB_PATH = 'fashion_store_v2_fixed.db'

# Delete old DB if exists
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"🗑️  Deleted old database")

# Read schema
with open('schema.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Create new database
try:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(sql_content)
    conn.commit()
    
    # Verify
    cur = conn.cursor()
    print(f"\n✅ Database created successfully!")
    print(f"   - NhanVien count: {cur.execute('SELECT COUNT(*) FROM NhanVien').fetchone()[0]}")
    print(f"   - SanPham count: {cur.execute('SELECT COUNT(*) FROM SanPham').fetchone()[0]}")
    print(f"   - TonKho count: {cur.execute('SELECT COUNT(*) FROM TonKho').fetchone()[0]}")
    print(f"   - Kho count: {cur.execute('SELECT COUNT(*) FROM Kho').fetchone()[0]}")
    
    # Check table structures
    print(f"\n📋 Table Structures:")
    
    tonkho_cols = [row[1] for row in cur.execute('PRAGMA table_info(TonKho)').fetchall()]
    print(f"   TonKho columns: {tonkho_cols}")
    
    sanpham_cols = [row[1] for row in cur.execute('PRAGMA table_info(SanPham)').fetchall()]
    print(f"   SanPham columns: {sanpham_cols}")
    
    kho_cols = [row[1] for row in cur.execute('PRAGMA table_info(Kho)').fetchall()]
    print(f"   Kho columns: {kho_cols}")
    
    danhmuc_cols = [row[1] for row in cur.execute('PRAGMA table_info(DanhMuc)').fetchall()]
    print(f"   DanhMuc columns: {danhmuc_cols}")
    
    # Check if KeTang table exists
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='KeTang'").fetchall()
    if tables:
        print(f"\n⚠️  WARNING: KeTang table still exists!")
    else:
        print(f"\n✅ KeTang table successfully removed!")
    
    # Sample data check
    print(f"\n📊 Sample Data:")
    stock = cur.execute('SELECT * FROM TonKho').fetchall()
    for row in stock:
        print(f"   {dict(row)}")
    
    conn.close()
    print("\n✅ All checks passed!")
    
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
