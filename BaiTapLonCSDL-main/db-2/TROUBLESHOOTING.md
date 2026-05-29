# 🔧 Troubleshooting Guide - Hướng Dẫn Giải Quyết Lỗi

## ❌ Lỗi: "Python không được tìm thấy" hoặc "'python' is not recognized"

**Nguyên nhân:** Python chưa được cài đặt hoặc không trong PATH

**Cách sửa:**
1. Download Python: https://www.python.org/downloads/
2. **Quan trọng:** Tick vào "Add Python to PATH" khi cài
3. Restart Command Prompt/PowerShell
4. Kiểm tra: `python --version`

---

## ❌ Lỗi: "No module named 'flask'"

**Nguyên nhân:** Flask chưa được cài đặt

**Cách sửa:**
```bash
pip install -r requirements.txt
```

Hoặc cài từng package:
```bash
pip install Flask==2.3.3
pip install Flask-Cors==3.0.10
```

---

## ❌ Lỗi: "Cannot connect to database" hoặc Database bị khóa

**Nguyên nhân:** Database file bị khóa hoặc xung đột

**Cách sửa:**
```bash
# Xóa database cũ
python test_db.py
```

Điều này sẽ rebuild database từ đầu

---

## ❌ Lỗi: "port 5000 already in use"

**Nguyên nhân:** Port 5000 đang được sử dụng bởi chương trình khác

**Cách sửa:**

### Option 1: Kill process đang dùng port 5000
```bash
# Windows CMD
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Hoặc PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Option 2: Chạy trên port khác
Sửa file `app.py` dòng 50:
```python
app.run(debug=True, port=5001)  # Thay 5000 bằng port khác
```

---

## ❌ Lỗi: "SyntaxError" hoặc lỗi cú pháp

**Cách kiểm tra:**
```bash
python check_syntax.py
```

Nó sẽ hiển thị file nào có lỗi cú pháp

---

## ❌ Lỗi: Form "Thêm sản phẩm" / "Thêm kho" không hoạt động

**Nguyên nhân:** Database schema không khớp với code

**Cách sửa:**
```bash
python test_db.py
```

Sau đó restart ứng dụng:
```bash
python run.py
```

---

## ❌ Lỗi: "Foreign key constraint failed"

**Nguyên nhân:** Dữ liệu referencing không tồn tại

**Cách sửa:**
1. Đảm bảo bạn tạo Kho trước khi tạo Sản phẩm
2. Rebuild database: `python test_db.py`
3. Thử lại

---

## ❌ Lỗi: "ModuleNotFoundError: No module named 'xyz'"

**Nguyên nhân:** Module/package chưa được cài đặt

**Cách sửa:**
```bash
# Cài tất cả dependencies
pip install -r requirements.txt

# Hoặc cài package cụ thể
pip install <package_name>
```

---

## ✅ Kiểm Tra Trước Khi Chạy

Chạy các lệnh này theo thứ tự:

```bash
# 1. Kiểm tra Python
python --version

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Kiểm tra cú pháp
python check_syntax.py

# 4. Khởi tạo database
python test_db.py

# 5. Chạy ứng dụng
python run.py
```

Nếu tất cả đều OK, mở: http://localhost:5000

---

## 📞 Debug Mode

Nếu vẫn có lỗi, chạy với debug chi tiết:

```bash
python -c "
from database import init_db
from app import app

print('1. Initializing database...')
init_db()
print('2. Starting server...')
app.run(debug=True, port=5000)
"
```

Xem thông báo lỗi chi tiết từ output

---

**Ngày cập nhật:** 2026-05-25  
**Version:** 1.0
