async function loadWarehouse() {
    const ca = document.getElementById('contentArea');
    try {
        const warehouses = await apiGet('/warehouse/');
        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Kho hàng</h1><p>${warehouses.length} kho</p></div>
            <button class="btn btn-primary" onclick="openWarehouseCreate()">+ Thêm kho</button>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="warehouseSearch" placeholder="Tìm kho..." oninput="filterWarehouses()" />
            </div>
        </div>
        <div id="warehouseTable"></div>
        `;
        window._warehouses = warehouses;
        renderWarehouseTable(warehouses);
    } catch (e) {
        ca.innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function filterWarehouses() {
    const q = document.getElementById('warehouseSearch').value.toLowerCase();
    renderWarehouseTable(window._warehouses.filter(k =>
        k.TenKho.toLowerCase().includes(q) || (k.DiaChi||'').toLowerCase().includes(q)
    ));
}

function renderWarehouseTable(rows) {
    document.getElementById('warehouseTable').innerHTML = buildTable([
        {key:'MaKho', label:'Mã kho'},
        {key:'TenKho', label:'Tên kho', cls:'td-name'},
        {key:'DiaChi', label:'Địa chỉ'}
    ], rows, row => `
        <div class="flex gap-8">
            <button class="btn btn-outline btn-sm" onclick="viewWarehouseStock('${row.MaKho}')">Tồn kho</button>
        </div>
    `);
}

async function viewWarehouseStock(id) {
    try {
        const stock = await apiGet(`/warehouse/${id}/stock`);
        openModal(`Tồn kho kho ${id}`, `
        <div class="card">
            ${buildTable([
                {key:'MaSP', label:'Mã SP'},
                {key:'TenSP', label:'Sản phẩm', cls:'td-name'},
                {key:'Size', label:'Size'},
                {key:'MauSac', label:'Màu sắc'},
                {key:'ViTri', label:'Vị trí kệ'},
                {key:'SoLuong', label:'Số lượng'},
            ], stock, null)}
        </div>
        <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Đóng</button></div>
        `, true);
    } catch (e) {
        toast(e.message, 'error');
    }
}

function openWarehouseCreate() {
    openModal('Thêm kho mới', `
    <div class="form-group"><label class="form-label">Mã kho</label><input class="form-control" id="wh_MaKho" /></div>
    <div class="form-group"><label class="form-label">Tên kho</label><input class="form-control" id="wh_TenKho" /></div>
    <div class="form-group"><label class="form-label">Địa chỉ</label><input class="form-control" id="wh_DiaChi" /></div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="createWarehouse()">Lưu</button>
    </div>`);
}

async function createWarehouse() {
    const d = {
        MaKho: document.getElementById('wh_MaKho').value.trim(),
        TenKho: document.getElementById('wh_TenKho').value.trim(),
        DiaChi: document.getElementById('wh_DiaChi').value.trim()
    };
    if (!d.MaKho || !d.TenKho) return toast('Điền đầy đủ thông tin', 'error');
    try {
        await apiPost('/warehouse/', d);
        closeModal(); toast('Thêm kho thành công','success'); loadWarehouse();
    } catch (e) { toast(e.message,'error'); }
}
