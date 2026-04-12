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

/* ===================== */
/* Products (מוצרים)     */
/* ===================== */

const prodCategoryLabels = {
    'food': 'אוכל', 'sweets': 'מתוקים ופיצוחים', 'drinks': 'שתייה',
    'flowers': 'פרחים', 'office': 'ציוד משרדי', 'cleaning': 'ניקיון', 'other': 'אחר'
};

const prodUnitLabels = {
    'unit': 'יחידה', 'kg': 'ק"ג', 'pack': 'חבילה', 'box': 'קרטון', 'bottle': 'בקבוק'
};

let prodImageData = null;

function showAddProduct() {
    document.getElementById('addProductForm').style.display = 'block';
}

function hideProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
    prodImageData = null;
    document.getElementById('prodImagePreview').innerHTML = '';
}

function previewProductImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        prodImageData = ev.target.result;
        document.getElementById('prodImagePreview').innerHTML =
            '<img src="' + prodImageData + '" style="width:120px;height:80px;object-fit:cover;border-radius:8px;">';
    };
    reader.readAsDataURL(file);
}

function addProduct() {
    const name = document.getElementById('prodName').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value) || 0;

    if (!name || !price) {
        alert('נא למלא שם ומחיר');
        return;
    }

    const product = {
        id: 'PRD-' + Date.now().toString().slice(-6),
        name: name,
        category: document.getElementById('prodCategory').value,
        description: document.getElementById('prodDesc').value.trim(),
        price: price,
        unit: document.getElementById('prodUnit').value,
        supplier: document.getElementById('prodSupplier').value.trim(),
        location: document.getElementById('prodLocation').value.trim(),
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        minOrder: parseInt(document.getElementById('prodMinOrder').value) || 1,
        image: prodImageData || null,
        forInstitutions: document.getElementById('prodForInstitutions').checked,
        createdAt: new Date().toISOString()
    };

    DB.add('products', product);
    loadProducts();
    hideProductForm();

    // Clear form
    ['prodName', 'prodDesc', 'prodPrice', 'prodSupplier', 'prodLocation', 'prodStock'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('prodMinOrder').value = '1';
    document.getElementById('prodImage').value = '';
    prodImageData = null;

    alert('מוצר נטען בהצלחה!');
}

function deleteProduct(index) {
    if (confirm('למחוק מוצר זה?')) {
        const products = DB.get('products');
        products.splice(index, 1);
        DB.set('products', products);
        loadProducts();
    }
}

function loadProducts() {
    const products = DB.get('products');
    const filterCat = document.getElementById('prodFilterCat').value;
    const search = document.getElementById('prodSearch').value.trim().toLowerCase();
    const grid = document.getElementById('productsGrid');

    let filtered = products;
    if (filterCat !== 'all') filtered = filtered.filter(p => p.category === filterCat);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search)));

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray);"><i class="fas fa-box-open" style="font-size:48px;display:block;margin-bottom:12px;"></i><p>אין מוצרים. לחץ "טען מוצר חדש" כדי להוסיף.</p></div>';
        return;
    }

    grid.innerHTML = filtered.map((p, i) => {
        const realIndex = products.indexOf(p);
        return `
        <div class="product-admin-card">
            <div class="product-admin-img">
                ${p.image ? '<img src="' + p.image + '">' : '<i class="fas fa-image"></i>'}
            </div>
            <div class="product-admin-body">
                <h4>${p.name}</h4>
                <p class="prod-desc">${p.description || ''}</p>
                <div class="product-admin-meta">
                    <span class="prod-tag"><i class="fas fa-tag"></i> ${prodCategoryLabels[p.category] || p.category}</span>
                    <span class="prod-tag"><i class="fas fa-ruler"></i> ${prodUnitLabels[p.unit] || p.unit}</span>
                    ${p.stock ? '<span class="prod-tag"><i class="fas fa-warehouse"></i> מלאי: ' + p.stock + '</span>' : ''}
                    ${p.supplier ? '<span class="prod-tag"><i class="fas fa-store"></i> ' + p.supplier + '</span>' : ''}
                    ${p.location ? '<span class="prod-tag"><i class="fas fa-map-marker-alt"></i> ' + p.location + '</span>' : ''}
                    ${p.forInstitutions ? '<span class="prod-tag" style="color:#2563EB;"><i class="fas fa-building"></i> למוסדות</span>' : ''}
                </div>
                <div class="product-admin-footer">
                    <span class="prod-price">₪${p.price} / ${prodUnitLabels[p.unit] || p.unit}</span>
                    <button class="action-btn cancel" onclick="deleteProduct(${realIndex})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`;
    }).join('');
}

/* ===================== */
/* Maps                  */
/* ===================== */

let adminMap = null;
let mapLayers = { couriers: [], suppliers: [], deliveries: [] };
const OFAKIM = [31.3133, 34.6200];

function initAdminMap() {
    if (adminMap) adminMap.remove();

    adminMap = L.map('adminMap').setView(OFAKIM, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    }).addTo(adminMap);

    loadMapMarkers('all');
}

