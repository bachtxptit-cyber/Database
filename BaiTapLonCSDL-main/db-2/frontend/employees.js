async function loadEmployees() {
    const ca = document.getElementById('contentArea');
    try {
        const [employees, warehouses] = await Promise.all([
            apiGet('/employees/'), apiGet('/warehouse/')
        ]);
        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Nhân viên</h1><p>${employees.length} nhân viên</p></div>
            <button class="btn btn-primary" onclick="openEmployeeCreate()">+ Thêm nhân viên</button>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="empSearch" placeholder="Tìm nhân viên..." oninput="filterEmployees()" />
                <select class="form-control" id="empWarehouse" style="width:220px" onchange="filterEmployees()">
                    <option value="">Tất cả kho</option>
                    ${warehouses.map(w => `<option value="${w.MaKho}">${w.TenKho}</option>`).join('')}
                </select>
            </div>
        </div>
        <div id="employeeTable"></div>
        `;
        window._employees = employees;
        window._warehouses = warehouses;
        renderEmployees(employees);
    } catch (e) {
        ca.innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function filterEmployees() {
    const q = document.getElementById('empSearch').value.toLowerCase();
    const selectedWarehouse = document.getElementById('empWarehouse').value;
    const filtered = window._employees.filter(e => {
        const matchesText = !q || e.HoTen.toLowerCase().includes(q) || e.MaNV.toLowerCase().includes(q) || (e.ChucVu || '').toLowerCase().includes(q);
        const matchesWarehouse = !selectedWarehouse || e.MaKho === selectedWarehouse;
        return matchesText && matchesWarehouse;
    });
    renderEmployees(filtered);
}

function renderEmployees(rows) {
    const html = `
        <div class="card mb-20">
            <div class="card-header">
                <h2>Danh sách nhân viên</h2>
                <p>${rows.length} nhân viên</p>
            </div>
            ${buildTable([
                {key:'MaNV', label:'Mã NV'},
                {key:'HoTen', label:'Họ tên', cls:'td-name'},
                {key:'ChucVu', label:'Chức vụ'},
                {key:'TenKho', label:'Tên kho hàng'},
                {key:'LoaiNV', label:'Loại NV'},
                {key:'NgayVaoBienChe', label:'Ngày vào BC', fmt: v => fmtDate(v)},
                {key:'ThoiHanHD', label:'Hạn hợp đồng', fmt: v => fmtDate(v)}
            ], rows, row => `
                <div class="flex gap-8">
                    <button type="button" class="btn btn-outline btn-sm" onclick="viewEmployee('${row.MaNV}')">Xem</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="editEmployee('${row.MaNV}')">Sửa</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteEmployee('${row.MaNV}')">Xóa</button>
                </div>
            `)}
        </div>
    `;

    document.getElementById('employeeTable').innerHTML = html || `<div class="empty-state"><div class="empty-icon">◈</div><p>Không có nhân viên</p></div>`;
}

async function viewEmployee(id) {
    try {
        const emp = await apiGet(`/employees/${id}`);
        openModal(`Nhân viên ${emp.HoTen}`, `
        <div class="grid-2">
            <div>
                <div class="info-item"><label>Mã NV</label><span>${emp.MaNV}</span></div>
                <div class="info-item"><label>Họ tên</label><span>${emp.HoTen}</span></div>
                <div class="info-item"><label>Chức vụ</label><span>${emp.ChucVu}</span></div>
                <div class="info-item"><label>Loại NV</label><span>${emp.LoaiNV}</span></div>
                <div class="info-item"><label>Email</label><span>${emp.Email || '—'}</span></div>
                <div class="info-item"><label>SĐT</label><span>${emp.SDT || '—'}</span></div>
            </div>
            <div>
                <div class="info-item"><label>Tên kho hàng</label><span>${emp.TenKho || '—'}</span></div>
                <div class="info-item"><label>Ngày vào biên chế</label><span>${fmtDate(emp.NgayVaoBienChe)}</span></div>
                <div class="info-item"><label>Hạn hợp đồng</label><span>${fmtDate(emp.ThoiHanHD)}</span></div>
                <div class="info-item"><label>Loại hợp đồng</label><span>${emp.LoaiHopDong || '—'}</span></div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" onclick="closeModal()">Đóng</button>
        </div>
        `, true);
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function openEmployeeCreate() {
    await openEmployeeForm();
}

async function editEmployee(id) {
    try {
        const emp = await apiGet(`/employees/${id}`);
        await openEmployeeForm(emp);
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function openEmployeeForm(emp = null) {
    const warehouses = await apiGet('/warehouse/');
    const isEdit = !!emp;
    openModal(isEdit ? `Sửa nhân viên ${emp.MaNV}` : 'Thêm nhân viên mới', `
    <div class="form-group"><label class="form-label">Mã NV</label><input class="form-control" id="e_MaNV" value="${emp?.MaNV||''}" ${isEdit ? 'readonly' : ''} placeholder="NV003" /></div>
    <div class="form-group"><label class="form-label">Họ tên</label><input class="form-control" id="e_HoTen" placeholder="Nguyễn Văn C" /></div>
    <div class="form-group"><label class="form-label">Chức vụ</label><input class="form-control" id="e_ChucVu" placeholder="Nhân viên" /></div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="e_Email" placeholder="nv@example.com" /></div>
        <div class="form-group"><label class="form-label">SĐT</label><input class="form-control" id="e_SDT" placeholder="0912345678" /></div>
    </div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Ngày bắt đầu</label><input class="form-control" type="date" id="e_NgayBatDau" /></div>
        <div class="form-group"><label class="form-label">Loại NV</label><select class="form-control" id="e_LoaiNV"><option value="BienChe">Biên chế</option><option value="HopDong">Hợp đồng</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Kho / Chi nhánh</label><select class="form-control" id="e_MaKho"><option value="">Chọn kho / chi nhánh</option>${warehouses.map(w => `<option value="${w.MaKho}" ${w.MaKho === (emp?.MaKho || '') ? 'selected' : ''}>${w.TenKho}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Mã quản lý</label><input class="form-control" id="e_MaQLy" value="${emp?.MaQLy||''}" placeholder="NV001" /></div>
    <div class="form-group"><label class="form-label">Ngày vào biên chế / Hạn HĐ</label><input class="form-control" type="date" id="e_ExtraDate" value="${emp?.NgayVaoBienChe || emp?.ThoiHanHD || ''}" /></div>
    <div class="form-group"><label class="form-label">Loại hợp đồng</label><input class="form-control" id="e_LoaiHopDong" value="${emp?.LoaiHopDong||''}" placeholder="Toàn thời gian" /></div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveEmployee('${emp?.MaNV||''}')">Lưu</button>
    </div>`);
}

async function saveEmployee(id = '') {
    const d = {
        HoTen: document.getElementById('e_HoTen').value.trim(),
        ChucVu: document.getElementById('e_ChucVu').value.trim(),
        Email: document.getElementById('e_Email').value.trim(),
        SDT: document.getElementById('e_SDT').value.trim(),
        NgayBatDau: document.getElementById('e_NgayBatDau').value,
        LoaiNV: document.getElementById('e_LoaiNV').value,
        MaKho: document.getElementById('e_MaKho').value,
        MaQLy: document.getElementById('e_MaQLy').value.trim(),
        NgayVaoBienChe: document.getElementById('e_ExtraDate').value,
        ThoiHanHD: document.getElementById('e_ExtraDate').value,
        LoaiHopDong: document.getElementById('e_LoaiHopDong').value.trim(),
    };
    if (!d.HoTen || !d.ChucVu || !d.LoaiNV || !d.MaKho) return toast('Vui lòng điền đủ thông tin và chọn kho', 'error');
    try {
        if (id) {
            await apiPut(`/employees/${id}`, d);
            toast('Cập nhật nhân viên thành công', 'success');
        } else {
            d.MaNV = document.getElementById('e_MaNV').value.trim();
            if (!d.MaNV) return toast('Vui lòng nhập mã NV', 'error');
            await apiPost('/employees/', d);
            toast('Thêm nhân viên thành công', 'success');
        }
        closeModal();
        loadEmployees();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteEmployee(id) {
    confirmDelete(`Xóa nhân viên ${id}?`, async () => {
        try {
            await apiDelete(`/employees/${id}`);
            toast('Xóa nhân viên thành công', 'success');
            loadEmployees();
        } catch (e) {
            toast(e.message, 'error');
        }
    });
}

async function createEmployee() {
    const d = {
        MaNV: document.getElementById('e_MaNV').value.trim(),
        HoTen: document.getElementById('e_HoTen').value.trim(),
        ChucVu: document.getElementById('e_ChucVu').value.trim(),
        Email: document.getElementById('e_Email').value.trim(),
        SDT: document.getElementById('e_SDT').value.trim(),
        NgayBatDau: document.getElementById('e_NgayBatDau').value,
        LoaiNV: document.getElementById('e_LoaiNV').value,
        MaKho: document.getElementById('e_MaKho').value,
        MaQLy: document.getElementById('e_MaQLy').value.trim(),
        NgayVaoBienChe: document.getElementById('e_ExtraDate').value,
        ThoiHanHD: document.getElementById('e_ExtraDate').value,
        LoaiHopDong: document.getElementById('e_LoaiHopDong').value.trim(),
    };
    if (!d.MaNV || !d.HoTen || !d.ChucVu || !d.LoaiNV || !d.MaKho) return toast('Vui lòng điền đủ thông tin và chọn kho', 'error');
    try {
        await apiPost('/employees/', d);
        closeModal(); toast('Thêm nhân viên thành công', 'success'); loadEmployees();
    } catch (e) { toast(e.message, 'error'); }
}
