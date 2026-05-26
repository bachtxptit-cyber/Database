async function loadInvoices() {
    const ca = document.getElementById('contentArea');
    try {
        const invoices = await apiGet('/sales/');
        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Hóa đơn</h1><p>${invoices.length} hóa đơn</p></div>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="invoiceSearch" placeholder="Tìm theo mã, khách hàng..." oninput="filterInvoices()" />
            </div>
        </div>
        <div id="invoiceTable"></div>
        `;
        window._invoices = invoices;
        renderInvoiceTable(invoices);
    } catch (e) {
        ca.innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function filterInvoices() {
    const q = document.getElementById('invoiceSearch').value.toLowerCase();
    renderInvoiceTable(window._invoices.filter(i =>
        i.MaHD.toLowerCase().includes(q) || (i.TenKH||'').toLowerCase().includes(q) || (i.TenNV||'').toLowerCase().includes(q)
    ));
}

function renderInvoiceTable(rows) {
    document.getElementById('invoiceTable').innerHTML = buildTable([
        {key:'MaHD', label:'Mã HD'},
        {key:'TenKH', label:'Khách hàng', cls:'td-name'},
        {key:'TenNV', label:'Nhân viên'},
        {key:'NgayLap', label:'Ngày', fmt: v => fmtDatetime(v)},
        {key:'TongSauGiam', label:'Tổng sau giảm', fmt: v => fmtVND(v)},
        {key:'TrangThai', label:'Trạng thái', fmt: v => renderStatusBadge(v)}
    ], rows, row => `
        <div class="flex gap-8">
            <button class="btn btn-outline btn-sm" onclick="viewInvoice('${row.MaHD}')">Xem</button>
        </div>
    `);
}

async function viewInvoice(id) {
    try {
        const hd = await apiGet(`/sales/${id}`);
        openModal(`Hóa đơn ${id}`, `
        <div class="grid-2">
            <div>
                <div class="info-item"><label>Mã HD</label><span>${hd.MaHD}</span></div>
                <div class="info-item"><label>Khách hàng</label><span>${hd.TenKH || 'Khách lẻ'}</span></div>
                <div class="info-item"><label>Nhân viên</label><span>${hd.TenNV}</span></div>
            </div>
            <div>
                <div class="info-item"><label>Ngày lập</label><span>${fmtDatetime(hd.NgayLap)}</span></div>
                <div class="info-item"><label>Tổng tiền</label><span>${fmtVND(hd.TongTien)}</span></div>
                <div class="info-item"><label>Tổng sau giảm</label><span>${fmtVND(hd.TongSauGiam)}</span></div>
            </div>
        </div>
        <div class="card-title">Chi tiết sản phẩm</div>
        ${buildTable([
            {key:'MaSP', label:'Mã SP'},
            {key:'TenSP', label:'Tên SP', cls:'td-name'},
            {key:'Size', label:'Size'},
            {key:'MauSac', label:'Màu sắc'},
            {key:'SoLuong', label:'SL'},
            {key:'GiaBan', label:'Giá bán', fmt: v => fmtVND(v)}
        ], hd.ChiTiet, null)}
        ${hd.UuDai?.length ? `
        <div class="card-title">Ưu đãi áp dụng</div>
        ${buildTable([{key:'MaUD', label:'Mã UD'},{key:'TenUD', label:'Tên ưu đãi'},{key:'GiaTriGiam', label:'Giảm giá', fmt:(v,r)=> r.IsPercent ? `${v}%` : fmtVND(v)}], hd.UuDai, null)}` : ''}
        ${hd.ThanhToan ? `
        <div class="card-title">Thanh toán</div>
        <div class="info-item"><label>Phương thức</label><span>${hd.ThanhToan.PhuongThuc}</span></div>
        <div class="info-item"><label>Số tiền</label><span>${fmtVND(hd.ThanhToan.SoTien)}</span></div>
        ` : ''}
        <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Đóng</button></div>
        `, true);
    } catch (e) {
        toast(e.message, 'error');
    }
}
