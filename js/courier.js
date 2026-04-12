/* ===================== */
/* TikiTaka - Courier    */
/* ===================== */

let courierMap = null;
let courierMarker = null;
let courierPos = null;
let currentCourier = null;
let watchId = null;

// Ofakim center
const OFAKIM_CENTER = [31.3133, 34.6200];

function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}

let isOnShift = false;

// Login
function courierLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('courierPhone').value.trim();
    const name = document.getElementById('courierName').value.trim();

    currentCourier = { phone, name, id: 'cur_' + phone };

    // Save courier location data
    let couriers = DB.get('couriers');
    let existing = couriers.find(c => c.phone === phone);
    if (!existing) {
        couriers.push({ phone, name, id: currentCourier.id, lat: OFAKIM_CENTER[0], lng: OFAKIM_CENTER[1], active: false });
        DB.set('couriers', couriers);
        isOnShift = false;
    } else {
        currentCourier.id = existing.id;
        isOnShift = existing.active || false;
    }

    document.getElementById('courierLogin').style.display = 'none';
    document.getElementById('courierDashboard').style.display = 'block';
    document.getElementById('cName').textContent = name;

    updateShiftUI();
    initCourierMap();
    loadDeliveries();
    if (isOnShift) startLocationTracking();
}

function courierLogout() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    currentCourier = null;
    isOnShift = false;
    document.getElementById('courierDashboard').style.display = 'none';
    document.getElementById('courierLogin').style.display = 'flex';
}

// Shift toggle
function toggleShift() {
    isOnShift = !isOnShift;

    // Update in storage
    let couriers = DB.get('couriers');
    const idx = couriers.findIndex(c => c.id === currentCourier.id);
    if (idx !== -1) {
        couriers[idx].active = isOnShift;
        DB.set('couriers', couriers);
    }

    updateShiftUI();

    if (isOnShift) {
        startLocationTracking();
    } else {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    }
}

function updateShiftUI() {
    const badge = document.getElementById('courierStatusBadge');
    const btnActive = document.getElementById('btnGoActive');
    const btnEnd = document.getElementById('btnEndShift');

    if (isOnShift) {
        badge.textContent = 'פעיל';
        badge.style.background = '#d1fae5';
        badge.style.color = '#065f46';
        btnActive.style.display = 'none';
        btnEnd.style.display = '';
    } else {
        badge.textContent = 'לא פעיל';
        badge.style.background = '#fee2e2';
        badge.style.color = '#991b1b';
        btnActive.style.display = '';
        btnEnd.style.display = 'none';
    }
}

