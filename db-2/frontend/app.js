// =====================================================
// LUXE FASHION STORE — MAIN APP CONTROLLER
// =====================================================

const API = '/api';

// ===== ROUTER =====
const routes = {
    dashboard: { title: 'Dashboard', fn: () => loadDashboard() },
    products: { title: 'Sản phẩm', fn: () => loadProducts() },
    warehouse: { title: 'Kho hàng', fn: () => loadWarehouse() },
    customers: { title: 'Khách hàng', fn: () => loadCustomers() },
    managers: { title: 'Quản lý', fn: () => loadManagers() },
    employees: { title: 'Nhân viên', fn: () => loadEmployees() },
    suppliers: { title: 'Nhà cung cấp', fn: () => loadSuppliers() },
    imports: { title: 'Nhập hàng', fn: () => loadImports() },
    pos: { title: 'Lập hóa đơn', fn: () => loadPOS() },
    invoices: { title: 'Hóa đơn', fn: () => loadInvoices() },
    promotions: { title: 'Ưu đãi', fn: () => loadPromotions() },
};

let currentPage = 'dashboard';

function navigate(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === page);
    });
    const route = routes[page];
    document.getElementById('pageTitle').textContent = route.title;
    document.getElementById('contentArea').innerHTML = '<div class="loading"><div class="spinner"></div> Đang tải...</div>';
    route.fn();
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Date display
    const now = new Date();
    document.getElementById('dateDisplay').textContent =
        now.toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    
    // Nav clicks
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            navigate(el.dataset.page);
        });
    });
    
    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    
    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
    
    navigate('dashboard');
});

// ===== API HELPERS =====
async function apiFetch(url, opts = {}) {
    try {
        const res = await fetch(API + url, {
            headers: { 'Content-Type': 'application/json' },
            ...opts
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
        return data;
    } catch (e) {
        throw e;
    }
}

async function apiGet(url) { return apiFetch(url); }
async function apiPost(url, body) { return apiFetch(url, { method:'POST', body:JSON.stringify(body) }); }
async function apiPut(url, body) { return apiFetch(url, { method:'PUT', body:JSON.stringify(body) }); }
async function apiDelete(url) { return apiFetch(url, { method:'DELETE' }); }

// ===== MODAL SYSTEM =====
function openModal(title, bodyHTML, wide = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modal').classList.add('open');
    document.getElementById('modalOverlay').classList.add('open');
    if (wide) document.getElementById('modal').classList.add('modal-wide');
    else document.getElementById('modal').classList.remove('modal-wide');
}
function closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('modalOverlay').classList.remove('open');
}

// ===== TOAST SYSTEM =====
function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ===== FORMATTERS =====
function fmtVND(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
}
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN');
}
function fmtDatetime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN');
}

// ===== TABLE BUILDER =====
function buildTable(cols, rows, actions) {
    if (!rows.length) return `<div class="empty-state"><div class="empty-icon">◈</div><p>Không có dữ liệu</p></div>`;
    const thead = `<thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join('')}${actions?'<th>Thao tác</th>':''}</tr></thead>`;
    const tbody = `<tbody>${rows.map(row => {
        const tds = cols.map(c => {
            let val = row[c.key];
            if (c.fmt) val = c.fmt(val, row);
            return `<td class="${c.cls||''}">${val ?? '—'}</td>`;
        }).join('');
        const acts = actions ? `<td>${actions(row)}</td>` : '';
        return `<tr>${tds}${acts}</tr>`;
    }).join('')}</tbody>`;
    return `<div class="table-wrapper"><table>${thead}${tbody}</table></div>`;
}

// ===== CONFIRM DELETE =====
function confirmDelete(msg, cb) {
    if (confirm(msg)) cb();
}

// ===== RENDER HELPERS =====
function renderStatusBadge(status) {
    const map = {
        'DaThanhToan': ['badge-green', 'Đã TT'],
        'ChuaThanhToan': ['badge-gold', 'Chưa TT'],
        'HuyBo': ['badge-red', 'Hủy'],
        'HoatDong': ['badge-green', 'Hoạt động'],
        'KhongHoatDong': ['badge-muted', 'Tắt'],
        'BienChe': ['badge-gold', 'Biên chế'],
        'HopDong': ['badge-teal', 'Hợp đồng'],
    };
    const [cls, label] = map[status] || ['badge-muted', status || '—'];
    return `<span class="badge ${cls}">${label}</span>`;
}