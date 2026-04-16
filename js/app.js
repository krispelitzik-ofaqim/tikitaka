/* ===================== */
/* TikiTaka - Main App   */
/* ===================== */

// Data Store (localStorage)
const DB = {
    get(key) {
        return JSON.parse(localStorage.getItem(`tikitaka_${key}`) || '[]');
    },
    set(key, data) {
        localStorage.setItem(`tikitaka_${key}`, JSON.stringify(data));
    },
    add(key, item) {
        const data = this.get(key);
        data.push(item);
        this.set(key, data);
        return item;
    }
};

// Get all products belonging to a specific supplier
function getSupplierProducts(supplierId) {
    return DB.get('products').filter(p => p.supplierId === supplierId);
}

// Get rating summary for a supplier
function getSupplierRating(supplierId) {
    const reviews = DB.get('reviews').filter(r => r.supplierId === supplierId);
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((s, r) => s + (r.stars || 0), 0);
    return { avg: (sum / reviews.length), count: reviews.length };
}

function getCurrentDaypart() {
    const h = new Date().getHours();
    if (h >= 6 && h < 11) return 'breakfast';
    if (h >= 11 && h < 16) return 'lunch';
    if (h >= 16 && h < 22) return 'dinner';
    return 'latenight';
}

function matchesCurrentDaypart(product) {
    if (!product.daypart || product.daypart === 'all') return true;
    return product.daypart === getCurrentDaypart();
}

// Icon catalogs — all entities of a type share one color, only the shape changes
const BUSINESS_COLOR = '#C41E2F';
const COURIER_COLOR = '#059669';
const CUSTOMER_COLOR = '#2563EB';

const BUSINESS_ICONS = [
    { key: 'food', label: 'אוכל', icon: 'fa-utensils', color: BUSINESS_COLOR },
    { key: 'flowers', label: 'פרחים', icon: 'fa-seedling', color: BUSINESS_COLOR },
    { key: 'documents', label: 'מסמכים', icon: 'fa-file-lines', color: BUSINESS_COLOR },
    { key: 'sweets', label: 'מתוקים', icon: 'fa-candy-cane', color: BUSINESS_COLOR },
    { key: 'international', label: 'חבילות חו"ל', icon: 'fa-plane-departure', color: BUSINESS_COLOR },
    { key: 'institutions', label: 'מוסדות', icon: 'fa-building', color: BUSINESS_COLOR }
];

const COURIER_ICONS = [
    { key: 'bike', label: 'אופניים', icon: 'fa-bicycle', color: COURIER_COLOR },
    { key: 'scooter', label: 'וספה', icon: 'fa-motorcycle', color: COURIER_COLOR },
    { key: 'car', label: 'רכב', icon: 'fa-car', color: COURIER_COLOR },
    { key: 'van', label: 'טנדר', icon: 'fa-truck', color: COURIER_COLOR },
    { key: 'drone', label: 'רחפן', icon: 'fa-helicopter', color: COURIER_COLOR },
    { key: 'walking', label: 'הולך רגל', icon: 'fa-person-walking', color: COURIER_COLOR },
    { key: 'runner', label: 'רץ מהיר', icon: 'fa-person-running', color: COURIER_COLOR },
    { key: 'eco', label: 'קורקינט חשמלי', icon: 'fa-bolt', color: COURIER_COLOR }
];

const CUSTOMER_AVATARS = [
    { key: 'customer', label: 'לקוח', icon: 'fa-user', color: CUSTOMER_COLOR }
];

const INSTITUTION_COLOR = '#DC2626';
const INSTITUTION_ICONS = [
    { key: 'school', label: 'בית ספר', icon: 'fa-school', color: INSTITUTION_COLOR },
    { key: 'kindergarten', label: 'גן ילדים', icon: 'fa-child', color: INSTITUTION_COLOR },
    { key: 'university', label: 'אוניברסיטה / מכללה', icon: 'fa-user-graduate', color: INSTITUTION_COLOR },
    { key: 'synagogue', label: 'בית כנסת', icon: 'fa-star-of-david', color: INSTITUTION_COLOR },
    { key: 'office', label: 'משרד / חברה', icon: 'fa-briefcase', color: INSTITUTION_COLOR },
    { key: 'hospital', label: 'בית חולים / מרפאה', icon: 'fa-hospital', color: INSTITUTION_COLOR },
    { key: 'municipal', label: 'מוסד עירוני', icon: 'fa-landmark', color: INSTITUTION_COLOR },
    { key: 'army', label: 'בסיס צבאי', icon: 'fa-shield-halved', color: INSTITUTION_COLOR },
    { key: 'welfare', label: 'מוסד רווחה', icon: 'fa-hands-holding-child', color: INSTITUTION_COLOR },
    { key: 'youth', label: 'מועדון נוער', icon: 'fa-users', color: INSTITUTION_COLOR }
];

function getIconDef(key, set) {
    return set.find(i => i.key === key) || set[0];
}

function renderIconPicker(containerId, set, currentKey, fieldName) {
    const html = set.map(i => `
        <label class="icon-pick" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:2px solid ${i.key === currentKey ? i.color : '#e0e0e0'};border-radius:10px;background:${i.key === currentKey ? i.color + '15' : '#fff'};transition:all 0.2s;min-width:70px;">
            <input type="radio" name="${fieldName}" value="${i.key}" ${i.key === currentKey ? 'checked' : ''} style="display:none;" onchange="document.querySelectorAll('[data-picker=&quot;${fieldName}&quot;] .icon-pick').forEach(el => { el.style.border='2px solid #e0e0e0'; el.style.background='#fff'; }); this.parentElement.style.border='2px solid ${i.color}'; this.parentElement.style.background='${i.color}15';">
            <i class="fas ${i.icon}" style="font-size:24px;color:${i.color};"></i>
            <span style="font-size:11px;color:#666;text-align:center;">${i.label}</span>
        </label>
    `).join('');
    const container = document.getElementById(containerId);
    if (container) {
        container.setAttribute('data-picker', fieldName);
        container.innerHTML = html;
    }
}

function renderStars(avg) {
    const full = Math.round(avg);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= full
            ? '<i class="fas fa-star" style="color:#FFB800;"></i>'
            : '<i class="far fa-star" style="color:#ccc;"></i>';
    }
    return html;
}

// One-time migration: convert legacy supplier.menu arrays → products with supplierId
function migrateSupplierMenus() {
    const suppliers = DB.get('suppliers');
    let migrated = false;
    suppliers.forEach(s => {
        if (Array.isArray(s.menu) && s.menu.length > 0) {
            const products = DB.get('products');
            s.menu.forEach((item, i) => {
                products.push({
                    id: 'PRD-' + s.id + '-' + i + '-' + Date.now().toString().slice(-4),
                    supplierId: s.id,
                    name: item.name,
                    description: item.description || '',
                    price: item.price || 0,
                    category: s.category || 'other',
                    unit: 'unit',
                    stock: 0,
                    minOrder: 1,
                    image: null,
                    addons: [],
                    notes: '',
                    forInstitutions: true,
                    supplier: s.name,
                    location: s.address || '',
                    createdAt: new Date().toISOString()
                });
            });
            DB.set('products', products);
            s.menu = [];
            migrated = true;
        }
    });
    if (migrated) DB.set('suppliers', suppliers);
}

// Initialize sample data
function initData() {
    if (DB.get('initialized').length === 0) {
        DB.set('suppliers', [
            {
                id: 'sup1',
                name: 'מעדני אופקים',
                category: 'food',
                description: 'מעדנייה מקומית עם מגוון מנות ביתיות',
                phone: '050-1234567',
                email: 'maadaney@example.com',
                address: 'רחוב הרצל 15, אופקים',
                isActive: true,
                images: [],
                menu: [
                    { name: 'חומוס מלא', price: 35, description: 'חומוס עם פול, חציל וביצה' },
                    { name: 'שקשוקה', price: 42, description: 'שקשוקה ביתית עם לחם' },
                    { name: 'סלט ישראלי', price: 28, description: 'סלט טרי עם ירקות מהגינה' }
                ]
            },
            {
                id: 'sup2',
                name: 'קונדיטוריית שמחה',
                category: 'food',
                description: 'עוגות, מאפים ומתוקים לכל אירוע',
                phone: '050-7654321',
                email: 'simcha@example.com',
                address: 'רחוב בן גוריון 8, אופקים',
                isActive: true,
                images: [],
                menu: [
                    { name: 'עוגת שוקולד', price: 120, description: 'עוגת שוקולד בלגי עשירה' },
                    { name: 'בורקס גבינה', price: 15, description: 'בורקס טרי במילוי גבינה' },
                    { name: 'עוגיות חמאה', price: 45, description: 'מגש עוגיות חמאה ביתיות' }
                ]
            },
            {
                id: 'sup3',
                name: 'שליחויות מהירות',
                category: 'documents',
                description: 'שירות שליחויות מסמכים מהיר ואמין',
                phone: '050-9876543',
                email: 'fast@example.com',
                address: 'רחוב ויצמן 3, אופקים',
                isActive: true,
                images: [],
                menu: [
                    { name: 'משלוח מסמך רגיל', price: 25, description: 'משלוח מסמך בתוך העיר' },
                    { name: 'משלוח דחוף', price: 45, description: 'משלוח דחוף תוך 30 דקות' },
                    { name: 'חבילה קטנה', price: 35, description: 'משלוח חבילה עד 2 ק"ג' }
                ]
            }
        ]);

        DB.set('orders', []);
        DB.set('initialized', [true]);
    }
}

