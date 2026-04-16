/* ===================== */
/* TikiTaka - Institutions */
/* ===================== */

let currentInst = null;
let currentRole = 'admin';
let cart = [];
let appliedCoupon = null;

const instTypeLabels = {
    'school': 'בית ספר',
    'kindergarten': 'גן ילדים',
    'office': 'משרד',
    'synagogue': 'בית כנסת',
    'community': 'מרכז קהילתי',
    'other': 'אחר'
};

const roleLabels = {
    'admin': 'מנהל מערכת',
    'accountant': 'הנהלת חשבונות',
    'signer1': 'מורשה חתימה 1',
    'signer2': 'מורשה חתימה 2',
    'dept_auth': 'מורשה אגפים'
};

const roleIcons = {
    'admin': 'fa-user-shield',
    'accountant': 'fa-calculator',
    'signer1': 'fa-signature',
    'signer2': 'fa-file-signature',
    'dept_auth': 'fa-sitemap'
};

// Toggle mobile menu
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// Show login/register
function showInstRegister() {
    document.getElementById('instLogin').style.display = 'none';
    document.getElementById('instRegister').style.display = 'flex';
}

function showInstLogin() {
    document.getElementById('instLogin').style.display = 'flex';
    document.getElementById('instRegister').style.display = 'none';
}

// Login
function instLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('instPhone').value.trim();
    const role = document.getElementById('instRole').value;
    const institutions = DB.get('institutions');
    const inst = institutions.find(i => i.phone === phone);

    if (inst) {
        currentInst = inst;
        currentRole = role;
        showInstDashboard();
    } else {
        alert('מוסד לא נמצא. בדוק את מספר הטלפון או הרשם כמוסד חדש.');
    }
}

// Register
function registerInst(e) {
    e.preventDefault();

    const inst = {
        id: 'inst' + Date.now(),
        name: document.getElementById('regInstName').value,
        type: document.getElementById('regInstType').value,
        contact: document.getElementById('regInstContact').value,
        phone: document.getElementById('regInstPhone').value,
        email: document.getElementById('regInstEmail').value || '',
        address: document.getElementById('regInstAddress').value,
        createdAt: new Date().toISOString(),
        users: [{
            name: document.getElementById('regInstContact').value,
            role: 'admin',
            phone: document.getElementById('regInstPhone').value,
            email: document.getElementById('regInstEmail').value || ''
        }],
        procurement: [],
        budget: []
    };

    DB.add('institutions', inst);
    currentInst = inst;
    currentRole = 'admin';
    alert('נרשמתם בהצלחה! ברוכים הבאים ל-TikiTaka');
    showInstDashboard();
}

// Show Dashboard
function showInstDashboard() {
    document.getElementById('instLogin').style.display = 'none';
    document.getElementById('instRegister').style.display = 'none';
    document.getElementById('instDashboard').style.display = 'block';
    document.getElementById('instName').textContent = currentInst.name;

    // Set role badge
    const badge = document.getElementById('roleBadge');
    badge.textContent = roleLabels[currentRole];
    badge.className = `role-badge role-${currentRole}`;

    // Show/hide tabs based on role
    applyRolePermissions();

    cart = [];
    updateCartCount();
    loadCatalog();
    loadInstOrders();
    loadInstProfile();
    populateSupplierFilter();
    loadProcurement();
    loadBudget();
    loadApprovals();
    loadUsers();
}

// Role permissions
function applyRolePermissions() {
    const usersTab = document.getElementById('tabBtnUsers');
    const budgetTab = document.getElementById('tabBtnBudget');
    const procTab = document.getElementById('tabBtnProcurement');
    const approvalsTab = document.getElementById('tabBtnApprovals');

    // All roles see procurement and approvals
    procTab.style.display = '';
    approvalsTab.style.display = '';

    // Only admin sees users management
    usersTab.style.display = (currentRole === 'admin') ? '' : 'none';

    // Admin and accountant see budget
    budgetTab.style.display = (currentRole === 'admin' || currentRole === 'accountant') ? '' : 'none';
}

