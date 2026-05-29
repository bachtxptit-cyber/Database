-- ============================================================
-- FASHION STORE DATABASE SCHEMA
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- BẢNG QUẢN LÝ / NHÂN VIÊN
-- ============================================================

CREATE TABLE IF NOT EXISTS NhanVien (
    MaNV         TEXT PRIMARY KEY,
    HoTen        TEXT NOT NULL,
    ChucVu       TEXT NOT NULL,
    Email        TEXT UNIQUE,
    SDT          TEXT,
    NgayBatDau   DATE NOT NULL,
    LoaiNV       TEXT NOT NULL CHECK(LoaiNV IN ('BienChe','HopDong')),
    MaQLy        TEXT,
    FOREIGN KEY (MaQLy) REFERENCES NhanVien(MaNV)
);

CREATE TABLE IF NOT EXISTS NVBienChe (
    MaNV         TEXT PRIMARY KEY,
    NgayVaoBienChe DATE NOT NULL,
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS NVHopDong (
    MaNV         TEXT PRIMARY KEY,
    ThoiHanHD    DATE NOT NULL,
    LoaiHopDong  TEXT NOT NULL,
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV) ON DELETE CASCADE
);

-- ============================================================
-- BẢNG KHO HÀNG
-- ============================================================

CREATE TABLE IF NOT EXISTS Kho (
    MaKho        TEXT PRIMARY KEY,
    TenKho       TEXT NOT NULL,
    DiaChi       TEXT
);

-- ============================================================
-- BẢNG SẢN PHẨM
-- ============================================================

CREATE TABLE IF NOT EXISTS DanhMuc (
    MaDM         TEXT PRIMARY KEY,
    TenDM        TEXT NOT NULL,
    MoTa         TEXT NOT NULL DEFAULT '',
    TrangThai    TEXT NOT NULL DEFAULT 'HoatDong' CHECK(TrangThai IN ('HoatDong','KhongHoatDong'))
);

CREATE TABLE IF NOT EXISTS SanPham (
    MaSP         TEXT PRIMARY KEY,
    TenSP        TEXT NOT NULL,
    MaDM         TEXT NOT NULL,
    Size         TEXT NOT NULL,
    MauSac       TEXT NOT NULL,
    GiaBan       REAL NOT NULL,
    FOREIGN KEY (MaDM) REFERENCES DanhMuc(MaDM)
);

CREATE TABLE IF NOT EXISTS TonKho (
    MaTK         INTEGER PRIMARY KEY AUTOINCREMENT,
    MaSP         TEXT NOT NULL,
    MaKho        TEXT NOT NULL,
    ViTriKe      TEXT NOT NULL,
    SoLuong      INTEGER NOT NULL DEFAULT 0,
    UNIQUE(MaSP, MaKho),
    FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP),
    FOREIGN KEY (MaKho) REFERENCES Kho(MaKho)
);

-- ============================================================
-- BẢNG NHÀ CUNG CẤP
-- ============================================================

CREATE TABLE IF NOT EXISTS NhaCungCap (
    MaNCC        TEXT PRIMARY KEY,
    TenNCC       TEXT NOT NULL,
    SDT          TEXT,
    DiaChi       TEXT
);

-- ============================================================
-- BẢNG NHẬP HÀNG
-- ============================================================

CREATE TABLE IF NOT EXISTS PhieuNhap (
    MaNhap       TEXT PRIMARY KEY,
    MaKho        TEXT NOT NULL,
    MaNCC        TEXT NOT NULL,
    MaQLy        TEXT NOT NULL,
    NgayNhap     DATE NOT NULL,
    GhiChu       TEXT,
    FOREIGN KEY (MaKho) REFERENCES Kho(MaKho),
    FOREIGN KEY (MaNCC) REFERENCES NhaCungCap(MaNCC),
    FOREIGN KEY (MaQLy) REFERENCES NhanVien(MaNV)
);

CREATE TABLE IF NOT EXISTS ChiTietNhap (
    MaCTN        INTEGER PRIMARY KEY AUTOINCREMENT,
    MaNhap       TEXT NOT NULL,
    MaSP         TEXT NOT NULL,
    SoLuong      INTEGER NOT NULL,
    GiaVon       REAL NOT NULL,
    FOREIGN KEY (MaNhap) REFERENCES PhieuNhap(MaNhap),
    FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
);

-- ============================================================
-- BẢNG KHÁCH HÀNG
-- ============================================================