initData();
migrateSupplierMenus();

// Toggle mobile menu
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// Submit order
// REMOVED: submitOrder() was dead code — not called from any HTML, and its DOM
// elements (customerName, customerPhone, orderForm, etc.) do not exist.
// function submitOrder(e) { ... }

// Close modal
function closeModal() {
    document.getElementById('orderModal').classList.remove('open');
}

// Track order by phone number — most recent matching order
function trackByPhone() {
    const raw = document.getElementById('trackPhone').value.trim();
    if (!raw) return;
    const norm = s => String(s || '').replace(/[^\d]/g, '');
    const phone = norm(raw);
    if (!phone) return;
    const orders = DB.get('orders').filter(o => norm(o.customerPhone) === phone);
    const resultDiv = document.getElementById('trackResult');
    if (orders.length === 0) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<p style="text-align:center;color:#C41E2F;font-weight:700;padding:20px;">לא נמצאו הזמנות עבור מספר זה.</p>';
        return;
    }
    // Most recent first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const order = orders[0];
    document.getElementById('trackPhone').dataset.foundOrderId = order.id;
    showOrderTracking(order, orders.length);
}

function showOrderTracking(order, totalForCustomer) {
    const resultDiv = document.getElementById('trackResult');
    // Reset to template if it was overwritten
    if (!resultDiv.querySelector('.track-status')) {
        resultDiv.innerHTML = `
            <div class="track-status">
                <div class="track-step"><div class="step-icon"><i class="fas fa-clipboard-check"></i></div><span>התקבל</span></div>
                <div class="track-line"></div>
                <div class="track-step"><div class="step-icon"><i class="fas fa-check-circle"></i></div><span>אושר</span></div>
                <div class="track-line"></div>
                <div class="track-step"><div class="step-icon"><i class="fas fa-box"></i></div><span>נאסף</span></div>
                <div class="track-line"></div>
                <div class="track-step"><div class="step-icon"><i class="fas fa-motorcycle"></i></div><span>בדרך</span></div>
                <div class="track-line"></div>
                <div class="track-step"><div class="step-icon"><i class="fas fa-house"></i></div><span>נמסר</span></div>
            </div>`;
    }
    resultDiv.style.display = 'block';
    const header = document.createElement('div');
    header.style.cssText = 'text-align:center;padding:12px;background:#fff;border-radius:8px;margin-bottom:12px;';
    header.innerHTML = `<strong>${order.customerName || ''}</strong> · הזמנה <strong>${order.id}</strong>` +
        (totalForCustomer > 1 ? ` <span style="color:#666;font-size:12px;">(מתוך ${totalForCustomer} הזמנות)</span>` : '');
    if (resultDiv.firstChild && !resultDiv.firstChild.classList?.contains('track-header')) {
        header.classList.add('track-header');
        resultDiv.insertBefore(header, resultDiv.firstChild);
    }
    const steps = resultDiv.querySelectorAll('.track-step');
    const lines = resultDiv.querySelectorAll('.track-line');
    const statusMap = { 'pending': 0, 'confirmed': 1, 'picked_up': 2, 'on_the_way': 3, 'delivered': 4 };
    const activeIndex = statusMap[order.status] || 0;
    steps.forEach((step, i) => step.classList.toggle('active', i <= activeIndex));
    lines.forEach((line, i) => { line.style.opacity = i < activeIndex ? '1' : '0.3'; });
    showCourierOnMap(order);
}

// Customer sell modal
let sellImagesData = [];

function openSellModal() {
    const m = document.getElementById('sellModal');
    if (m) m.classList.add('open');
}
function closeSellModal() {
    const m = document.getElementById('sellModal');
    if (m) m.classList.remove('open');
}

function previewSellImages(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
            sellImagesData.push(ev.target.result);
            renderSellPreviews();
        };
        reader.readAsDataURL(file);
    });
}

function renderSellPreviews() {
    const wrap = document.getElementById('sellImagesPreview');
    if (!wrap) return;
    wrap.innerHTML = sellImagesData.map((src, i) => `
        <div style="position:relative;">
            <img src="${src}" style="width:90px;height:90px;object-fit:cover;border-radius:8px;border:2px solid #EA580C;">
            <button type="button" onclick="removeSellImage(${i})" style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;background:#dc3545;color:white;border:none;cursor:pointer;">×</button>
        </div>
    `).join('');
}

function removeSellImage(i) {
    sellImagesData.splice(i, 1);
    renderSellPreviews();
}

function submitSellItem(e) {
    e.preventDefault();
    if (sellImagesData.length === 0) {
        if (!confirm('לא העלית תמונות. להמשיך בכל זאת?')) return;
    }
    const product = {
        id: 'CP-' + Date.now().toString().slice(-6),
        name: document.getElementById('sellName').value.trim(),
        price: parseFloat(document.getElementById('sellPrice').value) || 0,
        category: document.getElementById('sellCategory').value,
        description: document.getElementById('sellDesc').value.trim(),
        sellerName: document.getElementById('sellSellerName').value.trim(),
        sellerPhone: document.getElementById('sellSellerPhone').value.trim(),
        images: sellImagesData.slice(),
        image: sellImagesData[0] || null,
        status: 'available',
        createdAt: new Date().toISOString()
    };
    DB.add('customerProducts', product);
    alert('המוצר שלך פורסם! נציג ייצור איתך קשר אם מישהו יתעניין.');
    // Reset
    ['sellName', 'sellPrice', 'sellDesc', 'sellSellerName', 'sellSellerPhone'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    sellImagesData = [];
    renderSellPreviews();
    closeSellModal();
}

// Rental modal (bikes & scooters)
const RENTAL_RATES = {
    bike_electric: { hour: 15, day: 50, label: 'אופניים חשמליים' },
    bike_regular: { hour: 10, day: 35, label: 'אופניים רגילים' },
    scooter: { hour: 18, day: 60, label: 'קורקינט חשמלי' }
};

function openRentalModal() {
    const m = document.getElementById('rentalModal');
    if (m) m.classList.add('open');
    // Reset
    document.querySelectorAll('#rentalTypePicker label').forEach((l, i) => {
        l.style.border = i === 0 ? '2px solid #10B981' : '2px solid #e0e0e0';
        l.style.background = i === 0 ? '#d1fae5' : '#fff';
    });
    document.querySelectorAll('#rentalTypePicker input').forEach((el, i) => { el.checked = i === 0; });
    document.querySelectorAll('#rentalTypePicker label').forEach(l => {
        l.onclick = function() {
            document.querySelectorAll('#rentalTypePicker label').forEach(x => { x.style.border = '2px solid #e0e0e0'; x.style.background = '#fff'; });
            this.style.border = '2px solid #10B981';
            this.style.background = '#d1fae5';
            this.querySelector('input').checked = true;
            updateRentalPrice();
        };
    });
    updateRentalPrice();
}

function closeRentalModal() {
    const m = document.getElementById('rentalModal');
    if (m) m.classList.remove('open');
}

function updateRentalPrice() {
    const type = document.querySelector('#rentalTypePicker input:checked').value;
    const duration = document.getElementById('rentalDuration').value;
    const qty = parseInt(document.getElementById('rentalQty').value) || 1;
    const rate = RENTAL_RATES[type][duration];
    const total = rate * qty;
    document.getElementById('rentalPriceAmount').textContent = '₪' + total;
}

function submitRental(e) {
    e.preventDefault();
    const type = document.querySelector('#rentalTypePicker input:checked').value;
    const duration = document.getElementById('rentalDuration').value;
    const qty = parseInt(document.getElementById('rentalQty').value) || 1;
    const rate = RENTAL_RATES[type][duration];
    const total = rate * qty;
    const rental = {
        id: 'RN-' + Date.now().toString().slice(-6),
        type,
        typeLabel: RENTAL_RATES[type].label,
        duration,
        qty,
        rate,
        total,
        pickup: document.getElementById('rentalPickup').value,
        customerName: document.getElementById('rentalName').value.trim(),
        customerPhone: document.getElementById('rentalPhone').value.trim(),
        status: 'active',
        createdAt: new Date().toISOString()
    };
    DB.add('rentals', rental);
    closeRentalModal();
    document.getElementById('orderNumber').textContent = rental.id;
    document.getElementById('orderModal').classList.add('open');
    ['rentalName', 'rentalPhone'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

// Taxi modal + map picker + tracking + history + rating
let taxiModalMap = null;
let pendingTaxiRequest = false;
let taxiFromMarker = null;
let taxiToMarker = null;
let taxiFromLatLng = null;
let taxiToLatLng = null;
let taxiNearbyMarkers = [];
let taxiTrackingInterval = null;
let trackingMap = null;
let selectedRatingStars = 0;
const OFAKIM_CENTER = [31.3133, 34.6200];

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function haversineKm(a, b) {
    const toRad = d => d * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}

function getMyProfile() {
    try {
        const stored = JSON.parse(localStorage.getItem('tikitaka_myProfile') || 'null');
        return stored || window._sessionProfile || null;
    }
    catch (e) { return window._sessionProfile || null; }
}

function saveMyProfile(profile) {
    localStorage.setItem('tikitaka_myProfile', JSON.stringify(profile));
}

// Simulated PCI-compliant tokenization (in production this would call Stripe/Tranzila)
function tokenizeCard(cardNumber, expiry, cvv, holder) {
    const digits = String(cardNumber).replace(/\D/g, '');
    const last4 = digits.slice(-4);
    let brand = 'Card';
    if (/^4/.test(digits)) brand = 'Visa';
    else if (/^5[1-5]/.test(digits)) brand = 'Mastercard';
    else if (/^3[47]/.test(digits)) brand = 'American Express';
    else if (/^6/.test(digits)) brand = 'Isracard';
    // Generate a random token — raw card data is NEVER persisted
    const token = 'tok_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    return { token, last4, brand, holder, createdAt: new Date().toISOString() };
}

function hideAllTaxiSteps() {
    ['taxiStepRequest', 'taxiStepTracking', 'taxiStepHistory', 'taxiStepRating', 'taxiStepCard']
        .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
}

function openTaxiModal() {
    const m = document.getElementById('taxiModal');
    if (m) m.classList.add('open');
    document.body.classList.add('uber-open');

    hideAllTaxiSteps();
    document.getElementById('taxiStepRequest').style.display = 'block';

    const profile = getMyProfile();
    const nameEl = document.getElementById('taxiName');
    const phoneEl = document.getElementById('taxiPhone');
    if (profile) {
        if (nameEl) nameEl.value = profile.name || '';
        if (phoneEl) phoneEl.value = profile.phone || '';
        const payEl = document.getElementById('taxiPayment');
        if (payEl) payEl.value = profile.card && profile.card.token ? 'app' : 'cash';
        renderSavedCardBadge();
    }
    initTaxiModalMap();
}

function renderSavedCardBadge() {
    const profile = getMyProfile();
    const payGroup = document.getElementById('taxiPayment');
    if (!payGroup) return;
    let badge = document.getElementById('savedCardBadge');
    if (!profile || !profile.card) { if (badge) badge.remove(); return; }
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'savedCardBadge';
        badge.style.cssText = 'background:#d1fae5;border:1px solid #059669;border-radius:8px;padding:8px 12px;margin-top:6px;font-size:12px;display:flex;justify-content:space-between;align-items:center;';
        payGroup.parentElement.appendChild(badge);
    }
    badge.innerHTML = `
        <span><i class="fas fa-credit-card" style="color:#059669;"></i> ${profile.card.brand} •••• ${profile.card.last4} (${profile.card.holder})</span>
        <button type="button" onclick="removeSavedCard()" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:12px;"><i class="fas fa-trash"></i></button>
    `;
}

function removeSavedCard() {
    if (!confirm('להסיר את הכרטיס השמור?')) return;
    localStorage.removeItem('tikitaka_myProfile');
    const b = document.getElementById('savedCardBadge'); if (b) b.remove();
    alert('הכרטיס הוסר.');
    closeTaxiModal();
}

function openCardEntry() {
    hideAllTaxiSteps();
    document.getElementById('taxiStepCard').style.display = 'block';
    const profile = getMyProfile();
    if (profile) {
        document.getElementById('profName2').value = profile.name || '';
        document.getElementById('profPhone2').value = profile.phone || '';
    }
}

function skipCardEntry() {
    hideAllTaxiSteps();
    document.getElementById('taxiStepRequest').style.display = 'block';
    const payEl = document.getElementById('taxiPayment');
    if (payEl) payEl.value = 'cash';
    initTaxiModalMap();
}

function formatCardNumber(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 16);
    el.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatCardExpiry(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    el.value = v;
}

function luhnValid(num) {
    const digits = String(num).replace(/\D/g, '');
    if (digits.length < 12) return false;
    let sum = 0, alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i]);
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n; alt = !alt;
    }
    return sum % 10 === 0;
}