// Logout
function instLogout() {
    currentInst = null;
    currentRole = 'admin';
    cart = [];
    document.getElementById('instDashboard').style.display = 'none';
    document.getElementById('instLogin').style.display = 'flex';
}

// Show tab
function showInstTab(tab) {
    document.querySelectorAll('.sup-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sup-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`instTab-${tab}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tab === 'cart') renderCart();
    if (tab === 'myorders') loadInstOrders();
    if (tab === 'procurement') loadProcurement();
    if (tab === 'budget') loadBudget();
    if (tab === 'approvals') loadApprovals();
    if (tab === 'users') loadUsers();
}

// Populate supplier filter
function populateSupplierFilter() {
    const suppliers = DB.get('suppliers').filter(s => s.isActive);
    const select = document.getElementById('supplierFilter');
    select.innerHTML = '<option value="all">כל הספקים</option>' +
        suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

// Load Catalog
function loadCatalog() {
    const suppliers = DB.get('suppliers').filter(s => s.isActive);
    const filterSupplier = document.getElementById('supplierFilter').value;
    const searchText = document.getElementById('catalogSearch').value.trim().toLowerCase();
    const container = document.getElementById('catalogGrid');

    const filtered = filterSupplier === 'all' ? suppliers : suppliers.filter(s => s.id === filterSupplier);

    let html = '';

    filtered.forEach(supplier => {
        const menu = getSupplierProducts(supplier.id).filter(matchesCurrentDaypart).filter(item => {
            if (!searchText) return true;
            return item.name.toLowerCase().includes(searchText) ||
                   (item.description && item.description.toLowerCase().includes(searchText));
        });

        if (menu.length === 0 && searchText) return;

        html += `
            <div class="catalog-supplier">
                <i class="fas fa-store"></i>
                <div>
                    <h3>${supplier.name}</h3>
                    <p>${supplier.description || ''}</p>
                </div>
            </div>
        `;

        menu.forEach((item, idx) => {
            const cartItem = cart.find(c => c.supplierId === supplier.id && c.itemIndex === idx);
            const qty = cartItem ? cartItem.qty : 0;

            html += `
                <div class="product-card">
                    <div>
                        <div class="product-name">${item.name}</div>
                        <div class="product-desc">${item.description || ''}</div>
                        <div class="product-supplier-name"><i class="fas fa-store"></i> ${supplier.name}</div>
                    </div>
                    <div class="product-bottom">
                        <div class="product-price">₪${item.price}</div>
                        ${qty > 0 ? `
                            <div class="add-to-cart-btn">
                                <button class="qty-btn" onclick="updateQty('${supplier.id}', ${idx}, -1)">-</button>
                                <span class="qty-display">${qty}</span>
                                <button class="qty-btn" onclick="updateQty('${supplier.id}', ${idx}, 1)">+</button>
                            </div>
                        ` : `
                            <button class="add-cart-btn" onclick="addToCart('${supplier.id}', ${idx})">
                                <i class="fas fa-plus"></i> הוסף
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
    });

    // Add products from catalog (for institutions)
    const products = DB.get('products').filter(p => p.forInstitutions);
    const filteredProducts = products.filter(p => {
        if (!searchText) return true;
        return p.name.toLowerCase().includes(searchText) || (p.description && p.description.toLowerCase().includes(searchText));
    });

    if (filteredProducts.length > 0 && filterSupplier === 'all') {
        html += `
            <div class="catalog-supplier" style="background:linear-gradient(135deg, #7C3AED, #8B5CF6);">
                <i class="fas fa-boxes"></i>
                <div>
                    <h3>קטלוג מוצרים כללי</h3>
                    <p>מוצרים זמינים למוסדות</p>
                </div>
            </div>
        `;

        filteredProducts.forEach((p, idx) => {
            const cartItem = cart.find(c => c.supplierId === 'catalog' && c.itemIndex === idx);
            const qty = cartItem ? cartItem.qty : 0;

            html += `
                <div class="product-card">
                    <div>
                        ${p.image ? '<img src="' + p.image + '" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;">' : ''}
                        <div class="product-name">${p.name}</div>
                        <div class="product-desc">${p.description || ''}</div>
                        <div class="product-supplier-name"><i class="fas fa-boxes"></i> ${p.supplier || 'קטלוג כללי'} ${p.location ? '| <i class="fas fa-map-marker-alt"></i> ' + p.location : ''}</div>
                    </div>
                    <div class="product-bottom">
                        <div class="product-price">₪${p.price}</div>
                        ${qty > 0 ? `
                            <div class="add-to-cart-btn">
                                <button class="qty-btn" onclick="updateQty('catalog', ${idx}, -1)">-</button>
                                <span class="qty-display">${qty}</span>
                                <button class="qty-btn" onclick="updateQty('catalog', ${idx}, 1)">+</button>
                            </div>
                        ` : `
                            <button class="add-cart-btn" onclick="addCatalogToCart(${idx})">
                                <i class="fas fa-plus"></i> הוסף
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
    }

    if (!html) {
        html = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray);"><i class="fas fa-search" style="font-size:48px;display:block;margin-bottom:12px;"></i><p>לא נמצאו מוצרים</p></div>';
    }

    container.innerHTML = html;
}

// Add from catalog products
function addCatalogToCart(idx) {
    const products = DB.get('products').filter(p => p.forInstitutions);
    const p = products[idx];
    if (!p) return;

    cart.push({
        supplierId: 'catalog',
        supplierName: p.supplier || 'קטלוג כללי',
        itemIndex: idx,
        name: p.name,
        price: p.price,
        qty: 1
    });

    updateCartCount();
    loadCatalog();
}

// Cart functions
function addToCart(supplierId, itemIndex) {
    const suppliers = DB.get('suppliers');
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    const menu = getSupplierProducts(supplierId);
    if (!menu[itemIndex]) return;

    const item = menu[itemIndex];
    cart.push({
        supplierId,
        supplierName: supplier.name,
        itemIndex,
        name: item.name,
        price: item.price,
        qty: 1
    });

    updateCartCount();
    loadCatalog();
}

function updateQty(supplierId, itemIndex, delta) {
    const idx = cart.findIndex(c => c.supplierId === supplierId && c.itemIndex === itemIndex);
    if (idx === -1) return;

    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
    }

    updateCartCount();
    loadCatalog();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    renderCart();
    loadCatalog();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').textContent = count;
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');

    if (cart.length === 0) {
        container.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-cart"></i><p>הסל ריק. הוסף מוצרים מהקטלוג!</p></div>';
        summary.style.display = 'none';
        return;
    }

    container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${item.supplierName}</p>
            </div>
            <div class="cart-item-actions">
                <div class="add-to-cart-btn">
                    <button class="qty-btn" onclick="cartUpdateQty(${i}, -1)">-</button>
                    <span class="qty-display">${item.qty}</span>
                    <button class="qty-btn" onclick="cartUpdateQty(${i}, 1)">+</button>
                </div>
                <span class="cart-item-price">₪${item.price * item.qty}</span>
                <button class="delete-btn" onclick="removeFromCart(${i})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let total = subtotal;
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') {
            discount = subtotal * appliedCoupon.value / 100;
        } else {
            discount = appliedCoupon.value;
        }
        total = Math.max(0, subtotal - discount);
    }
    document.getElementById('cartTotal').innerHTML = discount > 0
        ? `<span style="text-decoration:line-through;color:#999;font-size:14px;">₪${subtotal}</span> ₪${total.toFixed(0)} <span style="color:#28a745;font-size:13px;">(-₪${discount.toFixed(0)})</span>`
        : `₪${total}`;
    summary.style.display = 'block';
}

function applyCoupon() {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const msg = document.getElementById('couponMsg');
    if (!code) { msg.textContent = ''; appliedCoupon = null; renderCart(); return; }
    const coupons = DB.get('coupons');
    const c = coupons.find(c => c.code === code);
    if (!c) { msg.innerHTML = '<span style="color:#dc3545;">קופון לא נמצא</span>'; return; }
    if (c.usesLeft <= 0) { msg.innerHTML = '<span style="color:#dc3545;">קופון מוצה</span>'; return; }
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) { msg.innerHTML = '<span style="color:#dc3545;">קופון פג תוקף</span>'; return; }
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    if (c.minOrder && subtotal < c.minOrder) {
        msg.innerHTML = `<span style="color:#dc3545;">מינימום להזמנה: ₪${c.minOrder}</span>`;
        return;
    }
    appliedCoupon = c;
    msg.innerHTML = `<span style="color:#28a745;">✓ קופון ${c.code} הוחל</span>`;
    renderCart();
}

function cartUpdateQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartCount();
    renderCart();
}

