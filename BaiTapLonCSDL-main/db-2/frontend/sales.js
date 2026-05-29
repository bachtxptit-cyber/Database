// ===== POS STATE =====
let posCart = [];
let posCustomer = null;
let posProducts = [];
let posPromotions = [];
let posEmployee = null;
let posUsePoints = 0;
const POINT_TO_VND = 1000;

async function loadPOS() {
    const ca = document.getElementById('contentArea');
    try {
        const [prods, promos, emps] = await Promise.all([
            apiGet('/products/'), apiGet('/promotions/active'), apiGet('/employees/')
        ]);
        posProducts = prods;
        posPromotions = promos;
        posCart = [];
        posCustomer = null;
        posUsePoints = 0;

        ca.innerHTML = `
        <div class="page-header">
            <div><h1>Lập hóa đơn</h1></div>
            <div class="flex gap-8">
                <select class="form-control" id="posEmp" style="width:180px">
                    ${emps.map(e=>`<option value="${e.MaNV}" ${e.MaNV===posEmployee?'selected':''}>${e.HoTen}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="pos-layout">
            <!-- LEFT: Products -->
            <div class="pos-products">
                <div class="search-bar">
                    <input class="input-search" id="posSearch" placeholder="Tìm sản phẩm..." oninput="filterPosProducts()" style="flex:1" />
                </div>
                <div class="pos-product-grid" id="posProductGrid"></div>
            </div>

            <!-- RIGHT: Cart -->
            <div class="pos-panel">
                <div class="pos-customer-bar">
                    <input class="form-control" id="posPhone" placeholder="SĐT khách hàng..." style="flex:1" />
                    <button class="btn btn-outline btn-sm" onclick="lookupCustomer()">Tra cứu</button>
                </div>
                <div id="posCustomerBox"></div>
                <div class="pos-cart" id="posCart">
                    <div class="cart-empty">Chọn sản phẩm để thêm vào giỏ hàng</div>
                </div>

                <div class="pos-summary">
                    <div class="form-group" style="margin:0 0 8px">
                        <label class="form-label">Áp dụng ưu đãi</label>
                        <div id="posPromo" style="max-height:120px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;gap:8px;display:flex;flex-direction:column">
                            ${promos.map(p=>`<label style="display:flex;align-items:center;gap:8px;margin:0;cursor:pointer;font-weight:normal;font-size:13px"><input type="checkbox" value="${p.MaUD}" onchange="updateSummary()" /> ${p.TenUD} (từ ${fmtVND(p.DieuKienMin)})</label>`).join('')}
                        </div>
                    </div>
                    <div class="summary-row"><span>Tạm tính:</span><span id="sumSubtotal">0₫</span></div>
                    <div class="summary-row"><span>Giảm giá:</span><span id="sumDiscount" style="color:var(--success)">0₫</span></div>
                    <div class="summary-total">
                        <span>Tổng cộng</span>
                        <span id="sumTotal" class="text-gold">0₫</span>
                    </div>
                    <div class="summary-row"><span>Giảm điểm:</span><span id="sumPoints">0₫</span></div>
                    <div class="form-group" style="margin:8px 0 0">
                        <label class="form-label">Sử dụng điểm tích lũy</label>
                        <div class="form-row" style="gap:8px;align-items:center;flex-wrap:wrap">
                            <input class="form-control" type="number" id="posUsePoints" min="0" value="0" placeholder="0" style="width:120px" disabled />
                            <button class="btn btn-outline btn-sm" id="posUsePointsBtn" onclick="applyCustomerPoints()" disabled>Áp dụng</button>
                        </div>
                        <div class="text-muted" style="font-size:11px;margin-top:6px">
                            1 điểm = ${fmtVND(POINT_TO_VND)}. Chỉ có thể dùng khi đã chọn khách hàng.
                        </div>
                    </div>
                    <div class="form-group" style="margin:8px 0 0">
                        <label class="form-label">Phương thức thanh toán</label>
                        <select class="form-control" id="posPayMethod">
                            <option value="TienMat">Tiền mặt</option>
                            <option value="ChuyenKhoan">Chuyển khoản</option>
                            <option value="ViDienTu">Ví điện tử</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="checkoutPOS()">
                        Thanh toán
                    </button>
                </div>
            </div>
        </div>
        `;
        
        renderPosProducts(prods);
    } catch(e) {
        ca.innerHTML = `<div class="loading">Lỗi: ${e.message}</div>`;
    }
}

function filterPosProducts() {
    const q = document.getElementById('posSearch').value.toLowerCase();
    renderPosProducts(posProducts.filter(p =>
        p.TenSP.toLowerCase().includes(q) || p.MaSP.toLowerCase().includes(q)
    ));
}

function renderPosProducts(list) {
    const grid = document.getElementById('posProductGrid');
    if (!grid) return;
    if (!list.length) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><p>Không tìm thấy</p></div>';
        return;
    }
    grid.innerHTML = list.map(p => `
    <div class="product-tile ${p.TongTon <= 0 ? 'disabled' : ''}" 
         onclick="${p.TongTon > 0 ? `addToCart('${p.MaSP}')` : ''}">
        <div class="pt-name">${p.TenSP}</div>
        <div class="pt-detail">${p.Size} / ${p.MauSac}</div>
        <div class="pt-price">${fmtVND(p.GiaBan)}</div>
        <div class="pt-stock ${p.TongTon <= 5 ? 'text-danger' : ''}">
            Còn: ${p.TongTon}
        </div>
    </div>`).join('');
}

function addToCart(maSP) {
    const sp = posProducts.find(p => p.MaSP === maSP);
    if (!sp || sp.TongTon <= 0) return;
    const existing = posCart.find(i => i.MaSP === maSP);
    if (existing) {
        if (existing.SoLuong >= sp.TongTon) return toast('Không đủ tồn kho','error');
        existing.SoLuong++;
    } else {
        posCart.push({ MaSP: maSP, TenSP: sp.TenSP, Size: sp.Size, MauSac: sp.MauSac,
                       GiaBan: sp.GiaBan, SoLuong: 1, TongTon: sp.TongTon });
    }
    renderCart();
}

function updateQty(maSP, delta) {
    const idx = posCart.findIndex(i => i.MaSP === maSP);
    if (idx === -1) return;
    posCart[idx].SoLuong += delta;
    if (posCart[idx].SoLuong <= 0) posCart.splice(idx, 1);
    renderCart();
}

function removeFromCart(maSP) {
    posCart = posCart.filter(i => i.MaSP !== maSP);
    renderCart();
}

function renderCart() {
    const el = document.getElementById('posCart');
    if (!el) return;
    if (!posCart.length) {
        el.innerHTML = '<div class="cart-empty">Giỏ hàng trống</div>';
        updateSummary();
        return;
    }
    el.innerHTML = posCart.map(item => `
    <div class="cart-item">
        <div class="ci-info">
            <div class="ci-name">${item.TenSP}</div>
            <div class="ci-price">${item.Size} / ${item.MauSac} · ${fmtVND(item.GiaBan)}</div>
        </div>
        <div class="ci-qty">
            <button onclick="updateQty('${item.MaSP}',-1)">−</button>
            <span>${item.SoLuong}</span>
            <button onclick="updateQty('${item.MaSP}',1)">+</button>
        </div>
        <div class="ci-total">${fmtVND(item.GiaBan * item.SoLuong)}</div>
        <button class="ci-remove" onclick="removeFromCart('${item.MaSP}')">✕</button>
    </div>`).join('');
    updateSummary();
}

function updateSummary() {
    const subtotal = posCart.reduce((s, i) => s + i.GiaBan * i.SoLuong, 0);
    let discount = 0;
    
    const promoEl = document.getElementById('posPromo');
    if (promoEl) {
        const selected = Array.from(promoEl.querySelectorAll('input[type="checkbox"]:checked')).map(o => o.value);
        selected.forEach(maUD => {
            const p = posPromotions.find(x => x.MaUD === maUD);
            if (p && subtotal >= p.DieuKienMin) {
                discount += p.IsPercent ? subtotal * p.GiaTriGiam / 100 : p.GiaTriGiam;
            }
        });
    }
    
    const pointsInput = document.getElementById('posUsePoints');
    const pointsBtn = document.getElementById('posUsePointsBtn');
    const maxPoints = posCustomer ? Math.min(posCustomer.DiemTichLuy, Math.floor(Math.max(0, subtotal - discount) / POINT_TO_VND)) : 0;
    if (posUsePoints > maxPoints) {
        posUsePoints = maxPoints;
        if (pointsInput) pointsInput.value = posUsePoints;
    }
    const pointsDiscount = posUsePoints * POINT_TO_VND;
    const total = Math.max(0, subtotal - discount - pointsDiscount);

    const ss = document.getElementById('sumSubtotal');
    const sd = document.getElementById('sumDiscount');
    const sp = document.getElementById('sumPoints');
    const st = document.getElementById('sumTotal');
    if (ss) ss.textContent = fmtVND(subtotal);
    if (sd) sd.textContent = '−' + fmtVND(discount);
    if (sp) sp.textContent = '−' + fmtVND(pointsDiscount);
    if (st) st.textContent = fmtVND(total);
    if (pointsInput) {
        pointsInput.max = maxPoints;
        pointsInput.disabled = !posCustomer;
    }
    if (pointsBtn) pointsBtn.disabled = !posCustomer;
}

function getCurrentPromoDiscount(subtotal) {
    let discount = 0;
    const promoEl = document.getElementById('posPromo');
    if (promoEl) {
        const selected = Array.from(promoEl.querySelectorAll('input[type="checkbox"]:checked')).map(o => o.value);
        selected.forEach(maUD => {
            const p = posPromotions.find(x => x.MaUD === maUD);
            if (p && subtotal >= p.DieuKienMin) {
                discount += p.IsPercent ? subtotal * p.GiaTriGiam / 100 : p.GiaTriGiam;
            }
        });
    }
    return discount;
}

function applyCustomerPoints() {
    if (!posCustomer) return toast('Chưa có khách hàng để sử dụng điểm','error');
    const pointsInput = document.getElementById('posUsePoints');
    if (!pointsInput) return;
    let value = parseInt(pointsInput.value, 10) || 0;
    if (value < 0) value = 0;
    const subtotal = posCart.reduce((s, i) => s + i.GiaBan * i.SoLuong, 0);
    const discount = getCurrentPromoDiscount(subtotal);
    const maxPoints = Math.min(posCustomer.DiemTichLuy, Math.floor(Math.max(0, subtotal - discount) / POINT_TO_VND));
    if (value > maxPoints) {
        value = maxPoints;
        pointsInput.value = value;
        toast(`Tối đa được dùng ${value} điểm cho đơn này`, 'error');
    }
    posUsePoints = value;
    updateSummary();
    toast(`Áp dụng ${posUsePoints} điểm`, 'success');
}

async function lookupCustomer() {
    const sdt = document.getElementById('posPhone').value.trim();
    if (!sdt) return toast('Nhập số điện thoại khách hàng','error');
    try {
        const kh = await apiGet(`/customers/phone/${sdt}`);
        posCustomer = kh;
        renderCustomerBox(kh);
        updateSummary();
    } catch(e) {
        posCustomer = null;
        posUsePoints = 0;
        const box = document.getElementById('posCustomerBox');
        box.innerHTML = `
        <div style="padding:10px 14px;background:rgba(201,120,120,0.08);border:1px solid rgba(201,120,120,0.2);border-radius:4px;margin:0 14px 0">
            <p style="font-size:12px;color:var(--rose);margin-bottom:6px">Không tìm thấy khách hàng với SĐT này</p>
            <button class="btn btn-sm btn-outline" onclick="showNewCustomerForm('${sdt}')">+ Tạo khách hàng mới</button>
        </div>`;
        updateSummary();
    }
}

function renderCustomerBox(kh) {
    const box = document.getElementById('posCustomerBox');
    if (!box) return;
    box.innerHTML = `
    <div class="customer-info-box" style="margin:0 14px 0">
        <div class="flex-between mb-12">
            <span style="font-weight:500;color:var(--cream)">${kh.HoTen}</span>
            <button class="btn-ghost" onclick="posCustomer=null;posUsePoints=0;document.getElementById('posCustomerBox').innerHTML='';updateSummary()">✕</button>
        </div>
        <div style="font-size:11px;color:var(--muted)">${kh.SDT}</div>
        <div style="margin-top:6px;font-size:12px">
            Điểm tích lũy: <span class="text-gold font-display">${kh.DiemTichLuy}</span>
        </div>
        ${kh.LichSuDiem?.length ? `
        <div style="margin-top:8px;font-size:11px;color:var(--muted)">
            Lần mua gần nhất: ${fmtDate(kh.LichSuDiem[0]?.NgayCapNhat)}
        </div>` : ''}
    </div>`;
}

function showNewCustomerForm(sdt = '') {
    openModal('Tạo khách hàng mới', `
    <div class="form-group">
        <label class="form-label">Họ tên *</label>
        <input class="form-control" id="nc_HoTen" placeholder="Nguyễn Văn A" />
    </div>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label">Số điện thoại *</label>
            <input class="form-control" id="nc_SDT" value="${sdt}" placeholder="09xxxxxxxx" />
        </div>
        <div class="form-group">
            <label class="form-label">Ngày sinh</label>
            <input class="form-control" type="date" id="nc_NgaySinh" />
        </div>
    </div>
    <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="createNewCustomerPOS()">Tạo & Áp dụng</button>
    </div>
    `);
}

async function createNewCustomerPOS() {
    const d = {
        HoTen: document.getElementById('nc_HoTen').value.trim(),
        SDT: document.getElementById('nc_SDT').value.trim(),
        NgaySinh: document.getElementById('nc_NgaySinh').value,
    };
    if (!d.HoTen || !d.SDT) return toast('Điền đầy đủ thông tin','error');
    try {
        const kh = await apiPost('/customers/', d);
        posCustomer = kh;        posUsePoints = 0;        closeModal();
        document.getElementById('posPhone').value = kh.SDT;
        renderCustomerBox({...kh, LichSuDiem: []});
        updateSummary();
        toast('Tạo khách hàng thành công','success');
    } catch(e) { toast(e.message,'error'); }
}

async function checkoutPOS() {
    if (!posCart.length) return toast('Giỏ hàng trống','error');
    
    const pointsInput = document.getElementById('posUsePoints');
    if (pointsInput) {
        posUsePoints = Math.max(0, parseInt(pointsInput.value, 10) || 0);
    }
    updateSummary();

    const empEl = document.getElementById('posEmp');
    const maNV = empEl ? empEl.value : posEmployee;
    const promoEl = document.getElementById('posPromo');
    const selectedPromos = promoEl ? Array.from(promoEl.querySelectorAll('input[type="checkbox"]:checked')).map(o => o.value) : [];
    const method = document.getElementById('posPayMethod').value;
    
    const payload = {
        MaKH: posCustomer?.MaKH || null,
        MaNV: maNV,
        ChiTiet: posCart.map(i => ({MaSP:i.MaSP, SoLuong:i.SoLuong, GiaBan:i.GiaBan})),
        UuDai: selectedPromos,
        DiemSuDung: posUsePoints,
    };
    
    try {
        const hd = await apiPost('/sales/', payload);
        // Create payment
        await apiPost('/payments/', { MaHD: hd.MaHD, PhuongThuc: method });
        
        toast(`✓ Thanh toán thành công! HD: ${hd.MaHD}`, 'success');
        showInvoiceSuccess(hd);
        
        // Reset cart
        posCart = [];
        posCustomer = null;
        posUsePoints = 0;
        renderCart();
        const box = document.getElementById('posCustomerBox');
        if (box) box.innerHTML = '';
        if (document.getElementById('posPhone')) document.getElementById('posPhone').value = '';
        
        // Reload products to update stock
        const prods = await apiGet('/products/');
        posProducts = prods;
        filterPosProducts();
        
    } catch(e) { toast(e.message, 'error'); }
}

function showInvoiceSuccess(hd) {
    openModal('Thanh toán thành công ✓', `
    <div style="text-align:center;padding:20px 0">
        <div style="font-size:48px;margin-bottom:12px">✓</div>
        <div style="font-family:var(--font-display);font-size:24px;color:var(--cream);margin-bottom:8px">
            Hóa đơn ${hd.MaHD}
        </div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:16px">Thanh toán thành công</div>
        <div style="font-family:var(--font-display);font-size:32px;color:var(--gold)">
            ${fmtVND(hd.TongSauGiam)}
        </div>
    </div>
    <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeModal()">Đóng</button>
    </div>
    `);
}