// Map
function initCourierMap() {
    if (courierMap) courierMap.remove();

    courierMap = L.map('courierMap').setView(OFAKIM_CENTER, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    }).addTo(courierMap);

    // Courier marker
    const courierIcon = L.divIcon({
        className: 'courier-marker',
        html: '<div style="background:#059669;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><i class="fas fa-motorcycle"></i></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    courierMarker = L.marker(OFAKIM_CENTER, { icon: courierIcon }).addTo(courierMap);
    courierMarker.bindPopup('<strong>אני כאן</strong>');

    // Add supplier locations
    const suppliers = DB.get('suppliers');
    suppliers.forEach(s => {
        if (s.lat && s.lng) {
            const supIcon = L.divIcon({
                className: 'supplier-marker',
                html: '<div style="background:#C41E2F;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-store"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            L.marker([s.lat, s.lng], { icon: supIcon }).addTo(courierMap)
                .bindPopup(`<strong>${s.name}</strong><br>${s.address || ''}`);
        }
    });
}

// Location tracking
function startLocationTracking() {
    if (!navigator.geolocation) return;

    watchId = navigator.geolocation.watchPosition(
        pos => {
            courierPos = [pos.coords.latitude, pos.coords.longitude];
            courierMarker.setLatLng(courierPos);

            // Save position
            let couriers = DB.get('couriers');
            const idx = couriers.findIndex(c => c.phone === currentCourier.phone);
            if (idx !== -1) {
                couriers[idx].lat = courierPos[0];
                couriers[idx].lng = courierPos[1];
                couriers[idx].lastUpdate = new Date().toISOString();
                DB.set('couriers', couriers);
            }
        },
        err => {
            console.log('Location error:', err.message);
            // Use Ofakim center as fallback
            courierPos = OFAKIM_CENTER;
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
}

function centerOnMe() {
    if (courierPos) {
        courierMap.setView(courierPos, 16);
    } else {
        courierMap.setView(OFAKIM_CENTER, 15);
    }
}

// Navigation
function startNavigation() {
    const activeOrder = getActiveOrder();
    if (!activeOrder) return;

    const dest = activeOrder.deliveryAddress || 'אופקים';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    window.open(url, '_blank');
}

function navigateTo(address) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address + ', אופקים')}&travelmode=driving`;
    window.open(url, '_blank');
}

function getActiveOrder() {
    const orders = DB.get('orders');
    return orders.find(o => o.courierId === currentCourier.id && (o.status === 'picked_up' || o.status === 'on_the_way'));
}

// Load deliveries
function loadDeliveries() {
    const orders = DB.get('orders');

    // Active deliveries (assigned to this courier)
    const active = orders.filter(o => o.courierId === currentCourier.id && o.status !== 'delivered' && o.status !== 'cancelled');
    const activeContainer = document.getElementById('activeDeliveries');

    if (active.length === 0) {
        activeContainer.innerHTML = '<p style="text-align:center;color:var(--gray);padding:16px;">אין משלוחים פעילים</p>';
        document.getElementById('navBtn').style.display = 'none';
    } else {
        document.getElementById('navBtn').style.display = '';
        activeContainer.innerHTML = active.map(o => `
            <div class="delivery-card">
                <h4><i class="fas fa-hashtag"></i> ${o.id}</h4>
                <p><i class="fas fa-user"></i> ${o.customerName} | ${o.customerPhone}</p>
                <p><i class="fas fa-map-marker-alt"></i> איסוף: ${o.pickupAddress}</p>
                <p><i class="fas fa-map-pin"></i> יעד: ${o.deliveryAddress}</p>
                ${o.notes ? `<p><i class="fas fa-sticky-note"></i> ${o.notes}</p>` : ''}
                <div class="delivery-actions">
                    ${o.status === 'confirmed' ? `<button class="action-btn approve" onclick="updateDeliveryStatus('${o.id}','picked_up')"><i class="fas fa-box"></i> אספתי</button>` : ''}
                    ${o.status === 'picked_up' ? `<button class="action-btn progress" onclick="updateDeliveryStatus('${o.id}','on_the_way')"><i class="fas fa-motorcycle"></i> בדרך</button>` : ''}
                    ${o.status === 'on_the_way' ? `<button class="action-btn approve" onclick="updateDeliveryStatus('${o.id}','delivered')"><i class="fas fa-check"></i> נמסר</button>` : ''}
                    <button class="action-btn progress" onclick="navigateTo('${o.deliveryAddress}')"><i class="fas fa-route"></i> נווט</button>
                </div>
            </div>
        `).join('');

        // Show destination markers on map
        active.forEach(o => {
            // Simple marker for delivery address
            const delIcon = L.divIcon({
                className: 'delivery-marker',
                html: '<div style="background:#DC2626;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-flag"></i></div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });
            // Place near Ofakim center with slight offset for demo
            const offset = Math.random() * 0.01;
            L.marker([OFAKIM_CENTER[0] + offset, OFAKIM_CENTER[1] + offset], { icon: delIcon })
                .addTo(courierMap)
                .bindPopup(`<strong>יעד: ${o.id}</strong><br>${o.deliveryAddress}`);
        });
    }

    // Available orders (pending/confirmed, not assigned)
    const available = orders.filter(o => (o.status === 'pending' || o.status === 'confirmed') && !o.courierId);
    const availContainer = document.getElementById('availableOrders');

    if (available.length === 0) {
        availContainer.innerHTML = '<p style="text-align:center;color:var(--gray);padding:16px;">אין הזמנות זמינות כרגע</p>';
    } else {
        availContainer.innerHTML = available.map(o => `
            <div class="delivery-card">
                <h4><i class="fas fa-hashtag"></i> ${o.id}</h4>
                <p><i class="fas fa-user"></i> ${o.customerName}</p>
                <p><i class="fas fa-map-marker-alt"></i> איסוף: ${o.pickupAddress}</p>
                <p><i class="fas fa-map-pin"></i> יעד: ${o.deliveryAddress}</p>
                <div class="delivery-actions">
                    <button class="action-btn approve" onclick="claimOrder('${o.id}')"><i class="fas fa-hand-paper"></i> קח הזמנה</button>
                </div>
            </div>
        `).join('');
    }
}

function claimOrder(orderId) {
    const orders = DB.get('orders');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].courierId = currentCourier.id;
        orders[idx].courierName = currentCourier.name;
        orders[idx].courierPhone = currentCourier.phone;
        if (orders[idx].status === 'pending') orders[idx].status = 'confirmed';
        DB.set('orders', orders);
        loadDeliveries();
    }
}

function updateDeliveryStatus(orderId, newStatus) {
    const orders = DB.get('orders');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = newStatus;
        DB.set('orders', orders);
        loadDeliveries();
    }
}

// Refresh every 30 seconds
setInterval(() => {
    if (currentCourier) loadDeliveries();
}, 30000);
