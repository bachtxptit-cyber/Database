# 🔧 Sửa Lỗi - Menu Không Thể Thêm Kho, Sản Phẩm

## Các vấn đề đã phát hiện và sửa:

### 1. **Frontend - products.js** ❌→✅
**Vấn đề:** Form thêm danh mục (category) cố gắng gửi trường `MoTa` (mô tả) nhưng database schema đã xóa trường này.

**Lỗi khi thêm danh mục:**
```javascript
// CŨ - sai
const d = {
    MaDM: document.getElementById('dm_MaDM').value,
    TenDM: document.getElementById('dm_TenDM').value,
    MoTa: document.getElementById('dm_MoTa').value,  // ❌ Trường không tồn tại trong DB
};
```

**Sửa:**
```javascript
// MỚI - đúng
const d = {
    MaDM: document.getElementById('dm_MaDM').value,
    TenDM: document.getElementById('dm_TenDM').value,
    // ❌ Xóa trường MoTa
};
```

---

### 2. **Schema - schema.sql** ❌→✅
**Vấn đề:** Trigger `trg_NhapHang` không cung cấp giá trị cho cột `ViTriKe` (bắt buộc NOT NULL)

**Lỗi:**
```sql
-- CŨ - sai
INSERT INTO TonKho (MaSP, MaKho, SoLuong)
SELECT NEW.MaSP, p.MaKho, NEW.SoLuong  -- ❌ Thiếu ViTriKe
FROM PhieuNhap p WHERE p.MaNhap = NEW.MaNhap
```

**Sửa:**
```sql
-- MỚI - đúng
INSERT INTO TonKho (MaSP, MaKho, ViTriKe, SoLuong)
SELECT NEW.MaSP, p.MaKho, 'A1', NEW.SoLuong  -- ✅ Cung cấp ViTriKe với giá trị mặc định A1
FROM PhieuNhap p WHERE p.MaNhap = NEW.MaNhap
```

---

### 3. **Database Migration - database.py** ❌→✅
**Vấn đề 1:** Cố gắng INSERT cột `MoTa` vào bảng `Kho` nhưng cột này không tồn tại

```python
# CŨ - sai
conn.execute("INSERT OR IGNORE INTO Kho (MaKho,TenKho,DiaChi,MoTa) VALUES (?,?,?,?)", 
             ('K002','Kho Chi Nhánh 2','34 Trần Phú, Q.7','Chi nhánh miền Nam'))
```

**Sửa:**
```python
# MỚI - đúng
conn.execute("INSERT OR IGNORE INTO Kho (MaKho,TenKho,DiaChi) VALUES (?,?,?)", 
             ('K002','Kho Chi Nhánh 2','34 Trần Phú, Q.7'))
```

**Vấn đề 2:** Sử dụng tên cột sai - `ViTri` thay vì `ViTriKe`

```python
# CŨ - sai
conn.execute("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,SoLuong,ViTri) VALUES (?,?,?,?)", 
             ('SP001','K002',15,'A2'))  # ❌ ViTri không tồn tại
```

**Sửa:**
```python
# MỚI - đúng
conn.execute("INSERT OR IGNORE INTO TonKho (MaSP,MaKho,ViTriKe,SoLuong) VALUES (?,?,?,?)", 
             ('SP001','K002','A2',15))  # ✅ Sử dụng ViTriKe
```

---

### 4. **Nhập Hàng - import_good.py** ❌→✅
**Vấn đề:** Default value cho `ViTriKe` là empty string `''` nhưng cột là `NOT NULL`

```python
# CŨ - sai
db.execute('''INSERT INTO TonKho (MaSP,MaKho,SoLuong,ViTriKe) VALUES (?,?,?,?)''',
           (item['MaSP'], d['MaKho'], item['SoLuong'], item.get('ViTriKe','')))  # ❌ Empty string
```

**Sửa:**
```python
# MỚI - đúng
db.execute('''INSERT INTO TonKho (MaSP,MaKho,SoLuong,ViTriKe) VALUES (?,?,?,?)''',
           (item['MaSP'], d['MaKho'], item['SoLuong'], item.get('ViTriKe','A1')))  # ✅ Default 'A1'
```

---

## 📋 Tóm Tắt Các File Sửa:

| File | Lỗi | Sửa |
|------|-----|-----|
| `frontend/products.js` | Form gửi `MoTa` không tồn tại | Xóa trường `MoTa` |
| `schema.sql` | Trigger thiếu `ViTriKe` | Thêm `ViTriKe` với default 'A1' |
| `database.py` | Gửi `MoTa` và tên cột sai | Sửa theo schema đúng |
| `import_good.py` | Default value `ViTriKe` là empty string | Thay đổi thành 'A1' |

---

## 🚀 Kiểm Tra:

Chạy lệnh để rebuild database từ schema mới:
```bash
python test_db.py
```

Sau đó chạy ứng dụng:
```bash
python app.py
```

Giờ bạn có thể:
- ✅ Thêm kho hàng bình thường
- ✅ Thêm sản phẩm bình thường  
- ✅ Thêm danh mục sản phẩm bình thường
- ✅ Nhập hàng không bị lỗi

---

**Ngày sửa:** 2026-05-25  
**Phiên bản:** Fixed v1
