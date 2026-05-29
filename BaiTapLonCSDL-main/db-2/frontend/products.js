async function loadProducts() {
    const ca = document.getElementById('contentArea');
    try {
        const [products, categories] = await Promise.all([
            apiGet('/products/'), apiGet('/products/categories/all')
        ]);
        const catMap = Object.fromEntries(categories.map(c=>[c.MaDM, c.TenDM]));

        ca.innerHTML = `
            <div><h1>Sản phẩm</h1><p>${products.length} sản phẩm</p></div>
            <div class="flex gap-8">
                <button class="btn btn-primary" onclick="showProductForm()">+ Thêm sản phẩm</button>
            </div>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="spSearch" placeholder="Tìm sản phẩm..." oninput="filterProducts()" />
                <select class="form-control" id="spCategory" style="width:160px" onchange="filterProducts()">
                    <option value="">Tất cả mã danh mục</option>
                    ${categories.map(c=>`<option value="${c.MaDM}">${c.MaDM}</option>`).join('')}
                </select>
            </div>
        </div>
        <div id="productList"></div>
        `;
        
        window._products = products;
        window._catMap = catMap;
        window._categories = categories;
        renderProductTable(products);
    } catch(e) {
        ca.innerHTML = `<div class="loading">Lỗi: ${e.message}</div>`;
    }
}

function filterProducts() {
    const q = document.getElementById('spSearch').value.toLowerCase();
    const cat = document.getElementById('spCategory').value;
    const filtered = window._products.filter(p => {
        const matchesText = !q || p.TenSP.toLowerCase().includes(q) || p.MaSP.toLowerCase().includes(q);
        const matchesCat = !cat || p.MaDM === cat;
        return matchesText && matchesCat;
    });
    renderProductTable(filtered);
}

function renderProductTable(products) {
    const el = document.getElementById('productList');
    if (!el) return;
    el.innerHTML = buildTable([
        {key:'MaSP', label:'Mã SP', cls:'td-name'},
        {key:'TenSP', label:'Tên sản phẩm', cls:'td-name'},
        {key:'TenDM', label:'Tên danh mục'},
        {key:'MauSac', label:'Màu sắc'},
        {key:'GiaBan', label:'Giá bán', fmt: v => `<span class="text-gold font-display">${fmtVND(v)}</span>`},
    ], products, row => `
        <div class="flex gap-8">
            <button class="btn btn-outline btn-sm" onclick='editProduct(${JSON.stringify(row)})'>Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${row.MaSP}')">Xóa</button>
        </div>
    `);
}

function showProductForm(p = null) {
    const isEdit = !!p;
    const cats = window._categories || [];
    openModal(isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm', `
    <div class="form-row">
        <div class="form-group">
            <label class="form-label">Mã sản phẩm *</label>
            <input class="form-control" id="f_MaSP" value="${p?.MaSP||''}" ${isEdit?'readonly':''} placeholder="SP001" />
        </div>
        <div class="form-group">
            <label class="form-label">Danh mục sản phẩm *</label>
            <select class="form-control" id="f_MaDM">
                ${cats.map(c=>`<option value="${c.MaDM}" ${p?.MaDM===c.MaDM?'selected':''}>${c.TenDM}</option>`).join('')}
            </select>
        </div>
    </div>
    <div class="form-group">
        <label class="form-label">Tên sản phẩm *</label>
        <input class="form-control" id="f_TenSP" value="${p?.TenSP||''}" placeholder="Áo Thun Basic" />
    </div>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label">Màu sắc *</label>
            <input class="form-control" id="f_MauSac" value="${p?.MauSac||''}" placeholder="Trắng" />
        </div>
        <div class="form-group">
            <label class="form-label">Giá bán (₫) *</label>
            <input class="form-control" type="number" id="f_GiaBan" value="${p?.GiaBan||''}" placeholder="250000" />
        </div>
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveProduct(${isEdit})">Lưu</button>
    </div>
    `);
}

function editProduct(p) { showProductForm(p); }

async function saveProduct(isEdit) {
    const d = {
        MaSP: document.getElementById('f_MaSP').value.trim(),
        TenSP: document.getElementById('f_TenSP').value.trim(),
        MaDM: document.getElementById('f_MaDM').value,
        MauSac: document.getElementById('f_MauSac').value.trim(),
        GiaBan: parseFloat(document.getElementById('f_GiaBan').value),
    };
    if (!d.MaSP||!d.TenSP||!d.MauSac||!d.GiaBan) return toast('Vui lòng điền đầy đủ thông tin','error');
    try {
        if (isEdit) await apiPut(`/products/${d.MaSP}`, d);
        else await apiPost('/products/', d);
        closeModal();
        toast(isEdit ? 'Cập nhật thành công' : 'Thêm sản phẩm thành công', 'success');
        loadProducts();
    } catch(e) { toast(e.message, 'error'); }
}

async function deleteProduct(id) {
    confirmDelete(`Xóa sản phẩm ${id}?`, async () => {
        try { await apiDelete(`/products/${id}`); toast('Đã xóa', 'success'); loadProducts(); }
        catch(e) { toast(e.message, 'error'); }
    });
}

async function deleteStock(id) {
    confirmDelete(`Xóa tồn kho này?`, async () => {
        try {
            await apiDelete(`/products/stock/${id}`);
            toast('Xóa tồn kho thành công', 'success');
            loadProducts();
        } catch(e) {
            toast(e.message, 'error');
        }
    });
}

function showCategoryModal() {
    openModal('Quản lý danh mục', `
    <div class="form-row">
        <div class="form-group">
            <label class="form-label">Mã danh mục</label>
            <input class="form-control" id="dm_MaDM" placeholder="DM005" />
        </div>
        <div class="form-group">
            <label class="form-label">Tên danh mục</label>
            <input class="form-control" id="dm_TenDM" placeholder="Phụ kiện" />
        </div>
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveCategory()">Lưu</button>
    </div>
    `);
}
async function saveCategory() {
    const d = {
        MaDM: document.getElementById('dm_MaDM').value.trim(),
        TenDM: document.getElementById('dm_TenDM').value.trim(),
    };
    if (!d.MaDM||!d.TenDM) return toast('Điền đầy đủ thông tin','error');
    try {
        await apiPost('/products/categories/', d);
        closeModal(); toast('Thêm danh mục thành công','success'); loadProducts();
    } catch(e) { toast(e.message,'error'); }
}