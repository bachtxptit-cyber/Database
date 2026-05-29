from pathlib import Path

base = Path('c:/Users/Admin/Desktop/db-2')

# Patch backend import API
import_file = base / 'import_good.py'
text = import_file.read_text(encoding='utf-8')
start = text.find("@import_bp.route('/', methods=['POST'])")
end = text.find("return jsonify({'error': str(e)}), 400", start)
if start == -1 or end == -1:
    raise SystemExit('Backend start/end markers not found')
end += len("return jsonify({'error': str(e)}), 400")
new_block = """@import_bp.route('/', methods=['POST'])
def create_import():
    db = get_db()
    d = request.json
    try:
        manager = db.execute('''
            SELECT 1 FROM NhanVien
            WHERE MaNV = ? AND (ChucVu LIKE '%Quản lý%' OR MaNV IN (
                SELECT DISTINCT MaQLy FROM NhanVien WHERE MaQLy IS NOT NULL
            ))
        ''', (d['MaQLy'],)).fetchone()
        if not manager:
            db.close()
            return jsonify({'error': 'Chỉ quản lý mới được lập phiếu nhập hàng'}), 403

        ma_nhap = 'PN' + ''.join(random.choices(string.digits, k=6))
        ngay_nhap = d.get('NgayNhap') or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        db.execute('''INSERT INTO PhieuNhap (MaNhap,MaKho,MaNCC,MaQLy,NgayNhap,GhiChu)
                      VALUES (?,?,?,?,?,?)''',
                   (ma_nhap, d['MaKho'], d['MaNCC'], d['MaQLy'], ngay_nhap, d.get('GhiChu', '')))
        for item in d.get('ChiTiet', []):
            db.execute('''INSERT INTO ChiTietNhap (MaNhap,MaSP,SoLuong,GiaVon) VALUES (?,?,?,?)''',
                       (ma_nhap, item['MaSP'], item['SoLuong'], item['GiaVon']))
            existing = db.execute('''SELECT SoLuong FROM TonKho WHERE MaSP = ? AND MaKho = ?''',
                                  (item['MaSP'], d['MaKho'])).fetchone()
            if existing:
                db.execute('''UPDATE TonKho SET SoLuong = SoLuong + ? WHERE MaSP = ? AND MaKho = ?''',
                           (item['SoLuong'], item['MaSP'], d['MaKho']))
            else:
                db.execute('''INSERT INTO TonKho (MaSP,MaKho,SoLuong) VALUES (?,?,?)''',
                           (item['MaSP'], d['MaKho'], item['SoLuong']))
        db.commit()
        db.close()
        return jsonify({'message': 'Tạo phiếu nhập thành công', 'MaNhap': ma_nhap}), 201
    except Exception as e:
        db.rollback()
        db.close()
        return jsonify({'error': str(e)}), 400
"""
text = text[:start] + new_block + text[end:]
import_file.write_text(text, encoding='utf-8')
print('backend patched')
