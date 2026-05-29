from flask import Blueprint, jsonify, request
from database import get_db

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET'])
def get_products():
    db = get_db()
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    
    query = '''
        SELECT sp.*, dm.TenDM,
               COALESCE(SUM(tk.SoLuong), 0) as TongTon
        FROM SanPham sp
        LEFT JOIN DanhMuc dm ON sp.MaDM = dm.MaDM
        LEFT JOIN TonKho tk ON sp.MaSP = tk.MaSP
    '''
    params = []
    conditions = []
    if search:
        conditions.append("(sp.TenSP LIKE ? OR sp.MaSP LIKE ?)")
        params.extend([f'%{search}%', f'%{search}%'])
    if category:
        conditions.append("sp.MaDM = ?")
        params.append(category)
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    query += ' GROUP BY sp.MaSP ORDER BY sp.TenSP'
    
    rows = db.execute(query, params).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@products_bp.route('/<id>', methods=['GET'])
def get_product(id):
    db = get_db()
    row = db.execute('''
        SELECT sp.*, dm.TenDM,
               COALESCE(SUM(tk.SoLuong), 0) as TongTon
        FROM SanPham sp
        LEFT JOIN DanhMuc dm ON sp.MaDM = dm.MaDM
        LEFT JOIN TonKho tk ON sp.MaSP = tk.MaSP
        WHERE sp.MaSP = ?
        GROUP BY sp.MaSP
    ''', (id,)).fetchone()
    db.close()
    if not row:
        return jsonify({'error': 'Không tìm thấy sản phẩm'}), 404
    return jsonify(dict(row))

@products_bp.route('/', methods=['POST'])
def create_product():
    db = get_db()
    d = request.json
    try:
        db.execute('''INSERT INTO SanPham (MaSP,TenSP,MaDM,Size,MauSac,GiaBan)
                      VALUES (?,?,?,?,?,?)''',
                   (d['MaSP'], d['TenSP'], d['MaDM'], d['Size'], d['MauSac'], d['GiaBan']))
        db.commit()
        db.close()
        return jsonify({'message': 'Thêm sản phẩm thành công'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@products_bp.route('/<id>', methods=['PUT'])
def update_product(id):
    db = get_db()
    d = request.json
    try:
        db.execute('''UPDATE SanPham SET TenSP=?,MaDM=?,Size=?,MauSac=?,GiaBan=?
                      WHERE MaSP=?''',
                   (d['TenSP'], d['MaDM'], d['Size'], d['MauSac'], d['GiaBan'], id))
        db.commit()
        db.close()
        return jsonify({'message': 'Cập nhật thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@products_bp.route('/<id>', methods=['DELETE'])
def delete_product(id):
    db = get_db()
    try:
        db.execute('DELETE FROM SanPham WHERE MaSP=?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@products_bp.route('/categories/all', methods=['GET'])
def get_categories():
    db = get_db()
    rows = db.execute('SELECT * FROM DanhMuc ORDER BY MaDM').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@products_bp.route('/categories/<id>', methods=['PUT'])
def update_category(id):
    db = get_db()
    d = request.json
    try:
        db.execute('UPDATE DanhMuc SET TenDM = ?, MoTa = ?, TrangThai = ? WHERE MaDM = ?',
                   (d['TenDM'], d.get('MoTa', ''), d.get('TrangThai', 'HoatDong'), id))
        db.commit()
        db.close()
        return jsonify({'message': 'Cập nhật danh mục thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@products_bp.route('/categories/<id>', methods=['DELETE'])
def delete_category(id):
    db = get_db()
    try:
        product = db.execute('SELECT 1 FROM SanPham WHERE MaDM = ? LIMIT 1', (id,)).fetchone()
        if product:
            db.close()
            return jsonify({'error': 'Không thể xóa danh mục đang có sản phẩm'}), 400
        db.execute('DELETE FROM DanhMuc WHERE MaDM = ?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa danh mục thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@products_bp.route('/categories/', methods=['POST'])
def create_category():
    db = get_db()
    d = request.json
    try:
        db.execute('INSERT INTO DanhMuc (MaDM,TenDM,MoTa,TrangThai) VALUES (?,?,?,?)',
                   (d['MaDM'], d['TenDM'], d.get('MoTa',''), d.get('TrangThai','HoatDong')))
        db.commit()
        db.close()
        return jsonify({'message': 'Thêm danh mục thành công'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@products_bp.route('/stock/all', methods=['GET'])
def get_stock():
    db = get_db()
    rows = db.execute('''
        SELECT tk.*, sp.TenSP, sp.Size, sp.MauSac, k.TenKho
        FROM TonKho tk
        JOIN SanPham sp ON tk.MaSP = sp.MaSP
        JOIN Kho k ON tk.MaKho = k.MaKho
        ORDER BY sp.TenSP
    ''').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@products_bp.route('/stock/<id>', methods=['DELETE'])
def delete_stock(id):
    db = get_db()
    try:
        stock = db.execute('SELECT MaSP, MaKho, SoLuong FROM TonKho WHERE MaTK = ?', (id,)).fetchone()
        if not stock:
            db.close()
            return jsonify({'error': 'Không tìm thấy tồn kho'}), 404
        db.execute('DELETE FROM TonKho WHERE MaTK = ?', (id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Xóa tồn kho thành công'})
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400