// Submit order
function submitInstOrder() {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const order = {
        id: 'TK-' + Date.now().toString().slice(-6),
        customerName: currentInst.name,
        customerPhone: currentInst.phone,
        customerEmail: currentInst.email || '',
        category: 'food',
        pickupAddress: cart[0].supplierName,
        deliveryAddress: currentInst.address,
        notes: document.getElementById('cartNotes').value || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        isInstitution: true,
        institutionId: currentInst.id,
        items: cart.map(c => ({
            name: c.name,
            qty: c.qty,
            price: c.price,
            supplier: c.supplierName,
            supplierId: c.supplierId
        })),
        totalPrice: total,
        couponCode: appliedCoupon ? appliedCoupon.code : null
    };

    if (appliedCoupon) {
        const coupons = DB.get('coupons');
        const ci = coupons.findIndex(c => c.code === appliedCoupon.code);
        if (ci !== -1) {
            coupons[ci].usesLeft = Math.max(0, coupons[ci].usesLeft - 1);
            DB.set('coupons', coupons);
        }
        appliedCoupon = null;
    }

    DB.add('orders', order);

    document.getElementById('instOrderNumber').textContent = order.id;
    document.getElementById('instOrderModal').classList.add('open');

    cart = [];
    updateCartCount();
    document.getElementById('cartNotes').value = '';
}

