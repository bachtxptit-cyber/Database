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

def seed_sample_data(conn):
    conn.execute("INSERT OR IGNORE INTO Kho (MaKho,TenKho,DiaChi) VALUES (?,?,?)",
                 ('K001','Kho Trung Tâm','12 Lê Lợi, Q.1'))
    conn.executemany("INSERT OR IGNORE INTO DanhMuc (MaDM,TenDM) VALUES (?,?)", [
        ('DM001','Áo'),
        ('DM002','Quần')
    ])
    conn.executemany("INSERT OR IGNORE INTO SanPham (MaSP,TenSP,MaDM,Size,MauSac,GiaBan) VALUES (?,?,?,?,?,?)", [
        ('SP001','Áo Sơ Mi Trắng','DM001','M','Trắng',350000),
        ('SP002','Quần Jeans Xanh','DM002','32','Xanh',450000),
        ('SP003','Áo Thun Đen','DM001','L','Đen',250000)
    ])
    conn.executemany("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong) VALUES (?,?,?,?)", [
        ('SP001','K001','A1',25),
        ('SP002','K001','B2',18),
        ('SP003','K001','C3',32)
    ])
    conn.execute("INSERT OR IGNORE INTO NhaCungCap (MaNCC,TenNCC,SDT,DiaChi) VALUES (?,?,?,?)",
                 ('NCC001','Công ty May Mặc Việt','0901234567','123 Đường ABC, Q.3'))
    conn.executemany("INSERT OR IGNORE INTO KhachHang (MaKH,HoTen,SDT,NgaySinh,DiemTichLuy) VALUES (?,?,?,?,?)", [
        ('KH001','Trần Văn C','0909999999','1990-05-20',120),
        ('KH002','Phạm Thị D','0918888888','1992-08-14',80)
    ])
    conn.executemany("INSERT OR IGNORE INTO NhanVien (MaNV,HoTen,ChucVu,Email,SDT,NgayBatDau,LoaiNV,MaQLy) VALUES (?,?,?,?,?,?,?,?)", [
        ('NV001','Nguyễn Văn A','Quản lý','nv.a@example.com','0912345678','2024-01-01','BienChe',None),
        ('NV002','Lê Thị B','Nhân viên bán hàng','nv.b@example.com','0987654321','2024-02-15','HopDong','NV001')
    ])
    conn.executemany("INSERT OR IGNORE INTO NVBienChe (MaNV,NgayVaoBienChe) VALUES (?,?)", [
        ('NV001','2024-01-01')
    ])
    conn.executemany("INSERT OR IGNORE INTO NVHopDong (MaNV,ThoiHanHD,LoaiHopDong) VALUES (?,?,?)", [
        ('NV002','2024-12-31','Hợp đồng bán hàng')
    ])
    conn.executemany("INSERT OR IGNORE INTO UuDai (MaUD,TenUD,DieuKienMin,GiaTriGiam,IsPercent,NgayBatDau,NgayKetThuc,TrangThai) VALUES (?,?,?,?,?,?,?,?)", [
        ('UD001','Giảm 10% cho đơn hàng trên 1 triệu',1000000,10,1,'2026-05-01','2026-12-31','HoatDong'),
        ('UD002','Giảm 50k cho đơn hàng trên 500k',500000,50000,0,'2026-05-01','2026-08-31','HoatDong')
    ])
    conn.execute("INSERT OR IGNORE INTO PhieuNhap (MaNhap,MaKho,MaNCC,MaQLy,NgayNhap,GhiChu) VALUES (?,?,?,?,?,?)",
                 ('PN001','K001','NCC001','NV001','2026-05-20','Nhập hàng ban đầu'))
    conn.executemany("INSERT OR IGNORE INTO ChiTietNhap (MaNhap,MaSP,SoLuong,GiaVon) VALUES (?,?,?,?)", [
        ('PN001','SP001',10,220000),
        ('PN001','SP002',5,270000)
    ])

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
            dm_cols = [r[1] for r in conn.execute('PRAGMA table_info(DanhMuc)').fetchall()]
            if 'MoTa' not in dm_cols:
                conn.execute("ALTER TABLE DanhMuc ADD COLUMN MoTa TEXT NOT NULL DEFAULT ''")
            if 'TrangThai' not in dm_cols:
                conn.execute("ALTER TABLE DanhMuc ADD COLUMN TrangThai TEXT NOT NULL DEFAULT 'HoatDong'")
            tk_cols = [r[1] for r in conn.execute('PRAGMA table_info(TonKho)').fetchall()]
            if 'ViTriKe' not in tk_cols:
                conn.execute("ALTER TABLE TonKho ADD COLUMN ViTriKe TEXT NOT NULL DEFAULT ''")
            hd_cols = [r[1] for r in conn.execute('PRAGMA table_info(HoaDon)').fetchall()]
            if 'DiemSuDung' not in hd_cols:
                conn.execute("ALTER TABLE HoaDon ADD COLUMN DiemSuDung INTEGER NOT NULL DEFAULT 0")
            conn.execute("UPDATE TonKho SET ViTriKe='A1' WHERE MaSP='SP001' AND MaKho='K001' AND (ViTriKe IS NULL OR ViTriKe='')")
            conn.execute("UPDATE TonKho SET ViTriKe='B2' WHERE MaSP='SP002' AND MaKho='K001' AND (ViTriKe IS NULL OR ViTriKe='')")
            conn.execute("UPDATE TonKho SET ViTriKe='C3' WHERE MaSP='SP003' AND MaKho='K001' AND (ViTriKe IS NULL OR ViTriKe='')")
            conn.execute("INSERT OR IGNORE INTO Kho (MaKho,TenKho,DiaChi) VALUES (?,?,?)", ('K002','Kho Chi Nhánh 2','34 Trần Phú, Q.7'))
            conn.execute("INSERT OR IGNORE INTO Kho (MaKho,TenKho,DiaChi) VALUES (?,?,?)", ('K003','Kho Chi Nhánh 3','78 Cách Mạng Tháng 8, Q.3'))
            conn.execute("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong) VALUES (?,?,?,?)", ('SP001','K002','A2',15))
            conn.execute("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong) VALUES (?,?,?,?)", ('SP002','K002','B3',12))
            conn.execute("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong) VALUES (?,?,?,?)", ('SP003','K003','C1',20))

        # Ensure sample data exists for empty or partially initialized databases
        seed_sample_data(conn)

        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"❌ Lỗi khi khởi tạo database: {e}")
        raise
    finally:
        conn.close()
    print("✅ Database initialized or updated successfully")