function loadMapMarkers(view) {
    // Clear layers
    Object.values(mapLayers).flat().forEach(m => adminMap.removeLayer(m));
    mapLayers = { couriers: [], suppliers: [], deliveries: [] };

    // Couriers
    if (view === 'all' || view === 'couriers') {
        const couriers = DB.get('couriers');
        couriers.forEach(c => {
            if (c.lat && c.lng) {
                const icon = L.divIcon({
                    className: '',
                    html: '<div style="background:#059669;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-motorcycle"></i></div>',
                    iconSize: [32, 32], iconAnchor: [16, 16]
                });
                const m = L.marker([c.lat, c.lng], { icon }).addTo(adminMap)
                    .bindPopup('<strong>' + c.name + '</strong><br>שליח');
                mapLayers.couriers.push(m);
            }
        });
    }

    // Suppliers
    if (view === 'all' || view === 'suppliers') {
        const suppliers = DB.get('suppliers');
        suppliers.forEach(s => {
            if (s.lat && s.lng) {
                const icon = L.divIcon({
                    className: '',
                    html: '<div style="background:#C41E2F;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-store"></i></div>',
                    iconSize: [32, 32], iconAnchor: [16, 16]
                });
                const m = L.marker([s.lat, s.lng], { icon }).addTo(adminMap)
                    .bindPopup('<strong>' + s.name + '</strong><br>' + (s.address || ''));
                mapLayers.suppliers.push(m);
            }
        });
    }

    // Active deliveries
    if (view === 'all' || view === 'deliveries') {
        const orders = DB.get('orders').filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        orders.forEach((o, i) => {
            const offset = (i + 1) * 0.003;
            const icon = L.divIcon({
                className: '',
                html: '<div style="background:#2563EB;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-box"></i></div>',
                iconSize: [28, 28], iconAnchor: [14, 14]
            });
            const m = L.marker([OFAKIM[0] + offset, OFAKIM[1] + offset], { icon }).addTo(adminMap)
                .bindPopup('<strong>' + o.id + '</strong><br>' + o.customerName + '<br>' + o.deliveryAddress);
            mapLayers.deliveries.push(m);
        });
    }
}

function showMapView(view) {
    document.querySelectorAll('.map-tab-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    loadMapMarkers(view);
}

/* ===================== */
/* Fleet (צי תנועה)      */
/* ===================== */

const vehicleTypeLabels = { 'bike': 'אופניים', 'scooter': 'וספה', 'car': 'רכב' };
const vehicleTypeIcons = { 'bike': 'fa-bicycle', 'scooter': 'fa-motorcycle', 'car': 'fa-car' };
const vehicleStatusLabels = { 'active': 'פעיל', 'maintenance': 'בתחזוקה', 'inactive': 'לא פעיל' };

function showAddVehicle() {
    document.getElementById('addVehicleForm').style.display = 'block';
}

function hideVehicleForm() {
    document.getElementById('addVehicleForm').style.display = 'none';
}

function addVehicle() {
    const type = document.getElementById('vehicleType').value;
    const plate = document.getElementById('vehiclePlate').value.trim();
    const courier = document.getElementById('vehicleCourier').value.trim();
    const status = document.getElementById('vehicleStatus').value;

    if (!plate) { alert('נא למלא מספר רישוי'); return; }

    const fleet = DB.get('fleet');
    fleet.push({ id: 'V-' + Date.now().toString().slice(-5), type, plate, courier, status });
    DB.set('fleet', fleet);
    loadFleet();
    hideVehicleForm();
    document.getElementById('vehiclePlate').value = '';
    document.getElementById('vehicleCourier').value = '';
}

function deleteVehicle(index) {
    if (confirm('למחוק כלי רכב זה?')) {
        const fleet = DB.get('fleet');
        fleet.splice(index, 1);
        DB.set('fleet', fleet);
        loadFleet();
    }
}

function loadFleet() {
    const fleet = DB.get('fleet');
    const tbody = document.getElementById('fleetTableBody');

    document.getElementById('fleetBikes').textContent = fleet.filter(v => v.type === 'bike').length;
    document.getElementById('fleetScooters').textContent = fleet.filter(v => v.type === 'scooter').length;
    document.getElementById('fleetCars').textContent = fleet.filter(v => v.type === 'car').length;

    if (fleet.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:30px;">אין כלי רכב</td></tr>';
        return;
    }

    tbody.innerHTML = fleet.map((v, i) => `
        <tr>
            <td><i class="fas ${vehicleTypeIcons[v.type]}" style="color:var(--primary);margin-left:6px;"></i> ${vehicleTypeLabels[v.type]}</td>
            <td>${v.plate}</td>
            <td>${v.courier || '-'}</td>
            <td><span class="status-badge status-${v.status === 'active' ? 'delivered' : v.status === 'maintenance' ? 'pending' : 'cancelled'}">${vehicleStatusLabels[v.status]}</span></td>
            <td><button class="action-btn cancel" onclick="deleteVehicle(${i})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

// Override showTab to init map and fleet
const origShowTab = showTab;
showTab = function(tab) {
    origShowTab(tab);
    if (tab === 'maps') {
        setTimeout(() => { initAdminMap(); }, 100);
    }
    if (tab === 'fleet') {
        loadFleet();
    }
};

// Init
loadDashboard();
