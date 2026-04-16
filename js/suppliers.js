/* ===================== */
/* TikiTaka - Suppliers   */
/* ===================== */

let currentSupplier = null;

// Toggle mobile menu
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// Show login/register
function showRegister() {
    document.getElementById('supplierLogin').style.display = 'none';
    document.getElementById('supplierRegister').style.display = 'flex';
}

function showLogin() {
    document.getElementById('supplierLogin').style.display = 'flex';
    document.getElementById('supplierRegister').style.display = 'none';
}

// Supplier Login
function supplierLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('supplierPhone').value.trim();
    const suppliers = DB.get('suppliers');
    const supplier = suppliers.find(s => s.phone === phone);

    if (supplier) {
        currentSupplier = supplier;
        showDashboard();
    } else {
        alert('ספק לא נמצא. בדוק את מספר הטלפון או הרשם כספק חדש.');
    }
}

// Register Supplier
function registerSupplier(e) {
    e.preventDefault();

    const supplier = {
        id: 'sup' + Date.now(),
        name: document.getElementById('regName').value,
        category: document.getElementById('regCategory').value,
        description: document.getElementById('regDescription').value || '',
        phone: document.getElementById('regPhone').value,
        email: document.getElementById('regEmail').value || '',
        address: document.getElementById('regAddress').value,
        isActive: true,
        images: []
    };

    DB.add('suppliers', supplier);
    currentSupplier = supplier;
    alert('נרשמת בהצלחה! ברוך הבא ל-TikiTaka');
    showDashboard();
}

// Show Dashboard
function showDashboard() {
    document.getElementById('supplierLogin').style.display = 'none';
    document.getElementById('supplierRegister').style.display = 'none';
    document.getElementById('supplierDashboard').style.display = 'block';
    document.getElementById('supplierName').textContent = currentSupplier.name;

    loadMenu();
    loadPhotos();
    loadSupplierOrders();
    loadProfile();
    startOrderPolling();
}

let lastPendingCount = null;
let orderPollInterval = null;
let audioCtx = null;

function playBeep() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}
}

function countSupplierPendingOrders() {
    const orders = DB.get('orders').filter(o => o.status === 'pending');
    return orders.filter(o =>
        Array.isArray(o.items) && o.items.some(it =>
            it.supplierId === currentSupplier.id ||
            (!it.supplierId && it.supplier === currentSupplier.name)
        )
    ).length;
}

