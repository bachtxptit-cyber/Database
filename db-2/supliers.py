from flask import Blueprint, jsonify, request
from database import get_db

suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('/', methods=['GET'])
def get_suppliers():
    db = get_db()
    rows = db.execute('SELECT * FROM NhaCungCap ORDER BY TenNCC').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@suppliers_bp.route('/', methods=['POST'])
def create_supplier():
    db = get_db()
    d = request.json
    try:
        db.execute('INSERT INTO NhaCungCap (MaNCC,TenNCC,SDT,DiaChi) VALUES (?,?,?,?)',
                   (d['MaNCC'], d['TenNCC'], d.get('SDT'), d.get('DiaChi')))
        db.commit()
        db.close()
        return jsonify({'message': 'Thêm nhà cung cấp thành công'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@suppliers_bp.route('/<id>', methods=['PUT'])
def update_supplier(id):
    db = get_db()
    d = request.json
    try:
        db.execute('UPDATE NhaCungCap SET TenNCC=?,SDT=?,DiaChi=? WHERE MaNCC=?',
                   (d['TenNCC'], d.get('SDT'), d.get('DiaChi'), id))
        db.commit()
        db.close()
        return jsonify({'message': 'Cập nhật thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@suppliers_bp.route('/<id>', methods=['DELETE'])
def delete_supplier(id):
    db = get_db()
    try:
        db.execute('DELETE FROM NhaCungCap WHERE MaNCC=?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400