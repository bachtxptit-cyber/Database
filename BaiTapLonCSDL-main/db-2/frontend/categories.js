async function loadCategories() {
    const ca = document.getElementById('contentArea');
    try {
        const categories = await apiGet('/products/categories/all');
        window._categories = categories;

        ca.innerHTML = `
        <div class="page-header">
            <div>
                <h1>Danh mục</h1>
                <p>${categories.length} danh mục</p>
            </div>
            <div class="flex gap-8">
                <button class="btn btn-primary" onclick="showCategoryForm()">+ Thêm danh mục</button>
            </div>
        </div>
        <div class="card mb-20">
            <div class="search-bar">
                <input class="input-search" id="catSearch" placeholder="Tìm mã danh mục hoặc tên..." oninput="filterCategories()" />
            </div>
        </div>
        <div id="categoryList"></div>
        `;

        renderCategoryList(categories);
    } catch (e) {
        ca.innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function filterCategories() {
    const q = document.getElementById('catSearch').value.toLowerCase();
    const filtered = (window._categories || []).filter(cat =>
        !q ||
        cat.MaDM.toLowerCase().includes(q) ||
        (cat.TenDM || '').toLowerCase().includes(q)
    );
    renderCategoryList(filtered);
}

function renderCategoryList(categories) {
    document.getElementById('categoryList').innerHTML = buildTable([
        { key: 'MaDM', label: 'Mã danh mục' },
        { key: 'TenDM', label: 'Tên danh mục' }
    ], categories, cat => `
        <div class="flex gap-8">
            <button type="button" class="btn btn-outline btn-sm" onclick="showCategoryForm('${cat.MaDM}')">Sửa</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteCategory('${cat.MaDM}')">Xóa</button>
        </div>
    `);
}

function showCategoryForm(maDM = '') {
    const category = (window._categories || []).find(c => c.MaDM === maDM) || {};
    openModal(maDM ? `Sửa danh mục ${maDM}` : 'Thêm danh mục mới', `
    <div class="form-group">
        <label class="form-label">Mã danh mục *</label>
        <input class="form-control" id="cat_MaDM" value="${category.MaDM || ''}" ${maDM ? 'readonly' : ''} placeholder="DM001" />
    </div>
    <div class="form-group">
        <label class="form-label">Tên danh mục *</label>
        <input class="form-control" id="cat_TenDM" value="${category.TenDM || ''}" placeholder="Áo" />
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveCategory('${maDM}')">Lưu</button>
    </div>
    `, true);
}

async function saveCategory(maDM = '') {
    const data = {
        MaDM: document.getElementById('cat_MaDM').value.trim(),
        TenDM: document.getElementById('cat_TenDM').value.trim()
    };
    if (!data.MaDM || !data.TenDM) return toast('Vui lòng điền đầy đủ thông tin', 'error');

    try {
        if (maDM) {
            await apiPut(`/products/categories/${maDM}`, data);
            toast('Cập nhật danh mục thành công', 'success');
        } else {
            await apiPost('/products/categories/', data);
            toast('Thêm danh mục thành công', 'success');
        }
        closeModal();
        loadCategories();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteCategory(maDM) {
    confirmDelete(`Xóa danh mục ${maDM}?`, async () => {
        try {
            await apiDelete(`/products/categories/${maDM}`);
            toast('Xóa danh mục thành công', 'success');
            loadCategories();
        } catch (e) {
            toast(e.message, 'error');
        }
    });
}
