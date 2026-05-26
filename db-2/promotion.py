from flask import Blueprint, jsonify, request
from database import get_db
import random, string
from datetime import datetime

promotions_bp = Blueprint('promotions', __name__)

@promotions_bp.route('/', methods=['GET'])
def get_promotions():
    db = get_db()
    rows = db.execute('SELECT * FROM UuDai ORDER BY NgayBatDau DESC').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@promotions_bp.route('/active', methods=['GET'])
def get_active_promotions():
    today = datetime.now().strftime('%Y-%m-%d')
    db = get_db()
    rows = db.execute('''
        SELECT * FROM UuDai 
        WHERE TrangThai="HoatDong" AND NgayBatDau <= ? AND NgayKetThuc >= ?
        ORDER BY DieuKienMin
    ''', (today, today)).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@promotions_bp.route('/', methods=['POST'])
def create_promotion():
    db = get_db()
    d = request.json
    try:
        ma_ud = 'UD' + ''.join(random.choices(string.digits, k=6))
        db.execute('''INSERT INTO UuDai (MaUD,TenUD,DieuKienMin,GiaTriGiam,IsPercent,NgayBatDau,NgayKetThuc,TrangThai)
                      VALUES (?,?,?,?,?,?,?,?)''',
                   (ma_ud, d['TenUD'], d['DieuKienMin'], d['GiaTriGiam'],
                    d.get('IsPercent', 0), d['NgayBatDau'], d['NgayKetThuc'],
                    d.get('TrangThai', 'HoatDong')))
        db.commit()
        db.close()
        return jsonify({'message': 'Thêm ưu đãi thành công', 'MaUD': ma_ud}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@promotions_bp.route('/<id>', methods=['PUT'])
def update_promotion(id):
    db = get_db()
    d = request.json
    try:
        db.execute('''UPDATE UuDai SET TenUD=?,DieuKienMin=?,GiaTriGiam=?,IsPercent=?,
                      NgayBatDau=?,NgayKetThuc=?,TrangThai=? WHERE MaUD=?''',
                   (d['TenUD'], d['DieuKienMin'], d['GiaTriGiam'], d.get('IsPercent',0),
                    d['NgayBatDau'], d['NgayKetThuc'], d['TrangThai'], id))
        db.commit()
        db.close()
        return jsonify({'message': 'Cập nhật thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@promotions_bp.route('/<id>', methods=['DELETE'])
def delete_promotion(id):
    db = get_db()
    try:
        db.execute('DELETE FROM UuDai WHERE MaUD=?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400