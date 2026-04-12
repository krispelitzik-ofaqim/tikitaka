/* ===================== */
/* TikiTaka - Admin JS   */
/* ===================== */

const statusLabels = {
    'pending': 'ממתין',
    'confirmed': 'אושר',
    'picked_up': 'נאסף',
    'on_the_way': 'בדרך',
    'delivered': 'נמסר',
    'cancelled': 'בוטל'
};

const categoryLabels = {
    'food': 'אוכל',
    'documents': 'מסמכים',
    'package': 'חבילה'
};

// Show tab
function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    event.currentTarget.classList.add('active');
    document.getElementById('pageTitle').textContent = getTabTitle(tab);

    if (tab === 'dashboard') loadDashboard();
    if (tab === 'orders') loadOrders();
    if (tab === 'suppliers') loadSuppliers();
    if (tab === 'customers') loadCustomers();
}

function getTabTitle(tab) {
    const titles = {
        'dashboard': 'דשבורד',
        'orders': 'הזמנות',
        'suppliers': 'ספקים',
        'customers': 'לקוחות',
        'settings': 'הגדרות',
        'customerView': 'צפייה בממשק לקוח'
    };
    return titles[tab] || '';
}

// Toggle sidebar (mobile)
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// Load Dashboard
function loadDashboard() {
    const orders = DB.get('orders');
    const suppliers = DB.get('suppliers');

    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('deliveredOrders').textContent = orders.filter(o => o.status === 'delivered').length;
    document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
    document.getElementById('totalSuppliers').textContent = suppliers.filter(s => s.isActive).length;

    const recent = orders.slice(-5).reverse();
    const tbody = document.getElementById('recentOrdersTable');
    tbody.innerHTML = recent.length === 0
        ? '<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:30px;">אין הזמנות עדיין</td></tr>'
        : recent.map(o => `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customerName}</td>
                <td>${categoryLabels[o.category] || o.category}</td>
                <td>${o.deliveryAddress}</td>
                <td><span class="status-badge status-${o.status}">${statusLabels[o.status]}</span></td>
                <td>
                    ${getActionButtons(o)}
                </td>
            </tr>
        `).join('');
}

// Load Orders
function loadOrders(filter = 'all') {
    const orders = DB.get('orders');
    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
    const tbody = document.getElementById('allOrdersTable');

    tbody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="9" style="text-align:center;color:var(--gray);padding:30px;">אין הזמנות</td></tr>'
        : filtered.reverse().map(o => `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customerName}</td>
                <td>${o.customerPhone}</td>
                <td>${categoryLabels[o.category] || o.category}</td>
                <td>${o.pickupAddress}</td>
                <td>${o.deliveryAddress}</td>
                <td><span class="status-badge status-${o.status}">${statusLabels[o.status]}</span></td>
                <td>${new Date(o.createdAt).toLocaleDateString('he-IL')}</td>
                <td>${getActionButtons(o)}</td>
            </tr>
        `).join('');
}

function filterOrders() {
    const filter = document.getElementById('statusFilter').value;
    loadOrders(filter);
}

// Action buttons based on status
function getActionButtons(order) {
    const buttons = [];

    if (order.status === 'pending') {
        buttons.push(`<button class="action-btn approve" onclick="updateStatus('${order.id}','confirmed')">אשר</button>`);
        buttons.push(`<button class="action-btn cancel" onclick="updateStatus('${order.id}','cancelled')">בטל</button>`);
    }
    if (order.status === 'confirmed') {
        buttons.push(`<button class="action-btn progress" onclick="updateStatus('${order.id}','picked_up')">נאסף</button>`);
    }
    if (order.status === 'picked_up') {
        buttons.push(`<button class="action-btn progress" onclick="updateStatus('${order.id}','on_the_way')">בדרך</button>`);
    }
    if (order.status === 'on_the_way') {
        buttons.push(`<button class="action-btn approve" onclick="updateStatus('${order.id}','delivered')">נמסר</button>`);
    }

    return buttons.join('') || '<span style="color:var(--gray)">-</span>';
}

// Update order status
function updateStatus(orderId, newStatus) {
    const orders = DB.get('orders');
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders[index].status = newStatus;
        DB.set('orders', orders);
        loadDashboard();
        loadOrders(document.getElementById('statusFilter')?.value || 'all');
    }
}

// Load Suppliers
function loadSuppliers() {
    const suppliers = DB.get('suppliers');
    const grid = document.getElementById('suppliersGrid');

    grid.innerHTML = suppliers.map(s => `
        <div class="supplier-card">
            <h3><i class="fas fa-store"></i> ${s.name}</h3>
            <p>${s.description}</p>
            <p><i class="fas fa-phone"></i> ${s.phone}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${s.address}</p>
            <div class="supplier-meta">
                <span class="supplier-tag"><i class="fas fa-tag"></i> ${categoryLabels[s.category] || s.category}</span>
                <span class="supplier-tag"><i class="fas fa-utensils"></i> ${s.menu ? s.menu.length : 0} פריטים</span>
                <span class="supplier-tag" style="color:${s.isActive ? '#28a745' : '#dc3545'}">
                    <i class="fas fa-circle"></i> ${s.isActive ? 'פעיל' : 'לא פעיל'}
                </span>
            </div>
        </div>
    `).join('');
}

// Load Customers
function loadCustomers() {
    const orders = DB.get('orders');
    const customers = {};

    orders.forEach(o => {
        if (!customers[o.customerPhone]) {
            customers[o.customerPhone] = {
                name: o.customerName,
                phone: o.customerPhone,
                email: o.customerEmail || '-',
                count: 0
            };
        }
        customers[o.customerPhone].count++;
    });

    const tbody = document.getElementById('customersTable');
    const list = Object.values(customers);

    tbody.innerHTML = list.length === 0
        ? '<tr><td colspan="4" style="text-align:center;color:var(--gray);padding:30px;">אין לקוחות עדיין</td></tr>'
        : list.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td>${c.email}</td>
                <td>${c.count}</td>
            </tr>
        `).join('');
}

// Preview size
function setPreviewSize(size) {
    const frame = document.getElementById('previewFrame');
    frame.className = `preview-frame ${size}`;
    document.querySelectorAll('.preview-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// Init
loadDashboard();
