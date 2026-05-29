async function loadPromotions() {
    const ca = document.getElementById('contentArea');
    try {
        const [promos, active] = await Promise.all([apiGet('/promotions/'), apiGet('/promotions/active')]);
        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Ưu đãi</h1><p>${promos.length} ưu đãi</p></div>
            <button class="btn btn-primary" onclick="openPromotionForm()">+ Thêm ưu đãi</button>
        </div>
        <div class="grid-2 mb-20">
            <div class="card">
                <div class="card-title">Ưu đãi đang hoạt động</div>
                <div>${active.length} ưu đãi</div>
            </div>
            <div class="card">
                <div class="card-title">Tất cả ưu đãi</div>
                <div>${promos.length} ưu đãi</div>
            </div>
        </div>
        <div id="promotionTable"></div>
        `;
        window._promotions = promos;
        renderPromotionTable(promos);
    } catch (e) {
        ca.innerHTML = `<div class="loading">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
}

function renderPromotionTable(rows) {
    document.getElementById('promotionTable').innerHTML = buildTable([
        {key:'MaUD', label:'Mã UD'},
        {key:'TenUD', label:'Tên ưu đãi', cls:'td-name'},
        {key:'DieuKienMin', label:'Điều kiện', fmt: v => fmtVND(v)},
        {key:'GiaTriGiam', label:'Giá trị', fmt: (v,r) => r.IsPercent ? `${v}%` : fmtVND(v)},
        {key:'NgayBatDau', label:'Bắt đầu', fmt: v => fmtDate(v)},
        {key:'NgayKetThuc', label:'Kết thúc', fmt: v => fmtDate(v)},
        {key:'TrangThai', label:'Trạng thái', fmt: v => renderStatusBadge(v)}
    ], rows, row => `
        <div class="flex gap-8">
            <button class="btn btn-outline btn-sm" onclick="openPromotionForm('${row.MaUD}')">Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="deletePromotion('${row.MaUD}')">Xóa</button>
        </div>
    `);
}

function openPromotionForm(key = null) {
    const promo = key ? window._promotions.find(p => p.MaUD === key) : null;
    const isEdit = !!promo;
    openModal(isEdit ? 'Sửa ưu đãi' : 'Thêm ưu đãi', `
    <div class="form-group"><label class="form-label">Tên ưu đãi</label><input class="form-control" id="ud_TenUD" value="${promo?.TenUD||''}" /></div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Điều kiện tối thiểu</label><input class="form-control" type="number" id="ud_DieuKienMin" value="${promo?.DieuKienMin||0}" /></div>
        <div class="form-group"><label class="form-label">Giá trị giảm</label><input class="form-control" type="number" id="ud_GiaTriGiam" value="${promo?.GiaTriGiam||0}" /></div>
    </div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Phần trăm?</label><select class="form-control" id="ud_IsPercent"><option value="0" ${promo?.IsPercent?'':'selected'}>Không</option><option value="1" ${promo?.IsPercent?'selected':''}>Có</option></select></div>
        <div class="form-group"><label class="form-label">Trạng thái</label><select class="form-control" id="ud_TrangThai"><option value="HoatDong" ${promo?.TrangThai==='HoatDong'?'selected':''}>Hoạt động</option><option value="KhongHoatDong" ${promo?.TrangThai==='KhongHoatDong'?'selected':''}>Không hoạt động</option></select></div>
    </div>
    <div class="form-row">
        <div class="form-group"><label class="form-label">Ngày bắt đầu</label><input class="form-control" type="date" id="ud_NgayBatDau" value="${promo?.NgayBatDau||''}" /></div>
        <div class="form-group"><label class="form-label">Ngày kết thúc</label><input class="form-control" type="date" id="ud_NgayKetThuc" value="${promo?.NgayKetThuc||''}" /></div>
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="savePromotion(${isEdit}, '${promo?.MaUD||''}')">Lưu</button>
    </div>`);
}

async function savePromotion(isEdit, id) {
    const d = {
        TenUD: document.getElementById('ud_TenUD').value.trim(),
        DieuKienMin: parseFloat(document.getElementById('ud_DieuKienMin').value) || 0,
        GiaTriGiam: parseFloat(document.getElementById('ud_GiaTriGiam').value) || 0,
        IsPercent: parseInt(document.getElementById('ud_IsPercent').value),
        NgayBatDau: document.getElementById('ud_NgayBatDau').value,
        NgayKetThuc: document.getElementById('ud_NgayKetThuc').value,
        TrangThai: document.getElementById('ud_TrangThai').value,
    };
    if (!d.TenUD || !d.NgayBatDau || !d.NgayKetThuc) return toast('Vui lòng điền đầy đủ thông tin', 'error');
    try {
        if (isEdit) await apiPut(`/promotions/${id}`, d);
        else await apiPost('/promotions/', d);
        closeModal(); toast('Lưu ưu đãi thành công', 'success'); loadPromotions();
    } catch (e) { toast(e.message, 'error'); }
}

async function deletePromotion(id) {
    confirmDelete(`Xóa ưu đãi ${id}?`, async () => {
        try { await apiDelete(`/promotions/${id}`); toast('Đã xóa', 'success'); loadPromotions(); }
        catch (e) { toast(e.message, 'error'); }
    });
}