CREATE TABLE IF NOT EXISTS KhachHang (
    MaKH         TEXT PRIMARY KEY,
    HoTen        TEXT NOT NULL,
    SDT          TEXT UNIQUE NOT NULL,
    NgaySinh     DATE,
    DiemTichLuy  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS LichSuDiem (
    MaLS         INTEGER PRIMARY KEY AUTOINCREMENT,
    MaHD         TEXT,
    MaKH         TEXT NOT NULL,
    SoDiem       INTEGER NOT NULL,
    LoaiThayDoi  TEXT NOT NULL CHECK(LoaiThayDoi IN ('Cong','Tru')),
    NgayCapNhat  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    GhiChu       TEXT,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
);

-- ============================================================
-- BẢNG ƯU ĐÃI
-- ============================================================

CREATE TABLE IF NOT EXISTS UuDai (
    MaUD         TEXT PRIMARY KEY,
    TenUD        TEXT NOT NULL,
    DieuKienMin  REAL NOT NULL DEFAULT 0,
    GiaTriGiam   REAL NOT NULL,
    IsPercent    INTEGER NOT NULL DEFAULT 0,
    NgayBatDau   DATE NOT NULL,
    NgayKetThuc  DATE NOT NULL,
    TrangThai    TEXT NOT NULL DEFAULT 'HoatDong' CHECK(TrangThai IN ('HoatDong','KhongHoatDong'))
);

-- ============================================================
-- BẢNG HÓA ĐƠN
-- ============================================================

CREATE TABLE IF NOT EXISTS HoaDon (
    MaHD         TEXT PRIMARY KEY,
    MaKH         TEXT,
    MaNV         TEXT NOT NULL,
    NgayLap      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TongTien     REAL NOT NULL DEFAULT 0,
    TongSauGiam  REAL NOT NULL DEFAULT 0,
    DiemSuDung   INTEGER NOT NULL DEFAULT 0,
    TrangThai    TEXT NOT NULL DEFAULT 'ChuaThanhToan' CHECK(TrangThai IN ('ChuaThanhToan','DaThanhToan','HuyBo')),
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
);

CREATE TABLE IF NOT EXISTS ChiTietHD (
    MaCTHD       INTEGER PRIMARY KEY AUTOINCREMENT,
    MaHD         TEXT NOT NULL,
    MaSP         TEXT NOT NULL,
    SoLuong      INTEGER NOT NULL,
    GiaBan       REAL NOT NULL,
    FOREIGN KEY (MaHD) REFERENCES HoaDon(MaHD),
    FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
);

CREATE TABLE IF NOT EXISTS ApDungUuDai (
    MaHD         TEXT NOT NULL,
    MaUD         TEXT NOT NULL,
    PRIMARY KEY (MaHD, MaUD),
    FOREIGN KEY (MaHD) REFERENCES HoaDon(MaHD),
    FOREIGN KEY (MaUD) REFERENCES UuDai(MaUD)
);

-- ============================================================
-- BẢNG THANH TOÁN
-- ============================================================

CREATE TABLE IF NOT EXISTS ThanhToan (
    MaTT         INTEGER PRIMARY KEY AUTOINCREMENT,
    MaHD         TEXT NOT NULL UNIQUE,
    PhuongThuc   TEXT NOT NULL CHECK(PhuongThuc IN ('TienMat','ChuyenKhoan','ViDienTu')),
    NgayTT       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    SoTien       REAL NOT NULL,
    FOREIGN KEY (MaHD) REFERENCES HoaDon(MaHD)
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

INSERT OR IGNORE INTO NhanVien (MaNV,HoTen,ChucVu,Email,SDT,NgayBatDau,LoaiNV,MaQLy)
VALUES
    ('NV001','Nguyễn Văn A','Quản lý','nv.a@example.com','0912345678','2024-01-01','BienChe',NULL),
    ('NV002','Lê Thị B','Nhân viên bán hàng','nv.b@example.com','0987654321','2024-02-15','HopDong','NV001');

INSERT OR IGNORE INTO Kho (MaKho,TenKho,DiaChi)
VALUES
    ('K001','Kho Trung Tâm','12 Lê Lợi, Q.1');

INSERT OR IGNORE INTO DanhMuc (MaDM,TenDM)
VALUES
    ('DM001','Áo'),
    ('DM002','Quần');

INSERT OR IGNORE INTO SanPham (MaSP,TenSP,MaDM,Size,MauSac,GiaBan)
VALUES
    ('SP001','Áo Sơ Mi Trắng','DM001','M','Trắng',350000),
    ('SP002','Quần Jeans Xanh','DM002','32','Xanh',450000),
    ('SP003','Áo Thun Đen','DM001','L','Đen',250000);

INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong)
VALUES
    ('SP001','K001','A1',25),
    ('SP002','K001','B2',18),
    ('SP003','K001','C3',32);

INSERT OR IGNORE INTO NhaCungCap (MaNCC,TenNCC,SDT,DiaChi)
VALUES
    ('NCC001','Công ty May Mặc Việt','0901234567','123 Đường ABC, Q.3');

INSERT OR IGNORE INTO KhachHang (MaKH,HoTen,SDT,NgaySinh,DiemTichLuy)
VALUES
    ('KH001','Trần Văn C','0909999999','1990-05-20',120),
    ('KH002','Phạm Thị D','0918888888','1992-08-14',80);

INSERT OR IGNORE INTO UuDai (MaUD,TenUD,DieuKienMin,GiaTriGiam,IsPercent,NgayBatDau,NgayKetThuc,TrangThai)
VALUES
    ('UD001','Giảm 10% cho đơn hàng trên 1 triệu',1000000,10,1,'2026-05-01','2026-12-31','HoatDong'),
    ('UD002','Giảm 50k cho đơn hàng trên 500k',500000,50000,0,'2026-05-01','2026-08-31','HoatDong');

INSERT OR IGNORE INTO NVBienChe (MaNV,NgayVaoBienChe)
VALUES
    ('NV001','2024-01-01');

INSERT OR IGNORE INTO NVHopDong (MaNV,ThoiHanHD,LoaiHopDong)
VALUES
    ('NV002','2024-12-31','Hợp đồng bán hàng');



INSERT OR IGNORE INTO PhieuNhap (MaNhap,MaKho,MaNCC,MaQLy,NgayNhap,GhiChu)
VALUES
    ('PN001','K001','NCC001','NV001','2026-05-20','Nhập hàng ban đầu');

INSERT OR IGNORE INTO ChiTietNhap (MaNhap,MaSP,SoLuong,GiaVon)
VALUES
    ('PN001','SP001',10,220000),
    ('PN001','SP002',5,270000);

INSERT OR IGNORE INTO HoaDon (MaHD,MaKH,MaNV,NgayLap,TongTien,TongSauGiam,TrangThai)
VALUES
    ('HD001','KH001','NV002','2026-05-21 10:00:00',1500000,1350000,'DaThanhToan');

INSERT OR IGNORE INTO ChiTietHD (MaHD,MaSP,SoLuong,GiaBan)
VALUES
    ('HD001','SP001',2,350000),
    ('HD001','SP002',1,450000);

INSERT OR IGNORE INTO ApDungUuDai (MaHD,MaUD)
VALUES
    ('HD001','UD001');

INSERT OR IGNORE INTO ThanhToan (MaHD,PhuongThuc,SoTien)
VALUES
    ('HD001','TienMat',1350000);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER IF NOT EXISTS trg_NhapHang
AFTER INSERT ON ChiTietNhap
BEGIN
    INSERT INTO TonKho (MaSP, MaKho, ViTriKe, SoLuong)
    SELECT NEW.MaSP, p.MaKho, 'A1', NEW.SoLuong
    FROM PhieuNhap p WHERE p.MaNhap = NEW.MaNhap
    ON CONFLICT(MaSP, MaKho) DO UPDATE SET
        SoLuong = SoLuong + NEW.SoLuong;
END;

CREATE TRIGGER IF NOT EXISTS trg_BanHang
AFTER INSERT ON ChiTietHD
BEGIN
    UPDATE TonKho
    SET SoLuong = SoLuong - NEW.SoLuong
    WHERE MaSP = NEW.MaSP
      AND MaTK = (
          SELECT MaTK FROM TonKho
          WHERE MaSP = NEW.MaSP AND SoLuong >= NEW.SoLuong
          ORDER BY SoLuong DESC
          LIMIT 1
      );
END;

CREATE TRIGGER IF NOT EXISTS trg_CongDiem
AFTER INSERT ON ThanhToan
BEGIN
    UPDATE KhachHang
    SET DiemTichLuy = DiemTichLuy + CAST(NEW.SoTien / 10000 AS INTEGER)
    WHERE MaKH = (SELECT MaKH FROM HoaDon WHERE MaHD = NEW.MaHD)
      AND (SELECT MaKH FROM HoaDon WHERE MaHD = NEW.MaHD) IS NOT NULL;

    INSERT INTO LichSuDiem (MaHD, MaKH, SoDiem, LoaiThayDoi, GhiChu)
    SELECT NEW.MaHD,
           h.MaKH,
           CAST(NEW.SoTien / 10000 AS INTEGER),
           'Cong',
           'Tích điểm từ hóa đơn ' || NEW.MaHD
    FROM HoaDon h
    WHERE h.MaHD = NEW.MaHD AND h.MaKH IS NOT NULL;

    UPDATE HoaDon SET TrangThai = 'DaThanhToan' WHERE MaHD = NEW.MaHD;
END;
