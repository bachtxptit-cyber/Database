async function loadCustomers() {
    const ca = document.getElementById('contentArea');
    try {
        const customers = await apiGet('/customers/');
        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Khách hàng</h1><p>${customers.length} khách hàng</p></div>
            <button class="btn btn-primary" onclick="showCustomerForm()">+ Thêm khách hàng</button>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="khSearch" placeholder="Tìm theo tên hoặc SĐT..." oninput="filterCustomers()" />
                <button class="btn btn-outline btn-sm" onclick="showPhoneLookup()">📞 Tra cứu SĐT</button>
            </div>
        </div>
        <div class="card">
        ${buildTable([
            {key:'MaKH', label:'Mã KH'},
            {key:'HoTen', label:'Họ tên', cls:'td-name'},
            {key:'SDT', label:'Số điện thoại'},
            {key:'NgaySinh', label:'Ngày sinh', fmt: v => fmtDate(v)},
            {key:'DiemTichLuy', label:'Điểm tích lũy', fmt: v => `<span class="badge badge-gold font-display">${v}</span>`},
        ], customers, row => `
            <div class="flex gap-8">
                <button class="btn btn-outline btn-sm" onclick="viewCustomer('${row.MaKH}')">Xem</button>
                <button class="btn btn-outline btn-sm" onclick='editCustomer(${JSON.stringify(row)})'>Sửa</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${row.MaKH}')">Xóa</button>
            </div>
        `)}
        </div>`;
        
        window._customers = customers;
    } catch(e) {
        ca.innerHTML = `<div class="loading">Lỗi: ${e.message}</div>`;
    }
}

function filterCustomers() {
    const q = document.getElementById('khSearch').value.toLowerCase();
    const filtered = window._customers.filter(k =>
        k.HoTen.toLowerCase().includes(q) || k.SDT.includes(q)
    );
    document.querySelector('.card:last-child').innerHTML = buildTable([
        {key:'MaKH', label:'Mã KH'},
        {key:'HoTen', label:'Họ tên', cls:'td-name'},
        {key:'SDT', label:'Số điện thoại'},
        {key:'NgaySinh', label:'Ngày sinh', fmt: v => fmtDate(v)},
        {key:'DiemTichLuy', label:'Điểm', fmt: v => `<span class="badge badge-gold">${v}</span>`},
    ], filtered, row => `
        <div class="flex gap-8">
            <button class="btn btn-outline btn-sm" onclick="viewCustomer('${row.MaKH}')">Xem</button>
            <button class="btn btn-outline btn-sm" onclick='editCustomer(${JSON.stringify(row)})'>Sửa</button>
        </div>`);
}

async function viewCustomer(id) {
    const kh = await apiGet(`/customers/${id}`);
    openModal(`${kh.HoTen} — Chi tiết`, `
    <div class="grid-2 mb-20">
        <div>
            <div class="info-item"><label>Mã KH</label><span>${kh.MaKH}</span></div>
            <div class="info-item"><label>Họ tên</label><span>${kh.HoTen}</span></div>
            <div class="info-item"><label>Số điện thoại</label><span>${kh.SDT}</span></div>
            <div class="info-item"><label>Ngày sinh</label><span>${fmtDate(kh.NgaySinh)}</span></div>
        </div>
        <div style="text-align:center;padding:20px;background:rgba(200,169,110,0.05);border-radius:8px;border:1px solid rgba(200,169,110,0.1)">
            <div style="font-size:11px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Điểm tích lũy</div>
            <div style="font-family:var(--font-display);font-size:48px;color:var(--gold)">${kh.DiemTichLuy}</div>
        </div>
    </div>
    <div class="card-title">Lịch sử tích điểm</div>
    ${kh.LichSuDiem.length ? buildTable([
        {key:'NgayCapNhat', label:'Ngày', fmt:v=>fmtDatetime(v)},
        {key:'MaHD', label:'Hóa đơn'},
        {key:'SoDiem', label:'Điểm', fmt:(v,r)=>`<span class="${r.LoaiThayDoi==='Cong'?'text-success':'text-danger'}">${r.LoaiThayDoi==='Cong'?'+':'-'}${v}</span>`},
        {key:'GhiChu', label:'Ghi chú'},
    ], kh.LichSuDiem, null) : '<p style="color:var(--muted);font-size:12px">Chưa có lịch sử</p>'}
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Đóng</button>
        <button class="btn btn-primary" onclick="showAdjustPoints('${kh.MaKH}')">Điều chỉnh điểm</button>
    </div>
    `, true);
}

function showCustomerForm(kh = null) {
    const isEdit = !!kh;
    openModal(isEdit ? 'Sửa khách hàng' : 'Thêm khách hàng', `
    <div class="form-group"><label class="form-label">Họ tên *</label>
        <input class="form-control" id="kh_HoTen" value="${kh?.HoTen||''}" /></div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Số điện thoại *</label>
            <input class="form-control" id="kh_SDT" value="${kh?.SDT||''}" /></div>
        <div class="form-group"><label class="form-label">Ngày sinh</label>
            <input class="form-control" type="date" id="kh_NgaySinh" value="${kh?.NgaySinh||''}" /></div>
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveCustomer(${isEdit}, '${kh?.MaKH||''}')">Lưu</button>
    </div>`);
}

function editCustomer(kh) { showCustomerForm(kh); }

async function saveCustomer(isEdit, id) {
    const d = {
        HoTen: document.getElementById('kh_HoTen').value.trim(),
        SDT: document.getElementById('kh_SDT').value.trim(),
        NgaySinh: document.getElementById('kh_NgaySinh').value,
    };
    if (!d.HoTen || !d.SDT) return toast('Điền đầy đủ thông tin','error');
    try {
        if (isEdit) await apiPut(`/customers/${id}`, d);
        else await apiPost('/customers/', d);
        closeModal(); toast('Lưu thành công','success'); loadCustomers();
    } catch(e) { toast(e.message,'error'); }
}

async function deleteCustomer(id) {
    confirmDelete(`Xóa khách hàng ${id}?`, async () => {
        try { await apiDelete(`/customers/${id}`); toast('Đã xóa','success'); loadCustomers(); }
        catch(e) { toast(e.message,'error'); }
    });
}

function showPhoneLookup() {
    openModal('Tra cứu khách hàng theo SĐT', `
    <div class="search-bar" style="margin-bottom:16px">
        <input class="input-search" id="lookup_sdt" placeholder="Nhập số điện thoại..." style="flex:1" />
        <button class="btn btn-primary" onclick="doPhoneLookup()">Tra cứu</button>
    </div>
    <div id="lookupResult"></div>
    `);
}

async function doPhoneLookup() {
    const sdt = document.getElementById('lookup_sdt').value.trim();
    if (!sdt) return;
    const res = document.getElementById('lookupResult');
    try {
        const kh = await apiGet(`/customers/phone/${sdt}`);
        res.innerHTML = `
        <div class="customer-info-box">
            <div style="font-size:15px;font-weight:500;color:var(--cream);margin-bottom:8px">${kh.HoTen}</div>
            <div style="font-size:12px;color:var(--muted)">SĐT: ${kh.SDT}</div>
            <div style="font-size:12px;color:var(--muted)">Ngày sinh: ${fmtDate(kh.NgaySinh)}</div>
            <div style="margin-top:10px">Điểm: <span class="text-gold font-display" style="font-size:20px">${kh.DiemTichLuy}</span></div>
            ${kh.LichSuDiem.length ? `
            <div class="divider"></div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:6px">Lịch sử gần nhất:</div>
            ${kh.LichSuDiem.slice(0,5).map(h=>`
                <div class="summary-row" style="font-size:11px">
                    <span>${fmtDate(h.NgayCapNhat)}</span>
                    <span class="${h.LoaiThayDoi==='Cong'?'text-success':'text-danger'}">${h.LoaiThayDoi==='Cong'?'+':'-'}${h.SoDiem} điểm</span>
                </div>`).join('')}
            ` : ''}
        </div>`;
    } catch(e) {
        res.innerHTML = `<div style="color:var(--danger);font-size:13px">Không tìm thấy khách hàng với SĐT này</div>`;
    }
}

function showAdjustPoints(id) {
    openModal('Điều chỉnh điểm', `
    <div class="form-row">
        <div class="form-group"><label class="form-label">Loại</label>
            <select class="form-control" id="adj_loai">
                <option value="Cong">Cộng điểm</option>
                <option value="Tru">Trừ điểm</option>
            </select>
        </div>
        <div class="form-group"><label class="form-label">Số điểm</label>
            <input class="form-control" type="number" id="adj_diem" placeholder="50" />
        </div>
    </div>
    <div class="form-group"><label class="form-label">Ghi chú</label>
        <input class="form-control" id="adj_ghichu" placeholder="Lý do..." />
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="doAdjustPoints('${id}')">Xác nhận</button>
    </div>`);
}

async function doAdjustPoints(id) {
    const d = {
        LoaiThayDoi: document.getElementById('adj_loai').value,
        SoDiem: parseInt(document.getElementById('adj_diem').value),
        GhiChu: document.getElementById('adj_ghichu').value,
    };
    if (!d.SoDiem) return toast('Nhập số điểm','error');
    try {
        await apiPost(`/customers/${id}/adjust-points`, d);
        closeModal(); toast('Cập nhật điểm thành công','success'); loadCustomers();
    } catch(e) { toast(e.message,'error'); }
}