function startOrderPolling() {
    if (orderPollInterval) clearInterval(orderPollInterval);
    lastPendingCount = countSupplierPendingOrders();
    orderPollInterval = setInterval(() => {
        if (!currentSupplier) return;
        const count = countSupplierPendingOrders();
        if (lastPendingCount !== null && count > lastPendingCount) {
            playBeep();
            loadSupplierOrders();
            if (Notification && Notification.permission === 'granted') {
                new Notification('הזמנה חדשה!', { body: 'התקבלה הזמנה חדשה ב-' + currentSupplier.name });
            }
        }
        lastPendingCount = count;
    }, 5000);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Logout
function supplierLogout() {
    if (orderPollInterval) { clearInterval(orderPollInterval); orderPollInterval = null; }
    currentSupplier = null;
    document.getElementById('supplierDashboard').style.display = 'none';
    document.getElementById('supplierLogin').style.display = 'flex';
}

// Show tab
function showSupTab(tab) {
    document.querySelectorAll('.sup-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sup-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`supTab-${tab}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Menu (products) functions
let itemImageData = null;
let itemImagesData = [];

function showAddItem() {
    document.getElementById('addItemForm').style.display = 'block';
    if (document.getElementById('itemAddonsList').children.length === 0) {
        addItemAddonRow();
    }
}

function hideAddItem() {
    document.getElementById('addItemForm').style.display = 'none';
    ['itemName', 'itemPrice', 'itemDesc', 'itemStock', 'itemNotes'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('itemMinOrder').value = '1';
    document.getElementById('itemImage').value = '';
    document.getElementById('itemImagePreview').innerHTML = '';
    document.getElementById('itemAddonsList').innerHTML = '';
    itemImageData = null;
    itemImagesData = [];
}

function previewItemImage(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    itemImagesData = [];
    const preview = document.getElementById('itemImagePreview');
    preview.innerHTML = '';
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            itemImagesData.push(ev.target.result);
            itemImageData = itemImagesData[0];
            const img = document.createElement('img');
            img.src = ev.target.result;
            img.style.cssText = 'width:80px;height:60px;object-fit:cover;border-radius:6px;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

function addItemAddonRow(name = '', price = '') {
    const list = document.getElementById('itemAddonsList');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:6px;align-items:center;';
    row.innerHTML = `
        <input type="text" placeholder="שם התוספת" value="${name}" class="item-addon-name" style="flex:2;padding:8px;border:1px solid #e0e0e0;border-radius:6px;">
        <input type="number" placeholder="מחיר ₪" value="${price}" min="0" step="0.5" class="item-addon-price" style="flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:6px;">
        <button type="button" class="delete-btn" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    list.appendChild(row);
}

function collectItemAddons() {
    const rows = document.querySelectorAll('#itemAddonsList > div');
    const addons = [];
    rows.forEach(r => {
        const name = r.querySelector('.item-addon-name').value.trim();
        const price = parseFloat(r.querySelector('.item-addon-price').value) || 0;
        if (name) addons.push({ name, price });
    });
    return addons;
}

function addMenuItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!name || !price) {
        alert('נא למלא שם ומחיר');
        return;
    }

    const product = {
        id: 'PRD-' + Date.now().toString().slice(-6),
        supplierId: currentSupplier.id,
        supplier: currentSupplier.name,
        location: currentSupplier.address || '',
        name: name,
        category: document.getElementById('itemCategory').value,
        description: document.getElementById('itemDesc').value.trim(),
        price: price,
        unit: document.getElementById('itemUnit').value,
        stock: parseInt(document.getElementById('itemStock').value) || 0,
        minOrder: parseInt(document.getElementById('itemMinOrder').value) || 1,
        image: itemImageData || null,
        images: itemImagesData.length > 0 ? itemImagesData.slice() : (itemImageData ? [itemImageData] : []),
        addons: collectItemAddons(),
        notes: document.getElementById('itemNotes').value.trim(),
        daypart: document.getElementById('itemDaypart').value,
        forInstitutions: document.getElementById('itemForInstitutions').checked,
        createdAt: new Date().toISOString()
    };

    DB.add('products', product);
    loadMenu();
    hideAddItem();
}

function deleteMenuItem(id) {
    if (!confirm('למחוק פריט זה?')) return;
    const products = DB.get('products').filter(p => p.id !== id);
    DB.set('products', products);
    loadMenu();
}

const supUnitLabels = { 'unit': 'יחידה', 'kg': 'ק"ג', 'pack': 'חבילה', 'box': 'קרטון', 'bottle': 'בקבוק' };

function loadMenu() {
    const container = document.getElementById('menuItems');
    const menu = getSupplierProducts(currentSupplier.id);

    if (menu.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">אין פריטים בתפריט. הוסף את הפריט הראשון!</p>';
        return;
    }

    container.innerHTML = menu.map(item => `
        <div class="menu-item">
            <div class="menu-item-info" style="display:flex;gap:12px;align-items:flex-start;">
                ${item.image ? '<img src="' + item.image + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">' : ''}
                <div style="flex:1;">
                    <h4>${item.name}</h4>
                    <p>${item.description || ''}</p>
                    <div style="font-size:12px;color:var(--gray);margin-top:4px;">
                        ${item.stock ? 'מלאי: ' + item.stock + ' | ' : ''}${supUnitLabels[item.unit] || item.unit || ''}
                        ${item.addons && item.addons.length ? ' | ' + item.addons.length + ' תוספות' : ''}
                    </div>
                    ${item.notes ? '<div style="margin-top:4px;padding:4px 8px;background:#fff8e1;border-right:3px solid #D4A843;font-size:12px;">' + item.notes + '</div>' : ''}
                </div>
            </div>
            <div class="menu-item-actions">
                <span class="menu-item-price">₪${item.price}</span>
                <button class="delete-btn" onclick="deleteMenuItem('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Photo functions
const MAX_SUPPLIER_PHOTOS = 6;

function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentSupplier.images) currentSupplier.images = [];
    if (currentSupplier.images.length >= MAX_SUPPLIER_PHOTOS) {
        alert('ניתן להעלות עד ' + MAX_SUPPLIER_PHOTOS + ' תמונות. מחק תמונה קיימת כדי להוסיף חדשה.');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        currentSupplier.images.push(event.target.result);
        saveSupplier();
        loadPhotos();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function uploadBusinessImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        currentSupplier.businessImage = event.target.result;
        saveSupplier();
        renderBusinessImagePreview();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function removeBusinessImage() {
    if (!confirm('להסיר את התמונה המייצגת?')) return;
    currentSupplier.businessImage = null;
    saveSupplier();
    renderBusinessImagePreview();
}

function renderBusinessImagePreview() {
    const el = document.getElementById('businessImagePreview');
    if (!el) return;
    if (currentSupplier.businessImage) {
        el.innerHTML = `
            <div style="position:relative;display:inline-block;">
                <img src="${currentSupplier.businessImage}" alt="תמונה מייצגת" style="width:160px;height:160px;object-fit:cover;border-radius:12px;border:2px solid #e0e0e0;">
                <button type="button" onclick="removeBusinessImage()" style="position:absolute;top:6px;left:6px;background:rgba(220,53,69,0.95);color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;"><i class="fas fa-times"></i></button>
            </div>`;
    } else {
        el.innerHTML = `<div style="width:160px;height:160px;border:2px dashed #ccc;border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--gray);flex-direction:column;"><i class="fas fa-image" style="font-size:36px;margin-bottom:6px;"></i><span style="font-size:12px;">אין תמונה מייצגת</span></div>`;
    }
}

function deletePhoto(index) {
    if (confirm('למחוק תמונה זו?')) {
        currentSupplier.images.splice(index, 1);
        saveSupplier();
        loadPhotos();
    }
}

function loadPhotos() {
    const slider = document.getElementById('photoSlider');
    const gallery = document.getElementById('photoGallery');
    const images = (currentSupplier.images || []).slice(0, MAX_SUPPLIER_PHOTOS);

    if (images.length === 0) {
        slider.innerHTML = '';
        gallery.innerHTML = '<div class="photo-placeholder"><i class="fas fa-images" style="font-size:48px;margin-bottom:12px;display:block;"></i><p>אין תמונות. העלה את התמונה הראשונה!</p></div>';
        return;
    }

    slider.innerHTML = `
        <div class="photo-slider-track">
            ${images.map((img, i) => `
                <div class="photo-slide" data-idx="${i}">
                    <img src="${img}" alt="תמונה ${i + 1}">
                </div>
            `).join('')}
        </div>
        <button type="button" class="photo-slider-btn prev" onclick="slidePhotos(-1)"><i class="fas fa-chevron-right"></i></button>
        <button type="button" class="photo-slider-btn next" onclick="slidePhotos(1)"><i class="fas fa-chevron-left"></i></button>
        <div class="photo-slider-dots">
            ${images.map((_, i) => `<span class="dot${i === 0 ? ' active' : ''}" onclick="goToSlide(${i})"></span>`).join('')}
        </div>
    `;
    currentSlide = 0;
    updateSlider();

    gallery.innerHTML = images.map((img, i) => `
        <div class="photo-item">
            <img src="${img}" alt="תמונה ${i + 1}">
            <button class="photo-delete" onclick="deletePhoto(${i})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

let currentSlide = 0;
function slidePhotos(dir) {
    const total = (currentSupplier.images || []).length;
    if (!total) return;
    currentSlide = (currentSlide + dir + total) % total;
    updateSlider();
}
function goToSlide(i) {
    currentSlide = i;
    updateSlider();
}
function updateSlider() {
    const track = document.querySelector('.photo-slider-track');
    if (!track) return;
    track.style.transform = `translateX(${currentSlide * 100}%)`;
    document.querySelectorAll('.photo-slider-dots .dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentSlide);
    });
}

// Orders
function loadSupplierOrders() {
    const container = document.getElementById('supplierOrders');
    const orders = DB.get('orders');

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">אין הזמנות עדיין</p>';
        return;
    }

    const statusLabels = {
        'pending': 'ממתין', 'confirmed': 'אושר', 'picked_up': 'נאסף',
        'on_the_way': 'בדרך', 'delivered': 'נמסר', 'cancelled': 'בוטל'
    };

    container.innerHTML = orders.slice(-10).reverse().map(o => `
        <div class="sup-order-card">
            <div class="sup-order-info">
                <strong>${o.id}</strong>
                <p>${o.customerName} | ${o.deliveryAddress}</p>
            </div>
            <span class="status-badge status-${o.status}">${statusLabels[o.status]}</span>
        </div>
    `).join('');
}

// Profile
function loadProfile() {
    renderBusinessImagePreview();
    document.getElementById('profName').value = currentSupplier.name || '';
    document.getElementById('profDesc').value = currentSupplier.description || '';
    document.getElementById('profPhone').value = currentSupplier.phone || '';
    document.getElementById('profEmail').value = currentSupplier.email || '';
    document.getElementById('profAddress').value = currentSupplier.address || '';
    document.getElementById('profOpen').value = currentSupplier.openTime || '';
    document.getElementById('profClose').value = currentSupplier.closeTime || '';
    document.getElementById('profRadius').value = currentSupplier.deliveryRadius || '';
    const days = currentSupplier.workDays || [0, 1, 2, 3, 4];
    document.querySelectorAll('.prof-day').forEach(cb => {
        cb.checked = days.includes(parseInt(cb.value));
    });
    renderIconPicker('profIconPicker', BUSINESS_ICONS, currentSupplier.iconKey || 'store', 'profIcon');
}

function updateProfile(e) {
    e.preventDefault();
    currentSupplier.name = document.getElementById('profName').value;
    currentSupplier.description = document.getElementById('profDesc').value;
    currentSupplier.phone = document.getElementById('profPhone').value;
    currentSupplier.email = document.getElementById('profEmail').value;
    currentSupplier.address = document.getElementById('profAddress').value;
    currentSupplier.openTime = document.getElementById('profOpen').value;
    currentSupplier.closeTime = document.getElementById('profClose').value;
    currentSupplier.deliveryRadius = parseFloat(document.getElementById('profRadius').value) || 0;
    currentSupplier.workDays = Array.from(document.querySelectorAll('.prof-day:checked')).map(cb => parseInt(cb.value));
    const sel = document.querySelector('input[name="profIcon"]:checked');
    if (sel) currentSupplier.iconKey = sel.value;
    saveSupplier();
    document.getElementById('supplierName').textContent = currentSupplier.name;
    alert('הפרופיל עודכן בהצלחה!');
}

function isSupplierOpen(supplier) {
    if (!supplier.openTime || !supplier.closeTime) return true;
    const now = new Date();
    const days = supplier.workDays || [0, 1, 2, 3, 4];
    if (!days.includes(now.getDay())) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = supplier.openTime.split(':').map(Number);
    const [ch, cm] = supplier.closeTime.split(':').map(Number);
    const open = oh * 60 + om;
    const close = ch * 60 + cm;
    return cur >= open && cur <= close;
}

// Supplier Map
let supplierMap = null;
let supplierMapMarker = null;
let selectedLocation = null;

function initSupplierMap() {
    const OFAKIM = [31.3133, 34.6200];
    const mapEl = document.getElementById('supplierMap');
    if (!mapEl || supplierMap) return;

    const startLat = currentSupplier.lat || OFAKIM[0];
    const startLng = currentSupplier.lng || OFAKIM[1];

    supplierMap = L.map('supplierMap').setView([startLat, startLng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    }).addTo(supplierMap);

    // Existing location
    if (currentSupplier.lat && currentSupplier.lng) {
        const icon = L.divIcon({
            className: 'sup-map-marker',
            html: '<div style="background:#C41E2F;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><i class="fas fa-store"></i></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
        supplierMapMarker = L.marker([startLat, startLng], { icon: icon }).addTo(supplierMap)
            .bindPopup('<strong>' + currentSupplier.name + '</strong>');
        selectedLocation = { lat: startLat, lng: startLng };
        document.getElementById('locationStatus').textContent = 'מיקום נבחר ✓';
        document.getElementById('locationStatus').style.color = '#28a745';
    }

    // Click to set location
    supplierMap.on('click', function(e) {
        selectedLocation = { lat: e.latlng.lat, lng: e.latlng.lng };

        if (supplierMapMarker) supplierMap.removeLayer(supplierMapMarker);

        const icon = L.divIcon({
            className: 'sup-map-marker',
            html: '<div style="background:#C41E2F;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><i class="fas fa-store"></i></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
        supplierMapMarker = L.marker([e.latlng.lat, e.latlng.lng], { icon: icon }).addTo(supplierMap)
            .bindPopup('<strong>' + currentSupplier.name + '</strong>').openPopup();

        document.getElementById('locationStatus').textContent = 'מיקום חדש נבחר - לחץ שמור';
        document.getElementById('locationStatus').style.color = '#D97706';
    });
}

function saveSupplierLocation() {
    if (!selectedLocation) {
        alert('לחץ על המפה כדי לבחור מיקום');
        return;
    }
    currentSupplier.lat = selectedLocation.lat;
    currentSupplier.lng = selectedLocation.lng;
    saveSupplier();
    document.getElementById('locationStatus').textContent = 'מיקום נשמר ✓';
    document.getElementById('locationStatus').style.color = '#28a745';
    alert('מיקום העסק נשמר בהצלחה!');
}

// Override showSupTab to init map / accounting
const origShowSupTab = showSupTab;
showSupTab = function(tab) {
    origShowSupTab(tab);
    if (tab === 'location') {
        setTimeout(() => {
            initSupplierMap();
            if (supplierMap) supplierMap.invalidateSize();
        }, 100);
    }
    if (tab === 'accounting') {
        initSupAccounting();
    }
};

/* ===================== */
/* Supplier Accounting    */
/* ===================== */

const supExpCatLabels = {
    'fuel': 'דלק', 'maintenance': 'תחזוקה', 'salary': 'משכורות',
    'suppliers': 'חומרי גלם', 'rent': 'שכירות', 'utilities': 'חשבונות',
    'marketing': 'שיווק', 'other': 'אחר'
};

function initSupAccounting() {
    if (!document.getElementById('supAccFrom').value) {
        setSupAccPeriod('month');
    } else {
        loadSupAccounting();
    }
}

function setSupAccPeriod(period) {
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    let from;
    if (period === 'month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else if (period === 'year') {
        from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    } else {
        from = '2000-01-01';
    }
    document.getElementById('supAccFrom').value = from;
    document.getElementById('supAccTo').value = to;
    loadSupAccounting();
}

function inSupAccRange(dateStr) {
    const from = document.getElementById('supAccFrom').value;
    const to = document.getElementById('supAccTo').value;
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
}

function loadSupAccounting() {
    const supId = currentSupplier.id;
    const supName = currentSupplier.name;

    // Orders with at least one item belonging to this supplier, delivered, in range
    const allOrders = DB.get('orders').filter(o =>
        o.status === 'delivered' && inSupAccRange(o.createdAt)
    );

    const rows = [];
    let revenue = 0;

    allOrders.forEach(o => {
        if (!Array.isArray(o.items)) return;
        const myItems = o.items.filter(it =>
            it.supplierId === supId || (!it.supplierId && it.supplier === supName)
        );
        if (myItems.length === 0) return;
        const orderRevenue = myItems.reduce((s, it) => s + (it.price * it.qty), 0);
        revenue += orderRevenue;
        rows.push({
            id: o.id,
            date: o.createdAt,
            customer: o.customerName,
            items: myItems.map(it => `${it.name} × ${it.qty}`).join(', '),
            total: orderRevenue
        });
    });

    // Expenses scoped to supplier
    const expenses = DB.get('expenses').filter(e =>
        e.supplierId === supId && inSupAccRange(e.date)
    );
    const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const profit = revenue - totalExp;

    document.getElementById('supAccRevenue').textContent = '₪' + revenue.toLocaleString('he-IL');
    document.getElementById('supAccExpenses').textContent = '₪' + totalExp.toLocaleString('he-IL');
    document.getElementById('supAccProfit').textContent = '₪' + profit.toLocaleString('he-IL');
    document.getElementById('supAccProfit').style.color = profit >= 0 ? '#28a745' : '#dc3545';
    document.getElementById('supAccOrders').textContent = rows.length;

    const revTbody = document.getElementById('supAccRevenueTable');
    revTbody.innerHTML = rows.length === 0
        ? '<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:30px;">אין הזמנות בתקופה זו</td></tr>'
        : rows.reverse().map(r => `
            <tr>
                <td><strong>${r.id}</strong></td>
                <td>${new Date(r.date).toLocaleDateString('he-IL')}</td>
                <td>${r.customer}</td>
                <td style="font-size:13px;">${r.items}</td>
                <td><strong>₪${r.total.toLocaleString('he-IL')}</strong></td>
            </tr>
        `).join('');

    const expTbody = document.getElementById('supAccExpensesTable');
    expTbody.innerHTML = expenses.length === 0
        ? '<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:30px;">אין הוצאות בתקופה זו</td></tr>'
        : expenses.slice().reverse().map(e => `
            <tr>
                <td>${new Date(e.date).toLocaleDateString('he-IL')}</td>
                <td>${supExpCatLabels[e.category] || e.category}</td>
                <td>${e.description || '-'}</td>
                <td>${e.receipt || '-'}</td>
                <td><strong>₪${parseFloat(e.amount).toLocaleString('he-IL')}</strong></td>
                <td><button class="delete-btn" onclick="deleteSupExpense('${e.id}')"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
}

function showSupAddExpense() {
    document.getElementById('supAddExpenseForm').style.display = 'block';
    if (!document.getElementById('supExpDate').value) {
        document.getElementById('supExpDate').value = new Date().toISOString().slice(0, 10);
    }
}

function hideSupExpenseForm() {
    document.getElementById('supAddExpenseForm').style.display = 'none';
}

function addSupExpense() {
    const date = document.getElementById('supExpDate').value;
    const amount = parseFloat(document.getElementById('supExpAmount').value);

    if (!date || !amount || amount <= 0) {
        alert('נא למלא תאריך וסכום תקין');
        return;
    }

    const expense = {
        id: 'EXP-' + Date.now().toString().slice(-6),
        supplierId: currentSupplier.id,
        date: date,
        category: document.getElementById('supExpCategory').value,
        description: document.getElementById('supExpDesc').value.trim(),
        amount: amount,
        receipt: document.getElementById('supExpReceipt').value.trim(),
        createdAt: new Date().toISOString()
    };

    DB.add('expenses', expense);

    ['supExpDesc', 'supExpAmount', 'supExpReceipt'].forEach(id => {
        document.getElementById(id).value = '';
    });
    hideSupExpenseForm();
    loadSupAccounting();
}

function deleteSupExpense(id) {
    if (!confirm('למחוק הוצאה זו?')) return;
    const expenses = DB.get('expenses').filter(e => e.id !== id);
    DB.set('expenses', expenses);
    loadSupAccounting();
}

// Save supplier to storage
function saveSupplier() {
    const suppliers = DB.get('suppliers');
    const index = suppliers.findIndex(s => s.id === currentSupplier.id);
    if (index !== -1) {
        suppliers[index] = currentSupplier;
        DB.set('suppliers', suppliers);
    }
}
