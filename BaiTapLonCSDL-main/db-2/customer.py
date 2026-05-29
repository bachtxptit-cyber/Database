from flask import Blueprint, jsonify, request
from database import get_db

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
def get_customers():
    db = get_db()
    search = request.args.get('search', '')
    if search:
        rows = db.execute('''
            SELECT * FROM KhachHang 
            WHERE HoTen LIKE ? OR SDT LIKE ?
            ORDER BY HoTen
        ''', (f'%{search}%', f'%{search}%')).fetchall()
    else:
        rows = db.execute('SELECT * FROM KhachHang ORDER BY HoTen').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@customers_bp.route('/phone/<sdt>', methods=['GET'])
def find_by_phone(sdt):
    db = get_db()
    row = db.execute('SELECT * FROM KhachHang WHERE SDT = ?', (sdt,)).fetchone()
    if not row:
        db.close()
        return jsonify({'found': False}), 404
    customer = dict(row)
    history = db.execute('''
        SELECT ls.*, hd.NgayLap FROM LichSuDiem ls
        LEFT JOIN HoaDon hd ON ls.MaHD = hd.MaHD
        WHERE ls.MaKH = ?
        ORDER BY ls.NgayCapNhat DESC
        LIMIT 10
    ''', (customer['MaKH'],)).fetchall()
    customer['found'] = True
    customer['LichSuDiem'] = [dict(h) for h in history]
    db.close()
    return jsonify(customer)

@customers_bp.route('/<id>', methods=['GET'])
def get_customer(id):
    db = get_db()
    row = db.execute('SELECT * FROM KhachHang WHERE MaKH = ?', (id,)).fetchone()
    if not row:
        db.close()
        return jsonify({'error': 'Không tìm thấy'}), 404
    customer = dict(row)
    history = db.execute('''
        SELECT ls.*, hd.NgayLap FROM LichSuDiem ls
        LEFT JOIN HoaDon hd ON ls.MaHD = hd.MaHD
        WHERE ls.MaKH = ?
        ORDER BY ls.NgayCapNhat DESC
    ''', (id,)).fetchall()
    customer['LichSuDiem'] = [dict(h) for h in history]
    db.close()
    return jsonify(customer)

@customers_bp.route('/', methods=['POST'])
def create_customer():
    db = get_db()
    d = request.json
    try:
        import random, string
        ma_kh = 'KH' + ''.join(random.choices(string.digits, k=6))
        db.execute('''INSERT INTO KhachHang (MaKH,HoTen,SDT,NgaySinh,DiemTichLuy)
                      VALUES (?,?,?,?,0)''',
                   (ma_kh, d['HoTen'], d['SDT'], d.get('NgaySinh')))
        db.commit()
        row = db.execute('SELECT * FROM KhachHang WHERE MaKH=?', (ma_kh,)).fetchone()
        db.close()
        return jsonify(dict(row)), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@customers_bp.route('/<id>', methods=['PUT'])
def update_customer(id):
    db = get_db()
    d = request.json
    try:
        db.execute('''UPDATE KhachHang SET HoTen=?,SDT=?,NgaySinh=? WHERE MaKH=?''',
                   (d['HoTen'], d['SDT'], d.get('NgaySinh'), id))
        db.commit()
        db.close()
        return jsonify({'message': 'Cập nhật thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@customers_bp.route('/<id>', methods=['DELETE'])
def delete_customer(id):
    db = get_db()
    try:
        db.execute('DELETE FROM KhachHang WHERE MaKH=?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@customers_bp.route('/<id>/adjust-points', methods=['POST'])
def adjust_points(id):
    db = get_db()
    d = request.json
    try:
        loai = d['LoaiThayDoi']
        so_diem = int(d['SoDiem'])
        if loai == 'Tru':
            kh = db.execute('SELECT DiemTichLuy FROM KhachHang WHERE MaKH=?',(id,)).fetchone()
            if not kh or kh['DiemTichLuy'] < so_diem:
                return jsonify({'error': 'Không đủ điểm'}), 400
            db.execute('UPDATE KhachHang SET DiemTichLuy = DiemTichLuy - ? WHERE MaKH=?', (so_diem, id))
        else:
            db.execute('UPDATE KhachHang SET DiemTichLuy = DiemTichLuy + ? WHERE MaKH=?', (so_diem, id))
        db.execute('''INSERT INTO LichSuDiem (MaKH,SoDiem,LoaiThayDoi,GhiChu) VALUES (?,?,?,?)''',
                   (id, so_diem, loai, d.get('GhiChu', 'Điều chỉnh thủ công')))
        db.commit()
        db.close()
        return jsonify({'message': 'Cập nhật điểm thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400