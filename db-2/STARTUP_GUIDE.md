# 🚀 Hướng Dẫn Khởi Động Ứng Dụng

## ⚡ Cách Chạy Nhanh Nhất (Windows)

### Bước 1: Double-click vào file `start.bat`
```
start.bat
```
Nó sẽ tự động:
- ✅ Kiểm tra Python
- ✅ Cài đặt dependencies
- ✅ Khởi tạo database
- ✅ Chạy ứng dụng

---

## 📋 Nếu click vào file không hoạt động

### Bước 1: Mở PowerShell/CMD
```
cd C:\Users\Admin\Desktop\db-2
```

### Bước 2: Chạy lệnh sau
```
python run.py
```

---

## 🔧 Nếu vẫn có lỗi

### Kiểm tra Python cài đặt chưa?
```
python --version
```
Nếu lệnh không tìm thấy, [cài Python](https://www.python.org)

### Kiểm tra cú pháp file Python
```
python check_syntax.py
```

### Cài đặt dependencies
```
pip install -r requirements.txt
```

### Khởi tạo database
```
python test_db.py
```

### Chạy ứng dụng
```
python run.py
```

---

## 📖 Các Lệnh Khác Hữu Ích

| Lệnh | Mô tả |
|------|-------|
| `python run.py` | Chạy ứng dụng bình thường |
| `python app.py` | Chạy Flask trực tiếp |
| `python test_db.py` | Test & rebuild database |
| `python check_syntax.py` | Kiểm tra lỗi cú pháp |

---

## 🌐 Sau Khi Ứng Dụng Chạy

**Mở trình duyệt:**
```
http://localhost:5000
```

**Dừng ứng dụng:** Nhấn `CTRL+C` trong terminal

---

## ✅ Các Lỗi Đã Sửa

1. ✅ Form thêm danh mục gửi trường không tồn tại
2. ✅ Trigger nhập hàng thiếu cột ViTriKe
3. ✅ Database migration sai tên cột
4. ✅ Default value sai trong import

**Giờ bạn có thể:**
- ✅ Thêm kho hàng
- ✅ Thêm sản phẩm
- ✅ Thêm danh mục
- ✅ Nhập hàng bình thường

---

## 📞 Nếu Còn Lỗi

Kiểm tra:
1. Python đã cài chưa: `python --version`
2. File Python có lỗi cú pháp: `python check_syntax.py`
3. Database: `python test_db.py`
4. Xem lỗi chi tiết: `python run.py` (sẽ hiển thị đầy đủ lỗi)

---

**Tạo:** 2026-05-25  
**Version:** 1.0
