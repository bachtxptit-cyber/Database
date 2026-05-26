# Thay đổi Database Schema

## Các thay đổi đã thực hiện:

### 1. Xóa bảng KeTang hoàn toàn
- ❌ Loại bỏ: `CREATE TABLE KeTang`
- ✅ Thay vào đó: Sử dụng cột `ViTriKe` trong bảng `TonKho`

### 2. Xóa các cột không cần thiết
- **SanPham**: Xóa `HinhAnh`, giữ lại (TenSP, Size, MauSac, GiaBan)
- **Kho**: Xóa `MoTa`, giữ lại (TenKho, DiaChi)
- **DanhMuc**: Xóa `MoTa`, giữ lại (TenDM)

### 3. Thêm vị trí kệ vào TonKho
- ✅ Thêm cột: `ViTriKe TEXT NOT NULL` (ví dụ: A1, B2, C3)
- ✅ Xóa FK reference: `MaKe` không còn

## Files đã sửa:

### schema.sql
✅ Cập nhật định nghĩa bảng:
- Xóa bảng KeTang
- Xóa cột MoTa từ Kho, DanhMuc
- Xóa cột HinhAnh từ SanPham
- Thêm cột ViTriKe vào TonKho
- Cập nhật sample data

### database.py
✅ Cập nhật migration logic:
- Thay `ViTri` → `ViTriKe` 
- Xóa logic liên quan KeTang

### warehouse.py
✅ Cập nhật API endpoints:
- Xóa MoTa từ INSERT/UPDATE Kho
- Xóa routes: `/shelves/` (GET, POST)
- Xóa JOIN KeTang từ query stock
- Cập nhật response: loại bỏ TenKe

### products.py
✅ Cập nhật API endpoints:
- Xóa MoTa từ INSERT DanhMuc
- Xóa JOIN KeTang từ query stock
- Cập nhật response: loại bỏ TenKe

### import_good.py
✅ Cập nhật logic nhập hàng:
- Thay `ViTri` → `ViTriKe`
- Xóa cột ViTri từ ChiTietNhap

## Cách sử dụng:

1. Chạy test để kiểm tra database mới:
```bash
python test_db.py
```

2. Xóa database cũ và khởi tạo lại:
```bash
python rebuild_db.py
```

3. Chạy ứng dụng Flask như bình thường
