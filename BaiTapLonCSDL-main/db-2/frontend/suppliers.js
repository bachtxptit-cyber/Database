async function loadSuppliers() {
    const ca = document.getElementById('contentArea');
    try {
        const suppliers = await apiGet('/suppliers/');
        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Nhà cung cấp</h1><p>${suppliers.length} nhà cung cấp</p></div>
            <button class="btn btn-primary" onclick="openSupplierForm()">+ Thêm NCC</button>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="supplierSearch" placeholder="Tìm nhà cung cấp..." oninput="filterSuppliers()" />
            </div>
        </div>
        <div id="supplierTable"></div>
        `;
        window._suppliers = suppliers;
        renderSupplierTable(suppliers);
    } catch (e) {
        ca.innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function filterSuppliers() {
    const q = document.getElementById('supplierSearch').value.toLowerCase();
    renderSupplierTable(window._suppliers.filter(s =>
        s.TenNCC.toLowerCase().includes(q) || (s.DiaChi||'').toLowerCase().includes(q) || (s.SDT||'').includes(q)
    ));
}

function renderSupplierTable(rows) {
    document.getElementById('supplierTable').innerHTML = buildTable([
        {key:'MaNCC', label:'Mã NCC'},
        {key:'TenNCC', label:'Tên NCC', cls:'td-name'},
        {key:'SDT', label:'SĐT'},
        {key:'DiaChi', label:'Địa chỉ'}
    ], rows, row => `
        <div class="flex gap-8">
            <button type="button" class="btn btn-primary btn-sm" onclick="editSupplier('${row.MaNCC}')">Sửa</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteSupplier('${row.MaNCC}')">Xóa</button>
        </div>
    `);
}

function openSupplierForm(supplier = null) {
    const isEdit = !!supplier;
    openModal(isEdit ? `Sửa nhà cung cấp ${supplier.MaNCC}` : 'Thêm nhà cung cấp', `
    <div class="form-group"><label class="form-label">Mã NCC</label><input class="form-control" id="sup_MaNCC" value="${supplier?.MaNCC||''}" ${isEdit ? 'readonly' : ''} /></div>
    <div class="form-group"><label class="form-label">Tên NCC</label><input class="form-control" id="sup_TenNCC" value="${supplier?.TenNCC||''}" /></div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">SĐT</label><input class="form-control" id="sup_SDT" value="${supplier?.SDT||''}" /></div>
        <div class="form-group"><label class="form-label">Địa chỉ</label><input class="form-control" id="sup_DiaChi" value="${supplier?.DiaChi||''}" /></div>
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveSupplier('${supplier?.MaNCC||''}')">Lưu</button>
    </div>`);
}

function editSupplier(id) {
    const supplier = (window._suppliers || []).find(s => s.MaNCC === id);
    if (!supplier) return toast('Không tìm thấy nhà cung cấp', 'error');
    openSupplierForm(supplier);
}

async function saveSupplier(id = '') {
    const data = {
        TenNCC: document.getElementById('sup_TenNCC').value.trim(),
        SDT: document.getElementById('sup_SDT').value.trim(),
        DiaChi: document.getElementById('sup_DiaChi').value.trim(),
    };
    if (!data.TenNCC) return toast('Điền đầy đủ thông tin', 'error');
    try {
        if (id) {
            await apiPut(`/suppliers/${id}`, data);
            toast('Cập nhật nhà cung cấp thành công','success');
        } else {
            data.MaNCC = document.getElementById('sup_MaNCC').value.trim();
            if (!data.MaNCC) return toast('Điền đầy đủ thông tin', 'error');
            await apiPost('/suppliers/', data);
            toast('Thêm nhà cung cấp thành công','success');
        }
        closeModal();
        loadSuppliers();
    } catch (e) { toast(e.message,'error'); }
}

async function createSupplier() {
    const d = {
        MaNCC: document.getElementById('sup_MaNCC').value.trim(),
        TenNCC: document.getElementById('sup_TenNCC').value.trim(),
        SDT: document.getElementById('sup_SDT').value.trim(),
        DiaChi: document.getElementById('sup_DiaChi').value.trim(),
    };
    if (!d.MaNCC || !d.TenNCC) return toast('Điền đầy đủ thông tin', 'error');
    try {
        await apiPost('/suppliers/', d);
        closeModal(); toast('Thêm nhà cung cấp thành công','success'); loadSuppliers();
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteSupplier(id) {
    confirmDelete(`Xóa NCC ${id}?`, async () => {
        try { await apiDelete(`/suppliers/${id}`); toast('Đã xóa', 'success'); loadSuppliers(); }
        catch (e) { toast(e.message, 'error'); }
    });
}
