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

// Save supplier to storage
function saveSupplier() {
    const suppliers = DB.get('suppliers');
    const index = suppliers.findIndex(s => s.id === currentSupplier.id);
    if (index !== -1) {
        suppliers[index] = currentSupplier;
        DB.set('suppliers', suppliers);
    }
}
