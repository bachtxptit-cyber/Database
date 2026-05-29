async function loadImports() {
    const ca = document.getElementById('contentArea');
    try {
        const [imports, products, warehouses, suppliers, managers] = await Promise.all([
            apiGet('/imports/'),
            apiGet('/products/'),
            apiGet('/warehouse/'),
            apiGet('/suppliers/'),
            apiGet('/employees/managers')
        ]);
        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Nhập hàng</h1><p>${imports.length} phiếu nhập</p></div>
            <button class="btn btn-primary" onclick="openImportForm()">+ Lập phiếu nhập</button>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="importSearch" placeholder="Tìm phiếu nhập..." oninput="filterImports()" />
            </div>
        </div>
        <div id="importTable"></div>
        `;
        window._imports = imports;
        window._importProducts = products;
        window._importWarehouses = warehouses;
        window._importSuppliers = suppliers;
        window._importManagers = managers;
        renderImportTable(imports);
    } catch (e) {
        ca.innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function filterImports() {
    const q = document.getElementById('importSearch').value.toLowerCase();
    renderImportTable(window._imports.filter(i =>
        i.MaNhap.toLowerCase().includes(q) ||
        (i.MaKho||'').toLowerCase().includes(q) ||
        (i.MaNCC||'').toLowerCase().includes(q) ||
        (i.MaQLy||'').toLowerCase().includes(q)
    ));
}

function renderImportTable(rows) {
    document.getElementById('importTable').innerHTML = buildTable([
        {key:'MaNhap', label:'Mã PN'},
        {key:'TenKho', label:'Tên kho hàng'},
        {key:'TenNCC', label:'Tên nhà cung cấp'},
        {key:'TenQLy', label:'Tên quản lý'},
        {key:'NgayNhap', label:'Ngày nhập', fmt: v => fmtDate(v)}
    ], rows, row => `
        <div class="flex gap-8">
            <button type="button" class="btn btn-outline btn-sm" onclick="viewImport('${row.MaNhap}')">Chi tiết</button>
        </div>
    `);
}

async function viewImport(id) {
    try {
        const phieu = await apiGet(`/imports/${id}`);
        openModal(`Phiếu nhập ${id}`, `
        <div class="info-item"><label>Mã PN</label><span>${phieu.MaNhap}</span></div>
        <div class="info-item"><label>Tên kho hàng</label><span>${phieu.TenKho}</span></div>
        <div class="info-item"><label>Tên nhà cung cấp</label><span>${phieu.TenNCC}</span></div>
        <div class="info-item"><label>Tên quản lý</label><span>${phieu.TenQLy}</span></div>
        <div class="info-item"><label>Ngày nhập</label><span>${fmtDate(phieu.NgayNhap)}</span></div>
        <div class="card-title">Chi tiết nhập</div>
        ${buildTable([
            {key:'MaSP', label:'Mã SP'},
            {key:'TenSP', label:'Sản phẩm', cls:'td-name'},
            {key:'Size', label:'Size'},
            {key:'MauSac', label:'Màu sắc'},
            {key:'ViTri', label:'Vị trí kệ'},
            {key:'SoLuong', label:'SL'},
            {key:'GiaVon', label:'Giá vốn', fmt: v => fmtVND(v)}
        ], phieu.ChiTiet, null)}
        <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Đóng</button></div>
        `, true);
    } catch (e) {
        toast(e.message, 'error');
    }
}

function openImportForm() {
    window._importItems = [{ MaSP: '', SoLuong: 1, GiaVon: 0, ViTri: '' }];
    openModal('Lập phiếu nhập hàng', `
    <div class="form-row">
        <div class="form-group"><label class="form-label">Kho hàng</label><select class="form-control" id="import_MaKho"></select></div>
        <div class="form-group"><label class="form-label">Nhà cung cấp</label><select class="form-control" id="import_MaNCC"></select></div>
    </div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Quản lý</label><select class="form-control" id="import_MaQLy"></select></div>
        <div class="form-group"><label class="form-label">Ngày nhập</label><input class="form-control" type="date" id="import_NgayNhap" /></div>
    </div>
    <div class="card mb-20">
        <div class="card-title">Chi tiết nhập</div>
        <div id="importItemsContainer"></div>
        <button class="btn btn-secondary btn-sm" type="button" onclick="addImportItem()">+ Thêm sản phẩm</button>
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="submitImportForm()">Lưu</button>
    </div>`);
    renderImportFormOptions();
    renderImportItems();
}

function renderImportFormOptions() {
    const warehouseSelect = document.getElementById('import_MaKho');
    const supplierSelect = document.getElementById('import_MaNCC');
    const managerSelect = document.getElementById('import_MaQLy');

    warehouseSelect.innerHTML = `<option value="">Chọn kho hàng</option>${window._importWarehouses.map(w => `<option value="${w.MaKho}">${w.TenKho}</option>`).join('')}`;
    supplierSelect.innerHTML = `<option value="">Chọn nhà cung cấp</option>${window._importSuppliers.map(s => `<option value="${s.MaNCC}">${s.TenNCC}</option>`).join('')}`;
    managerSelect.innerHTML = `<option value="">Chọn quản lý</option>${window._importManagers.map(m => `<option value="${m.MaNV}">${m.HoTen} (${m.MaNV})</option>`).join('')}`;
}

function renderImportItems() {
    const container = document.getElementById('importItemsContainer');
    if (!container) return;
    container.innerHTML = window._importItems.map((item, index) => `
        <div class="card mb-10">
            <div class="form-row">
                <div class="form-group"><label class="form-label">Sản phẩm</label><select class="form-control" onchange="updateImportItem(${index}, 'MaSP', this.value)">${
                    '<option value="">Chọn sản phẩm</option>' + window._importProducts.map(p => `<option value="${p.MaSP}" ${p.MaSP === item.MaSP ? 'selected' : ''}>${p.TenSP} (${p.MaSP})</option>`).join('')
                }</select></div>
                <div class="form-group"><label class="form-label">Số lượng</label><input class="form-control" type="number" min="1" value="${item.SoLuong}" onchange="updateImportItem(${index}, 'SoLuong', this.value)" /></div>
                <div class="form-group"><label class="form-label">Giá vốn</label><input class="form-control" type="number" min="0" step="100" value="${item.GiaVon}" onchange="updateImportItem(${index}, 'GiaVon', this.value)" /></div>
            </div>
            <div class="form-group"><label class="form-label">Vị trí kệ</label><input class="form-control" type="text" value="${item.ViTri || ''}" onchange="updateImportItem(${index}, 'ViTri', this.value)" placeholder="VD: Kệ A - Vị trí 1" /></div>
            <div class="flex justify-end"><button class="btn btn-danger btn-sm" type="button" onclick="removeImportItem(${index})">Xóa</button></div>
        </div>
    `).join('');
}

function addImportItem() {
    window._importItems.push({ MaSP: '', SoLuong: 1, GiaVon: 0, ViTri: '' });
    renderImportItems();
}

function removeImportItem(index) {
    window._importItems.splice(index, 1);
    if (!window._importItems.length) window._importItems = [{ MaSP: '', SoLuong: 1, GiaVon: 0, ViTri: '' }];
    renderImportItems();
}

function updateImportItem(index, field, value) {
    if (!window._importItems[index]) return;
    if (field === 'SoLuong' || field === 'GiaVon') {
        window._importItems[index][field] = Number(value) || 0;
    } else {
        window._importItems[index][field] = value;
    }
}

async function submitImportForm() {
    const data = {
        MaKho: document.getElementById('import_MaKho').value,
        MaNCC: document.getElementById('import_MaNCC').value,
        MaQLy: document.getElementById('import_MaQLy').value,
        NgayNhap: document.getElementById('import_NgayNhap').value,
        ChiTiet: window._importItems.filter(i => i.MaSP).map(i => ({
            MaSP: i.MaSP,
            SoLuong: i.SoLuong,
            GiaVon: i.GiaVon,
            ViTri: i.ViTri || ''
        }))
    };
    if (!data.MaKho || !data.MaNCC || !data.MaQLy) return toast('Chọn kho, nhà cung cấp và quản lý', 'error');
    if (!data.ChiTiet.length) return toast('Thêm ít nhất một sản phẩm', 'error');
    try {
        const res = await apiPost('/imports/', data);
        toast('Tạo phiếu nhập thành công', 'success');
        closeModal();
        loadImports();
    } catch (e) {
        toast(e.message, 'error');
    }
}
