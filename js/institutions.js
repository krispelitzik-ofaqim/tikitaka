/* ===================== */
/* TikiTaka - Institutions */
/* ===================== */

let currentInst = null;
let cart = [];

const instTypeLabels = {
    'school': 'בית ספר',
    'kindergarten': 'גן ילדים',
    'office': 'משרד',
    'synagogue': 'בית כנסת',
    'community': 'מרכז קהילתי',
    'other': 'אחר'
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
    const institutions = DB.get('institutions');
    const inst = institutions.find(i => i.phone === phone);

    if (inst) {
        currentInst = inst;
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
        createdAt: new Date().toISOString()
    };

    DB.add('institutions', inst);
    currentInst = inst;
    alert('נרשמתם בהצלחה! ברוכים הבאים ל-TikiTaka');
    showInstDashboard();
}

// Show Dashboard
function showInstDashboard() {
    document.getElementById('instLogin').style.display = 'none';
    document.getElementById('instRegister').style.display = 'none';
    document.getElementById('instDashboard').style.display = 'block';
    document.getElementById('instName').textContent = currentInst.name;

    cart = [];
    updateCartCount();
    loadCatalog();
    loadInstOrders();
    loadInstProfile();
    populateSupplierFilter();
}

// Logout
function instLogout() {
    currentInst = null;
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
        const menu = (supplier.menu || []).filter(item => {
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

    if (!html) {
        html = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray);"><i class="fas fa-search" style="font-size:48px;display:block;margin-bottom:12px;"></i><p>לא נמצאו מוצרים</p></div>';
    }

    container.innerHTML = html;
}

// Cart functions
function addToCart(supplierId, itemIndex) {
    const suppliers = DB.get('suppliers');
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier || !supplier.menu[itemIndex]) return;

    const item = supplier.menu[itemIndex];
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

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('cartTotal').textContent = `₪${total}`;
    summary.style.display = 'block';
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
            supplier: c.supplierName
        })),
        totalPrice: total
    };

    DB.add('orders', order);

    document.getElementById('instOrderNumber').textContent = order.id;
    document.getElementById('instOrderModal').classList.add('open');

    cart = [];
    updateCartCount();
    document.getElementById('cartNotes').value = '';
}

function closeInstModal() {
    document.getElementById('instOrderModal').classList.remove('open');
    showInstTab.call(document.querySelector('.sup-tab.inst-tab:first-child'), 'catalog');
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

// Profile
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

    const institutions = DB.get('institutions');
    const index = institutions.findIndex(i => i.id === currentInst.id);
    if (index !== -1) {
        institutions[index] = currentInst;
        DB.set('institutions', institutions);
    }

    document.getElementById('instName').textContent = currentInst.name;
    alert('הפרופיל עודכן בהצלחה!');
}