function saveCardProfile(e) {
    e.preventDefault();
    const name = document.getElementById('profName2').value.trim();
    const phone = document.getElementById('profPhone2').value.trim();
    const holder = document.getElementById('cardHolder').value.trim();
    const cardNumber = document.getElementById('cardNumber').value;
    const expiry = document.getElementById('cardExpiry').value;
    const cvv = document.getElementById('cardCvv').value;
    const nationalId = document.getElementById('cardId').value.trim();

    if (!luhnValid(cardNumber)) { alert('מספר כרטיס לא תקין'); return; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { alert('תוקף לא תקין (MM/YY)'); return; }
    if (!/^\d{3,4}$/.test(cvv)) { alert('CVV לא תקין'); return; }
    if (!/^\d{9}$/.test(nationalId)) { alert('ת"ז חייבת להיות 9 ספרות'); return; }

    // Tokenize — raw card is discarded after this call
    const card = tokenizeCard(cardNumber, expiry, cvv, holder);

    const profile = {
        name, phone,
        nationalIdMasked: nationalId.slice(0, 3) + '***' + nationalId.slice(-1),
        card,
        updatedAt: new Date().toISOString()
    };
    const saveMode = (document.getElementById('cardSaveMode') || {}).value || 'persist';
    const shouldPersist = saveMode === 'persist';
    if (shouldPersist) {
        saveMyProfile(profile);
    } else {
        window._sessionProfile = profile;
    }

    // Clear raw fields from memory
    ['cardHolder', 'cardNumber', 'cardExpiry', 'cardCvv', 'cardId', 'profName2', 'profPhone2']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    if (shouldPersist) alert(`כרטיס ${card.brand} •••• ${card.last4} נשמר בהצלחה!`);
    hideAllTaxiSteps();
    document.getElementById('taxiStepRequest').style.display = 'block';
    document.getElementById('taxiName').value = name;
    document.getElementById('taxiPhone').value = phone;
    document.getElementById('taxiPayment').value = 'app';
    renderSavedCardBadge();
    if (pendingTaxiRequest && taxiToLatLng) {
        pendingTaxiRequest = false;
        submitTaxiRequest({ preventDefault: () => {} });
    } else {
        pendingTaxiRequest = false;
        initTaxiModalMap();
    }
}

function closeTaxiModal() {
    const m = document.getElementById('taxiModal');
    if (m) m.classList.remove('open');
    document.body.classList.remove('uber-open');
    if (taxiTrackingInterval) { clearInterval(taxiTrackingInterval); taxiTrackingInterval = null; }
}

let taxiDestSearchTimer = null;
const OFAKIM_BBOX = { south: 31.28, west: 34.58, north: 31.35, east: 34.68 };

function onTaxiDestInput() {
    estimateTaxiPrice();
    const q = (document.getElementById('taxiTo').value || '').trim();
    if (taxiDestSearchTimer) clearTimeout(taxiDestSearchTimer);
    if (q.length < 2) {
        const box = document.getElementById('taxiDestSuggest');
        if (box) box.classList.remove('open');
        return;
    }
    taxiDestSearchTimer = setTimeout(() => searchTaxiDestinations(q), 280);
}

function searchTaxiDestinations(query) {
    const box = document.getElementById('taxiDestSuggest');
    if (!box) return;
    const viewbox = `${OFAKIM_BBOX.west},${OFAKIM_BBOX.north},${OFAKIM_BBOX.east},${OFAKIM_BBOX.south}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&accept-language=he&countrycodes=il&limit=8&addressdetails=1&viewbox=${viewbox}&bounded=1&q=${encodeURIComponent(query + ' אופקים')}`;
    box.classList.add('open');
    box.innerHTML = '<div class="uber-suggest-empty">מחפש...</div>';
    fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(r => r.json())
        .then(results => {
            if (!results || results.length === 0) {
                box.innerHTML = '<div class="uber-suggest-empty">לא נמצאו תוצאות</div>';
                return;
            }
            box.innerHTML = results.map((r, i) => {
                const a = r.address || {};
                const street = a.road || a.pedestrian || a.neighbourhood || '';
                const house = a.house_number ? ' ' + a.house_number : '';
                const city = a.city || a.town || a.village || 'אופקים';
                const label = (street ? street + house : (r.display_name || '').split(',')[0]) || 'מיקום';
                const sub = city;
                return `<div class="uber-suggest-item" onclick="selectTaxiDest(${i})">
                    <div class="pin"><i class="fas fa-map-marker-alt"></i></div>
                    <div><div class="label">${escapeHtml(label)}</div><div class="sub">${escapeHtml(sub)}</div></div>
                </div>`;
            }).join('');
            box._results = results;
        })
        .catch(() => {
            box.innerHTML = '<div class="uber-suggest-empty">שגיאה בחיפוש</div>';
        });
}

function selectTaxiDest(idx) {
    const box = document.getElementById('taxiDestSuggest');
    if (!box || !box._results) return;
    const r = box._results[idx];
    if (!r) return;
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
    const a = r.address || {};
    const street = a.road || a.pedestrian || a.neighbourhood || '';
    const house = a.house_number ? ' ' + a.house_number : '';
    const label = (street ? street + house : (r.display_name || '').split(',')[0]);
    document.getElementById('taxiTo').value = label;
    box.classList.remove('open');

    if (taxiToMarker) { try { taxiModalMap.removeLayer(taxiToMarker); } catch (e) {} }
    taxiToLatLng = [lat, lng];
    if (taxiModalMap) {
        const icon = L.divIcon({ className: '', html: '<div style="background:#C41E2F;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-flag-checkered" style="transform:rotate(45deg);"></i></div>', iconSize: [32, 32], iconAnchor: [16, 32] });
        taxiToMarker = L.marker(taxiToLatLng, { icon }).addTo(taxiModalMap).bindPopup('<strong>יעד</strong>');
        if (taxiFromLatLng) {
            taxiModalMap.eachLayer(l => { if (l instanceof L.Polyline && !(l instanceof L.Polygon)) taxiModalMap.removeLayer(l); });
            L.polyline([taxiFromLatLng, taxiToLatLng], { color: '#C41E2F', weight: 4, dashArray: '6,8' }).addTo(taxiModalMap);
            taxiModalMap.fitBounds([taxiFromLatLng, taxiToLatLng], { padding: [50, 50] });
        } else {
            taxiModalMap.setView(taxiToLatLng, 16);
        }
    }
    estimateTaxiPrice();
}

function recenterTaxiMap() {
    if (!taxiModalMap) return;
    if (taxiFromLatLng) {
        taxiModalMap.setView(taxiFromLatLng, 16, { animate: true });
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => setTaxiOriginFromCoords([pos.coords.latitude, pos.coords.longitude]),
            () => {},
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }
}

function toggleTaxiTime() {
    const when = document.getElementById('taxiWhen').value;
    document.getElementById('taxiTimeWrap').style.display = when === 'scheduled' ? 'block' : 'none';
}

function initTaxiModalMap() {
    if (taxiModalMap) { try { taxiModalMap.remove(); } catch (e) {} taxiModalMap = null; }
    taxiFromMarker = null;
    taxiToMarker = null;
    taxiFromLatLng = null;
    taxiToLatLng = null;
    taxiNearbyMarkers = [];
    setTimeout(() => {
        const el = document.getElementById('taxiModalMap');
        if (!el || typeof L === 'undefined') return;
        taxiModalMap = L.map('taxiModalMap').setView(OFAKIM_CENTER, 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 19 }).addTo(taxiModalMap);
        taxiModalMap.on('click', onTaxiMapClick);
        showNearbyDriversOnModalMap();
        detectTaxiOrigin();
    }, 200);
}

