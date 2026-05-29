from flask import Blueprint, jsonify, request
from database import get_db

employees_bp = Blueprint('employees', __name__)

@employees_bp.route('/', methods=['GET'])
def get_employees():
    db = get_db()
    rows = db.execute('''
        SELECT nv.*, 
               k.TenKho as TenKho,
               mgr.HoTen as TenQLy,
               bc.NgayVaoBienChe,
               hd.ThoiHanHD, hd.LoaiHopDong
        FROM NhanVien nv
        LEFT JOIN Kho k ON nv.MaKho = k.MaKho
        LEFT JOIN NhanVien mgr ON nv.MaQLy = mgr.MaNV
        LEFT JOIN NVBienChe bc ON nv.MaNV = bc.MaNV
        LEFT JOIN NVHopDong hd ON nv.MaNV = hd.MaNV
        ORDER BY nv.HoTen
    ''').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@employees_bp.route('/managers', methods=['GET'])
def get_managers():
    db = get_db()
    rows = db.execute('''
        SELECT nv.MaNV,
               nv.HoTen,
               nv.ChucVu,
               nv.Email,
               nv.SDT,
               nv.MaKho,
               k.TenKho,
               nv.NgayBatDau,
               nv.LoaiNV,
               bc.NgayVaoBienChe,
               hd.ThoiHanHD,
               hd.LoaiHopDong,
               COUNT(sub.MaNV) AS SoNhanVienQuanLy
        FROM NhanVien nv
        LEFT JOIN Kho k ON nv.MaKho = k.MaKho
        LEFT JOIN NVBienChe bc ON nv.MaNV = bc.MaNV
        LEFT JOIN NVHopDong hd ON nv.MaNV = hd.MaNV
        LEFT JOIN NhanVien sub ON sub.MaQLy = nv.MaNV
        WHERE nv.ChucVu LIKE '%Quản lý%' OR nv.MaNV IN (
            SELECT DISTINCT MaQLy FROM NhanVien WHERE MaQLy IS NOT NULL
        )
        GROUP BY nv.MaNV
        ORDER BY nv.HoTen
    ''').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@employees_bp.route('/<id>', methods=['GET'])
def get_employee(id):
    db = get_db()
    row = db.execute('''
        SELECT nv.*, k.TenKho as TenKho, mgr.HoTen as TenQLy,
               bc.NgayVaoBienChe,
               hd.ThoiHanHD, hd.LoaiHopDong
        FROM NhanVien nv
        LEFT JOIN Kho k ON nv.MaKho = k.MaKho
        LEFT JOIN NhanVien mgr ON nv.MaQLy = mgr.MaNV
        LEFT JOIN NVBienChe bc ON nv.MaNV = bc.MaNV
        LEFT JOIN NVHopDong hd ON nv.MaNV = hd.MaNV
        WHERE nv.MaNV = ?
    ''', (id,)).fetchone()
    db.close()
    if not row:
        return jsonify({'error': 'Không tìm thấy'}), 404
    return jsonify(dict(row))

@employees_bp.route('/', methods=['POST'])
def create_employee():
    db = get_db()
    d = request.json
    try:
        if not d.get('MaKho'):
            db.close()
            return jsonify({'error': 'Vui lòng chọn mã kho cho nhân viên'}), 400
        if not db.execute('SELECT 1 FROM Kho WHERE MaKho = ?', (d['MaKho'],)).fetchone():
            db.close()
            return jsonify({'error': 'Mã kho không hợp lệ'}), 400
        db.execute('''INSERT INTO NhanVien (MaNV,HoTen,ChucVu,Email,SDT,NgayBatDau,LoaiNV,MaKho,MaQLy)
                      VALUES (?,?,?,?,?,?,?,?,?)''',
                   (d['MaNV'], d['HoTen'], d['ChucVu'], d.get('Email'), d.get('SDT'),
                    d['NgayBatDau'], d['LoaiNV'], d['MaKho'], d.get('MaQLy')))
        if d['LoaiNV'] == 'BienChe':
            db.execute('INSERT INTO NVBienChe (MaNV,NgayVaoBienChe) VALUES (?,?)',
                       (d['MaNV'], d.get('NgayVaoBienChe', d['NgayBatDau'])))
        else:
            db.execute('INSERT INTO NVHopDong (MaNV,ThoiHanHD,LoaiHopDong) VALUES (?,?,?)',
                       (d['MaNV'], d['ThoiHanHD'], d['LoaiHopDong']))
        db.commit()
        db.close()
        return jsonify({'message': 'Thêm nhân viên thành công'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@employees_bp.route('/<id>', methods=['PUT'])
def update_employee(id):
    db = get_db()
    d = request.json
    try:
        if d.get('MaKho') and not db.execute('SELECT 1 FROM Kho WHERE MaKho = ?', (d['MaKho'],)).fetchone():
            db.close()
            return jsonify({'error': 'Mã kho không hợp lệ'}), 400
        db.execute('''UPDATE NhanVien SET HoTen=?,ChucVu=?,Email=?,SDT=?,MaKho=?,MaQLy=? WHERE MaNV=?''',
                   (d['HoTen'], d['ChucVu'], d.get('Email'), d.get('SDT'), d.get('MaKho'), d.get('MaQLy'), id))
        db.commit()
        db.close()
        return jsonify({'message': 'Cập nhật thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@employees_bp.route('/<id>', methods=['DELETE'])
def delete_employee(id):
    db = get_db()
    try:
        db.execute('DELETE FROM NhanVien WHERE MaNV=?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400