function closeInstModal() {
    document.getElementById('instOrderModal').classList.remove('open');
    loadCatalog();
}

// Load institution orders
function loadInstOrders() {
    const orders = DB.get('orders').filter(o => o.institutionId === currentInst.id);
    const container = document.getElementById('instOrders');

    const statusLabels = {
        'pending': 'ממתין', 'confirmed': 'אושר', 'picked_up': 'נאסף',
        'on_the_way': 'בדרך', 'delivered': 'נמסר', 'cancelled': 'בוטל'
    };

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">אין הזמנות עדיין</p>';
        return;
    }

    container.innerHTML = orders.reverse().map(o => `
        <div class="sup-order-card">
            <div class="sup-order-info">
                <strong>${o.id}</strong>
                <p>${new Date(o.createdAt).toLocaleDateString('he-IL')} | ${o.items ? o.items.length + ' פריטים' : ''} | ₪${o.totalPrice || 0}</p>
            </div>
            <span class="status-badge status-${o.status}">${statusLabels[o.status]}</span>
        </div>
    `).join('');
}

/* ===================== */
/* Procurement (רכש)     */
/* ===================== */

const procStatusLabels = {
    'pending': 'ממתין לאישור',
    'approved1': 'אושר ע"י מורשה 1',
    'approved2': 'אושר ע"י מורשה 2',
    'completed': 'הושלם',
    'rejected': 'נדחה'
};

const urgencyLabels = {
    'normal': 'רגיל',
    'urgent': 'דחוף',
    'critical': 'קריטי'
};

function showAddProcurement() {
    document.getElementById('addProcForm').style.display = 'block';
}

function hideProcForm() {
    document.getElementById('addProcForm').style.display = 'none';
}

