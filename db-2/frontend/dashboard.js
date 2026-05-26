async function loadDashboard() {
    try {
        const s = await apiGet('/dashboard/stats');
        const content = document.getElementById('contentArea');
        content.innerHTML = `
        <div class="page-header">
            <div>
                <h1>Dashboard</h1>
                <p>Tổng quan hoạt động cửa hàng</p>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Doanh thu hôm nay</div>
                <div class="stat-value">${fmtVND(s.DoanhThuHomNay)}</div>
                <div class="stat-sub">${s.HoaDonHomNay} hóa đơn</div>
                <div class="stat-icon">◈</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Doanh thu tháng</div>
                <div class="stat-value">${fmtVND(s.DoanhThuThang)}</div>
                <div class="stat-sub">Tháng ${new Date().getMonth()+1}</div>
                <div class="stat-icon">◉</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tổng sản phẩm</div>
                <div class="stat-value">${s.TongSanPham}</div>
                <div class="stat-sub">SKU đang kinh doanh</div>
                <div class="stat-icon">◧</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Khách hàng</div>
                <div class="stat-value">${s.TongKhachHang}</div>
                <div class="stat-sub">Thành viên tích lũy</div>
                <div class="stat-icon">◎</div>
            </div>
        </div>

        <div class="grid-2" style="margin-bottom:20px">
            <div class="card">
                <div class="card-title">Doanh thu 7 ngày gần nhất</div>
                <div id="revenueChart"></div>
            </div>
            <div class="card">
                <div class="card-title">Sản phẩm bán chạy</div>
                ${s.TopSanPham.length ? `
                <table style="width:100%;font-size:12px">
                    ${s.TopSanPham.map((p,i) => `
                    <tr>
                        <td style="padding:6px 0;color:var(--muted)">#${i+1}</td>
                        <td style="padding:6px 0;color:var(--cream)">${p.TenSP} <span style="color:var(--muted)">${p.Size} / ${p.MauSac}</span></td>
                        <td style="padding:6px 0;text-align:right;color:var(--gold);font-family:var(--font-display)">${p.TongBan}</td>
                    </tr>`).join('')}
                </table>` : '<p style="color:var(--muted);font-size:12px">Chưa có dữ liệu</p>'}
            </div>
        </div>

        ${s.TonKhoThap.length ? `
        <div class="card" style="border-color:rgba(201,96,96,0.2)">
            <div class="card-title" style="color:var(--danger)">⚠ Cảnh báo tồn kho thấp</div>
            ${buildTable([
                {key:'TenSP', label:'Sản phẩm', cls:'td-name'},
                {key:'Size', label:'Size'},
                {key:'MauSac', label:'Màu sắc'},
                {key:'TongTon', label:'Tồn kho', fmt:(v)=>`<span class="badge badge-red">${v}</span>`},
            ], s.TonKhoThap, null)}
        </div>` : ''}
        `;
        
        // Draw chart
        renderRevenueChart(s.DoanhThu7Ngay);
        
    } catch(e) {
        document.getElementById('contentArea').innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function renderRevenueChart(data) {
    const max = Math.max(...data.map(d => d.revenue), 1);
    const html = `
    <div class="chart-bar-container">
        ${data.map(d => {
            const h = Math.max(4, Math.round((d.revenue / max) * 90));
            const day = new Date(d.date).toLocaleDateString('vi-VN',{weekday:'short'});
            return `
            <div class="chart-bar-wrap">
                <span style="font-size:9px;color:var(--muted)">${d.revenue > 0 ? fmtVND(d.revenue).replace('₫','') : ''}</span>
                <div class="chart-bar" style="height:${h}px" title="${fmtVND(d.revenue)}"></div>
                <span class="chart-bar-label">${day}</span>
            </div>`;
        }).join('')}
    </div>`;
    document.getElementById('revenueChart').innerHTML = html;
}