function detectTaxiOrigin() {
    const hintEl = document.getElementById('taxiMapHint');
    const fromWrap = document.getElementById('taxiFromWrap');
    const showManual = () => {
        if (hintEl) hintEl.style.display = 'none';
        if (fromWrap) fromWrap.style.display = 'block';
        const fromEl = document.getElementById('taxiFrom');
        if (fromEl) fromEl.required = true;
    };
    if (!navigator.geolocation) { showManual(); return; }
    navigator.geolocation.getCurrentPosition(
        pos => setTaxiOriginFromCoords([pos.coords.latitude, pos.coords.longitude]),
        err => showManual(),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
}

function setTaxiOriginFromCoords(latlng) {
    if (!taxiModalMap) return;
    taxiFromLatLng = latlng;
    if (taxiFromMarker) { try { taxiModalMap.removeLayer(taxiFromMarker); } catch (e) {} }
    const icon = L.divIcon({ className: '', html: '<div style="background:#059669;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-location-crosshairs" style="transform:rotate(45deg);"></i></div>', iconSize: [32, 32], iconAnchor: [16, 32] });
    taxiFromMarker = L.marker(latlng, { icon }).addTo(taxiModalMap).bindPopup('<strong>המיקום שלך</strong>');
    taxiModalMap.setView(latlng, 16);
    const fromEl = document.getElementById('taxiFrom');
    if (fromEl) fromEl.value = `המיקום הנוכחי שלי (${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)})`;
    const labelEl = document.getElementById('taxiOriginLabel');
    if (labelEl) labelEl.textContent = 'המיקום הנוכחי שלי';
    showNearbyDriversOnModalMap();
    if (taxiToLatLng) estimateTaxiPrice();
}

function onTaxiMapClick(e) {
    const latlng = [e.latlng.lat, e.latlng.lng];
    if (taxiToMarker) { try { taxiModalMap.removeLayer(taxiToMarker); } catch (err) {} }
    taxiToLatLng = latlng;
    const icon = L.divIcon({ className: '', html: '<div style="background:#C41E2F;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-flag-checkered" style="transform:rotate(45deg);"></i></div>', iconSize: [32, 32], iconAnchor: [16, 32] });
    taxiToMarker = L.marker(latlng, { icon }).addTo(taxiModalMap).bindPopup('<strong>יעד</strong>');
    document.getElementById('taxiTo').value = `מיקום על המפה (${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)})`;
    if (taxiFromLatLng) {
        taxiModalMap.eachLayer(l => { if (l instanceof L.Polyline && !(l instanceof L.Polygon)) taxiModalMap.removeLayer(l); });
        L.polyline([taxiFromLatLng, taxiToLatLng], { color: '#D4A843', weight: 4, dashArray: '6,8' }).addTo(taxiModalMap);
        taxiModalMap.fitBounds([taxiFromLatLng, taxiToLatLng], { padding: [40, 40] });
    }
    estimateTaxiPrice();
}

function resetTaxiMap() {
    if (!taxiModalMap) return;
    taxiModalMap.eachLayer(l => {
        if (l instanceof L.Marker || (l instanceof L.Polyline && !(l instanceof L.Polygon))) taxiModalMap.removeLayer(l);
    });
    taxiToMarker = null;
    taxiToLatLng = null;
    taxiNearbyMarkers = [];
    const toEl = document.getElementById('taxiTo');
    if (toEl) toEl.value = '';
    const priceEl = document.getElementById('taxiPriceEstimate');
    if (priceEl) priceEl.style.display = 'none';
    if (taxiFromLatLng) {
        setTaxiOriginFromCoords(taxiFromLatLng);
    } else {
        showNearbyDriversOnModalMap();
    }
}

function showNearbyDriversOnModalMap() {
    if (!taxiModalMap) return;
    const drivers = DB.get('drivers').filter(d => d.status === 'available' && d.lat && d.lng);
    const center = taxiFromLatLng || OFAKIM_CENTER;
    const withDist = drivers.map(d => ({ d, km: haversineKm(center, [d.lat, d.lng]) })).sort((a, b) => a.km - b.km).slice(0, 8);
    withDist.forEach(({ d, km }) => {
        const icon = L.divIcon({ className: '', html: '<div style="background:#059669;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fde047;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-taxi"></i></div>', iconSize: [28, 28], iconAnchor: [14, 14] });
        const m = L.marker([d.lat, d.lng], { icon }).addTo(taxiModalMap)
            .bindPopup(`<strong>${d.name}</strong><br>${d.plate || ''}<br>${km.toFixed(1)} ק"מ · ~${Math.round(km * 2)} דק׳`);
        taxiNearbyMarkers.push(m);
    });
    const panel = document.getElementById('taxiNearbyDrivers');
    if (!panel) return;
    if (withDist.length > 0) {
        const closest = withDist[0];
        panel.innerHTML = `<div style="background:#d1fae5;border:1px solid #059669;border-radius:8px;padding:10px;font-size:13px;"><i class="fas fa-taxi" style="color:#059669;"></i> <strong>${withDist.length} נהגים פנויים בסביבה</strong> · הקרוב: ${closest.d.name} (${closest.km.toFixed(1)} ק"מ · ~${Math.round(closest.km * 2)} דק׳)</div>`;
    } else {
        panel.innerHTML = '<div style="background:#fef3c7;border:1px solid #D97706;border-radius:8px;padding:10px;font-size:13px;color:#92400E;"><i class="fas fa-exclamation-triangle"></i> אין נהגים פנויים כרגע באזור</div>';
    }
    panel.style.display = 'block';
}

function getTaxiTariff() {
    const s = JSON.parse(localStorage.getItem('tikitaka_settings') || '{}');
    return {
        baseFare: s.taxiBaseFare !== undefined ? parseFloat(s.taxiBaseFare) : 15,
        perKm: s.taxiPerKm !== undefined ? parseFloat(s.taxiPerKm) : 3,
        nightSurcharge: s.taxiNightSurcharge !== undefined ? parseFloat(s.taxiNightSurcharge) : 25,
        shabbatSurcharge: s.taxiShabbatSurcharge !== undefined ? parseFloat(s.taxiShabbatSurcharge) : 25,
        vehicleMultiplier: { standard: 1, large: 1.3, accessible: 1.2, premium: 1.6 }
    };
}

function estimateTaxiPrice() {
    const from = (document.getElementById('taxiFrom') || {}).value || '';
    const to = (document.getElementById('taxiTo') || {}).value || '';
    const vehicle = (document.getElementById('taxiVehicle') || {}).value || 'standard';
    const wrap = document.getElementById('taxiPriceEstimate');
    if (!from.trim() || !to.trim()) { if (wrap) wrap.style.display = 'none'; return; }

    let km;
    if (taxiFromLatLng && taxiToLatLng) {
        km = Math.max(0.5, haversineKm(taxiFromLatLng, taxiToLatLng));
    } else {
        const hash = (from + '→' + to).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        km = 2 + (hash % 80) / 10;
    }
    const now = new Date();
    const isNight = now.getHours() >= 21 || now.getHours() < 6;
    const isShabbat = (now.getDay() === 5 && now.getHours() >= 15) || now.getDay() === 6;
    let price = calcFixedPrice(km);
    const parts = [`${km.toFixed(1)} ק"מ`];
    if (isNight) { price = Math.round(price * 1.25); parts.push('+25% לילה'); }
    if (isShabbat) { price = Math.round(price * 1.25); parts.push('+25% שבת'); }
    price = Math.round(price);

    document.getElementById('taxiPriceAmount').textContent = '₪' + price;
    parts.unshift('מחיר קבוע');
    document.getElementById('taxiPriceBreakdown').textContent = parts.join(' · ');

    // ETA
    const etaEl = document.getElementById('taxiEta');
    if (etaEl) {
        const drivers = DB.get('drivers').filter(d => d.status === 'available' && d.lat && d.lng);
        if (drivers.length > 0 && taxiFromLatLng) {
            const closest = drivers.map(d => haversineKm(taxiFromLatLng, [d.lat, d.lng])).sort((a, b) => a - b)[0];
            const etaMin = Math.max(1, Math.round(closest * 2 + 1));
            etaEl.innerHTML = `<i class="fas fa-clock"></i> נהג קרוב מגיע בעוד ~${etaMin} דקות`;
        } else {
            etaEl.textContent = '';
        }
    }
    wrap.style.display = 'block';
    return { km, price };
}

function submitTaxiRequest(e) {
    e.preventDefault();
    const profile = getMyProfile();
    if (!profile || !profile.card || !profile.card.token) {
        pendingTaxiRequest = true;
        openCardEntry();
        return;
    }
    const est = estimateTaxiPrice() || { km: 0, price: 0 };
    const when = document.getElementById('taxiWhen').value;
    const ride = {
        id: 'RD-' + Date.now().toString().slice(-6),
        fromAddress: document.getElementById('taxiFrom').value.trim(),
        toAddress: document.getElementById('taxiTo').value.trim(),
        pickupLat: taxiFromLatLng ? taxiFromLatLng[0] : null,
        pickupLng: taxiFromLatLng ? taxiFromLatLng[1] : null,
        dropoffLat: taxiToLatLng ? taxiToLatLng[0] : null,
        dropoffLng: taxiToLatLng ? taxiToLatLng[1] : null,
        passengers: parseInt(document.getElementById('taxiPassengers').value),
        vehicleType: document.getElementById('taxiVehicle').value,
        when: when,
        scheduledAt: when === 'scheduled' ? document.getElementById('taxiTime').value : null,
        customerName: document.getElementById('taxiName').value.trim(),
        customerPhone: document.getElementById('taxiPhone').value.trim(),
        notes: document.getElementById('taxiNotes').value.trim(),
        paymentMethod: (document.getElementById('taxiPayment') || {}).value || 'cash',
        estimatedKm: est.km,
        estimatedPrice: est.price,
        status: 'requested',
        driverId: null,
        createdAt: new Date().toISOString()
    };
    // Attach saved card token if paying via app
    if (ride.paymentMethod === 'app' || ride.paymentMethod === 'card') {
        const profile = getMyProfile();
        if (profile && profile.card) {
            ride.cardToken = profile.card.token;
            ride.cardLast4 = profile.card.last4;
            ride.cardBrand = profile.card.brand;
        }
    }

    DB.add('rides', ride);
    showRideTracking(ride.id);
}

function showRideTracking(rideId) {
    const ride = DB.get('rides').find(r => r.id === rideId);
    if (!ride) return;
    hideAllTaxiSteps();
    const wrap = document.getElementById('taxiStepTracking');
    wrap.style.display = 'block';
    if (!ride._progress && ride.status === 'in_ride') ride._progress = 0;
    buildTrackingUI(ride);
    if (taxiTrackingInterval) clearInterval(taxiTrackingInterval);
    taxiTrackingInterval = setInterval(() => {
        const r = DB.get('rides').find(x => x.id === rideId);
        if (!r) { clearInterval(taxiTrackingInterval); return; }
        advanceRide(r);
        updateTrackingUI(r);
        if (r.status === 'completed') {
            clearInterval(taxiTrackingInterval);
            setTimeout(() => openRatingForRide(rideId), 1200);
        }
    }, 2000);
}

let _trackDriverMarker = null;
let _trackRouteLine = null;
let _trackProgressLine = null;

function advanceRide(ride) {
    if (!ride.pickupLat || !ride.dropoffLat) return;
    const driver = ride.driverId ? DB.get('drivers').find(d => d.id === ride.driverId) : null;
    if (!driver) return;
    const drivers = DB.get('drivers');
    const idx = drivers.findIndex(x => x.id === driver.id);

    if (ride.status === 'on_way_to_pickup') {
        driver.lat += (ride.pickupLat - driver.lat) * 0.18;
        driver.lng += (ride.pickupLng - driver.lng) * 0.18;
        if (idx !== -1) { drivers[idx] = driver; DB.set('drivers', drivers); }
    } else if (ride.status === 'in_ride') {
        if (ride._progress === undefined) ride._progress = 0;
        ride._progress = Math.min(1, ride._progress + 0.06 + Math.random() * 0.04);
        const lat = ride.pickupLat + (ride.dropoffLat - ride.pickupLat) * ride._progress;
        const lng = ride.pickupLng + (ride.dropoffLng - ride.pickupLng) * ride._progress;
        driver.lat = lat;
        driver.lng = lng;
        if (idx !== -1) { drivers[idx] = driver; DB.set('drivers', drivers); }
        const rides = DB.get('rides');
        const ri = rides.find(x => x.id === ride.id);
        if (ri) { ri._progress = ride._progress; DB.set('rides', rides); }
    }
}

function buildTrackingUI(ride) {
    const wrap = document.getElementById('taxiStepTracking');
    const driver = ride.driverId ? DB.get('drivers').find(d => d.id === ride.driverId) : null;

    wrap.innerHTML = `
        <div class="uber-step" style="background:#000;">
            <div id="trackingMapFull" style="position:absolute;inset:0;z-index:1;"></div>
            <div class="uber-topbar" style="z-index:10;">
                <button type="button" class="uber-iconbtn" onclick="closeTaxiModal()" aria-label="סגור">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                <div class="uber-topbar-title" id="trackTopTitle">המונית שלך</div>
                <div style="width:42px;"></div>
            </div>
            <div class="uber-sheet" style="max-height:50vh;">
                <div class="uber-sheet-handle"></div>
                <div id="trackStatusBanner"></div>
                <div id="trackDriverCard" style="margin:8px 0;"></div>
                <div id="trackEtaBar" style="margin:8px 0;"></div>
                <div id="trackRouteInfo" style="margin:8px 0;"></div>
                <div id="trackTimeline" style="margin:10px 0;"></div>
                <div id="trackActions" style="display:flex;gap:8px;margin-top:10px;"></div>
            </div>
        </div>`;
    setTimeout(() => {
        initTrackingMapFull(ride, driver);
        updateTrackingUI(ride);
    }, 150);
}

function updateTrackingUI(ride) {
    const driver = ride.driverId ? DB.get('drivers').find(d => d.id === ride.driverId) : null;
    const isCancelled = ride.status === 'cancelled';
    const statuses = [
        { key: 'requested', label: 'בקשה', icon: 'fa-paper-plane' },
        { key: 'accepted', label: 'אושר', icon: 'fa-check-circle' },
        { key: 'on_way_to_pickup', label: 'בדרך אליך', icon: 'fa-road' },
        { key: 'in_ride', label: 'בנסיעה', icon: 'fa-car-side' },
        { key: 'completed', label: 'הגעת!', icon: 'fa-flag-checkered' }
    ];
    const currentIdx = statuses.findIndex(s => s.key === ride.status);

    const banner = document.getElementById('trackStatusBanner');
    if (banner) {
        const msgs = {
            requested: '<i class="fas fa-spinner fa-spin"></i> מחפש נהג פנוי...',
            accepted: '<i class="fas fa-check-circle"></i> נהג אישר! מתכונן לדרך',
            on_way_to_pickup: '<i class="fas fa-car-side"></i> הנהג בדרך אליך',
            in_ride: '<i class="fas fa-route"></i> בנסיעה ליעד',
            completed: '<i class="fas fa-flag-checkered"></i> הגעת ליעד!',
            cancelled: '<i class="fas fa-times-circle"></i> הנסיעה בוטלה'
        };
        const colors = { requested: '#D4A843', accepted: '#059669', on_way_to_pickup: '#2563EB', in_ride: '#C41E2F', completed: '#059669', cancelled: '#dc3545' };
        const bg = colors[ride.status] || '#D4A843';
        banner.innerHTML = `<div style="background:${bg};color:#fff;border-radius:10px;padding:10px 14px;font-size:14px;font-weight:700;text-align:center;">${msgs[ride.status] || ''}</div>`;
    }

    const dcard = document.getElementById('trackDriverCard');
    if (dcard) {
        if (driver) {
            dcard.innerHTML = `
                <div style="background:#111;border:1px solid #222;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:12px;">
                    ${driver.photo ? `<img src="${driver.photo}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #C41E2F;">` : '<div style="width:48px;height:48px;border-radius:50%;background:#C41E2F;color:white;display:flex;align-items:center;justify-content:center;font-size:20px;"><i class="fas fa-user"></i></div>'}
                    <div style="flex:1;color:#fff;">
                        <strong>${driver.name}</strong><br>
                        <span style="font-size:11px;color:#888;">${driver.plate || ''} · <i class="fas fa-star" style="color:#FFB800;"></i> ${(parseFloat(driver.rating) || 0).toFixed(1)}</span>
                    </div>
                    ${driver.phone ? `<a href="tel:${driver.phone.replace(/[^\d+]/g,'')}" style="background:#059669;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;"><i class="fas fa-phone"></i></a>` : ''}
                </div>`;
        } else {
            dcard.innerHTML = `<div style="background:#111;border-radius:10px;padding:14px;text-align:center;color:#888;"><i class="fas fa-spinner fa-spin"></i> מחפש נהג...</div>`;
        }
    }

    const etaBar = document.getElementById('trackEtaBar');
    if (etaBar && ride.status === 'in_ride') {
        const progress = ride._progress || 0;
        const totalKm = ride.estimatedKm || 3;
        const remainKm = Math.max(0, totalKm * (1 - progress));
        const etaMin = Math.max(1, Math.round(remainKm * 2));
        const pct = Math.round(progress * 100);
        etaBar.innerHTML = `
            <div style="background:#111;border:1px solid #222;border-radius:10px;padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:6px;">
                    <span><i class="fas fa-clock"></i> ~${etaMin} דק׳ ליעד</span>
                    <span>${remainKm.toFixed(1)} ק"מ נותרו</span>
                </div>
                <div style="background:#222;border-radius:6px;height:6px;overflow:hidden;">
                    <div style="background:linear-gradient(90deg,#C41E2F,#F59E0B);width:${pct}%;height:100%;border-radius:6px;transition:width 1.5s ease;"></div>
                </div>
            </div>`;
    } else if (etaBar && ride.status === 'on_way_to_pickup' && driver) {
        const driverDist = (ride.pickupLat && driver.lat) ? haversineKm([ride.pickupLat, ride.pickupLng], [driver.lat, driver.lng]) : 0;
        const etaMin = Math.max(1, Math.round(driverDist * 2 + 1));
        etaBar.innerHTML = `
            <div style="background:#111;border:1px solid #222;border-radius:10px;padding:10px 14px;font-size:13px;color:#fff;text-align:center;">
                <i class="fas fa-car-side" style="color:#2563EB;"></i> הנהג ממך ${driverDist.toFixed(1)} ק"מ · הגעה בעוד ~${etaMin} דק׳
            </div>`;
    } else if (etaBar) {
        etaBar.innerHTML = '';
    }

    const routeInfo = document.getElementById('trackRouteInfo');
    if (routeInfo) {
        routeInfo.innerHTML = `
            <div style="background:#111;border:1px solid #222;border-radius:10px;padding:10px 14px;font-size:12px;color:#aaa;">
                <div style="margin-bottom:4px;"><span style="color:#059669;"><i class="fas fa-circle" style="font-size:8px;"></i></span> ${ride.fromAddress || 'מוצא'}</div>
                <div><span style="color:#C41E2F;"><i class="fas fa-square" style="font-size:8px;"></i></span> ${ride.toAddress || 'יעד'}</div>
                <div style="margin-top:6px;color:#fff;">₪${ride.estimatedPrice || '—'} · ${({cash:'מזומן',card:'אשראי',bit:'ביט',app:'אפליקציה'})[ride.paymentMethod] || '—'}</div>
            </div>`;
    }

    const tl = document.getElementById('trackTimeline');
    if (tl && !isCancelled) {
        tl.innerHTML = `<div style="display:flex;justify-content:space-between;position:relative;">
            <div style="position:absolute;top:14px;left:8%;right:8%;height:3px;background:#222;z-index:0;"></div>
            ${statuses.map((s, i) => `<div style="text-align:center;position:relative;z-index:2;flex:1;">
                <div style="width:30px;height:30px;border-radius:50%;background:${i <= currentIdx ? '#C41E2F' : '#222'};color:${i <= currentIdx ? '#fff' : '#555'};display:inline-flex;align-items:center;justify-content:center;font-size:12px;transition:background 0.5s;"><i class="fas ${s.icon}"></i></div>
                <div style="font-size:9px;margin-top:3px;color:${i <= currentIdx ? '#fff' : '#555'};">${s.label}</div>
            </div>`).join('')}
        </div>`;
    } else if (tl) {
        tl.innerHTML = `<div style="background:#3a0a0a;border:1px solid #dc3545;border-radius:10px;padding:12px;text-align:center;color:#dc3545;font-weight:700;"><i class="fas fa-times-circle"></i> הנסיעה בוטלה</div>`;
    }

    const actions = document.getElementById('trackActions');
    if (actions) {
        const canCancel = ['requested', 'accepted'].includes(ride.status);
        actions.innerHTML = `
            ${canCancel ? `<button onclick="cancelMyRide('${ride.id}')" style="flex:1;background:#dc3545;color:#fff;border:none;border-radius:10px;padding:12px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;"><i class="fas fa-times"></i> בטל</button>` : ''}
            <button onclick="closeTaxiModal()" style="flex:1;background:#222;color:#fff;border:none;border-radius:10px;padding:12px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;">סגור</button>
            ${ride.status === 'completed' ? `<button onclick="backToTaxiRequest()" style="flex:1;background:#C41E2F;color:#fff;border:none;border-radius:10px;padding:12px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;"><i class="fas fa-plus"></i> חדש</button>` : ''}`;
    }

    updateTrackingMapMarker(ride, driver);
}

function initTrackingMapFull(ride, driver) {
    const el = document.getElementById('trackingMapFull');
    if (!el || typeof L === 'undefined') return;
    if (trackingMap) { try { trackingMap.remove(); } catch (e) {} trackingMap = null; }
    _trackDriverMarker = null;
    _trackRouteLine = null;
    _trackProgressLine = null;

    trackingMap = L.map('trackingMapFull', { zoomControl: false }).setView(
        ride.pickupLat && ride.pickupLng ? [ride.pickupLat, ride.pickupLng] : OFAKIM_CENTER, 15
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 19 }).addTo(trackingMap);

    if (ride.pickupLat && ride.pickupLng) {
        L.marker([ride.pickupLat, ride.pickupLng], {
            icon: L.divIcon({ className: '', html: '<div style="background:#059669;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"><i class="fas fa-map-marker-alt" style="transform:rotate(45deg);"></i></div>', iconSize: [32, 32], iconAnchor: [16, 32] })
        }).addTo(trackingMap);
    }
    if (ride.dropoffLat && ride.dropoffLng) {
        L.marker([ride.dropoffLat, ride.dropoffLng], {
            icon: L.divIcon({ className: '', html: '<div style="background:#C41E2F;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"><i class="fas fa-flag-checkered" style="transform:rotate(45deg);"></i></div>', iconSize: [32, 32], iconAnchor: [16, 32] })
        }).addTo(trackingMap);
    }
    if (ride.pickupLat && ride.dropoffLat) {
        _trackRouteLine = L.polyline(
            [[ride.pickupLat, ride.pickupLng], [ride.dropoffLat, ride.dropoffLng]],
            { color: '#444', weight: 4, dashArray: '8,8', opacity: 0.6 }
        ).addTo(trackingMap);
        _trackProgressLine = L.polyline([], { color: '#C41E2F', weight: 5, opacity: 0.9 }).addTo(trackingMap);
    }

    const driverLat = driver ? driver.lat : (ride.pickupLat || OFAKIM_CENTER[0]);
    const driverLng = driver ? driver.lng : (ride.pickupLng || OFAKIM_CENTER[1]);
    _trackDriverMarker = L.marker([driverLat, driverLng], {
        icon: L.divIcon({ className: '', html: '<div style="background:#000;color:#FFB800;width:40px;height:40px;border-radius:50%;border:3px solid #C41E2F;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(196,30,47,0.5);"><i class="fas fa-taxi"></i></div>', iconSize: [40, 40], iconAnchor: [20, 20] })
    }).addTo(trackingMap);

    const pts = [];
    if (ride.pickupLat) pts.push([ride.pickupLat, ride.pickupLng]);
    if (ride.dropoffLat) pts.push([ride.dropoffLat, ride.dropoffLng]);
    if (driver && driver.lat) pts.push([driver.lat, driver.lng]);
    if (pts.length >= 2) trackingMap.fitBounds(pts, { padding: [60, 60] });
}

