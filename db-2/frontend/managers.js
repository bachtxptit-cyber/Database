async function loadManagers() {
    const ca = document.getElementById('contentArea');
    try {
        const managers = await apiGet('/employees/managers');
        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Quản lý</h1><p>${managers.length} người quản lý</p></div>
            <button class="btn btn-primary" onclick="openManagerCreate()">+ Thêm quản lý</button>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="mgrSearch" placeholder="Tìm quản lý theo tên, kho, email..." oninput="filterManagers()" />
            </div>
        </div>
        <div id="managerTable"></div>
        `;
        window._managers = managers;
        renderManagers(managers);
    } catch (e) {
        ca.innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function openManagerCreate() {
    openModal('Thêm quản lý mới', `
    <div class="form-group"><label class="form-label">Mã NV</label><input class="form-control" id="m_MaNV" placeholder="NV010" /></div>
    <div class="form-group"><label class="form-label">Họ tên</label><input class="form-control" id="m_HoTen" placeholder="Nguyễn Văn A" /></div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="m_Email" placeholder="manager@example.com" /></div>
    <div class="form-group"><label class="form-label">SĐT</label><input class="form-control" id="m_SDT" placeholder="0912345678" /></div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Ngày bắt đầu quản lý</label><input class="form-control" type="date" id="m_NgayBatDau" /></div>
        <div class="form-group"><label class="form-label">Loại NV</label><select class="form-control" id="m_LoaiNV"><option value="BienChe">Biên chế</option><option value="HopDong">Hợp đồng</option></select></div>
    </div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Ngày vào biên chế</label><input class="form-control" type="date" id="m_NgayVaoBienChe" /></div>
        <div class="form-group"><label class="form-label">Hạn hợp đồng</label><input class="form-control" type="date" id="m_ThoiHanHD" /></div>
    </div>
    <div class="form-group"><label class="form-label">Loại hợp đồng</label><input class="form-control" id="m_LoaiHopDong" placeholder="Toàn thời gian" /></div>
    <div class="form-group"><label class="form-label">Mã kho</label><input class="form-control" id="m_MaKho" placeholder="K001" /></div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="createManager()">Lưu</button>
    </div>
    `, true);
}

async function createManager() {
    const data = {
        MaNV: document.getElementById('m_MaNV').value.trim(),
        HoTen: document.getElementById('m_HoTen').value.trim(),
        ChucVu: 'Quản lý',
        Email: document.getElementById('m_Email').value.trim(),
        SDT: document.getElementById('m_SDT').value.trim(),
        NgayBatDau: document.getElementById('m_NgayBatDau').value,
        LoaiNV: document.getElementById('m_LoaiNV').value,
        MaKho: document.getElementById('m_MaKho').value.trim(),
        NgayVaoBienChe: document.getElementById('m_NgayVaoBienChe').value,
        ThoiHanHD: document.getElementById('m_ThoiHanHD').value,
        LoaiHopDong: document.getElementById('m_LoaiHopDong').value.trim(),
    };
    if (!data.MaNV || !data.HoTen || !data.MaKho || !data.LoaiNV || !data.NgayBatDau) {
        return toast('Vui lòng điền đúng thông tin cơ bản của quản lý', 'error');
    }
    try {
        await apiPost('/employees/', data);
        closeModal();
        toast('Thêm quản lý thành công', 'success');
        loadManagers();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function filterManagers() {
    const q = document.getElementById('mgrSearch').value.toLowerCase();
    const filtered = window._managers.filter(m =>
        m.HoTen.toLowerCase().includes(q) ||
        m.MaNV.toLowerCase().includes(q) ||
        (m.ChucVu || '').toLowerCase().includes(q) ||
        (m.Email || '').toLowerCase().includes(q) ||
        (m.SDT || '').toLowerCase().includes(q) ||
        (m.MaKho || '').toLowerCase().includes(q) ||
        (m.TenKho || '').toLowerCase().includes(q)
    );
    renderManagers(filtered);
}

function renderManagers(rows) {
    document.getElementById('managerTable').innerHTML = buildTable([
        {key:'MaNV', label:'Mã NV'},
        {key:'HoTen', label:'Họ tên', cls:'td-name'},
        {key:'ChucVu', label:'Chức vụ'},
        {key:'Email', label:'Email'},
        {key:'SDT', label:'SĐT'},
        {key:'MaKho', label:'Mã kho'},
        {key:'NgayBatDau', label:'Ngày bắt đầu quản lý', fmt: v => fmtDate(v)},
        {key:'SoNhanVienQuanLy', label:'Số NV quản lý'}
    ], rows, row => `
        <div class="flex gap-8">
            <button class="btn btn-outline btn-sm" onclick="viewManager('${row.MaNV}')">Xem</button>
        </div>
    `);
}

async function viewManager(id) {
    try {
        const mgr = await apiGet(`/employees/${id}`);
        const current = (window._managers || []).find(m => m.MaNV === id) || {};
        const managedCount = current.SoNhanVienQuanLy ?? 0;
        openModal(`Quản lý ${mgr.HoTen}`, `
        <div class="grid-2">
            <div>
                <div class="info-item"><label>Mã NV</label><span>${mgr.MaNV}</span></div>
                <div class="info-item"><label>Họ tên</label><span>${mgr.HoTen}</span></div>
                <div class="info-item"><label>Chức vụ</label><span>${mgr.ChucVu}</span></div>
                <div class="info-item"><label>Email</label><span>${mgr.Email || '—'}</span></div>
                <div class="info-item"><label>SĐT</label><span>${mgr.SDT || '—'}</span></div>
                <div class="info-item"><label>Loại NV</label><span>${mgr.LoaiNV}</span></div>
            </div>
            <div>
                <div class="info-item"><label>Mã kho</label><span>${mgr.MaKho || '—'}</span></div>
                <div class="info-item"><label>Ngày bắt đầu quản lý</label><span>${fmtDate(mgr.NgayBatDau)}</span></div>
                <div class="info-item"><label>Số nhân viên trực tiếp</label><span>${managedCount}</span></div>
                <div class="info-item"><label>Ngày vào biên chế</label><span>${fmtDate(mgr.NgayVaoBienChe)}</span></div>
                <div class="info-item"><label>Hạn hợp đồng</label><span>${fmtDate(mgr.ThoiHanHD)}</span></div>
                <div class="info-item"><label>Loại hợp đồng</label><span>${mgr.LoaiHopDong || '—'}</span></div>
            </div>
        </div>
        <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Đóng</button></div>
        `, true);
    } catch (e) {
        toast(e.message, 'error');
    }
}