function addProcurement() {
    const item = document.getElementById('procItem').value.trim();
    const supplier = document.getElementById('procSupplier').value.trim();
    const qty = parseInt(document.getElementById('procQty').value) || 0;
    const price = parseFloat(document.getElementById('procPrice').value) || 0;
    const dept = document.getElementById('procDept').value.trim();
    const urgency = document.getElementById('procUrgency').value;
    const notes = document.getElementById('procNotes').value.trim();

    if (!item || !qty || !price) {
        alert('נא למלא תיאור, כמות ומחיר');
        return;
    }

    if (!currentInst.procurement) currentInst.procurement = [];

    currentInst.procurement.push({
        id: 'PR-' + Date.now().toString().slice(-6),
        item,
        supplier,
        qty,
        price,
        total: qty * price,
        dept,
        urgency,
        notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: roleLabels[currentRole]
    });

    saveInst();
    loadProcurement();
    hideProcForm();

    // Clear form
    ['procItem', 'procSupplier', 'procQty', 'procPrice', 'procDept', 'procNotes'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

function loadProcurement() {
    const procs = currentInst.procurement || [];
    const tbody = document.getElementById('procTableBody');

    if (procs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--gray);padding:30px;">אין בקשות רכש</td></tr>';
        document.getElementById('procSummary').innerHTML = '';
        return;
    }

    tbody.innerHTML = procs.map((p, i) => `
        <tr>
            <td><strong>${p.id}</strong></td>
            <td>${p.item}</td>
            <td>${p.supplier || '-'}</td>
            <td>${p.qty}</td>
            <td>₪${p.price}</td>
            <td><strong>₪${p.total}</strong></td>
            <td>${p.dept || '-'}</td>
            <td><span class="urgency-badge urgency-${p.urgency}">${urgencyLabels[p.urgency]}</span></td>
            <td><span class="proc-status-badge proc-${p.status}">${procStatusLabels[p.status]}</span></td>
            <td>${getProcActions(p, i)}</td>
        </tr>
    `).join('');

    // Summary
    const totalAmount = procs.reduce((s, p) => s + p.total, 0);
    const pending = procs.filter(p => p.status === 'pending').length;
    const approved = procs.filter(p => p.status === 'completed').length;

    document.getElementById('procSummary').innerHTML = `
        <div class="proc-stat"><span class="proc-val">${procs.length}</span><span class="proc-label">סה"כ בקשות</span></div>
        <div class="proc-stat"><span class="proc-val">${pending}</span><span class="proc-label">ממתינות</span></div>
        <div class="proc-stat"><span class="proc-val">${approved}</span><span class="proc-label">הושלמו</span></div>
        <div class="proc-stat"><span class="proc-val">₪${totalAmount.toLocaleString()}</span><span class="proc-label">סה"כ סכום</span></div>
    `;
}

function getProcActions(proc, index) {
    if (proc.status === 'rejected' || proc.status === 'completed') return '-';

    const actions = [];

    if (proc.status === 'pending' && (currentRole === 'signer1' || currentRole === 'admin')) {
        actions.push(`<button class="action-btn approve" onclick="approveProcurement(${index},'approved1')">אשר</button>`);
        actions.push(`<button class="action-btn cancel" onclick="approveProcurement(${index},'rejected')">דחה</button>`);
    }
    if (proc.status === 'approved1' && (currentRole === 'signer2' || currentRole === 'admin')) {
        actions.push(`<button class="action-btn approve" onclick="approveProcurement(${index},'approved2')">אשר סופי</button>`);
        actions.push(`<button class="action-btn cancel" onclick="approveProcurement(${index},'rejected')">דחה</button>`);
    }
    if (proc.status === 'approved2' && (currentRole === 'admin' || currentRole === 'accountant')) {
        actions.push(`<button class="action-btn progress" onclick="approveProcurement(${index},'completed')">הושלם</button>`);
    }

    return actions.join('') || '<span style="color:var(--gray);font-size:12px;">ממתין</span>';
}

function approveProcurement(index, newStatus) {
    currentInst.procurement[index].status = newStatus;
    currentInst.procurement[index].approvedBy = roleLabels[currentRole];
    currentInst.procurement[index].approvedAt = new Date().toISOString();
    saveInst();
    loadProcurement();
    loadApprovals();
}

function deleteProcurement(index) {
    if (confirm('למחוק בקשת רכש זו?')) {
        currentInst.procurement.splice(index, 1);
        saveInst();
        loadProcurement();
    }
}

/* ===================== */
/* Budget (תקציב)        */
/* ===================== */

function showAddBudget() {
    document.getElementById('addBudgetForm').style.display = 'block';
}

function hideBudgetForm() {
    document.getElementById('addBudgetForm').style.display = 'none';
}

function addBudgetItem() {
    const name = document.getElementById('budgetName').value.trim();
    const amount = parseFloat(document.getElementById('budgetAmount').value) || 0;
    const dept = document.getElementById('budgetDept').value.trim();
    const year = document.getElementById('budgetYear').value;

    if (!name || !amount) {
        alert('נא למלא שם סעיף ותקציב');
        return;
    }

    if (!currentInst.budget) currentInst.budget = [];

    currentInst.budget.push({
        id: 'BG-' + Date.now().toString().slice(-6),
        name,
        amount,
        used: 0,
        dept,
        year
    });

    saveInst();
    loadBudget();
    hideBudgetForm();
    document.getElementById('budgetName').value = '';
    document.getElementById('budgetAmount').value = '';
    document.getElementById('budgetDept').value = '';
}

function loadBudget() {
    const budgets = currentInst.budget || [];
    const tbody = document.getElementById('budgetTableBody');

    if (budgets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray);padding:30px;">אין סעיפי תקציב</td></tr>';
        document.getElementById('budgetTotalBar').style.display = 'none';
        return;
    }

    // Calculate used from completed procurement
    const procs = (currentInst.procurement || []).filter(p => p.status === 'completed');
    budgets.forEach(b => {
        b.used = procs.filter(p => p.dept === b.dept).reduce((s, p) => s + p.total, 0);
    });

    tbody.innerHTML = budgets.map((b, i) => {
        const remaining = b.amount - b.used;
        const pct = b.amount > 0 ? Math.round((b.used / b.amount) * 100) : 0;
        const progressClass = pct < 60 ? 'progress-green' : pct < 85 ? 'progress-yellow' : 'progress-red';

        return `
            <tr>
                <td><strong>${b.name}</strong></td>
                <td>${b.dept || '-'}</td>
                <td>${b.year}</td>
                <td>₪${b.amount.toLocaleString()}</td>
                <td>₪${b.used.toLocaleString()}</td>
                <td style="color:${remaining < 0 ? '#dc3545' : '#28a745'};font-weight:700;">₪${remaining.toLocaleString()}</td>
                <td>
                    <span style="font-weight:700;">${pct}%</span>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill ${progressClass}" style="width:${Math.min(pct, 100)}%"></div>
                    </div>
                </td>
                <td>
                    ${currentRole === 'admin' || currentRole === 'accountant' ? `<button class="action-btn cancel" onclick="deleteBudget(${i})"><i class="fas fa-trash"></i></button>` : '-'}
                </td>
            </tr>
        `;
    }).join('');

    // Total bar
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalUsed = budgets.reduce((s, b) => s + b.used, 0);
    const totalRemaining = totalBudget - totalUsed;
    const totalPct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;

    document.getElementById('budgetTotalBar').style.display = 'flex';
    document.getElementById('budgetTotalBar').innerHTML = `
        <div class="budget-stat"><span class="bval">₪${totalBudget.toLocaleString()}</span><span class="blabel">תקציב כולל</span></div>
        <div class="budget-stat"><span class="bval">₪${totalUsed.toLocaleString()}</span><span class="blabel">נוצל</span></div>
        <div class="budget-stat"><span class="bval">₪${totalRemaining.toLocaleString()}</span><span class="blabel">יתרה</span></div>
        <div class="budget-stat"><span class="bval">${totalPct}%</span><span class="blabel">ניצול</span></div>
    `;
}