function updateTrackingMapMarker(ride, driver) {
    if (!trackingMap || !_trackDriverMarker) return;
    if (driver && driver.lat && driver.lng) {
        _trackDriverMarker.setLatLng([driver.lat, driver.lng]);
    }
    if (_trackProgressLine && ride.pickupLat && ride.status === 'in_ride') {
        const progress = ride._progress || 0;
        const curLat = ride.pickupLat + (ride.dropoffLat - ride.pickupLat) * progress;
        const curLng = ride.pickupLng + (ride.dropoffLng - ride.pickupLng) * progress;
        _trackProgressLine.setLatLngs([[ride.pickupLat, ride.pickupLng], [curLat, curLng]]);
    }
}

function renderRideTracking(ride) { updateTrackingUI(ride); }

function renderTrackingMap(ride, driver) { /* replaced by initTrackingMapFull */ }

function openPricingModal() {
    const m = document.getElementById('pricingModal');
    if (m) m.classList.add('open');
    calcPricing();
}

function closePricingModal() {
    const m = document.getElementById('pricingModal');
    if (m) m.classList.remove('open');
}

function calcFixedPrice(km) {
    if (km <= 2) return 15;
    if (km <= 5) return 15 + (km - 2) * 4;
    if (km <= 10) return 15 + 3 * 4 + (km - 5) * 3.5;
    return 15 + 3 * 4 + 5 * 3.5 + (km - 10) * 3;
}

