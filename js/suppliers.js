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
        images: [],
        menu: []
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
}

// Logout
function supplierLogout() {
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

// Menu functions
function showAddItem() {
    document.getElementById('addItemForm').style.display = 'block';
}

function hideAddItem() {
    document.getElementById('addItemForm').style.display = 'none';
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemDesc').value = '';
}

function addMenuItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);
    const desc = document.getElementById('itemDesc').value.trim();

    if (!name || !price) {
        alert('נא למלא שם ומחיר');
        return;
    }

    if (!currentSupplier.menu) currentSupplier.menu = [];
    currentSupplier.menu.push({ name, price, description: desc });
    saveSupplier();
    loadMenu();
    hideAddItem();
}

function deleteMenuItem(index) {
    if (confirm('למחוק פריט זה?')) {
        currentSupplier.menu.splice(index, 1);
        saveSupplier();
        loadMenu();
    }
}

function loadMenu() {
    const container = document.getElementById('menuItems');
    const menu = currentSupplier.menu || [];

    if (menu.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">אין פריטים בתפריט. הוסף את הפריט הראשון!</p>';
        return;
    }

    container.innerHTML = menu.map((item, i) => `
        <div class="menu-item">
            <div class="menu-item-info">
                <h4>${item.name}</h4>
                <p>${item.description || ''}</p>
            </div>
            <div class="menu-item-actions">
                <span class="menu-item-price">₪${item.price}</span>
                <button class="delete-btn" onclick="deleteMenuItem(${i})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Photo functions
function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        if (!currentSupplier.images) currentSupplier.images = [];
        currentSupplier.images.push(event.target.result);
        saveSupplier();
        loadPhotos();
    };
    reader.readAsDataURL(file);
}

function deletePhoto(index) {
    if (confirm('למחוק תמונה זו?')) {
        currentSupplier.images.splice(index, 1);
        saveSupplier();
        loadPhotos();
    }
}

function loadPhotos() {
    const container = document.getElementById('photoGallery');
    const images = currentSupplier.images || [];

    if (images.length === 0) {
        container.innerHTML = '<div class="photo-placeholder"><i class="fas fa-images" style="font-size:48px;margin-bottom:12px;display:block;"></i><p>אין תמונות. העלה את התמונה הראשונה!</p></div>';
        return;
    }

    container.innerHTML = images.map((img, i) => `
        <div class="photo-item">
            <img src="${img}" alt="תמונה ${i + 1}">
            <button class="photo-delete" onclick="deletePhoto(${i})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
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
    document.getElementById('profName').value = currentSupplier.name || '';
    document.getElementById('profDesc').value = currentSupplier.description || '';
    document.getElementById('profPhone').value = currentSupplier.phone || '';
    document.getElementById('profEmail').value = currentSupplier.email || '';
    document.getElementById('profAddress').value = currentSupplier.address || '';
}

function updateProfile(e) {
    e.preventDefault();
    currentSupplier.name = document.getElementById('profName').value;
    currentSupplier.description = document.getElementById('profDesc').value;
    currentSupplier.phone = document.getElementById('profPhone').value;
    currentSupplier.email = document.getElementById('profEmail').value;
    currentSupplier.address = document.getElementById('profAddress').value;
    saveSupplier();
    document.getElementById('supplierName').textContent = currentSupplier.name;
    alert('הפרופיל עודכן בהצלחה!');
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

// Override showSupTab to init map
const origShowSupTab = showSupTab;
showSupTab = function(tab) {
    origShowSupTab(tab);
    if (tab === 'location') {
        setTimeout(() => {
            initSupplierMap();
            if (supplierMap) supplierMap.invalidateSize();
        }, 100);
    }
};

// Save supplier to storage
function saveSupplier() {
    const suppliers = DB.get('suppliers');
    const index = suppliers.findIndex(s => s.id === currentSupplier.id);
    if (index !== -1) {
        suppliers[index] = currentSupplier;
        DB.set('suppliers', suppliers);
    }
}