function deleteBudget(index) {
    if (confirm('למחוק סעיף תקציב זה?')) {
        currentInst.budget.splice(index, 1);
        saveInst();
        loadBudget();
    }
}

/* ===================== */
/* Approvals (אישורים)   */
/* ===================== */

function loadApprovals() {
    const procs = (currentInst.procurement || []).filter(p => {
        if (p.status === 'pending' && (currentRole === 'signer1' || currentRole === 'admin')) return true;
        if (p.status === 'approved1' && (currentRole === 'signer2' || currentRole === 'admin')) return true;
        if (p.status === 'approved2' && (currentRole === 'admin' || currentRole === 'accountant')) return true;
        return false;
    });

    const container = document.getElementById('approvalsList');

    if (procs.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">אין אישורים ממתינים</p>';
        return;
    }

    container.innerHTML = procs.map(p => {
        const idx = currentInst.procurement.indexOf(p);
        return `
            <div class="approval-card">
                <h4>${p.item} - ${p.id}</h4>
                <p><i class="fas fa-store"></i> ספק: ${p.supplier || '-'} | <i class="fas fa-sitemap"></i> אגף: ${p.dept || '-'}</p>
                <p><i class="fas fa-coins"></i> סכום: ₪${p.total} | כמות: ${p.qty} | <span class="urgency-badge urgency-${p.urgency}">${urgencyLabels[p.urgency]}</span></p>
                <p><i class="fas fa-info-circle"></i> סטטוס: ${procStatusLabels[p.status]}</p>
                ${p.notes ? `<p><i class="fas fa-sticky-note"></i> ${p.notes}</p>` : ''}
                <div class="approval-actions">
                    ${getProcActions(p, idx)}
                </div>
            </div>
        `;
    }).join('');
}

