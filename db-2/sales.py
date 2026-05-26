from flask import Blueprint, jsonify, request
from database import get_db
import random, string
from datetime import datetime

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/', methods=['GET'])
def get_invoices():
    db = get_db()
    rows = db.execute('''
        SELECT hd.*, kh.HoTen as TenKH, kh.SDT as SDTKH,
               nv.HoTen as TenNV
        FROM HoaDon hd
        LEFT JOIN KhachHang kh ON hd.MaKH = kh.MaKH
        JOIN NhanVien nv ON hd.MaNV = nv.MaNV
        ORDER BY hd.NgayLap DESC
    ''').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@sales_bp.route('/<id>', methods=['GET'])
def get_invoice(id):
    db = get_db()
    hd = db.execute('''
        SELECT hd.*, kh.HoTen as TenKH, kh.SDT as SDTKH, kh.DiemTichLuy,
               nv.HoTen as TenNV
        FROM HoaDon hd
        LEFT JOIN KhachHang kh ON hd.MaKH = kh.MaKH
        JOIN NhanVien nv ON hd.MaNV = nv.MaNV
        WHERE hd.MaHD = ?
    ''', (id,)).fetchone()
    if not hd:
        db.close()
        return jsonify({'error': 'Không tìm thấy'}), 404
    chi_tiet = db.execute('''
        SELECT ct.*, sp.TenSP, sp.Size, sp.MauSac
        FROM ChiTietHD ct
        JOIN SanPham sp ON ct.MaSP = sp.MaSP
        WHERE ct.MaHD = ?
    ''', (id,)).fetchall()
    uu_dai = db.execute('''
        SELECT ud.* FROM ApDungUuDai au
        JOIN UuDai ud ON au.MaUD = ud.MaUD
        WHERE au.MaHD = ?
    ''', (id,)).fetchall()
    tt = db.execute('SELECT * FROM ThanhToan WHERE MaHD=?', (id,)).fetchone()
    result = dict(hd)
    result['ChiTiet'] = [dict(c) for c in chi_tiet]
    result['UuDai'] = [dict(u) for u in uu_dai]
    result['ThanhToan'] = dict(tt) if tt else None
    db.close()
    return jsonify(result)

@sales_bp.route('/', methods=['POST'])
def create_invoice():
    db = get_db()
    d = request.json
    try:
        ma_hd = 'HD' + ''.join(random.choices(string.digits, k=6))
        tong_tien = sum(i['SoLuong'] * i['GiaBan'] for i in d.get('ChiTiet', []))
        
        # Tính giảm giá
        giam = 0
        for ma_ud in d.get('UuDai', []):
            ud = db.execute('SELECT * FROM UuDai WHERE MaUD=? AND TrangThai="HoatDong"', (ma_ud,)).fetchone()
            if ud and tong_tien >= ud['DieuKienMin']:
                if ud['IsPercent']:
                    giam += tong_tien * ud['GiaTriGiam'] / 100
                else:
                    giam += ud['GiaTriGiam']
        
        tong_sau_giam = max(0, tong_tien - giam)
        
        db.execute('''INSERT INTO HoaDon (MaHD,MaKH,MaNV,NgayLap,TongTien,TongSauGiam)
                      VALUES (?,?,?,?,?,?)''',
                   (ma_hd, d.get('MaKH'), d['MaNV'],
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    tong_tien, tong_sau_giam))
        
        for item in d.get('ChiTiet', []):
            # Kiểm tra tồn kho
            ton = db.execute('''
                SELECT COALESCE(SUM(SoLuong),0) as total FROM TonKho WHERE MaSP=?
            ''', (item['MaSP'],)).fetchone()['total']
            if ton < item['SoLuong']:
                db.rollback()
                sp = db.execute('SELECT TenSP FROM SanPham WHERE MaSP=?',(item['MaSP'],)).fetchone()
                db.close()
                return jsonify({'error': f'Không đủ tồn kho cho sản phẩm: {sp["TenSP"] if sp else item["MaSP"]}'}), 400
            db.execute('''INSERT INTO ChiTietHD (MaHD,MaSP,SoLuong,GiaBan) VALUES (?,?,?,?)''',
                       (ma_hd, item['MaSP'], item['SoLuong'], item['GiaBan']))
        
        for ma_ud in d.get('UuDai', []):
            db.execute('INSERT INTO ApDungUuDai (MaHD,MaUD) VALUES (?,?)', (ma_hd, ma_ud))
        
        db.commit()
        db.close()
        return jsonify({'message': 'Tạo hóa đơn thành công', 'MaHD': ma_hd, 
                        'TongTien': tong_tien, 'TongSauGiam': tong_sau_giam}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@sales_bp.route('/<id>/cancel', methods=['POST'])
def cancel_invoice(id):
    db = get_db()
    try:
        db.execute("UPDATE HoaDon SET TrangThai='HuyBo' WHERE MaHD=? AND TrangThai='ChuaThanhToan'", (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Hủy hóa đơn thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400