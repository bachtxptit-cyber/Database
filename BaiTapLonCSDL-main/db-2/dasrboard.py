from flask import Blueprint, jsonify
from database import get_db
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    db = get_db()
    today = datetime.now().strftime('%Y-%m-%d')
    month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    
    # Doanh thu hôm nay
    dt_today = db.execute('''
        SELECT COALESCE(SUM(tt.SoTien),0) as total
        FROM ThanhToan tt WHERE DATE(tt.NgayTT) = ?
    ''', (today,)).fetchone()['total']
    
    # Doanh thu tháng này
    dt_month = db.execute('''
        SELECT COALESCE(SUM(tt.SoTien),0) as total
        FROM ThanhToan tt WHERE DATE(tt.NgayTT) >= ?
    ''', (month_start,)).fetchone()['total']
    
    # Tổng hóa đơn hôm nay
    hd_today = db.execute('''
        SELECT COUNT(*) as cnt FROM HoaDon WHERE DATE(NgayLap)=? AND TrangThai='DaThanhToan'
    ''', (today,)).fetchone()['cnt']
    
    # Tổng sản phẩm
    sp_count = db.execute('SELECT COUNT(*) as cnt FROM SanPham').fetchone()['cnt']
    
    # Tổng khách hàng
    kh_count = db.execute('SELECT COUNT(*) as cnt FROM KhachHang').fetchone()['cnt']
    
    # Sản phẩm tồn kho thấp (< 5)
    low_stock = db.execute('''
        SELECT sp.MaSP, sp.TenSP, sp.Size, sp.MauSac, COALESCE(SUM(tk.SoLuong),0) as TongTon
        FROM SanPham sp
        LEFT JOIN TonKho tk ON sp.MaSP = tk.MaSP
        GROUP BY sp.MaSP
        HAVING TongTon < 5
        ORDER BY TongTon ASC
        LIMIT 5
    ''').fetchall()
    
    # Doanh thu 7 ngày gần nhất
    revenue_7days = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        rev = db.execute('''
            SELECT COALESCE(SUM(SoTien),0) as rev FROM ThanhToan WHERE DATE(NgayTT)=?
        ''', (day,)).fetchone()['rev']
        revenue_7days.append({'date': day, 'revenue': rev})
    
    # Top sản phẩm bán chạy
    top_products = db.execute('''
        SELECT sp.TenSP, sp.Size, sp.MauSac, SUM(ct.SoLuong) as TongBan
        FROM ChiTietHD ct
        JOIN SanPham sp ON ct.MaSP = sp.MaSP
        JOIN HoaDon hd ON ct.MaHD = hd.MaHD
        WHERE hd.TrangThai = 'DaThanhToan'
        GROUP BY ct.MaSP
        ORDER BY TongBan DESC
        LIMIT 5
    ''').fetchall()
    
    db.close()
    return jsonify({
        'DoanhThuHomNay': dt_today,
        'DoanhThuThang': dt_month,
        'HoaDonHomNay': hd_today,
        'TongSanPham': sp_count,
        'TongKhachHang': kh_count,
        'TonKhoThap': [dict(r) for r in low_stock],
        'DoanhThu7Ngay': revenue_7days,
        'TopSanPham': [dict(r) for r in top_products]
    })