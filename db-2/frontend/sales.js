// ===== POS STATE =====
let posCart = [];
let posCustomer = null;
let posProducts = [];
let posPromotions = [];
let posEmployee = null;

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
                        <select class="form-control" id="posPromo" multiple style="height:60px">
                            ${promos.map(p=>`<option value="${p.MaUD}">${p.TenUD} (từ ${fmtVND(p.DieuKienMin)})</option>`).join('')}
                        </select>
                    </div>
                    <div class="summary-row"><span>Tạm tính:</span><span id="sumSubtotal">0₫</span></div>
                    <div class="summary-row"><span>Giảm giá:</span><span id="sumDiscount" style="color:var(--success)">0₫</span></div>
                    <div class="summary-total">
                        <span>Tổng cộng</span>
                        <span id="sumTotal" class="text-gold">0₫</span>
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
        const selected = Array.from(promoEl.selectedOptions).map(o => o.value);
        selected.forEach(maUD => {
            const p = posPromotions.find(x => x.MaUD === maUD);
            if (p && subtotal >= p.DieuKienMin) {
                discount += p.IsPercent ? subtotal * p.GiaTriGiam / 100 : p.GiaTriGiam;
            }
        });
    }
    
    const total = Math.max(0, subtotal - discount);
    const ss = document.getElementById('sumSubtotal');
    const sd = document.getElementById('sumDiscount');
    const st = document.getElementById('sumTotal');
    if (ss) ss.textContent = fmtVND(subtotal);
    if (sd) sd.textContent = '−' + fmtVND(discount);
    if (st) st.textContent = fmtVND(total);
}

async function lookupCustomer() {
    const sdt = document.getElementById('posPhone').value.trim();
    if (!sdt) return toast('Nhập số điện thoại khách hàng','error');
    try {
        const kh = await apiGet(`/customers/phone/${sdt}`);
        posCustomer = kh;
        renderCustomerBox(kh);
    } catch(e) {
        posCustomer = null;
        const box = document.getElementById('posCustomerBox');
        box.innerHTML = `
        <div style="padding:10px 14px;background:rgba(201,120,120,0.08);border:1px solid rgba(201,120,120,0.2);border-radius:4px;margin:0 14px 0">
            <p style="font-size:12px;color:var(--rose);margin-bottom:6px">Không tìm thấy khách hàng với SĐT này</p>
            <button class="btn btn-sm btn-outline" onclick="showNewCustomerForm('${sdt}')">+ Tạo khách hàng mới</button>
        </div>`;
    }
}

function renderCustomerBox(kh) {
    const box = document.getElementById('posCustomerBox');
    if (!box) return;
    box.innerHTML = `
    <div class="customer-info-box" style="margin:0 14px 0">
        <div class="flex-between mb-12">
            <span style="font-weight:500;color:var(--cream)">${kh.HoTen}</span>
            <button class="btn-ghost" onclick="posCustomer=null;document.getElementById('posCustomerBox').innerHTML=''">✕</button>
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
        posCustomer = kh;
        closeModal();
        document.getElementById('posPhone').value = kh.SDT;
        renderCustomerBox({...kh, LichSuDiem: []});
        toast('Tạo khách hàng thành công','success');
    } catch(e) { toast(e.message,'error'); }
}

async function checkoutPOS() {
    if (!posCart.length) return toast('Giỏ hàng trống','error');
    
    const empEl = document.getElementById('posEmp');
    const maNV = empEl ? empEl.value : posEmployee;
    const promoEl = document.getElementById('posPromo');
    const selectedPromos = promoEl ? Array.from(promoEl.selectedOptions).map(o => o.value) : [];
    const method = document.getElementById('posPayMethod').value;
    
    const payload = {
        MaKH: posCustomer?.MaKH || null,
        MaNV: maNV,
        ChiTiet: posCart.map(i => ({MaSP:i.MaSP, SoLuong:i.SoLuong, GiaBan:i.GiaBan})),
        UuDai: selectedPromos,
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