import sqlite3
import os
import glob

DB_PATH = os.path.join(os.path.dirname(__file__), 'fashion_store_v2_fixed.db')
SQL_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')

def cleanup_lock_files():
    """Remove stale lock files that may prevent database access"""
    lock_patterns = [
        DB_PATH + '-journal',
        DB_PATH + '-wal',
        DB_PATH + '-shm',
    ]
    for pattern in lock_patterns:
        if os.path.exists(pattern):
            try:
                os.remove(pattern)
                print(f"🧹 Removed lock file: {os.path.basename(pattern)}")
            except Exception as e:
                print(f"⚠ Could not remove {os.path.basename(pattern)}: {e}")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 30000")
    try:
        conn.execute("PRAGMA journal_mode = WAL")
    except sqlite3.OperationalError:
        # If WAL mode fails, cleanup and retry once
        cleanup_lock_files()
        conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA busy_timeout = 30000")
    conn.isolation_level = None
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    exists = os.path.exists(DB_PATH)
    conn = get_db()
    try:
        if not exists:
            with open(SQL_PATH, 'r', encoding='utf-8') as f:
                conn.executescript(f.read())
        else:
            cols = [r[1] for r in conn.execute('PRAGMA table_info(NhanVien)').fetchall()]
            if 'MaKho' not in cols:
                conn.execute("ALTER TABLE NhanVien ADD COLUMN MaKho TEXT NOT NULL DEFAULT ''")
            tk_cols = [r[1] for r in conn.execute('PRAGMA table_info(TonKho)').fetchall()]
            if 'ViTriKe' not in tk_cols:
                conn.execute("ALTER TABLE TonKho ADD COLUMN ViTriKe TEXT NOT NULL DEFAULT ''")
            conn.execute("UPDATE TonKho SET ViTriKe='A1' WHERE MaSP='SP001' AND MaKho='K001' AND (ViTriKe IS NULL OR ViTriKe='')")
            conn.execute("UPDATE TonKho SET ViTriKe='B2' WHERE MaSP='SP002' AND MaKho='K001' AND (ViTriKe IS NULL OR ViTriKe='')")
            conn.execute("UPDATE TonKho SET ViTriKe='C3' WHERE MaSP='SP003' AND MaKho='K001' AND (ViTriKe IS NULL OR ViTriKe='')")
            conn.execute("INSERT OR IGNORE INTO Kho (MaKho,TenKho,DiaChi) VALUES (?,?,?)", ('K002','Kho Chi Nhánh 2','34 Trần Phú, Q.7'))
            conn.execute("INSERT OR IGNORE INTO Kho (MaKho,TenKho,DiaChi) VALUES (?,?,?)", ('K003','Kho Chi Nhánh 3','78 Cách Mạng Tháng 8, Q.3'))
            conn.execute("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong) VALUES (?,?,?,?)", ('SP001','K002','A2',15))
            conn.execute("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong) VALUES (?,?,?,?)", ('SP002','K002','B3',12))
            conn.execute("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong) VALUES (?,?,?,?)", ('SP003','K003','C1',20))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"❌ Lỗi khi khởi tạo database: {e}")
        raise
    finally:
        conn.close()
    print("✅ Database initialized or updated successfully")
