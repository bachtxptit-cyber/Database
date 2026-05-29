from flask import Blueprint, jsonify, request
from database import get_db
import random, string
from datetime import datetime

import_bp = Blueprint('imports', __name__)

@import_bp.route('/', methods=['GET'])
def get_imports():
    db = get_db()
    rows = db.execute('''
        SELECT pn.*, k.TenKho, ncc.TenNCC, nv.HoTen as TenQLy
        FROM PhieuNhap pn
        JOIN Kho k ON pn.MaKho = k.MaKho
        JOIN NhaCungCap ncc ON pn.MaNCC = ncc.MaNCC
        JOIN NhanVien nv ON pn.MaQLy = nv.MaNV
        ORDER BY pn.NgayNhap DESC
    ''').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@import_bp.route('/<id>', methods=['GET'])
def get_import(id):
    db = get_db()
    phieu = db.execute('''
        SELECT pn.*, k.TenKho, ncc.TenNCC, nv.HoTen as TenQLy
        FROM PhieuNhap pn
        JOIN Kho k ON pn.MaKho = k.MaKho
        JOIN NhaCungCap ncc ON pn.MaNCC = ncc.MaNCC
        JOIN NhanVien nv ON pn.MaQLy = nv.MaNV
        WHERE pn.MaNhap = ?
    ''', (id,)).fetchone()
    if not phieu:
        db.close()
        return jsonify({'error': 'Không tìm thấy'}), 404
    chi_tiet = db.execute('''
        SELECT ctn.*, sp.TenSP, sp.Size, sp.MauSac
        FROM ChiTietNhap ctn
        JOIN SanPham sp ON ctn.MaSP = sp.MaSP
        WHERE ctn.MaNhap = ?
    ''', (id,)).fetchall()
    result = dict(phieu)
    result['ChiTiet'] = [dict(c) for c in chi_tiet]
    db.close()
    return jsonify(result)

@import_bp.route('/', methods=['POST'])
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
        db.execute('''INSERT INTO PhieuNhap (MaNhap,MaKho,MaNCC,MaQLy,NgayNhap)
                      VALUES (?,?,?,?,?)''',
                   (ma_nhap, d['MaKho'], d['MaNCC'], d['MaQLy'], ngay_nhap))
        for item in d.get('ChiTiet', []):
            db.execute('''INSERT INTO ChiTietNhap (MaNhap,MaSP,SoLuong,GiaVon) VALUES (?,?,?,?)''',
                       (ma_nhap, item['MaSP'], item['SoLuong'], item['GiaVon']))
            existing = db.execute('''SELECT SoLuong,ViTriKe FROM TonKho WHERE MaSP = ? AND MaKho = ?''',
                                  (item['MaSP'], d['MaKho'])).fetchone()
            if existing:
                if item.get('ViTriKe'):
                    db.execute('''UPDATE TonKho SET SoLuong = SoLuong + ?, ViTriKe = ? WHERE MaSP = ? AND MaKho = ?''',
                               (item['SoLuong'], item['ViTriKe'], item['MaSP'], d['MaKho']))
                else:
                    db.execute('''UPDATE TonKho SET SoLuong = SoLuong + ? WHERE MaSP = ? AND MaKho = ?''',
                               (item['SoLuong'], item['MaSP'], d['MaKho']))
            else:
                db.execute('''INSERT INTO TonKho (MaSP,MaKho,SoLuong,ViTriKe) VALUES (?,?,?,?)''',
                           (item['MaSP'], d['MaKho'], item['SoLuong'], item.get('ViTriKe','A1')))
        db.commit()
        db.close()
        return jsonify({'message': 'Tạo phiếu nhập thành công', 'MaNhap': ma_nhap}), 201
    except Exception as e:
        db.rollback()
        db.close()
        return jsonify({'error': str(e)}), 400

@import_bp.route('/<id>', methods=['DELETE'])
def delete_import(id):
    db = get_db()
    try:
        phieu = db.execute('SELECT MaKho FROM PhieuNhap WHERE MaNhap = ?', (id,)).fetchone()
        if not phieu:
            db.close()
            return jsonify({'error': 'Không tìm thấy phiếu nhập'}), 404

        chi_tiet = db.execute('SELECT MaSP, SoLuong FROM ChiTietNhap WHERE MaNhap = ?', (id,)).fetchall()
        if not chi_tiet:
            db.close()
            return jsonify({'error': 'Phiếu nhập không có chi tiết'}, 400)

        for item in chi_tiet:
            stock = db.execute('SELECT SoLuong FROM TonKho WHERE MaSP = ? AND MaKho = ?',
                               (item['MaSP'], phieu['MaKho'])).fetchone()
            if stock:
                new_qty = stock['SoLuong'] - item['SoLuong']
                if new_qty <= 0:
                    db.execute('DELETE FROM TonKho WHERE MaSP = ? AND MaKho = ?', (item['MaSP'], phieu['MaKho']))
                else:
                    db.execute('UPDATE TonKho SET SoLuong = ? WHERE MaSP = ? AND MaKho = ?',
                               (new_qty, item['MaSP'], phieu['MaKho']))

        db.execute('DELETE FROM ChiTietNhap WHERE MaNhap = ?', (id,))
        db.execute('DELETE FROM PhieuNhap WHERE MaNhap = ?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa phiếu nhập thành công'})
    except Exception as e:
        db.rollback()
        db.close()
        return jsonify({'error': str(e)}), 400