function calcPricing() {
    const input = document.getElementById('pricingCalcKm');
    const result = document.getElementById('pricingCalcResult');
    if (!input || !result) return;
    const km = parseFloat(input.value) || 0;
    result.textContent = '₪' + Math.round(calcFixedPrice(km));
}

function isDayMode() {
    const h = new Date().getHours();
    return h >= 5 && h < 17;
}

function applyDayNightMode() {
    const day = isDayMode();
    document.body.classList.toggle('day-mode', day);
    document.body.classList.toggle('night-mode', !day);
}

applyDayNightMode();
setInterval(applyDayNightMode, 60000);

function cancelMyRide(rideId) {
    if (!confirm('לבטל את הנסיעה?')) return;
    const rides = DB.get('rides');
    const r = rides.find(x => x.id === rideId);
    if (!r) return;
    r.status = 'cancelled';
    DB.set('rides', rides);
    if (r.driverId) {
        const drivers = DB.get('drivers');
        const d = drivers.find(x => x.id === r.driverId);
        if (d) { d.status = 'available'; DB.set('drivers', drivers); }
    }
    renderRideTracking(r);
    if (taxiTrackingInterval) { clearInterval(taxiTrackingInterval); taxiTrackingInterval = null; }
}

function backToTaxiRequest() {
    if (taxiTrackingInterval) { clearInterval(taxiTrackingInterval); taxiTrackingInterval = null; }
    document.getElementById('taxiStepTracking').style.display = 'none';
    document.getElementById('taxiStepRequest').style.display = 'block';
    ['taxiName', 'taxiPhone', 'taxiNotes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    setTimeout(() => initTaxiModalMap(), 100);
}

function openRideHistory() {
    document.getElementById('taxiStepRequest').style.display = 'none';
    document.getElementById('taxiStepTracking').style.display = 'none';
    document.getElementById('taxiStepRating').style.display = 'none';
    const wrap = document.getElementById('taxiStepHistory');
    wrap.style.display = 'block';
    wrap.innerHTML = `
        <h2 style="margin-bottom:8px;"><i class="fas fa-history"></i> הנסיעות שלי</h2>
        <p style="color:#666;font-size:13px;margin-bottom:16px;">הכנס את מספר הטלפון שלך</p>
        <div class="form-group"><input type="tel" id="historyPhone" placeholder="050-0000000" onkeydown="if(event.key==='Enter')loadRideHistory()"></div>
        <button onclick="loadRideHistory()" class="btn btn-primary btn-large" style="width:100%;justify-content:center;background:#2563EB;"><i class="fas fa-search"></i> חפש</button>
        <div id="historyResults" style="margin-top:16px;"></div>
        <p style="text-align:center;margin-top:12px;"><a href="#" onclick="document.getElementById('taxiStepHistory').style.display='none';document.getElementById('taxiStepRequest').style.display='block';initTaxiModalMap();return false;" style="color:#666;">← חזור להזמנה</a></p>`;
}

function loadRideHistory() {
    const phone = document.getElementById('historyPhone').value.trim();
    if (!phone) return;
    const norm = s => String(s || '').replace(/\D/g, '');
    const nPhone = norm(phone);
    const rides = DB.get('rides').filter(r => norm(r.customerPhone) === nPhone);
    const orders = DB.get('orders').filter(o => norm(o.customerPhone) === nPhone);
    const results = document.getElementById('historyResults');
    if (rides.length === 0 && orders.length === 0) {
        results.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">לא נמצאו הזמנות</p>';
        return;
    }
    const statusLabels = { requested: 'ממתין', accepted: 'אושר', on_way_to_pickup: 'נהג בדרך', in_ride: 'בנסיעה', completed: 'הושלם', cancelled: 'בוטל' };
    results.innerHTML = `
        ${rides.length > 0 ? `<h3 style="margin:12px 0 8px;font-size:15px;"><i class="fas fa-taxi" style="color:#D4A843;"></i> נסיעות מוניות (${rides.length})</h3>
        ${rides.slice().reverse().map(r => `
            <div style="background:#fef3c7;border:1px solid #D4A843;border-radius:8px;padding:10px;margin-bottom:8px;font-size:13px;cursor:pointer;" onclick="showRideTracking('${r.id}')">
                <div style="display:flex;justify-content:space-between;"><strong>${r.id}</strong><span style="color:#92400E;">${statusLabels[r.status] || r.status}</span></div>
                <div>${r.fromAddress} ← ${r.toAddress}</div>
                <div style="color:#666;">${new Date(r.createdAt).toLocaleString('he-IL')} · ₪${r.estimatedPrice}</div>
            </div>`).join('')}` : ''}
        ${orders.length > 0 ? `<h3 style="margin:12px 0 8px;font-size:15px;"><i class="fas fa-box" style="color:#059669;"></i> הזמנות משלוחים (${orders.length})</h3>
        ${orders.slice().reverse().map(o => `
            <div style="background:#d1fae5;border:1px solid #059669;border-radius:8px;padding:10px;margin-bottom:8px;font-size:13px;">
                <div><strong>${o.id}</strong> · ${o.status}</div>
                <div>${o.deliveryAddress || ''}</div>
                <div style="color:#666;">${new Date(o.createdAt).toLocaleString('he-IL')}</div>
            </div>`).join('')}` : ''}`;
}

function openRatingForRide(rideId) {
    const ride = DB.get('rides').find(r => r.id === rideId);
    if (!ride) return;
    const driver = ride.driverId ? DB.get('drivers').find(d => d.id === ride.driverId) : null;
    hideAllTaxiSteps();
    const wrap = document.getElementById('taxiStepRating');
    wrap.style.display = 'block';

    const km = ride.estimatedKm || 3;
    const price = ride.estimatedPrice || 0;
    const created = ride.createdAt ? new Date(ride.createdAt) : new Date();
    const endTime = new Date();
    const durationMin = Math.round((endTime - created) / 60000) || Math.round(km * 2);
    const payLabel = ({cash:'מזומן',card:'כרטיס אשראי',bit:'ביט / פייבוקס',app:'חיוב באפליקציה'})[ride.paymentMethod] || 'מזומן';

    const tariff = getTaxiTariff();
    const baseFare = tariff.baseFare || 12;
    const perKm = tariff.perKm || 3;
    const kmCost = Math.round(km * perKm);

    wrap.innerHTML = `
        <div class="uber-step" style="background:#000;overflow-y:auto;">
            <div class="uber-card-topbar">
                <button type="button" class="uber-iconbtn" onclick="closeTaxiModal()" aria-label="סגור">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                <div class="uber-topbar-title">סיכום נסיעה</div>
                <div style="width:42px;"></div>
            </div>
            <div style="padding:16px 20px calc(24px + env(safe-area-inset-bottom));direction:rtl;">

                <!-- Route Map -->
                <div id="ratingRouteMap" style="width:100%;height:200px;border-radius:14px;overflow:hidden;margin-bottom:16px;border:1px solid #222;"></div>

                <!-- Route Summary -->
                <div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px 16px;margin-bottom:14px;">
                    <div style="display:flex;align-items:flex-start;gap:12px;">
                        <div style="display:flex;flex-direction:column;align-items:center;padding-top:4px;">
                            <div style="width:10px;height:10px;border-radius:50%;background:#059669;"></div>
                            <div style="width:2px;flex:1;min-height:20px;background:repeating-linear-gradient(to bottom,#333 0 4px,transparent 4px 8px);margin:3px 0;"></div>
                            <div style="width:10px;height:10px;border-radius:2px;background:#C41E2F;"></div>
                        </div>
                        <div style="flex:1;">
                            <div style="color:#fff;font-size:14px;font-weight:600;margin-bottom:12px;">${ride.fromAddress || 'נקודת איסוף'}</div>
                            <div style="color:#fff;font-size:14px;font-weight:600;">${ride.toAddress || 'יעד'}</div>
                        </div>
                    </div>
                    <div style="border-top:1px solid #222;margin-top:12px;padding-top:10px;display:flex;justify-content:space-around;color:#888;font-size:12px;">
                        <span><i class="fas fa-road"></i> ${km.toFixed(1)} ק"מ</span>
                        <span><i class="fas fa-clock"></i> ${durationMin} דק׳</span>
                        <span><i class="fas fa-calendar"></i> ${created.toLocaleDateString('he-IL')}</span>
                    </div>
                </div>

                <!-- Invoice -->
                <div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px 16px;margin-bottom:14px;">
                    <div style="color:#fff;font-size:15px;font-weight:700;margin-bottom:12px;"><i class="fas fa-receipt" style="color:#C41E2F;"></i> חשבון</div>
                    <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
                        <div style="display:flex;justify-content:space-between;color:#aaa;"><span>פתיחת מונה</span><span style="color:#fff;">₪${baseFare}</span></div>
                        <div style="display:flex;justify-content:space-between;color:#aaa;"><span>${km.toFixed(1)} ק"מ × ₪${perKm}</span><span style="color:#fff;">₪${kmCost}</span></div>
                        ${ride._nightSurcharge ? `<div style="display:flex;justify-content:space-between;color:#aaa;"><span>תוספת לילה</span><span style="color:#fff;">₪${ride._nightSurcharge}</span></div>` : ''}
                        <div style="border-top:1px solid #222;padding-top:8px;display:flex;justify-content:space-between;">
                            <span style="color:#fff;font-size:16px;font-weight:800;">סה"כ</span>
                            <span style="color:#C41E2F;font-size:22px;font-weight:900;">₪${price}</span>
                        </div>
                        <div style="color:#666;font-size:11px;display:flex;align-items:center;gap:6px;"><i class="fas fa-credit-card"></i> ${payLabel}</div>
                    </div>
                    <div style="margin-top:10px;text-align:center;font-size:11px;color:#555;">מס׳ נסיעה: ${ride.id} · ${created.toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'})}</div>
                </div>

                <!-- Driver + Rating -->
                <div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px 16px;margin-bottom:14px;">
                    <div style="text-align:center;margin-bottom:10px;">
                        ${driver && driver.photo
                            ? `<img src="${driver.photo}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #C41E2F;margin-bottom:6px;">`
                            : `<div style="width:72px;height:72px;border-radius:50%;background:#C41E2F;color:white;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:6px;"><i class="fas fa-user"></i></div>`}
                        <div style="color:#fff;font-size:16px;font-weight:700;">${driver ? driver.name : 'הנהג'}</div>
                        ${driver && driver.plate ? `<div style="color:#666;font-size:12px;">${driver.plate}</div>` : ''}
                    </div>

                    <div style="text-align:center;color:#fff;font-size:15px;font-weight:600;margin-bottom:10px;">איך הייתה הנסיעה?</div>
                    <div id="ratingStars" style="text-align:center;font-size:36px;color:#333;margin-bottom:12px;display:flex;justify-content:center;gap:6px;">
                        ${[1,2,3,4,5].map(n => `<i class="fas fa-star" data-star="${n}" style="cursor:pointer;transition:color 0.15s,transform 0.15s;" onclick="selectRating(${n})" onmouseenter="hoverRating(${n})" onmouseleave="hoverRating(0)"></i>`).join('')}
                    </div>
                    <div id="ratingLabel" style="text-align:center;color:#555;font-size:13px;margin-bottom:10px;height:20px;"></div>
                    <textarea id="ratingText" rows="2" placeholder="ספר על החוויה שלך..." style="width:100%;background:#0a0a0a;border:1px solid #222;color:#fff;border-radius:10px;padding:10px 14px;font-size:14px;font-family:inherit;resize:none;direction:rtl;outline:none;transition:border-color 0.15s;" onfocus="this.style.borderColor='#C41E2F'" onblur="this.style.borderColor='#222'"></textarea>
                </div>

                <!-- Actions -->
                <button onclick="submitRating('${rideId}')" class="uber-cta" style="margin-bottom:8px;">
                    <i class="fas fa-star"></i> שלח דירוג
                </button>
                <button onclick="closeTaxiModal()" style="width:100%;background:none;border:none;color:#666;font-size:13px;font-family:inherit;padding:8px;cursor:pointer;">דלג</button>
            </div>
        </div>`;

    selectedRatingStars = 0;
    setTimeout(() => renderRatingRouteMap(ride), 200);
}

function renderRatingRouteMap(ride) {
    const el = document.getElementById('ratingRouteMap');
    if (!el || typeof L === 'undefined') return;
    const map = L.map(el, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false }).setView(OFAKIM_CENTER, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const pts = [];
    if (ride.pickupLat && ride.pickupLng) {
        pts.push([ride.pickupLat, ride.pickupLng]);
        L.marker([ride.pickupLat, ride.pickupLng], {
            icon: L.divIcon({ className: '', html: '<div style="background:#059669;color:white;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;"><i class="fas fa-map-marker-alt" style="transform:rotate(45deg);font-size:12px;"></i></div>', iconSize: [28, 28], iconAnchor: [14, 28] })
        }).addTo(map);
    }
    if (ride.dropoffLat && ride.dropoffLng) {
        pts.push([ride.dropoffLat, ride.dropoffLng]);
        L.marker([ride.dropoffLat, ride.dropoffLng], {
            icon: L.divIcon({ className: '', html: '<div style="background:#C41E2F;color:white;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;"><i class="fas fa-flag-checkered" style="transform:rotate(45deg);font-size:12px;"></i></div>', iconSize: [28, 28], iconAnchor: [14, 28] })
        }).addTo(map);
    }
    if (pts.length === 2) {
        L.polyline(pts, { color: '#C41E2F', weight: 4, opacity: 0.8 }).addTo(map);
        map.fitBounds(pts, { padding: [30, 30] });
    }
}

const ratingLabels = ['', 'גרוע', 'לא טוב', 'סביר', 'טוב', 'מעולה!'];

function hoverRating(n) {
    if (selectedRatingStars > 0) return;
    document.querySelectorAll('#ratingStars [data-star]').forEach(el => {
        const s = parseInt(el.dataset.star);
        el.style.color = s <= n ? '#FFB800' : '#333';
        el.style.transform = s === n ? 'scale(1.2)' : 'scale(1)';
    });
    const label = document.getElementById('ratingLabel');
    if (label) label.textContent = n > 0 ? ratingLabels[n] : '';
}

function selectRating(n) {
    selectedRatingStars = n;
    document.querySelectorAll('#ratingStars [data-star]').forEach(el => {
        const s = parseInt(el.dataset.star);
        el.style.color = s <= n ? '#FFB800' : '#333';
        el.style.transform = s <= n ? 'scale(1.15)' : 'scale(1)';
    });
    const label = document.getElementById('ratingLabel');
    if (label) label.textContent = ratingLabels[n] || '';
}

function submitRating(rideId) {
    if (selectedRatingStars === 0) { alert('נא לבחור דירוג'); return; }
    const ride = DB.get('rides').find(r => r.id === rideId);
    if (!ride) return;
    const rating = {
        id: 'RRT-' + Date.now().toString().slice(-6),
        rideId, driverId: ride.driverId,
        stars: selectedRatingStars,
        text: document.getElementById('ratingText').value.trim(),
        customerName: ride.customerName,
        createdAt: new Date().toISOString()
    };
    DB.add('rideRatings', rating);
    if (ride.driverId) {
        const drivers = DB.get('drivers');
        const d = drivers.find(x => x.id === ride.driverId);
        if (d) {
            const all = DB.get('rideRatings').filter(r => r.driverId === ride.driverId);
            const avg = all.reduce((s, r) => s + r.stars, 0) / all.length;
            d.rating = avg.toFixed(1);
            DB.set('drivers', drivers);
        }
    }
    showRatingThankYou();
}

function showRatingThankYou() {
    const wrap = document.getElementById('taxiStepRating');
    wrap.innerHTML = `
        <div class="uber-step" style="background:#000;display:flex;align-items:center;justify-content:center;">
            <div style="text-align:center;padding:40px 20px;">
                <div style="font-size:60px;margin-bottom:16px;">
                    ${[1,2,3,4,5].map(i => `<i class="fas fa-star" style="color:${i <= selectedRatingStars ? '#FFB800' : '#222'};margin:0 2px;"></i>`).join('')}
                </div>
                <h2 style="color:#fff;font-size:22px;font-weight:800;margin-bottom:8px;">תודה!</h2>
                <p style="color:#888;font-size:14px;margin-bottom:24px;">הדירוג שלך עוזר לנו להשתפר</p>
                <button onclick="closeTaxiModal()" class="uber-cta" style="max-width:280px;margin:0 auto;">סיום</button>
            </div>
        </div>`;
    selectedRatingStars = 0;
}

// Legacy: track by order ID
// DEPRECATED: trackOrder() is not called from any HTML — kept for possible future use.
function trackOrder() {
    const trackNumberEl = document.getElementById('trackNumber');
    if (!trackNumberEl) return;
    const trackNumber = trackNumberEl.value.trim();
    if (!trackNumber) return;

    const orders = DB.get('orders');
    const order = orders.find(o => o.id === trackNumber);
    const resultDiv = document.getElementById('trackResult');
    if (!resultDiv) return;

    if (order) {
        resultDiv.style.display = 'block';
        const steps = resultDiv.querySelectorAll('.track-step');
        const lines = resultDiv.querySelectorAll('.track-line');
        const statusMap = {
            'pending': 0,
            'confirmed': 1,
            'picked_up': 2,
            'on_the_way': 3,
            'delivered': 4
        };

        const activeIndex = statusMap[order.status] || 0;

        steps.forEach((step, i) => {
            step.classList.toggle('active', i <= activeIndex);
        });
        lines.forEach((line, i) => {
            line.style.opacity = i < activeIndex ? '1' : '0.3';
        });

        // Show courier map if courier assigned
        showCourierOnMap(order);
    } else {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<p style="text-align:center;color:#C41E2F;font-weight:700;">הזמנה לא נמצאה. בדוק את מספר ההזמנה.</p>';
        setTimeout(() => {
            resultDiv.innerHTML = `
                <div class="track-status">
                    <div class="track-step active"><div class="step-icon"><i class="fas fa-clipboard-check"></i></div><span>התקבל</span></div>
                    <div class="track-line"></div>
                    <div class="track-step"><div class="step-icon"><i class="fas fa-check-circle"></i></div><span>אושר</span></div>
                    <div class="track-line"></div>
                    <div class="track-step"><div class="step-icon"><i class="fas fa-box"></i></div><span>נאסף</span></div>
                    <div class="track-line"></div>
                    <div class="track-step"><div class="step-icon"><i class="fas fa-motorcycle"></i></div><span>בדרך</span></div>
                    <div class="track-line"></div>
                    <div class="track-step"><div class="step-icon"><i class="fas fa-home"></i></div><span>נמסר</span></div>
                </div>`;
            resultDiv.style.display = 'none';
        }, 3000);
    }
}

// Show courier on map
let trackMap = null;
function showCourierOnMap(order) {
    const mapContainer = document.getElementById('courierTrackMapContainer');
    if (!mapContainer) return;

    if (order.courierId && order.status !== 'delivered' && order.status !== 'pending') {
        mapContainer.style.display = 'block';

        const couriers = DB.get('couriers');
        const courier = couriers.find(c => c.id === order.courierId);
        const OFAKIM = [31.3133, 34.6200];
        const courierLat = courier ? courier.lat : OFAKIM[0];
        const courierLng = courier ? courier.lng : OFAKIM[1];

        if (trackMap) trackMap.remove();

        trackMap = L.map('trackCourierMap').setView([courierLat, courierLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }).addTo(trackMap);

        // Courier marker
        const courierIcon = L.divIcon({
            className: 'courier-marker',
            html: '<div style="background:#059669;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);"><i class="fas fa-motorcycle"></i></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        L.marker([courierLat, courierLng], { icon: courierIcon }).addTo(trackMap)
            .bindPopup('<strong>' + (courier ? courier.name : 'השליח שלך') + '</strong><br>בדרך אליך!').openPopup();
    } else {
        mapContainer.style.display = 'none';
    }
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    } else {
        nav.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
});