/* ===================== */
/* Users (משתמשים)       */
/* ===================== */

function showAddUser() {
    document.getElementById('addUserForm').style.display = 'block';
}

function hideUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
}

function addUser() {
    const name = document.getElementById('userName').value.trim();
    const role = document.getElementById('userRole').value;
    const phone = document.getElementById('userPhone').value.trim();
    const email = document.getElementById('userEmail').value.trim();

    if (!name || !phone) {
        alert('נא למלא שם וטלפון');
        return;
    }

    if (!currentInst.users) currentInst.users = [];

    currentInst.users.push({ name, role, phone, email });
    saveInst();
    loadUsers();
    hideUserForm();
    document.getElementById('userName').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('userEmail').value = '';
}

function deleteUser(index) {
    if (confirm('למחוק משתמש זה?')) {
        currentInst.users.splice(index, 1);
        saveInst();
        loadUsers();
    }
}

function loadUsers() {
    const users = currentInst.users || [];
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:30px;">אין משתמשים</td></tr>';
        return;
    }

    tbody.innerHTML = users.map((u, i) => `
        <tr>
            <td>${u.name}</td>
            <td><span class="role-badge role-${u.role}" style="font-size:11px;padding:3px 10px;">${roleLabels[u.role]}</span></td>
            <td>${u.phone}</td>
            <td>${u.email || '-'}</td>
            <td>${currentRole === 'admin' ? `<button class="action-btn cancel" onclick="deleteUser(${i})"><i class="fas fa-trash"></i></button>` : '-'}</td>
        </tr>
    `).join('');
}

/* ===================== */
/* Profile               */
/* ===================== */

function loadInstProfile() {
    document.getElementById('instProfName').value = currentInst.name || '';
    document.getElementById('instProfContact').value = currentInst.contact || '';
    document.getElementById('instProfPhone').value = currentInst.phone || '';
    document.getElementById('instProfEmail').value = currentInst.email || '';
    document.getElementById('instProfAddress').value = currentInst.address || '';
}

function updateInstProfile(e) {
    e.preventDefault();
    currentInst.name = document.getElementById('instProfName').value;
    currentInst.contact = document.getElementById('instProfContact').value;
    currentInst.phone = document.getElementById('instProfPhone').value;
    currentInst.email = document.getElementById('instProfEmail').value;
    currentInst.address = document.getElementById('instProfAddress').value;

    saveInst();
    document.getElementById('instName').textContent = currentInst.name;
    alert('הפרופיל עודכן בהצלחה!');
}

// Save institution to storage
function saveInst() {
    const institutions = DB.get('institutions');
    const index = institutions.findIndex(i => i.id === currentInst.id);
    if (index !== -1) {
        institutions[index] = currentInst;
        DB.set('institutions', institutions);
    }
}
