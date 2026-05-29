from flask import Blueprint, jsonify, request
from database import get_db
from datetime import datetime

payments_bp = Blueprint('payments', __name__)

@payments_bp.route('/', methods=['GET'])
def get_payments():
    db = get_db()
    rows = db.execute('''
        SELECT tt.*, hd.MaKH, hd.TongSauGiam, kh.HoTen as TenKH
        FROM ThanhToan tt
        JOIN HoaDon hd ON tt.MaHD = hd.MaHD
        LEFT JOIN KhachHang kh ON hd.MaKH = kh.MaKH
        ORDER BY tt.NgayTT DESC
    ''').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@payments_bp.route('/', methods=['POST'])
def create_payment():
    db = get_db()
    d = request.json
    try:
        ma_hd = d['MaHD']
        hd = db.execute('SELECT * FROM HoaDon WHERE MaHD=?', (ma_hd,)).fetchone()
        if not hd:
            db.close()
            return jsonify({'error': 'Không tìm thấy hóa đơn'}), 404
        if hd['TrangThai'] == 'DaThanhToan':
            db.close()
            return jsonify({'error': 'Hóa đơn đã được thanh toán'}), 400
        if hd['TrangThai'] == 'HuyBo':
            db.close()
            return jsonify({'error': 'Hóa đơn đã bị hủy'}), 400
        
        db.execute('''INSERT INTO ThanhToan (MaHD,PhuongThuc,NgayTT,SoTien)
                      VALUES (?,?,?,?)''',
                   (ma_hd, d['PhuongThuc'],
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    hd['TongSauGiam']))
        db.commit()
        
        # Lấy thông tin điểm mới của khách hàng
        if hd['MaKH']:
            kh = db.execute('SELECT DiemTichLuy FROM KhachHang WHERE MaKH=?', (hd['MaKH'],)).fetchone()
            diem_moi = kh['DiemTichLuy'] if kh else 0
        else:
            diem_moi = 0
        
        db.close()
        return jsonify({
            'message': 'Thanh toán thành công',
            'DiemMoi': diem_moi,
            'DiemCong': int(hd['TongSauGiam'] / 10000)
        }), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400