from flask import Blueprint, jsonify, request
from database import get_db

warehouse_bp = Blueprint('warehouse', __name__)

@warehouse_bp.route('/', methods=['GET'])
def get_warehouses():
    db = get_db()
    rows = db.execute('SELECT * FROM Kho ORDER BY TenKho').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@warehouse_bp.route('/', methods=['POST'])
def create_warehouse():
    db = get_db()
    d = request.json
    try:
        db.execute('INSERT INTO Kho (MaKho,TenKho,DiaChi) VALUES (?,?,?)',
                   (d['MaKho'], d['TenKho'], d.get('DiaChi','')))
        db.commit()
        db.close()
        return jsonify({'message': 'Thêm kho thành công'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@warehouse_bp.route('/<id>', methods=['PUT'])
def update_warehouse(id):
    db = get_db()
    d = request.json
    try:
        db.execute('UPDATE Kho SET TenKho=?,DiaChi=? WHERE MaKho=?',
                   (d['TenKho'], d.get('DiaChi',''), id))
        db.commit()
        db.close()
        return jsonify({'message': 'Cập nhật thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@warehouse_bp.route('/<id>', methods=['DELETE'])
def delete_warehouse(id):
    db = get_db()
    try:
        db.execute('DELETE FROM Kho WHERE MaKho=?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@warehouse_bp.route('/<id>/stock', methods=['GET'])
def get_warehouse_stock(id):
    db = get_db()
    rows = db.execute('''
        SELECT tk.*, sp.TenSP, sp.Size, sp.MauSac, sp.GiaBan, dm.TenDM
        FROM TonKho tk
        JOIN SanPham sp ON tk.MaSP = sp.MaSP
        JOIN DanhMuc dm ON sp.MaDM = dm.MaDM
        WHERE tk.MaKho = ?
        ORDER BY sp.TenSP
    ''', (id,)).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

