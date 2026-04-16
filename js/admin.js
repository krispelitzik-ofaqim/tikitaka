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
    const activeLink = document.querySelector(`.sidebar-link[onclick*="'${tab}'"]`);
    if (activeLink) activeLink.classList.add('active');
    document.getElementById('pageTitle').textContent = getTabTitle(tab);

    if (tab === 'dashboard') loadDashboard();
    if (tab === 'orders') loadOrders();
    if (tab === 'suppliers') loadSuppliers();
    if (tab === 'customers') loadCustomers();
}

/* ===================== */
/* Settings               */
/* ===================== */

function getSettings() {
    return JSON.parse(localStorage.getItem('tikitaka_settings') || '{}');
}

function saveSettingsObj(s) {
    localStorage.setItem('tikitaka_settings', JSON.stringify(s));
}

function loadSettings() {
    const s = getSettings();
    document.getElementById('setBizName').value = s.bizName || 'TikiTaka Deliveries';
    document.getElementById('setBizPhone').value = s.bizPhone || '08-000-0000';
    document.getElementById('setBizEmail').value = s.bizEmail || 'info@tikitaka.co.il';
    document.getElementById('setBizAddress').value = s.bizAddress || 'אופקים, ישראל';
    document.getElementById('setCommission').value = s.commission !== undefined ? s.commission : 10;
    document.getElementById('setVat').value = s.vat !== undefined ? s.vat : 17;
    document.getElementById('setTaxiBase').value = s.taxiBaseFare !== undefined ? s.taxiBaseFare : 15;
    document.getElementById('setTaxiPerKm').value = s.taxiPerKm !== undefined ? s.taxiPerKm : 3;
    document.getElementById('setTaxiNight').value = s.taxiNightSurcharge !== undefined ? s.taxiNightSurcharge : 25;
    document.getElementById('setTaxiShabbat').value = s.taxiShabbatSurcharge !== undefined ? s.taxiShabbatSurcharge : 25;
    document.getElementById('setDriverCommission').value = s.driverCommission !== undefined ? s.driverCommission : 20;
    document.getElementById('setCourierCommission').value = s.courierCommission !== undefined ? s.courierCommission : 20;
    document.getElementById('setSupplierCommission').value = s.supplierCommission !== undefined ? s.supplierCommission : 10;
    document.getElementById('setPaymentFrequency').value = s.paymentFrequency || 'weekly';
    document.getElementById('setDeliveryFoodBase').value = s.deliveryFoodBase !== undefined ? s.deliveryFoodBase : 12;
    document.getElementById('setDeliveryFoodKm').value = s.deliveryFoodKm !== undefined ? s.deliveryFoodKm : 3;
    document.getElementById('setDeliverySweetsBase').value = s.deliverySweetsBase !== undefined ? s.deliverySweetsBase : 15;
    document.getElementById('setDeliverySweetsKm').value = s.deliverySweetsKm !== undefined ? s.deliverySweetsKm : 3;
    document.getElementById('setDeliveryFlowersBase').value = s.deliveryFlowersBase !== undefined ? s.deliveryFlowersBase : 20;
    document.getElementById('setDeliveryFlowersKm').value = s.deliveryFlowersKm !== undefined ? s.deliveryFlowersKm : 3.5;
    document.getElementById('setDeliveryDocsBase').value = s.deliveryDocsBase !== undefined ? s.deliveryDocsBase : 10;
    document.getElementById('setDeliveryDocsKm').value = s.deliveryDocsKm !== undefined ? s.deliveryDocsKm : 2.5;
    document.getElementById('setDeliveryPackageBase').value = s.deliveryPackageBase !== undefined ? s.deliveryPackageBase : 18;
    document.getElementById('setDeliveryPackageKm').value = s.deliveryPackageKm !== undefined ? s.deliveryPackageKm : 4;
    document.getElementById('setDeliveryIntlBase').value = s.deliveryIntlBase !== undefined ? s.deliveryIntlBase : 35;
    document.getElementById('setDeliveryIntlKm').value = s.deliveryIntlKm !== undefined ? s.deliveryIntlKm : 0;
    document.getElementById('setDeliveryHeavy').value = s.deliveryHeavy !== undefined ? s.deliveryHeavy : 5;
    document.getElementById('setDeliveryUrgent').value = s.deliveryUrgent !== undefined ? s.deliveryUrgent : 50;
    document.getElementById('setBankOwner').value = s.bankOwner || '';
    document.getElementById('setBankName').value = s.bankName || '';
    document.getElementById('setBankBranch').value = s.bankBranch || '';
    document.getElementById('setBankAccount').value = s.bankAccount || '';
    document.getElementById('setBankIBAN').value = s.bankIBAN || '';
    document.getElementById('setBankTransferFreq').value = s.bankTransferFreq || 'weekly';
    document.getElementById('setBankTransferDay').value = s.bankTransferDay !== undefined ? s.bankTransferDay : '0';
    const services = s.servicesVisible || {};
    document.querySelectorAll('.svc-toggle').forEach(cb => {
        const key = cb.dataset.key;
        cb.checked = services[key] !== false; // default ON
    });
    loadCoupons();
}

function addCoupon() {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const value = parseFloat(document.getElementById('couponValue').value);
    if (!code || !value) return alert('נא למלא קוד וערך');
    const coupon = {
        code,
        type: document.getElementById('couponType').value,
        value,
        minOrder: parseFloat(document.getElementById('couponMin').value) || 0,
        expiresAt: document.getElementById('couponExpires').value || null,
        usesLeft: parseInt(document.getElementById('couponUses').value) || 999,
        createdAt: new Date().toISOString()
    };
    DB.add('coupons', coupon);
    ['couponCode', 'couponValue', 'couponMin', 'couponExpires', 'couponUses'].forEach(id => {
        document.getElementById(id).value = '';
    });
    loadCoupons();
}

function deleteCoupon(code) {
    if (!confirm('למחוק קופון?')) return;
    const coupons = DB.get('coupons').filter(c => c.code !== code);
    DB.set('coupons', coupons);
    loadCoupons();
}

function loadCoupons() {
    const list = document.getElementById('couponsList');
    const coupons = DB.get('coupons');
    if (coupons.length === 0) {
        list.innerHTML = '<p style="color:var(--gray);font-size:13px;">אין קופונים</p>';
        return;
    }
    list.innerHTML = '<table class="admin-table"><thead><tr><th>קוד</th><th>הנחה</th><th>מינימום</th><th>תקף עד</th><th>שימושים</th><th></th></tr></thead><tbody>' +
        coupons.map(c => `
            <tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.type === 'percent' ? c.value + '%' : '₪' + c.value}</td>
                <td>${c.minOrder ? '₪' + c.minOrder : '-'}</td>
                <td>${c.expiresAt || '-'}</td>
                <td>${c.usesLeft}</td>
                <td><button class="action-btn cancel" onclick="deleteCoupon('${c.code.replace(/'/g, "&#39;")}')"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('') + '</tbody></table>';
}

function saveSettings() {
    const s = getSettings();
    s.bizName = document.getElementById('setBizName').value;
    s.bizPhone = document.getElementById('setBizPhone').value;
    s.bizEmail = document.getElementById('setBizEmail').value;
    s.bizAddress = document.getElementById('setBizAddress').value;
    s.commission = parseFloat(document.getElementById('setCommission').value) || 0;
    s.vat = parseFloat(document.getElementById('setVat').value) || 0;
    s.taxiBaseFare = parseFloat(document.getElementById('setTaxiBase').value) || 0;
    s.taxiPerKm = parseFloat(document.getElementById('setTaxiPerKm').value) || 0;
    s.taxiNightSurcharge = parseFloat(document.getElementById('setTaxiNight').value) || 0;
    s.taxiShabbatSurcharge = parseFloat(document.getElementById('setTaxiShabbat').value) || 0;
    s.servicesVisible = {};
    document.querySelectorAll('.svc-toggle').forEach(cb => {
        s.servicesVisible[cb.dataset.key] = cb.checked;
    });
    const newPwd = document.getElementById('setAdminPwd').value.trim();
    if (newPwd) s.adminPassword = newPwd;
    const restorePwd = document.getElementById('setRestorePwd').value.trim();
    if (restorePwd) s.restorePassword = restorePwd;
    s.driverCommission = parseFloat(document.getElementById('setDriverCommission').value) || 20;
    s.courierCommission = parseFloat(document.getElementById('setCourierCommission').value) || 20;
    s.supplierCommission = parseFloat(document.getElementById('setSupplierCommission').value) || 10;
    s.paymentFrequency = document.getElementById('setPaymentFrequency').value || 'weekly';
    s.deliveryFoodBase = parseFloat(document.getElementById('setDeliveryFoodBase').value) || 12;
    s.deliveryFoodKm = parseFloat(document.getElementById('setDeliveryFoodKm').value) || 3;
    s.deliverySweetsBase = parseFloat(document.getElementById('setDeliverySweetsBase').value) || 15;
    s.deliverySweetsKm = parseFloat(document.getElementById('setDeliverySweetsKm').value) || 3;
    s.deliveryFlowersBase = parseFloat(document.getElementById('setDeliveryFlowersBase').value) || 20;
    s.deliveryFlowersKm = parseFloat(document.getElementById('setDeliveryFlowersKm').value) || 3.5;
    s.deliveryDocsBase = parseFloat(document.getElementById('setDeliveryDocsBase').value) || 10;
    s.deliveryDocsKm = parseFloat(document.getElementById('setDeliveryDocsKm').value) || 2.5;
    s.deliveryPackageBase = parseFloat(document.getElementById('setDeliveryPackageBase').value) || 18;
    s.deliveryPackageKm = parseFloat(document.getElementById('setDeliveryPackageKm').value) || 4;
    s.deliveryIntlBase = parseFloat(document.getElementById('setDeliveryIntlBase').value) || 35;
    s.deliveryIntlKm = parseFloat(document.getElementById('setDeliveryIntlKm').value) || 0;
    s.deliveryHeavy = parseFloat(document.getElementById('setDeliveryHeavy').value) || 5;
    s.deliveryUrgent = parseFloat(document.getElementById('setDeliveryUrgent').value) || 50;
    s.bankOwner = document.getElementById('setBankOwner').value.trim();
    s.bankName = document.getElementById('setBankName').value;
    s.bankBranch = document.getElementById('setBankBranch').value.trim();
    s.bankAccount = document.getElementById('setBankAccount').value.trim();
    s.bankIBAN = document.getElementById('setBankIBAN').value.trim();
    s.bankTransferFreq = document.getElementById('setBankTransferFreq').value;
    s.bankTransferDay = document.getElementById('setBankTransferDay').value;
    saveSettingsObj(s);
    document.getElementById('setAdminPwd').value = '';
    document.getElementById('setRestorePwd').value = '';
    alert('ההגדרות נשמרו!');
}

const DB_KEYS = ['suppliers', 'orders', 'products', 'couriers', 'fleet', 'expenses', 'initialized', 'institutions', 'reviews', 'coupons', 'drivers', 'rides', 'customerProducts', 'rideRatings', 'rentals', 'settlements', 'teamMembers'];

function exportDB(mode = 'all') {
    const data = { exportedAt: new Date().toISOString(), mode, settings: getSettings() };
    DB_KEYS.forEach(k => {
        const raw = localStorage.getItem('tikitaka_' + k);
        if (!raw) return;
        let arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
            if (mode === 'demo') arr = arr.filter(x => x && x._demo === true);
            else if (mode === 'fixed') arr = arr.filter(x => !x || x._demo !== true);
        }
        data[k] = arr;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tikitaka_${mode}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importDB(e, mode = 'all') {
    const file = e.target.files[0];
    if (!file) return;
    const msg = mode === 'all'
        ? 'ייבוא ידרוס את כל הנתונים הקיימים. להמשיך?'
        : mode === 'fixed'
            ? 'ייבוא ידרוס את הנתונים הקבועים (לא הדמו). להמשיך?'
            : 'ייבוא ימזג את נתוני הדמו עם הקיים. להמשיך?';
    if (!confirm(msg)) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            Object.keys(data).forEach(k => {
                if (k === 'exportedAt' || k === 'mode') return;
                if (k === 'settings') {
                    if (mode === 'all') localStorage.setItem('tikitaka_settings', JSON.stringify(data.settings));
                    return;
                }
                const incoming = data[k];
                if (!Array.isArray(incoming)) return;
                if (mode === 'all') {
                    localStorage.setItem('tikitaka_' + k, JSON.stringify(incoming));
                } else {
                    // Merge: keep records not matching the mode, then add incoming
                    const current = JSON.parse(localStorage.getItem('tikitaka_' + k) || '[]');
                    const kept = current.filter(x => {
                        if (mode === 'fixed') return !x || x._demo === true;
                        if (mode === 'demo') return !x || x._demo !== true;
                        return true;
                    });
                    localStorage.setItem('tikitaka_' + k, JSON.stringify([...kept, ...incoming]));
                }
            });
            alert('הייבוא הושלם. הדף יטען מחדש.');
            location.reload();
        } catch (err) {
            alert('שגיאה: הקובץ לא תקין - ' + err.message);
        }
    };
    reader.readAsText(file);
}

function clearDemoData() {
    if (!confirm('למחוק את כל נתוני הדמו (ולשמור את הקבועים)?')) return;
    DB_KEYS.forEach(k => {
        const raw = localStorage.getItem('tikitaka_' + k);
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return;
        const kept = arr.filter(x => !x || x._demo !== true);
        localStorage.setItem('tikitaka_' + k, JSON.stringify(kept));
    });
    alert('נתוני הדמו נמחקו. הדף יטען מחדש.');
    location.reload();
}

// Simple string hash → stable 0..1
function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return ((h >>> 0) % 10000) / 10000;
}

// Generate a varied SVG data URI. Each call is deterministic per label.
function generateIconImage(label, iconDef, opts = {}) {
    const { width = 300, height = 200, circleSize = 90, variant = 0 } = opts;
    const color = iconDef.color || '#6B7280';
    const glyphMap = {
        'fa-utensils': '🍽', 'fa-seedling': '🌱', 'fa-file-lines': '📄',
        'fa-candy-cane': '🍬', 'fa-plane-departure': '✈️', 'fa-building': '🏢',
        'fa-bicycle': '🚲', 'fa-motorcycle': '🛵', 'fa-car': '🚗',
        'fa-truck': '🚚', 'fa-helicopter': '🚁', 'fa-person-walking': '🚶',
        'fa-person-running': '🏃', 'fa-bolt': '⚡', 'fa-user': '👤',
        'fa-taxi': '🚕', 'fa-id-card': '🪪', 'fa-wine-bottle': '🍷',
        'fa-pizza-slice': '🍕', 'fa-burger': '🍔', 'fa-fish': '🐟',
        'fa-ice-cream': '🍦', 'fa-mug-hot': '☕', 'fa-bread-slice': '🥖',
        'fa-gift': '🎁', 'fa-paw': '🐾', 'fa-book': '📚',
        'fa-school': '🏫', 'fa-child': '🧒', 'fa-hospital': '🏥',
        'fa-user-graduate': '🎓', 'fa-star-of-david': '✡', 'fa-briefcase': '💼',
        'fa-landmark': '🏛', 'fa-shield-halved': '🛡', 'fa-users': '👥'
    };
    const glyph = glyphMap[iconDef.icon] || (label || '?').charAt(0);
    const safeLabel = String(label || '').replace(/[<>&]/g, '').slice(0, 24);
    const seed = hashStr(label + variant);
    const angle = Math.round(seed * 360);
    const radius = 40 + Math.round(seed * 60);
    // Slight color variant for variety
    const tint = Math.round(seed * 40 - 20);
    const shade = (hex, pct) => {
        const n = parseInt(hex.slice(1), 16);
        const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + pct));
        const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + pct));
        const b = Math.min(255, Math.max(0, (n & 0xff) + pct));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    const c1 = shade(color, tint);
    const c2 = shade(color, tint - 40);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
        <defs>
            <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%' gradientTransform='rotate(${angle} .5 .5)'>
                <stop offset='0%' stop-color='${c1}'/>
                <stop offset='100%' stop-color='${c2}'/>
            </linearGradient>
            <radialGradient id='glow'>
                <stop offset='0%' stop-color='white' stop-opacity='0.35'/>
                <stop offset='100%' stop-color='white' stop-opacity='0'/>
            </radialGradient>
        </defs>
        <rect width='${width}' height='${height}' fill='url(#bg)'/>
        <circle cx='${width * (0.3 + seed * 0.4)}' cy='${height * 0.3}' r='${radius}' fill='url(#glow)'/>
        <circle cx='${width / 2}' cy='${height / 2 - 12}' r='${circleSize / 2}' fill='white' fill-opacity='0.2' stroke='white' stroke-opacity='0.5' stroke-width='2'/>
        <text x='${width / 2}' y='${height / 2 - 4}' text-anchor='middle' dominant-baseline='central' font-size='54' font-family='Arial'>${glyph}</text>
        <text x='${width / 2}' y='${height - 18}' text-anchor='middle' font-size='15' fill='white' font-family='Arial' font-weight='bold'>${safeLabel}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Generate a taxi vehicle image based on vehicle type
function generateTaxiImage(label, vehicleType = 'standard', variant = 0) {
    const colors = {
        standard: '#F59E0B',
        large: '#7C3AED',
        accessible: '#2563EB',
        premium: '#111827'
    };
    const typeLabels = {
        standard: 'מונית רגילה',
        large: 'מונית 7 מקומות',
        accessible: 'מונית נגישה',
        premium: 'מונית פרימיום'
    };
    const color = colors[vehicleType] || '#F59E0B';
    const seed = hashStr(label + variant);
    const angle = Math.round(seed * 60) + 150;
    const safeLabel = String(label || '').replace(/[<>&]/g, '').slice(0, 26);
    const plate = 'TAXI-' + Math.floor(100 + seed * 899);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'>
        <defs>
            <linearGradient id='sky' x1='0%' y1='0%' x2='0%' y2='100%'>
                <stop offset='0%' stop-color='#bae6fd'/>
                <stop offset='100%' stop-color='#fde68a'/>
            </linearGradient>
            <linearGradient id='body' gradientTransform='rotate(${angle})'>
                <stop offset='0%' stop-color='${color}'/>
                <stop offset='100%' stop-color='#111827'/>
            </linearGradient>
        </defs>
        <rect width='320' height='200' fill='url(#sky)'/>
        <rect y='140' width='320' height='60' fill='#4b5563'/>
        <!-- Car body -->
        <path d='M60 140 Q70 85 110 80 L200 80 Q240 85 260 140 Z' fill='url(#body)' stroke='#111' stroke-width='2'/>
        <!-- Roof sign -->
        <rect x='145' y='62' width='40' height='20' rx='3' fill='#fde047' stroke='#111' stroke-width='1.5'/>
        <text x='165' y='77' text-anchor='middle' font-size='13' font-family='Arial' font-weight='bold' fill='#111'>TAXI</text>
        <!-- Windows -->
        <path d='M115 88 L200 88 Q220 90 235 120 L110 120 Q112 100 115 88 Z' fill='#93c5fd' opacity='0.8' stroke='#111' stroke-width='1'/>
        <line x1='160' y1='88' x2='160' y2='120' stroke='#111' stroke-width='1.5'/>
        <!-- Wheels -->
        <circle cx='100' cy='150' r='22' fill='#111'/>
        <circle cx='100' cy='150' r='10' fill='#6b7280'/>
        <circle cx='220' cy='150' r='22' fill='#111'/>
        <circle cx='220' cy='150' r='10' fill='#6b7280'/>
        <!-- Headlight -->
        <circle cx='255' cy='115' r='5' fill='#fef3c7'/>
        <!-- Plate -->
        <rect x='140' y='130' width='40' height='12' fill='white' stroke='#111' stroke-width='1'/>
        <text x='160' y='140' text-anchor='middle' font-size='9' font-family='Arial' font-weight='bold' fill='#111'>${plate}</text>
        <!-- Accessible badge if applicable -->
        ${vehicleType === 'accessible' ? `<circle cx='290' cy='55' r='18' fill='#2563EB'/><text x='290' y='62' text-anchor='middle' font-size='22' fill='white'>♿</text>` : ''}
        <!-- Label -->
        <text x='160' y='190' text-anchor='middle' font-size='14' fill='white' font-family='Arial' font-weight='bold'>${safeLabel || typeLabels[vehicleType]}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Generate a person avatar image (driver/courier)
function generatePersonAvatar(label, iconDef, variant = 0) {
    const seed = hashStr(label + variant);
    const skin = ['#F5D0A9', '#E6B796', '#C99966', '#8D5524'][Math.floor(seed * 4)];
    const shirt = iconDef.color || '#059669';
    const safeLabel = String(label || '').replace(/[<>&]/g, '').slice(0, 18);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'>
        <defs>
            <linearGradient id='bg' x1='0%' y1='0%' x2='0%' y2='100%'>
                <stop offset='0%' stop-color='${shirt}' stop-opacity='0.15'/>
                <stop offset='100%' stop-color='${shirt}' stop-opacity='0.4'/>
            </linearGradient>
        </defs>
        <rect width='220' height='220' fill='url(#bg)'/>
        <!-- Shoulders -->
        <path d='M40 200 Q40 150 110 140 Q180 150 180 200 Z' fill='${shirt}' stroke='#111' stroke-width='2'/>
        <!-- Neck -->
        <rect x='98' y='120' width='24' height='25' fill='${skin}' stroke='#111' stroke-width='1.5'/>
        <!-- Head -->
        <circle cx='110' cy='90' r='38' fill='${skin}' stroke='#111' stroke-width='2'/>
        <!-- Hair -->
        <path d='M72 85 Q78 55 110 52 Q142 55 148 85 Q148 75 140 72 Q130 55 110 58 Q90 55 80 72 Q72 75 72 85 Z' fill='#1f2937'/>
        <!-- Eyes -->
        <circle cx='98' cy='90' r='3' fill='#111'/>
        <circle cx='122' cy='90' r='3' fill='#111'/>
        <!-- Smile -->
        <path d='M98 105 Q110 114 122 105' stroke='#111' stroke-width='2' fill='none' stroke-linecap='round'/>
        <!-- Icon badge on shirt -->
        <circle cx='110' cy='180' r='16' fill='white'/>
        <text x='110' y='188' text-anchor='middle' font-size='20' font-family='Arial'>${({'fa-bicycle':'🚲','fa-motorcycle':'🛵','fa-car':'🚗','fa-truck':'🚚','fa-helicopter':'🚁','fa-id-card':'🚕','fa-bolt':'⚡','fa-person-walking':'🚶','fa-person-running':'🏃'})[iconDef.icon] || '👤'}</text>
        <!-- Name -->
        <text x='110' y='215' text-anchor='middle' font-size='13' fill='#111' font-family='Arial' font-weight='bold'>${safeLabel}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Populate missing images across suppliers, couriers, and customers
function populateFolderImages() {
    if (!confirm('תוסיף תמונות אוטומטיות לכל הספקים, השליחים והמוצרים שחסרים. להמשיך?')) return;

    let added = { suppliers: 0, couriers: 0, drivers: 0, products: 0, orders: 0 };

    // Suppliers: logo (image) + 3 gallery images with variation
    const suppliers = DB.get('suppliers');
    suppliers.forEach(s => {
        const def = getIconDef(s.iconKey || 'food', BUSINESS_ICONS);
        if (!s.image) {
            s.image = generateIconImage(s.name, def, { variant: 0 });
            added.suppliers++;
        }
        if (!Array.isArray(s.images) || s.images.length === 0) {
            s.images = [
                generateIconImage(s.name + ' · חזית', def, { variant: 1 }),
                generateIconImage(s.name + ' · פנים', def, { variant: 2 }),
                generateIconImage(s.name + ' · מוצרים', def, { variant: 3 })
            ];
        }
    });
    DB.set('suppliers', suppliers);

    // Couriers: personal avatar photo
    const couriers = DB.get('couriers');
    couriers.forEach(c => {
        const def = getIconDef(c.iconKey || 'scooter', COURIER_ICONS);
        if (!c.photo) {
            c.photo = generatePersonAvatar(c.name, def, 0);
            added.couriers++;
        }
    });
    DB.set('couriers', couriers);

    // Drivers (taxi): avatar + taxi vehicle photo
    const drivers = DB.get('drivers');
    drivers.forEach(d => {
        const driverIconDef = { icon: 'fa-id-card', color: '#D4A843' };
        if (!d.photo) {
            d.photo = generatePersonAvatar(d.name, driverIconDef, 0);
            added.drivers++;
        }
        if (!Array.isArray(d.vehicleImages) || d.vehicleImages.length === 0) {
            d.vehicleImages = [
                generateTaxiImage(d.plate || d.name, d.vehicleType || 'standard', 0),
                generateTaxiImage((d.plate || d.name) + ' · פנים', d.vehicleType || 'standard', 1)
            ];
        }
    });
    DB.set('drivers', drivers);

    // Products: ensure image/images
    const products = DB.get('products');
    products.forEach(p => {
        if (!p.image && !(p.images && p.images.length)) {
            const supplier = suppliers.find(s => s.id === p.supplierId);
            const def = supplier ? getIconDef(supplier.iconKey || 'food', BUSINESS_ICONS) : BUSINESS_ICONS[0];
            const img = generateIconImage(p.name, def, { width: 300, height: 200 });
            p.image = img;
            p.images = [img];
            added.products++;
        } else if (p.image && !(p.images && p.images.length)) {
            p.images = [p.image];
        }
    });
    DB.set('products', products);

    // Customer order photos (one placeholder per customer — attach to most recent order)
    const orders = DB.get('orders');
    const custSeen = {};
    orders.forEach(o => {
        const key = o.customerPhone || o.customerName;
        if (!key) return;
        if (!custSeen[key]) custSeen[key] = true;
        if (!Array.isArray(o.photos) || o.photos.length === 0) {
            const custDef = { icon: 'fa-user', color: CUSTOMER_COLOR };
            o.photos = [generateIconImage(o.customerName || 'לקוח', custDef, { width: 300, height: 200 })];
            added.orders++;
        }
    });
    DB.set('orders', orders);

    alert(`תמונות נוספו:\n· ספקים: ${added.suppliers}\n· שליחים: ${added.couriers}\n· מוצרים: ${added.products}\n· הזמנות/לקוחות: ${added.orders}`);
    // Refresh photos tab if active
    if (document.getElementById('tab-photos').classList.contains('active')) {
        renderPhotosMain();
    }
}

function seedFullDemo() {
    if (!confirm('תוסיף 30 ספקים, 600 מוצרים ו-5 שליחים לדוגמה. זו כמות גדולה של נתונים. להמשיך?')) return;

    const svgImage = (label, color) => {
        const safeLabel = String(label).replace(/</g, '').replace(/>/g, '').slice(0, 20);
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='300' height='200' fill='${color}'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-size='22' fill='white' font-family='Arial' font-weight='bold'>${safeLabel}</text></svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };

    // 20 distinct prices schedule per category (different per cat)
    const priceSets = {
        food:         [18, 24, 32, 38, 45, 52, 58, 65, 72, 78, 85, 92, 98, 105, 115, 125, 135, 145, 155, 180],
        drinks:       [15, 22, 28, 36, 45, 55, 65, 78, 90, 105, 120, 140, 160, 180, 210, 240, 280, 320, 380, 450],
        flowers:      [25, 35, 45, 60, 80, 100, 120, 150, 180, 220, 260, 300, 340, 380, 420, 480, 540, 600, 700, 850],
        documents:    [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 120, 140, 160, 180, 220],
        international:[50, 75, 100, 130, 160, 200, 240, 290, 340, 400, 460, 520, 600, 680, 770, 860, 960, 1080, 1220, 1400],
        office:       [12, 22, 35, 48, 60, 75, 90, 110, 130, 155, 180, 210, 240, 280, 320, 360, 410, 470, 540, 620]
    };

    const productNames = {
        food: [
            'חומוס מלא', 'פלאפל במנה', 'שווארמה בפיתה', 'סלט ישראלי', 'שקשוקה ביתית',
            'מוסקה יווני', 'קוסקוס מרוקאי', 'אוזי עוף', 'קציצות בקר', 'מג׳דרה',
            'סביח', 'קבב בלפלאפל', 'חצילים בטחינה', 'תבשיל גרונות', 'מרק עוף',
            'לבני עם זעתר', 'מפרום תימני', 'כבד קצוץ', 'פסטה ברוטב', 'פיצה משפחתית'
        ],
        drinks: [
            'שוקולד חלב 100ג', 'שקדים מלוחים 200ג', 'גרעינים שחורים', 'חפיסת סיגריות', 'וויסקי 700מ"ל',
            'וודקה 750מ"ל', 'יין אדום יבש', 'בירה מחצית הליטר', 'אנרגיה 500מ"ל', 'מיץ ענבים',
            'קולה 1.5 ליטר', 'קפה קפוא', 'עוגיות שוקולד צ׳יפס', 'וופלים עם קצפת', 'פיצוחי אגוזים',
            'מארז בונבוניירה', 'טבק לגלגול', 'נרגילה מנטה', 'ערק ענבים', 'רום חום'
        ],
        flowers: [
            'זר 12 ורדים אדומים', 'זר חמניות', 'זר פרחי בר', 'עציץ סחלב לבן', 'זר כלות',
            'זר גרברות צבעוני', 'עציץ ירק פוטוס', 'זר פיוניות', 'זר טוליפים', 'קקטוס בעציץ',
            'זר יום הולדת', 'סידור פרחים לשולחן', 'זר אבל', 'זר ליולדת', 'זר ענק VIP',
            'זרי חינה לחתונה', 'עציץ בונסאי', 'זר שושנים ורודים', 'זר אורכידאה', 'זר לכניסה לארץ'
        ],
        documents: [
            'משלוח מעטפה רגילה', 'משלוח מסמך דחוף', 'משלוח חוזה חתום', 'משלוח תעודות', 'משלוח כתב תביעה',
            'משלוח חבילת מסמכים', 'איסוף מסמך מרשות', 'משלוח לעורך דין', 'משלוח דואר רשום', 'משלוח גיליון ציונים',
            'משלוח הזמנה לחתונה', 'משלוח מכתב יבוא', 'מסמך פיקדון בנק', 'העברת תעודת רכב', 'איסוף קבלה',
            'משלוח דו"ח ביקורת', 'משלוח מפרט טכני', 'משלוח טפסי ביטוח', 'מסמך לבית משפט', 'מסמך דחוף ליעד מיוחד'
        ],
        international: [
            'מעטפה רגילה לאירופה', 'מעטפה רגילה לארה"ב', 'חבילה עד 1 ק"ג עולמית', 'חבילה עד 2 ק"ג עולמית', 'חבילה עד 5 ק"ג עולמית',
            'משלוח אקספרס 3 ימים', 'משלוח אקספרס יום אחד', 'משלוח מעקב + ביטוח', 'משלוח שבירים', 'חבילה מקוררת',
            'חבילה לקנדה', 'חבילה לאוסטרליה', 'חבילה לצרפת', 'חבילה לרוסיה', 'חבילה לתאילנד',
            'חבילת ארוחה', 'חבילת טקסטיל', 'חבילת מוצרי חשמל', 'חבילת ספרים', 'חבילת מסמכים עולמית'
        ],
        office: [
            'ניירות A4 חבילה', 'חפיסת עטים 10 יח׳', 'טונר למדפסת', 'מחברות לבית ספר', 'סוללות AA מארז',
            'נייר טואלט 32 גלילים', 'מגבות נייר מארז', 'סבון ידיים 5 ליטר', 'חיטוי ידיים 500מ"ל', 'כפות פלסטיק 100',
            'כוסות חד פעמיות', 'צלחות מזון 50 יח׳', 'שקיות זבל 50 יח׳', 'מטליות מיקרופייבר', 'שמנים לניקוי',
            'קלסרים 5 יח׳', 'סיכות שדכן', 'מהדקים מארז', 'לוח מחיק + טוש', 'קופסאות ארכיב'
        ]
    };

    const catLabels = {
        food: 'אוכל',
        drinks: 'מתוקים / אלכוהול',
        flowers: 'פרחים',
        documents: 'מסמכים',
        international: 'דואר חו"ל',
        office: 'ציוד למוסדות'
    };

    const catColors = {
        food: '#C41E2F',
        drinks: '#7C3AED',
        flowers: '#DB2777',
        documents: '#2563EB',
        international: '#0891B2',
        office: '#059669'
    };

    const supplierNames = {
        food: ['מעדני הנגב', 'פלאפל המלך', 'מטבח הדרום', 'ביסטרו אופקים', 'שף אבי'],
        drinks: ['יינות הנגב', 'אלכוהול סנטר', 'פיצוחי דרום', 'שוקולד פרמיום', 'בר סטור'],
        flowers: ['פרחי השדה', 'ורדים ואהבה', 'הגינה הקסומה', 'פריחה של אופקים', 'זרי מתנה'],
        documents: ['מסמכים אקספרס', 'שליחויות הנגב', 'פוסט דרום', 'Quick Docs', 'מהיר אל המטרה'],
        international: ['דואר עולמי אופקים', 'Global Send', 'Nagev World Post', 'International Express', 'חו"ל שלוחה'],
        office: ['אורחובט - ציוד משרדי', 'מוסדנט', 'כל לבית הספר', 'מחסן המוסדות', 'שיפוץ ציוד']
    };

    const categories = ['food', 'drinks', 'flowers', 'documents', 'international', 'office'];
    const baseLat = 31.3133, baseLng = 34.6200;

    let suppliers = DB.get('suppliers');
    let products = DB.get('products');

    categories.forEach((cat, catIdx) => {
        for (let i = 0; i < 5; i++) {
            const sid = `sup-demo-${cat}-${i + 1}`;
            if (suppliers.find(s => s.id === sid)) continue;
            const supName = supplierNames[cat][i];
            const supplier = {
                id: sid,
                name: supName,
                category: cat,
                description: `ספק ${catLabels[cat]} מוביל באזור אופקים`,
                phone: `050-${String(1000000 + catIdx * 100 + i * 10).slice(-7)}`,
                email: `${sid}@demo.co.il`,
                address: `רחוב הדמו ${catIdx * 10 + i + 1}, אופקים`,
                isActive: true,
                images: [],
                lat: baseLat + (Math.random() - 0.5) * 0.03,
                lng: baseLng + (Math.random() - 0.5) * 0.03,
                openTime: '08:00',
                closeTime: '22:00',
                workDays: [0, 1, 2, 3, 4, 5],
                deliveryRadius: 10,
                _demo: true
            };
            suppliers.push(supplier);

            const prices = priceSets[cat];
            const names = productNames[cat];
            for (let p = 0; p < 20; p++) {
                const prodName = names[p];
                const price = prices[p];
                const img = svgImage(prodName, catColors[cat]);
                products.push({
                    id: `PRD-${sid}-${p + 1}`,
                    supplierId: sid,
                    supplier: supName,
                    location: supplier.address,
                    name: prodName,
                    description: `${prodName} - איכות גבוהה מ${supName}`,
                    price: price,
                    category: cat,
                    unit: 'unit',
                    stock: 20 + Math.floor(Math.random() * 100),
                    minOrder: 1,
                    image: img,
                    images: [img],
                    addons: [],
                    notes: '',
                    daypart: 'all',
                    forInstitutions: true,
                    _demo: true,
                    createdAt: new Date().toISOString()
                });
            }
        }
    });

    DB.set('suppliers', suppliers);
    DB.set('products', products);

    // 5 couriers
    const courierNames = [
        { name: 'יוסי כהן', phone: '052-1110001', vehicle: 'scooter' },
        { name: 'אבי לוי', phone: '052-1110002', vehicle: 'bike' },
        { name: 'שרה דוד', phone: '052-1110003', vehicle: 'car' },
        { name: 'רון מזרחי', phone: '052-1110004', vehicle: 'scooter' },
        { name: 'מיכל פרץ', phone: '052-1110005', vehicle: 'drone' }
    ];
    const couriers = DB.get('couriers');
    courierNames.forEach((c, i) => {
        const cid = `courier-demo-${i + 1}`;
        if (couriers.find(x => x.id === cid)) return;
        couriers.push({
            id: cid,
            name: c.name,
            phone: c.phone,
            vehicle: c.vehicle,
            isActive: true,
            _demo: true,
            lat: baseLat + (Math.random() - 0.5) * 0.02,
            lng: baseLng + (Math.random() - 0.5) * 0.02
        });
    });
    DB.set('couriers', couriers);

    // Also add matching fleet vehicles
    const fleet = DB.get('fleet');
    courierNames.forEach((c, i) => {
        const fid = `V-demo-${i + 1}`;
        if (fleet.find(v => v.id === fid)) return;
        fleet.push({
            id: fid,
            type: c.vehicle,
            plate: `DEMO-${1000 + i}`,
            courier: c.name,
            status: 'active',
            _demo: true
        });
    });
    DB.set('fleet', fleet);

    alert('נוצרו 30 ספקים, 600 מוצרים, 5 שליחים ו-5 רכבי צי בהצלחה!');
    location.reload();
}

function seedTestData() {
    if (!confirm('תוסיף 5 הזמנות לדוגמה (אוכל, אלכוהול+סיגריות, פרחים, מסמכים, חלב למוסד). להמשיך?')) return;

    // Ensure suppliers exist for each test scenario
    const suppliers = DB.get('suppliers');
    const ensureSupplier = (id, data) => {
        if (!suppliers.find(s => s.id === id)) {
            suppliers.push({ id, isActive: true, images: [], _demo: true, lat: 31.3133 + Math.random() * 0.02, lng: 34.62 + Math.random() * 0.02, ...data });
        }
    };
    ensureSupplier('sup-food', { name: 'מעדני אופקים', category: 'food', description: 'מעדנייה מקומית', phone: '050-1111111', address: 'רחוב הרצל 10, אופקים' });
    ensureSupplier('sup-liquor', { name: 'יינות וטבק הנגב', category: 'package', description: 'אלכוהול וסיגריות', phone: '050-2222222', address: 'שד\' הנשיא 5, אופקים' });
    ensureSupplier('sup-flowers', { name: 'פרחי השדה', category: 'package', description: 'זרי פרחים ושזירה', phone: '050-3333333', address: 'רחוב הבנים 8, אופקים' });
    ensureSupplier('sup-docs', { name: 'שליחויות אקספרס', category: 'documents', description: 'משלוחי מסמכים מהירים', phone: '050-4444444', address: 'מרכז מסחרי, אופקים' });
    ensureSupplier('sup-dairy', { name: 'חלבי הדרום', category: 'food', description: 'מוצרי חלב טריים', phone: '050-5555555', address: 'אזור תעשייה, אופקים' });
    DB.set('suppliers', suppliers);

    // Ensure products exist
    const products = DB.get('products');
    const ensureProduct = (p) => {
        if (!products.find(x => x.id === p.id)) products.push(p);
    };
    const baseProd = { unit: 'unit', stock: 50, minOrder: 1, image: null, images: [], addons: [], notes: '', daypart: 'all', forInstitutions: true, _demo: true, createdAt: new Date().toISOString() };
    ensureProduct({ ...baseProd, id: 'PRD-TEST-1', supplierId: 'sup-food', name: 'שווארמה במנה', description: 'שווארמה עם ירקות וחומוס', price: 48, category: 'food', supplier: 'מעדני אופקים' });
    ensureProduct({ ...baseProd, id: 'PRD-TEST-2', supplierId: 'sup-liquor', name: 'וודקה אבסולוט 750מ"ל', description: 'וודקה פרימיום', price: 120, category: 'drinks', supplier: 'יינות וטבק הנגב' });
    ensureProduct({ ...baseProd, id: 'PRD-TEST-3', supplierId: 'sup-liquor', name: 'חפיסת מרלבורו', description: 'סיגריות', price: 36, category: 'other', supplier: 'יינות וטבק הנגב' });
    ensureProduct({ ...baseProd, id: 'PRD-TEST-4', supplierId: 'sup-flowers', name: 'זר ורדים אדומים', description: '12 ורדים אדומים', price: 180, category: 'flowers', supplier: 'פרחי השדה' });
    ensureProduct({ ...baseProd, id: 'PRD-TEST-5', supplierId: 'sup-docs', name: 'משלוח מסמך רשמי', description: 'משלוח עד 30 דקות', price: 45, category: 'other', supplier: 'שליחויות אקספרס' });
    ensureProduct({ ...baseProd, id: 'PRD-TEST-6', supplierId: 'sup-dairy', name: 'חלב טרי 3%', description: 'ליטר', price: 8, category: 'food', supplier: 'חלבי הדרום' });
    ensureProduct({ ...baseProd, id: 'PRD-TEST-7', supplierId: 'sup-dairy', name: 'יוגורט טבעי 150ג', description: 'יוגורט ביתי', price: 6, category: 'food', supplier: 'חלבי הדרום' });
    ensureProduct({ ...baseProd, id: 'PRD-TEST-8', supplierId: 'sup-dairy', name: 'גבינה צהובה 200ג', description: 'גבינה צהובה פרוסה', price: 22, category: 'food', supplier: 'חלבי הדרום' });
    DB.set('products', products);

    // Ensure one institution for the dairy test
    const institutions = DB.get('institutions');
    if (!institutions.find(i => i.id === 'inst-test')) {
        institutions.push({
            id: 'inst-test',
            name: 'בית ספר "אופק"',
            type: 'school',
            phone: '08-9999999',
            email: 'school@ofakim.muni.il',
            address: 'רחוב החינוך 1, אופקים',
            budget: 5000,
            createdAt: new Date().toISOString()
        });
        DB.set('institutions', institutions);
    }

    // Build 5 delivered orders at different times today
    const today = new Date();
    const mkDate = (hour, minute) => {
        const d = new Date(today);
        d.setHours(hour, minute, 0, 0);
        return d.toISOString();
    };

    const newOrders = [
        {
            id: 'TK-T' + Date.now().toString().slice(-5) + '1',
            customerName: 'דוד כהן',
            customerPhone: '052-1000001',
            customerEmail: 'david@example.com',
            category: 'food',
            pickupAddress: 'מעדני אופקים',
            deliveryAddress: 'רחוב שלום 12, אופקים',
            status: 'delivered',
            createdAt: mkDate(12, 30),
            items: [{ name: 'שווארמה במנה', qty: 2, price: 48, supplier: 'מעדני אופקים', supplierId: 'sup-food' }],
            totalPrice: 96,
            price: 96
        },
        {
            id: 'TK-T' + Date.now().toString().slice(-5) + '2',
            customerName: 'שרה לוי',
            customerPhone: '052-1000002',
            customerEmail: 'sara@example.com',
            category: 'package',
            pickupAddress: 'יינות וטבק הנגב',
            deliveryAddress: 'שד\' בן גוריון 44, אופקים',
            status: 'delivered',
            createdAt: mkDate(20, 15),
            items: [
                { name: 'וודקה אבסולוט 750מ"ל', qty: 1, price: 120, supplier: 'יינות וטבק הנגב', supplierId: 'sup-liquor' },
                { name: 'חפיסת מרלבורו', qty: 2, price: 36, supplier: 'יינות וטבק הנגב', supplierId: 'sup-liquor' }
            ],
            totalPrice: 192,
            price: 192
        },
        {
            id: 'TK-T' + Date.now().toString().slice(-5) + '3',
            customerName: 'יעל רוזנברג',
            customerPhone: '052-1000003',
            customerEmail: 'yael@example.com',
            category: 'package',
            pickupAddress: 'פרחי השדה',
            deliveryAddress: 'רחוב הגפן 7, אופקים',
            status: 'delivered',
            createdAt: mkDate(10, 45),
            items: [{ name: 'זר ורדים אדומים', qty: 1, price: 180, supplier: 'פרחי השדה', supplierId: 'sup-flowers' }],
            totalPrice: 180,
            price: 180
        },
        {
            id: 'TK-T' + Date.now().toString().slice(-5) + '4',
            customerName: 'משה אברהם',
            customerPhone: '052-1000004',
            customerEmail: 'moshe@example.com',
            category: 'documents',
            pickupAddress: 'שליחויות אקספרס',
            deliveryAddress: 'רחוב ז\'בוטינסקי 22, אופקים',
            status: 'delivered',
            createdAt: mkDate(14, 0),
            items: [{ name: 'משלוח מסמך רשמי', qty: 1, price: 45, supplier: 'שליחויות אקספרס', supplierId: 'sup-docs' }],
            totalPrice: 45,
            price: 45
        },
        {
            id: 'TK-T' + Date.now().toString().slice(-5) + '5',
            customerName: 'בית ספר "אופק"',
            customerPhone: '08-9999999',
            customerEmail: 'school@ofakim.muni.il',
            category: 'food',
            pickupAddress: 'חלבי הדרום',
            deliveryAddress: 'רחוב החינוך 1, אופקים',
            status: 'delivered',
            createdAt: mkDate(8, 0),
            isInstitution: true,
            institutionId: 'inst-test',
            items: [
                { name: 'חלב טרי 3%', qty: 50, price: 8, supplier: 'חלבי הדרום', supplierId: 'sup-dairy' },
                { name: 'יוגורט טבעי 150ג', qty: 80, price: 6, supplier: 'חלבי הדרום', supplierId: 'sup-dairy' },
                { name: 'גבינה צהובה 200ג', qty: 30, price: 22, supplier: 'חלבי הדרום', supplierId: 'sup-dairy' }
            ],
            totalPrice: 1540,
            price: 1540
        }
    ];

    const orders = DB.get('orders');
    newOrders.forEach(o => orders.push({ ...o, _demo: true }));
    DB.set('orders', orders);

    alert('נוצרו 5 הזמנות בדיקה מ-5 לקוחות! הדף יטען מחדש.');
    location.reload();
}

function clearDB() {
    if (!confirm('למחוק את כל הנתונים? פעולה זו בלתי הפיכה!')) return;
    if (!confirm('אתה בטוח לחלוטין? כל ההזמנות, ספקים, מוצרים והגדרות יימחקו.')) return;
    Object.keys(localStorage).filter(k => k.startsWith('tikitaka_')).forEach(k => localStorage.removeItem(k));
    alert('כל הנתונים נמחקו. הדף יטען מחדש.');
    location.reload();
}

function getTabTitle(tab) {
    const titles = {
        'dashboard': 'דשבורד',
        'orders': 'הזמנות',
        'suppliers': 'ספקים',
        'customers': 'לקוחות',
        'settings': 'הגדרות',
        'customerView': 'צפייה בממשק לקוח',
        'products': 'ניהול מוצרים',
        'maps': 'מפות',
        'fleet': 'ניהול צי תנועה',
        'accounting': 'הנהלת חשבונות',
        'analytics': 'אנליטיקה',
        'couriers': 'שליחים',
        'photos': 'תמונות',
        'rides': 'נסיעות מוניות',
        'drivers': 'נהגים',
        'rentals': 'השכרות'
    };
    titles['settlement'] = 'התחשבנות נהגים';
    titles['team'] = 'ניהול צוות';
    titles['courierSettlement'] = 'התחשבנות שליחים';
    titles['supplierSettlement'] = 'התחשבנות ספקים';
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
    const couriers = DB.get('couriers');
    const products = DB.get('products');
    const expenses = DB.get('expenses');

    // Live activity block
    const rides = DB.get('rides');
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    const activeRides = rides.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;
    const activeCouriers = couriers.filter(c => c.isActive !== false).length;
    // Unique customers across both orders AND rides
    const custSet = new Set();
    orders.forEach(o => { if (o.customerPhone || o.customerName) custSet.add(o.customerPhone || o.customerName); });
    rides.forEach(r => { if (r.customerPhone || r.customerName) custSet.add(r.customerPhone || r.customerName); });
    const uniqueCust = custSet.size;
    const orderRev = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + getOrderPrice(o), 0);
    const rideRev = rides.filter(r => r.status === 'completed').reduce((s, r) => s + (parseFloat(r.estimatedPrice) || 0), 0);
    const totalRev = orderRev + rideRev;
    const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const fmt = n => '₪' + Math.round(n).toLocaleString('he-IL');
    if (document.getElementById('liveOrders')) {
        document.getElementById('liveOrders').textContent = activeOrders;
        document.getElementById('liveRides').textContent = activeRides;
        document.getElementById('liveCouriers').textContent = activeCouriers;
        document.getElementById('liveCustomers').textContent = uniqueCust;
        document.getElementById('liveProducts').textContent = products.length;
        document.getElementById('liveRevenue').textContent = fmt(totalRev);
        document.getElementById('liveExpenses').textContent = fmt(totalExp);
    }

    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('deliveredOrders').textContent = orders.filter(o => o.status === 'delivered').length;
    document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
    document.getElementById('totalSuppliers').textContent = suppliers.filter(s => s.isActive).length;

    // Merge orders + rides, tag each with kind, sort by createdAt, take top 10
    const merged = [
        ...orders.map(o => ({ kind: 'delivery', item: o, ts: new Date(o.createdAt || 0).getTime() })),
        ...rides.map(r => ({ kind: 'ride', item: r, ts: new Date(r.createdAt || 0).getTime() }))
    ].sort((a, b) => b.ts - a.ts).slice(0, 10);

    const rideStatusLabels2 = {
        'requested': 'חדש', 'accepted': 'אושר', 'on_way_to_pickup': 'בדרך לאיסוף',
        'in_ride': 'בנסיעה', 'completed': 'הושלם', 'cancelled': 'בוטל'
    };

    const tbody = document.getElementById('recentOrdersTable');
    tbody.innerHTML = merged.length === 0
        ? '<tr><td colspan="7" style="text-align:center;color:var(--gray);padding:30px;">אין פעילות עדיין</td></tr>'
        : merged.map(m => {
            const x = m.item;
            if (m.kind === 'delivery') {
                return `
                    <tr>
                        <td><span class="status-badge" style="background:#059669;color:white;"><i class="fas fa-box"></i> משלוח</span></td>
                        <td><strong>${x.id}</strong></td>
                        <td>${x.customerName}</td>
                        <td>${categoryLabels[x.category] || x.category || '-'}</td>
                        <td>${x.deliveryAddress || '-'}</td>
                        <td><span class="status-badge status-${x.status}">${statusLabels[x.status]}</span></td>
                        <td>${getActionButtons(x)}</td>
                    </tr>
                `;
            } else {
                const telBtn = x.customerPhone
                    ? `<a class="action-btn" href="tel:${String(x.customerPhone).replace(/[^\d+]/g,'')}" style="background:#059669;color:white;text-decoration:none;"><i class="fas fa-phone"></i></a>`
                    : '';
                return `
                    <tr>
                        <td><span class="status-badge" style="background:#D4A843;color:white;"><i class="fas fa-taxi"></i> נסיעה</span></td>
                        <td><strong>${x.id}</strong></td>
                        <td>${x.customerName}</td>
                        <td>${x.passengers || 1} נוסעים · ₪${x.estimatedPrice || 0}</td>
                        <td><small>${x.fromAddress || ''} ← ${x.toAddress || ''}</small></td>
                        <td><span class="status-badge status-${x.status}">${rideStatusLabels2[x.status] || x.status}</span></td>
                        <td>${telBtn}</td>
                    </tr>
                `;
            }
        }).join('');
}

// Load Orders
function loadOrders(filter = 'all') {
    const orders = DB.get('orders');
    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
    const tbody = document.getElementById('allOrdersTable');

    tbody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="9" style="text-align:center;color:var(--gray);padding:30px;">אין הזמנות</td></tr>'
        : filtered.slice().reverse().map(o => `
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

    if (order.customerPhone) {
        const telNum = String(order.customerPhone).replace(/[^\d+]/g, '');
        buttons.push(`<a class="action-btn" href="tel:${telNum}" style="background:#059669;color:white;text-decoration:none;" title="חייג ל-${order.customerName}"><i class="fas fa-phone"></i> חייג</a>`);
    }

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

    return buttons.join(' ') || '<span style="color:var(--gray)">-</span>';
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

    grid.innerHTML = suppliers.map(s => {
        const rating = getSupplierRating(s.id);
        const iconDef = getIconDef(s.iconKey || 'food', BUSINESS_ICONS);
        const bizImg = s.businessImage || (s.images && s.images[0]) || '';
        return `
        <div class="supplier-card" style="border-top:4px solid ${iconDef.color};">
            ${bizImg ? `<img src="${bizImg}" alt="${s.name}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:10px;">` : ''}
            <h3><i class="fas ${iconDef.icon}" style="color:${iconDef.color};"></i> ${s.name} <span style="font-size:12px;font-weight:normal;color:var(--gray);">· ${iconDef.label}</span>
                <button onclick="openIconPicker('supplier','${s.id}')" title="שנה אייקון מפה" style="background:none;border:none;color:#2563EB;cursor:pointer;font-size:14px;float:left;"><i class="fas fa-palette"></i></button>
            </h3>
            <div style="margin:6px 0;font-size:14px;">
                ${renderStars(rating.avg)}
                <span style="color:var(--gray);font-size:12px;">(${rating.count} ביקורות${rating.count ? ' · ' + rating.avg.toFixed(1) : ''})</span>
                <button class="btn btn-small" onclick="addReviewPrompt('${s.id}')" style="background:#FFB800;color:white;padding:2px 8px;font-size:11px;margin-right:6px;">
                    <i class="fas fa-plus"></i> הוסף
                </button>
            </div>
            <p>${s.description}</p>
            <p><i class="fas fa-phone"></i> ${s.phone}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${s.address}</p>
            <div class="supplier-meta">
                <span class="supplier-tag"><i class="fas fa-tag"></i> ${categoryLabels[s.category] || s.category}</span>
                <span class="supplier-tag"><i class="fas fa-utensils"></i> ${getSupplierProducts(s.id).length} פריטים</span>
                <span class="supplier-tag" style="color:${s.isActive ? '#28a745' : '#dc3545'}">
                    <i class="fas fa-circle"></i> ${s.isActive ? 'פעיל' : 'לא פעיל'}
                </span>
                ${s.openTime ? `<span class="supplier-tag"><i class="fas fa-clock"></i> ${s.openTime}-${s.closeTime}</span>` : ''}
                ${s.deliveryRadius ? `<span class="supplier-tag"><i class="fas fa-route"></i> ${s.deliveryRadius} ק"מ</span>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

function addReviewPrompt(supplierId) {
    const stars = parseInt(prompt('דירוג 1-5:', '5'));
    if (!stars || stars < 1 || stars > 5) return;
    const name = prompt('שם המדרג:', 'לקוח') || 'אנונימי';
    const text = prompt('ביקורת (אופציונלי):', '') || '';
    const review = {
        id: 'REV-' + Date.now().toString().slice(-6),
        supplierId, stars, text,
        customerName: name,
        createdAt: new Date().toISOString()
    };
    DB.add('reviews', review);
    loadSuppliers();
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
    const activeBtn = document.querySelector(`.preview-btn[onclick*="'${size}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

/* ===================== */
/* Products (מוצרים)     */
/* ===================== */

const prodCategoryLabels = {
    'food': 'אוכל', 'sweets': 'מתוקים ופיצוחים', 'drinks': 'שתייה',
    'flowers': 'פרחים', 'office': 'ציוד משרדי', 'cleaning': 'ניקיון',
    'documents': 'מסמכים', 'international': 'מסירה חבילות חו"ל', 'other': 'אחר'
};

const prodUnitLabels = {
    'unit': 'יחידה', 'kg': 'ק"ג', 'pack': 'חבילה', 'box': 'קרטון', 'bottle': 'בקבוק'
};

let prodImageData = null;
let prodImagesData = [];

function showAddProduct() {
    document.getElementById('addProductForm').style.display = 'block';
    if (document.getElementById('prodAddonsList').children.length === 0) {
        addAddonRow();
    }
}

function hideProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
    prodImageData = null;
    document.getElementById('prodImagePreview').innerHTML = '';
}

function addAddonRow(name = '', price = '') {
    const list = document.getElementById('prodAddonsList');
    const row = document.createElement('div');
    row.className = 'addon-row';
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:6px;align-items:center;';
    row.innerHTML = `
        <input type="text" placeholder="שם התוספת" value="${name}" class="addon-name" style="flex:2;padding:8px;border:1px solid #e0e0e0;border-radius:6px;">
        <input type="number" placeholder="מחיר ₪" value="${price}" min="0" step="0.5" class="addon-price" style="flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:6px;">
        <button type="button" class="action-btn cancel" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    list.appendChild(row);
}

function collectAddons() {
    const rows = document.querySelectorAll('#prodAddonsList .addon-row');
    const addons = [];
    rows.forEach(r => {
        const name = r.querySelector('.addon-name').value.trim();
        const price = parseFloat(r.querySelector('.addon-price').value) || 0;
        if (name) addons.push({ name, price });
    });
    return addons;
}

function previewProductImage(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    prodImagesData = [];
    const preview = document.getElementById('prodImagePreview');
    preview.innerHTML = '';
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            prodImagesData.push(ev.target.result);
            prodImageData = prodImagesData[0];
            const img = document.createElement('img');
            img.src = ev.target.result;
            img.style.cssText = 'width:80px;height:60px;object-fit:cover;border-radius:6px;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
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
        images: prodImagesData.length > 0 ? prodImagesData.slice() : (prodImageData ? [prodImageData] : []),
        addons: collectAddons(),
        notes: document.getElementById('prodNotes').value.trim(),
        daypart: document.getElementById('prodDaypart').value,
        forInstitutions: document.getElementById('prodForInstitutions').checked,
        createdAt: new Date().toISOString()
    };

    DB.add('products', product);
    loadProducts();
    hideProductForm();

    // Clear form
    ['prodName', 'prodDesc', 'prodPrice', 'prodSupplier', 'prodLocation', 'prodStock', 'prodNotes'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('prodAddonsList').innerHTML = '';
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
                    ${p.addons && p.addons.length ? '<span class="prod-tag" style="color:#059669;"><i class="fas fa-plus-circle"></i> ' + p.addons.length + ' תוספות</span>' : ''}
                </div>
                ${p.addons && p.addons.length ? '<div style="margin-top:8px;padding:8px;background:#f8f9fa;border-radius:6px;font-size:12px;"><strong>תוספות:</strong> ' + p.addons.map(a => a.name + ' (₪' + a.price + ')').join(', ') + '</div>' : ''}
                ${p.notes ? '<div style="margin-top:6px;padding:6px 8px;background:#fff8e1;border-right:3px solid #D4A843;font-size:12px;color:#666;"><i class="fas fa-sticky-note"></i> ' + p.notes + '</div>' : ''}
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

let adminMapCurrentView = 'all';

function isLayerOn(which, layer) {
    // Only relevant in "all" view. Other views show only their own layer.
    const sel = which === 'dash' ? '.dash-map-layer-toggle' : '.map-layer-toggle';
    const cb = document.querySelector(`${sel}[data-layer="${layer}"]`);
    return cb ? cb.checked : true;
}

function applyMapLayers(which) {
    if (which === 'main') {
        if (adminMapCurrentView === 'all') loadMapMarkers('all');
    } else {
        if (dashMapCurrentView === 'all') loadDashMapMarkers('all');
    }
}

function loadMapMarkers(view) {
    adminMapCurrentView = view;
    // Clear layers
    Object.values(mapLayers).flat().forEach(m => adminMap.removeLayer(m));
    mapLayers = { couriers: [], suppliers: [], deliveries: [], fleet: [], taxis: [] };
    const showAll = view === 'all';

    // Couriers
    if ((showAll && isLayerOn('main', 'couriers')) || view === 'couriers') {
        const couriers = DB.get('couriers');
        couriers.forEach(c => {
            if (c.lat && c.lng) {
                const def = getIconDef(c.iconKey || 'scooter', COURIER_ICONS);
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="background:${def.color};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas ${def.icon}"></i></div>`,
                    iconSize: [32, 32], iconAnchor: [16, 16]
                });
                const m = L.marker([c.lat, c.lng], { icon }).addTo(adminMap);
                bindHoverPopup(m, courierPopupHtml(c, def));
                mapLayers.couriers.push(m);
            }
        });
    }

    // Suppliers
    if ((showAll && isLayerOn('main', 'suppliers')) || view === 'suppliers') {
        const suppliers = DB.get('suppliers');
        suppliers.forEach(s => {
            if (s.lat && s.lng) {
                const def = getIconDef(s.iconKey || 'food', BUSINESS_ICONS);
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="background:${def.color};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas ${def.icon}"></i></div>`,
                    iconSize: [32, 32], iconAnchor: [16, 16]
                });
                const m = L.marker([s.lat, s.lng], { icon }).addTo(adminMap);
                bindHoverPopup(m, supplierPopupHtml(s, def));
                mapLayers.suppliers.push(m);
            }
        });
    }

    // Active deliveries (customer icon — shows customer info on hover)
    if ((showAll && isLayerOn('main', 'deliveries')) || view === 'deliveries') {
        const orders = DB.get('orders').filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        orders.forEach((o, i) => {
            const offset = (i + 1) * 0.003;
            const icon = L.divIcon({
                className: '',
                html: `<div style="background:${CUSTOMER_COLOR};color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-user"></i></div>`,
                iconSize: [30, 30], iconAnchor: [15, 15]
            });
            const m = L.marker([OFAKIM[0] + offset, OFAKIM[1] + offset], { icon }).addTo(adminMap);
            bindHoverPopup(m, customerPopupHtml(o));
            mapLayers.deliveries.push(m);
        });
    }

    // Fleet vehicles
    if ((showAll && isLayerOn('main', 'fleet')) || view === 'fleet') {
        renderFleetMarkers(adminMap, mapLayers.fleet);
    }

    // Taxis (drivers only)
    if ((showAll && isLayerOn('main', 'taxis')) || view === 'taxis') {
        renderTaxiMarkers(adminMap, mapLayers.taxis);
    }
}

// Render taxi drivers as markers with popup details + active ride pickups
function renderTaxiMarkers(mapInst, layerArr) {
    const drivers = DB.get('drivers');
    const rides = DB.get('rides');
    const statusColors = { available: '#28a745', busy: '#D97706', offline: '#6B7280', pending_approval: '#9CA3AF' };

    drivers.forEach(d => {
        if (!d.lat || !d.lng) return;
        const color = statusColors[d.status] || '#D4A843';
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:${color};color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:3px solid #fde047;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><i class="fas fa-taxi"></i></div>`,
            iconSize: [36, 36], iconAnchor: [18, 18]
        });
        const m = L.marker([d.lat, d.lng], { icon }).addTo(mapInst);
        bindHoverPopup(m, taxiPopupHtml(d));
        layerArr.push(m);
    });

    // Active rides - pickup points
    const activeRides = rides.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
    activeRides.forEach((r, i) => {
        const lat = r.pickupLat || (OFAKIM[0] + (i + 1) * 0.002);
        const lng = r.pickupLng || (OFAKIM[1] + (i + 1) * 0.002);
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:#EA580C;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-map-pin"></i></div>`,
            iconSize: [30, 30], iconAnchor: [15, 30]
        });
        const m = L.marker([lat, lng], { icon }).addTo(mapInst);
        const driver = r.driverId ? drivers.find(d => d.id === r.driverId) : null;
        bindHoverPopup(m, ridePopupHtml(r, driver));
        layerArr.push(m);
    });
}

function ridePopupHtml(r, driver) {
    const statusLabels = {
        'requested': 'חדש - ממתין', 'accepted': 'אושר',
        'on_way_to_pickup': 'נהג בדרך', 'in_ride': 'בנסיעה',
        'completed': 'הושלם', 'cancelled': 'בוטל'
    };
    const vehicleLabels = { standard: 'רגיל', large: 'מרווח', accessible: 'נגיש', premium: 'פרימיום' };
    const telHtml = r.customerPhone
        ? `<a href="tel:${String(r.customerPhone).replace(/[^\d+]/g,'')}" style="color:#2563EB;text-decoration:none;">${r.customerPhone}</a>`
        : '-';
    return `
        <div style="min-width:240px;font-family:'Heebo',sans-serif;direction:rtl;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="background:#EA580C;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="fas fa-taxi"></i></div>
                <div>
                    <strong style="font-size:14px;">${r.id}</strong><br>
                    <span style="font-size:11px;color:#666;">נסיעת מונית · ${vehicleLabels[r.vehicleType] || r.vehicleType}</span>
                </div>
            </div>
            <div style="font-size:12px;line-height:1.7;">
                <div><strong>${r.customerName}</strong></div>
                <div><i class="fas fa-phone" style="color:#059669;"></i> ${telHtml}</div>
                <div><i class="fas fa-map-marker-alt" style="color:#059669;"></i> ${r.fromAddress}</div>
                <div><i class="fas fa-flag-checkered" style="color:#C41E2F;"></i> ${r.toAddress}</div>
                <div><i class="fas fa-users" style="color:#7C3AED;"></i> ${r.passengers} נוסעים · ₪${r.estimatedPrice}</div>
                ${driver ? `<div><i class="fas fa-id-card" style="color:#D4A843;"></i> נהג: ${driver.name}</div>` : '<div style="color:#999;"><i>לא שויך נהג</i></div>'}
                <div><i class="fas fa-circle" style="color:#D4A843;font-size:9px;"></i> ${statusLabels[r.status] || r.status}</div>
            </div>
        </div>`;
}

function taxiPopupHtml(d) {
    const statusLabels = { available: 'פנוי', busy: 'בנסיעה', offline: 'לא פעיל', pending_approval: 'ממתין לאישור' };
    const statusColors = { available: '#28a745', busy: '#D97706', offline: '#6B7280', pending_approval: '#9CA3AF' };
    const vehicleLabels = { standard: 'רגיל', large: 'מרווח', accessible: 'נגיש', premium: 'פרימיום' };
    const photo = d.photo
        ? `<img src="${d.photo}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid #D4A843;">`
        : `<div style="width:60px;height:60px;border-radius:50%;background:#D4A843;color:white;display:flex;align-items:center;justify-content:center;font-size:28px;"><i class="fas fa-taxi"></i></div>`;
    const telHtml = d.phone
        ? `<a href="tel:${String(d.phone).replace(/[^\d+]/g,'')}" style="color:#2563EB;text-decoration:none;">${d.phone}</a>`
        : '-';
    return `
        <div style="min-width:230px;font-family:'Heebo',sans-serif;direction:rtl;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                ${photo}
                <div>
                    <strong style="font-size:14px;">${d.name}</strong><br>
                    <span style="font-size:11px;color:#666;">נהג מונית · ${vehicleLabels[d.vehicleType] || d.vehicleType}</span>
                </div>
            </div>
            <div style="font-size:12px;line-height:1.7;">
                <div><i class="fas fa-phone" style="color:#059669;"></i> ${telHtml}</div>
                <div><i class="fas fa-id-badge" style="color:#D4A843;"></i> ${d.plate || '-'}</div>
                <div><i class="fas fa-users" style="color:#7C3AED;"></i> ${d.seats} מושבים${d.accessible ? ' · ♿ נגיש' : ''}</div>
                <div><i class="fas fa-star" style="color:#FFB800;"></i> ${(d.rating || 0)} · ${d.ridesCount || 0} נסיעות</div>
                <div><i class="fas fa-circle" style="color:${statusColors[d.status] || '#6B7280'};font-size:9px;"></i> <strong>${statusLabels[d.status] || '-'}</strong></div>
            </div>
        </div>`;
}

// Show popup on hover instead of click
function bindHoverPopup(marker, html) {
    marker.bindPopup(html, { closeButton: false, autoPan: false });
    marker.on('mouseover', function() { this.openPopup(); });
    marker.on('mouseout', function() { setTimeout(() => this.closePopup(), 200); });
}

function supplierPopupHtml(s, def) {
    const rating = getSupplierRating(s.id);
    const prodCount = getSupplierProducts(s.id).length;
    const starsHtml = rating.count > 0
        ? `${renderStars(rating.avg)} <span style="font-size:11px;color:#666;">(${rating.count})</span>`
        : '<span style="font-size:11px;color:#999;">אין ביקורות</span>';
    const telHtml = s.phone
        ? `<a href="tel:${String(s.phone).replace(/[^\d+]/g,'')}" style="color:#2563EB;text-decoration:none;">${s.phone}</a>`
        : '-';
    return `
        <div style="min-width:220px;font-family:'Heebo',sans-serif;direction:rtl;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="background:${def.color};color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="fas ${def.icon}"></i></div>
                <div>
                    <strong style="font-size:14px;">${s.name}</strong><br>
                    <span style="font-size:11px;color:#666;">${def.label}</span>
                </div>
            </div>
            <div style="font-size:12px;line-height:1.6;">
                ${s.description ? `<div>${s.description}</div>` : ''}
                <div><i class="fas fa-phone" style="color:#059669;"></i> ${telHtml}</div>
                <div><i class="fas fa-map-marker-alt" style="color:#C41E2F;"></i> ${s.address || '-'}</div>
                ${s.openTime ? `<div><i class="fas fa-clock" style="color:#D97706;"></i> ${s.openTime}-${s.closeTime}</div>` : ''}
                <div><i class="fas fa-boxes-stacked" style="color:#7C3AED;"></i> ${prodCount} מוצרים</div>
                <div>${starsHtml}</div>
            </div>
        </div>`;
}

function courierPopupHtml(c, def) {
    const photo = c.photo
        ? `<img src="${c.photo}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid ${def.color};">`
        : `<div style="width:60px;height:60px;border-radius:50%;background:${def.color};color:white;display:flex;align-items:center;justify-content:center;font-size:28px;border:2px solid white;"><i class="fas ${def.icon}"></i></div>`;
    const telHtml = c.phone
        ? `<a href="tel:${String(c.phone).replace(/[^\d+]/g,'')}" style="color:#2563EB;text-decoration:none;">${c.phone}</a>`
        : '-';
    return `
        <div style="min-width:220px;font-family:'Heebo',sans-serif;direction:rtl;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                ${photo}
                <div>
                    <strong style="font-size:14px;">${c.name}</strong><br>
                    <span style="font-size:11px;color:#666;">שליח · ${def.label}</span>
                </div>
            </div>
            <div style="font-size:12px;line-height:1.6;">
                <div><i class="fas fa-phone" style="color:#059669;"></i> ${telHtml}</div>
                <div><i class="fas fa-circle" style="color:${c.isActive !== false ? '#28a745' : '#dc3545'};font-size:9px;"></i> ${c.isActive !== false ? 'פעיל' : 'לא פעיל'}</div>
            </div>
        </div>`;
}

function customerPopupHtml(o) {
    const telHtml = o.customerPhone
        ? `<a href="tel:${String(o.customerPhone).replace(/[^\d+]/g,'')}" style="color:#2563EB;text-decoration:none;">${o.customerPhone}</a>`
        : '-';
    return `
        <div style="min-width:200px;font-family:'Heebo',sans-serif;direction:rtl;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <div style="width:44px;height:44px;border-radius:50%;background:${CUSTOMER_COLOR};color:white;display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas fa-user"></i></div>
                <div>
                    <strong style="font-size:14px;">${o.customerName || 'לקוח'}</strong><br>
                    <span style="font-size:11px;color:#666;">הזמנה ${o.id}</span>
                </div>
            </div>
            <div style="font-size:12px;line-height:1.6;">
                <div><i class="fas fa-phone" style="color:#059669;"></i> ${telHtml}</div>
                <div><i class="fas fa-map-marker-alt" style="color:#C41E2F;"></i> ${o.deliveryAddress || '-'}</div>
                ${o.totalPrice ? `<div><i class="fas fa-shekel-sign" style="color:#D4A843;"></i> ₪${o.totalPrice}</div>` : ''}
            </div>
        </div>`;
}

// Render fleet markers on a given map, pushing to a given array
function renderFleetMarkers(mapInst, layerArr, offsetMap) {
    const fleet = DB.get('fleet');
    const couriers = DB.get('couriers');
    fleet.forEach((v, i) => {
        // Find position: assigned courier's lat/lng if active; otherwise depot (OFAKIM center)
        let lat, lng, posLabel;
        const assignedCourier = v.courier ? couriers.find(c => c.name === v.courier) : null;
        if (v.status === 'active' && assignedCourier && assignedCourier.lat && assignedCourier.lng) {
            lat = assignedCourier.lat;
            lng = assignedCourier.lng;
            if (offsetMap && offsetMap[assignedCourier.id]) {
                lat += offsetMap[assignedCourier.id].lat;
                lng += offsetMap[assignedCourier.id].lng;
            }
            posLabel = 'בדרך';
        } else {
            // Stack at depot with a fan-out offset
            const angle = (i / Math.max(fleet.length, 1)) * Math.PI * 2;
            lat = OFAKIM[0] + Math.cos(angle) * 0.002;
            lng = OFAKIM[1] + Math.sin(angle) * 0.002;
            posLabel = v.status === 'maintenance' ? 'בתחזוקה' :
                       v.status === 'inactive' ? 'לא פעיל' : 'במרכז הפצה';
        }

        const color = v.status === 'active' ? '#059669' :
                      v.status === 'maintenance' ? '#D97706' : '#6B7280';
        const iconClass = vehicleTypeIcons[v.type] || 'fa-car';
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:${color};color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid #7C3AED;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas ${iconClass}"></i></div>`,
            iconSize: [34, 34], iconAnchor: [17, 17]
        });
        const m = L.marker([lat, lng], { icon }).addTo(mapInst)
            .bindPopup(`<strong>${vehicleTypeLabels[v.type] || v.type} · ${v.plate}</strong><br>` +
                       `שליח: ${v.courier || 'לא מוקצה'}<br>` +
                       `סטטוס: ${posLabel}`);
        layerArr.push(m);
    });
}

function showMapView(view) {
    document.querySelectorAll('#tab-maps .map-tab-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`#tab-maps .map-tab-btn[onclick*="'${view}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
    loadMapMarkers(view);
}

/* Dashboard mini-map (separate instance) */
let dashMap = null;
let dashMapLayers = { couriers: [], suppliers: [], deliveries: [] };

function initDashMap() {
    const el = document.getElementById('dashboardMap');
    if (!el) return;
    if (dashMap) { dashMap.remove(); dashMap = null; }
    dashMap = L.map('dashboardMap').setView(OFAKIM, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19
    }).addTo(dashMap);
    loadDashMapMarkers('all');
    startDashTracking();
}

function loadDashMapMarkers(view) {
    dashMapCurrentView = view;
    Object.values(dashMapLayers).flat().forEach(m => dashMap.removeLayer(m));
    dashMapLayers = { couriers: [], suppliers: [], deliveries: [], fleet: [], taxis: [] };
    const showAll = view === 'all';

    if ((showAll && isLayerOn('dash', 'couriers')) || view === 'couriers') {
        DB.get('couriers').forEach(c => {
            if (c.lat && c.lng) {
                const off = dashCourierOffsets[c.id] || { lat: 0, lng: 0 };
                const def = getIconDef(c.iconKey || 'scooter', COURIER_ICONS);
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="background:${def.color};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas ${def.icon}"></i></div>`,
                    iconSize: [32, 32], iconAnchor: [16, 16]
                });
                const m = L.marker([c.lat + off.lat, c.lng + off.lng], { icon }).addTo(dashMap);
                bindHoverPopup(m, courierPopupHtml(c, def));
                dashMapLayers.couriers.push(m);
            }
        });
    }

    if ((showAll && isLayerOn('dash', 'suppliers')) || view === 'suppliers') {
        DB.get('suppliers').forEach(s => {
            if (s.lat && s.lng) {
                const def = getIconDef(s.iconKey || 'food', BUSINESS_ICONS);
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="background:${def.color};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas ${def.icon}"></i></div>`,
                    iconSize: [32, 32], iconAnchor: [16, 16]
                });
                const m = L.marker([s.lat, s.lng], { icon }).addTo(dashMap);
                bindHoverPopup(m, supplierPopupHtml(s, def));
                dashMapLayers.suppliers.push(m);
            }
        });
    }

    if ((showAll && isLayerOn('dash', 'deliveries')) || view === 'deliveries') {
        const orders = DB.get('orders').filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        orders.forEach((o, i) => {
            const offset = (i + 1) * 0.003;
            const icon = L.divIcon({
                className: '',
                html: `<div style="background:${CUSTOMER_COLOR};color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-user"></i></div>`,
                iconSize: [30, 30], iconAnchor: [15, 15]
            });
            const m = L.marker([OFAKIM[0] + offset, OFAKIM[1] + offset], { icon }).addTo(dashMap);
            bindHoverPopup(m, customerPopupHtml(o));
            dashMapLayers.deliveries.push(m);
        });
    }

    if ((showAll && isLayerOn('dash', 'fleet')) || view === 'fleet') {
        renderFleetMarkers(dashMap, dashMapLayers.fleet, dashCourierOffsets);
    }

    if ((showAll && isLayerOn('dash', 'taxis')) || view === 'taxis') {
        renderTaxiMarkers(dashMap, dashMapLayers.taxis);
    }
}

function showDashMapView(view) {
    document.querySelectorAll('#tab-dashboard .map-tab-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`#tab-dashboard .map-tab-btn[onclick*="'${view}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
    dashMapCurrentView = view;
    loadDashMapMarkers(view);
}

let dashMapCurrentView = 'all';
let dashTrackingInterval = null;
let dashCourierOffsets = {};

function startDashTracking() {
    if (dashTrackingInterval) clearInterval(dashTrackingInterval);
    dashTrackingInterval = setInterval(() => {
        if (!dashMap) return;
        // Simulate courier movement: jitter offsets in-memory only (don't persist)
        DB.get('couriers').forEach(c => {
            if (!dashCourierOffsets[c.id]) dashCourierOffsets[c.id] = { lat: 0, lng: 0 };
            dashCourierOffsets[c.id].lat += (Math.random() - 0.5) * 0.0006;
            dashCourierOffsets[c.id].lng += (Math.random() - 0.5) * 0.0006;
            // Clamp drift so markers don't wander too far
            dashCourierOffsets[c.id].lat = Math.max(-0.01, Math.min(0.01, dashCourierOffsets[c.id].lat));
            dashCourierOffsets[c.id].lng = Math.max(-0.01, Math.min(0.01, dashCourierOffsets[c.id].lng));
        });
        loadDashMapMarkers(dashMapCurrentView);
    }, 5000);
}

/* ===================== */
/* Fleet (צי תנועה)      */
/* ===================== */

const vehicleTypeLabels = { 'bike': 'אופניים', 'scooter': 'וספה', 'car': 'רכב', 'drone': 'רחפן', 'taxi': 'מונית' };
const vehicleTypeIcons = { 'bike': 'fa-bicycle', 'scooter': 'fa-motorcycle', 'car': 'fa-car', 'drone': 'fa-helicopter', 'taxi': 'fa-taxi' };
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
    document.getElementById('fleetDrones').textContent = fleet.filter(v => v.type === 'drone').length;
    document.getElementById('fleetTaxis').textContent = fleet.filter(v => v.type === 'taxi').length;

    const typeFilter = (document.getElementById('fleetTypeFilter') || {}).value || 'all';
    const search = ((document.getElementById('fleetSearch') || {}).value || '').trim().toLowerCase();

    let filtered = fleet;
    if (typeFilter !== 'all') filtered = filtered.filter(v => v.type === typeFilter);
    if (search) {
        filtered = filtered.filter(v =>
            (v.plate || '').toLowerCase().includes(search) ||
            (v.courier || '').toLowerCase().includes(search) ||
            (vehicleTypeLabels[v.type] || '').includes(search)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:30px;">לא נמצאו כלי רכב</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(v => {
        const realIndex = fleet.indexOf(v);
        const imgHtml = v.image
            ? `<img src="${v.image}" style="width:70px;height:46px;object-fit:cover;border-radius:6px;border:1px solid #e0e0e0;">`
            : `<div style="width:70px;height:46px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9ca3af;"><i class="fas ${vehicleTypeIcons[v.type] || 'fa-car'}" style="font-size:22px;"></i></div>`;
        return `
            <tr>
                <td>${imgHtml}</td>
                <td><i class="fas ${vehicleTypeIcons[v.type]}" style="color:var(--primary);margin-left:6px;"></i> ${vehicleTypeLabels[v.type]}</td>
                <td><strong>${v.plate}</strong></td>
                <td>${v.courier || '-'}</td>
                <td><span class="status-badge status-${v.status === 'active' ? 'delivered' : v.status === 'maintenance' ? 'pending' : 'cancelled'}">${vehicleStatusLabels[v.status]}</span></td>
                <td><button class="action-btn cancel" onclick="deleteVehicle(${realIndex})"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    }).join('');
}

function seedFleetTaxis() {
    if (!confirm('תוסיף 60 מוניות לצי הרכב (עם תמונות). להמשיך?')) return;
    const fleet = DB.get('fleet');
    const firstNames = ['יוסי', 'אבי', 'דני', 'רון', 'משה', 'שלמה', 'עומר', 'איתי', 'אליאב', 'תמיר', 'שרה', 'מיכל', 'רונית', 'יעל', 'נועה'];
    const lastNames = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'אברהם', 'דוד', 'שטרית', 'ביטון', 'חדד', 'עזרא'];
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const vehicleTypes = ['standard', 'standard', 'standard', 'standard', 'large', 'accessible', 'premium'];
    const statuses = ['active', 'active', 'active', 'active', 'maintenance', 'inactive'];

    for (let i = 0; i < 60; i++) {
        const plate = `${rnd(10, 99)}-${rnd(100, 999)}-${rnd(10, 99)}`;
        const vType = pick(vehicleTypes);
        fleet.push({
            id: 'V-taxi-' + Date.now().toString().slice(-4) + '-' + i,
            type: 'taxi',
            plate,
            courier: `${pick(firstNames)} ${pick(lastNames)}`,
            status: pick(statuses),
            vehicleSubType: vType,
            image: generateTaxiImage(plate, vType, i),
            _demo: true
        });
    }
    DB.set('fleet', fleet);
    alert('נוספו 60 מוניות לצי!');
    loadFleet();
}

// Override showTab to init map and fleet
const origShowTab = showTab;
showTab = function(tab) {
    origShowTab(tab);
    if (tab === 'maps') {
        setTimeout(() => { initAdminMap(); }, 100);
    }
    if (tab === 'dashboard') {
        setTimeout(() => { initDashMap(); }, 100);
    }
    if (tab === 'fleet') {
        loadFleet();
    }
    if (tab === 'accounting') {
        initAccounting();
    }
    if (tab === 'settings') {
        loadSettings();
    }
    if (tab === 'settlement') {
        loadSettlement();
    }
    if (tab === 'courierSettlement') {
        loadCourierSettlement();
    }
    if (tab === 'supplierSettlement') {
        loadSupplierSettlement();
    }
    if (tab === 'team') {
        loadTeam();
    }
    if (tab === 'analytics') {
        loadAnalytics();
    }
    if (tab === 'couriers') {
        loadCouriers();
    }
    if (tab === 'photos') {
        renderPhotosMain();
    }
    if (tab === 'rides') {
        loadRides();
    }
    if (tab === 'drivers') {
        loadDrivers();
    }
    if (tab === 'rentals') {
        loadRentals();
    }
};

/* ===================== */
/* Drivers + Rides (Taxi) */
/* ===================== */

const rideStatusLabels = {
    'requested': 'חדש - ממתין',
    'accepted': 'אושר',
    'on_way_to_pickup': 'בדרך לאיסוף',
    'in_ride': 'בנסיעה',
    'completed': 'הושלם',
    'cancelled': 'בוטל'
};

const rideVehicleLabels = {
    'standard': 'רגיל',
    'large': 'מרווח',
    'accessible': 'נגיש',
    'premium': 'פרימיום'
};

let pendingDriverPhoto = null;

function previewDriverPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        pendingDriverPhoto = ev.target.result;
        document.getElementById('driverPhotoPreview').innerHTML =
            `<img src="${pendingDriverPhoto}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid #D4A843;">`;
    };
    reader.readAsDataURL(file);
}

function showAddDriver() {
    document.getElementById('addDriverForm').style.display = 'block';
}

function hideAddDriver() {
    document.getElementById('addDriverForm').style.display = 'none';
    ['driverName', 'driverPhone', 'driverLicense', 'driverPlate'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('driverSeats').value = '4';
    document.getElementById('driverAccessible').checked = false;
    document.getElementById('driverPhotoInput').value = '';
    document.getElementById('driverPhotoPreview').innerHTML = '';
    pendingDriverPhoto = null;
}

function addDriver() {
    const name = document.getElementById('driverName').value.trim();
    if (!name) return alert('נא למלא שם');
    const vehicleType = document.getElementById('driverVehicleType').value;
    const plate = document.getElementById('driverPlate').value.trim();
    const driverIconDef = { icon: 'fa-id-card', color: '#D4A843' };
    const driver = {
        id: 'drv-' + Date.now().toString().slice(-6),
        name,
        phone: document.getElementById('driverPhone').value.trim(),
        license: document.getElementById('driverLicense').value.trim(),
        plate,
        vehicleType,
        seats: parseInt(document.getElementById('driverSeats').value) || 4,
        accessible: document.getElementById('driverAccessible').checked,
        status: 'available',
        rating: 0,
        ridesCount: 0,
        photo: pendingDriverPhoto || generatePersonAvatar(name, driverIconDef, 0),
        vehicleImages: [
            generateTaxiImage(plate || name, vehicleType, 0),
            generateTaxiImage((plate || name) + ' · פנים', vehicleType, 1)
        ],
        lat: 31.3133 + (Math.random() - 0.5) * 0.02,
        lng: 34.62 + (Math.random() - 0.5) * 0.02
    };
    DB.add('drivers', driver);
    hideAddDriver();
    loadDrivers();
}

// Seed products across the 6 categories requested
function seedCategoryProducts() {
    if (!confirm('תוסיף מוצרים ב-6 קטגוריות: אוכל, פרחים, חבילות, מעטפות, סיגריות ויין, מוצרי יסוד. להמשיך?')) return;

    const categories = [
        {
            key: 'food', storeCategory: 'food', label: 'אוכל', iconKey: 'food',
            supplierName: 'מטבח השף אופקים',
            items: [
                { name: 'שניצל טוגן + ירקות', price: 42 },
                { name: 'פסטה ברוטב עגבניות', price: 38 },
                { name: 'אורז עם ירקות', price: 22 },
                { name: 'חומוס מלא עם פיתות', price: 32 },
                { name: 'מרק עוף ביתי', price: 28 },
                { name: 'סלט חי', price: 24 },
                { name: 'מג׳דרה ביתית', price: 26 },
                { name: 'חצילים בטחינה', price: 28 },
                { name: 'קציצות בקר', price: 48 },
                { name: 'כבד קצוץ', price: 36 },
                { name: 'שווארמה בצלחת', price: 55 },
                { name: 'פיצה משפחתית', price: 68 }
            ]
        },
        {
            key: 'flowers', storeCategory: 'flowers', label: 'פרחים', iconKey: 'flowers',
            supplierName: 'פרחי אהבה אופקים',
            items: [
                { name: 'זר ורדים אדומים', price: 180 },
                { name: 'זר חמניות', price: 150 },
                { name: 'עציץ סחלב לבן', price: 220 },
                { name: 'זר כלות לבן', price: 450 },
                { name: 'זר פרחי בר מעורבים', price: 95 },
                { name: 'זר גרברות צבעוני', price: 120 },
                { name: 'זר יום הולדת', price: 110 },
                { name: 'זר ליולדת', price: 165 },
                { name: 'זר אבל', price: 140 },
                { name: 'סידור פרחים לשולחן', price: 200 },
                { name: 'קקטוס בעציץ', price: 45 },
                { name: 'בונסאי קטן', price: 280 }
            ]
        },
        {
            key: 'package', storeCategory: 'documents', label: 'חבילות', iconKey: 'documents',
            supplierName: 'שליחויות אופקים אקספרס',
            items: [
                { name: 'חבילה עד 1 ק"ג באופקים', price: 25 },
                { name: 'חבילה עד 5 ק"ג באופקים', price: 45 },
                { name: 'חבילה עד 10 ק"ג באופקים', price: 65 },
                { name: 'חבילה דחופה (30 דק׳)', price: 60 },
                { name: 'חבילה שבירים - ביטוח', price: 85 },
                { name: 'חבילה מקוררת', price: 95 },
                { name: 'חבילה עם איסוף מהבית', price: 55 },
                { name: 'חבילה רגישה לזמן', price: 75 },
                { name: 'חבילה לאחסון 24ש', price: 30 },
                { name: 'איסוף ומסירה באותו יום', price: 50 },
                { name: 'חבילה גדולה (20 ק"ג+)', price: 120 },
                { name: 'משלוח בין ערים סמוכות', price: 90 }
            ]
        },
        {
            key: 'envelope', storeCategory: 'documents', label: 'מעטפות ומסמכים', iconKey: 'documents',
            supplierName: 'דואר מהיר הנגב',
            items: [
                { name: 'מעטפה רגילה באופקים', price: 15 },
                { name: 'מעטפה דחופה (30 דק׳)', price: 35 },
                { name: 'מסמך חתום לעו"ד', price: 40 },
                { name: 'משלוח חוזה חתום', price: 45 },
                { name: 'הזמנה לחתונה (50+)', price: 120 },
                { name: 'טופס בנק', price: 25 },
                { name: 'מסמך לבית משפט', price: 55 },
                { name: 'תעודת רכב', price: 30 },
                { name: 'קבלה/חשבונית', price: 20 },
                { name: 'מכתב רשמי', price: 22 },
                { name: 'מעטפה עם חתימה נדרשת', price: 50 },
                { name: 'אישור מסירה מצולם', price: 38 }
            ]
        },
        {
            key: 'tobacco_wine', storeCategory: 'drinks', label: 'סיגריות ויין', iconKey: 'sweets',
            supplierName: 'יינות וטבק הנגב',
            items: [
                { name: 'חפיסת מרלבורו', price: 36 },
                { name: 'חפיסת נובלס', price: 34 },
                { name: 'פחית טבק לגלגול', price: 80 },
                { name: 'נרגילה מנטה', price: 120 },
                { name: 'גפרורים ומצת', price: 15 },
                { name: 'יין אדום ברקן', price: 55 },
                { name: 'יין לבן שאטו', price: 68 },
                { name: 'בקבוק וודקה אבסולוט', price: 145 },
                { name: 'וויסקי ג׳וני ווקר', price: 180 },
                { name: 'ערק אלית', price: 85 },
                { name: 'ליקר Baileys', price: 120 },
                { name: 'שישית בירה גולדסטאר', price: 45 }
            ]
        },
        {
            key: 'basics', storeCategory: 'other', label: 'מוצרי יסוד', iconKey: 'institutions',
            supplierName: 'סופר יסוד אופקים',
            items: [
                { name: 'לחם פרוס 750ג', price: 10 },
                { name: 'חלב טרי 3% ליטר', price: 7 },
                { name: 'ביצים L - תריסר', price: 18 },
                { name: 'סוכר לבן 1 ק"ג', price: 6 },
                { name: 'קמח לבן 1 ק"ג', price: 7 },
                { name: 'אורז לבן 1 ק"ג', price: 12 },
                { name: 'עגבניות 1 ק"ג', price: 9 },
                { name: 'מלפפונים 1 ק"ג', price: 8 },
                { name: 'שמן קנולה 1 ליטר', price: 15 },
                { name: 'מלח ים 500 גר׳', price: 6 },
                { name: 'גבינה צהובה 200 גר׳', price: 22 },
                { name: 'טונה במים 160 גר׳', price: 11 }
            ]
        }
    ];

    const suppliers = DB.get('suppliers');
    const products = DB.get('products');
    const baseLat = 31.3133, baseLng = 34.6200;

    categories.forEach((cat, ci) => {
        const supId = 'sup-cat-' + cat.key;
        let supplier = suppliers.find(s => s.id === supId);
        if (!supplier) {
            supplier = {
                id: supId,
                name: cat.supplierName,
                category: cat.storeCategory || cat.key,
                iconKey: cat.iconKey,
                description: `ספק מוביל בקטגוריית ${cat.label}`,
                phone: `050-${String(5000000 + ci * 111).slice(-7)}`,
                email: `${supId}@demo.co.il`,
                address: `רחוב הקטגוריות ${ci + 1}, אופקים`,
                isActive: true,
                lat: baseLat + (Math.random() - 0.5) * 0.02,
                lng: baseLng + (Math.random() - 0.5) * 0.02,
                openTime: '08:00',
                closeTime: '22:00',
                workDays: [0, 1, 2, 3, 4, 5],
                deliveryRadius: 10,
                images: [],
                _demo: true
            };
            suppliers.push(supplier);
        }

        const iconDef = getIconDef(cat.iconKey, BUSINESS_ICONS);
        cat.items.slice(0, 10).forEach((item, i) => {
            const pid = `PRD-cat-${cat.key}-${i}`;
            if (products.find(p => p.id === pid)) return;
            const img = generateIconImage(item.name, iconDef, { variant: i });
            products.push({
                id: pid,
                supplierId: supId,
                supplier: cat.supplierName,
                location: supplier.address,
                name: item.name,
                description: `${item.name} - ${cat.label}`,
                price: item.price,
                category: cat.storeCategory || cat.key,
                unit: 'unit',
                stock: 20 + Math.floor(Math.random() * 80),
                minOrder: 1,
                image: img,
                images: [img],
                addons: [],
                notes: '',
                daypart: 'all',
                forInstitutions: true,
                _demo: true,
                createdAt: new Date().toISOString()
            });
        });
    });

    DB.set('suppliers', suppliers);
    DB.set('products', products);

    const total = categories.reduce((s, c) => s + Math.min(c.items.length, 10), 0);
    alert(`נוספו ${total} מוצרים ב-6 קטגוריות. הדף יטען מחדש כדי לרענן את כל המסכים.`);
    location.reload();
}

// End-to-end test: 10 customers, mix of flows, verifies pipeline works
function runTaxiTest10() {
    if (!confirm('בדיקת 10 לקוחות מונית — תיצור 10 נסיעות במצבים שונים ותבדוק שהכל עובד. להמשיך?')) return;

    const drivers = DB.get('drivers').filter(d => d.status !== 'offline');
    if (drivers.length < 3) {
        alert('יש צורך לפחות ב-3 נהגים פעילים. לחץ קודם על "יצר 10 נהגי מוניות + 10 שליחים".');
        return;
    }

    const results = [];
    const log = (name, ok, note) => results.push({ name, ok, note });

    // Test 1-10: Create 10 customers with varied scenarios
    const customers = [
        { name: 'דנה כהן', phone: '0501000001', scenario: 'new_no_card' },
        { name: 'אבי לוי', phone: '0501000002', scenario: 'card_saved' },
        { name: 'מירי פרץ', phone: '0501000003', scenario: 'completed_with_rating' },
        { name: 'יוסי מזרחי', phone: '0501000004', scenario: 'cancelled_early' },
        { name: 'שרה ביטון', phone: '0501000005', scenario: 'in_ride' },
        { name: 'רון אברהם', phone: '0501000006', scenario: 'accessible_ride' },
        { name: 'נועה חדד', phone: '0501000007', scenario: 'premium_ride' },
        { name: 'אלי דוד', phone: '0501000008', scenario: 'on_way_to_pickup' },
        { name: 'ליאת שטרית', phone: '0501000009', scenario: 'completed_no_rating' },
        { name: 'תמיר עזרא', phone: '0501000010', scenario: 'scheduled_future' }
    ];

    const rides = DB.get('rides');
    const ratings = DB.get('rideRatings');
    const baseLat = 31.3133, baseLng = 34.6200;
    const rnd = (min, max) => min + Math.random() * (max - min);

    customers.forEach((cust, i) => {
        const pickupLat = baseLat + rnd(-0.015, 0.015);
        const pickupLng = baseLng + rnd(-0.015, 0.015);
        const dropoffLat = baseLat + rnd(-0.015, 0.015);
        const dropoffLng = baseLng + rnd(-0.015, 0.015);
        const km = Math.max(0.5, Math.sqrt(Math.pow((dropoffLat - pickupLat) * 111, 2) + Math.pow((dropoffLng - pickupLng) * 90, 2)));

        let vehicleType = 'standard', status = 'requested', driverId = null, paymentMethod = 'cash';

        switch (cust.scenario) {
            case 'new_no_card': paymentMethod = 'cash'; status = 'requested'; break;
            case 'card_saved': paymentMethod = 'app'; status = 'accepted'; driverId = drivers[0].id; break;
            case 'completed_with_rating': status = 'completed'; driverId = drivers[1 % drivers.length].id; paymentMethod = 'app'; break;
            case 'cancelled_early': status = 'cancelled'; paymentMethod = 'cash'; break;
            case 'in_ride': status = 'in_ride'; driverId = drivers[2 % drivers.length].id; paymentMethod = 'card'; break;
            case 'accessible_ride': vehicleType = 'accessible'; status = 'accepted'; driverId = (drivers.find(d => d.vehicleType === 'accessible') || drivers[0]).id; break;
            case 'premium_ride': vehicleType = 'premium'; status = 'on_way_to_pickup'; driverId = (drivers.find(d => d.vehicleType === 'premium') || drivers[0]).id; paymentMethod = 'app'; break;
            case 'on_way_to_pickup': status = 'on_way_to_pickup'; driverId = drivers[0].id; break;
            case 'completed_no_rating': status = 'completed'; driverId = drivers[1 % drivers.length].id; break;
            case 'scheduled_future': status = 'requested'; paymentMethod = 'bit'; break;
        }

        const price = Math.round(15 + km * 3);
        const ride = {
            id: 'RD-T' + Date.now().toString().slice(-4) + '-' + i,
            fromAddress: `רחוב ${['הרצל', 'הנשיא', 'הגפן', 'החלוצים', 'ז׳בוטינסקי'][i % 5]} ${10 + i}, אופקים`,
            toAddress: `רחוב ${['הבנים', 'הדקל', 'התמר', 'המדע', 'השלום'][i % 5]} ${20 + i}, אופקים`,
            pickupLat, pickupLng, dropoffLat, dropoffLng,
            passengers: 1 + (i % 4),
            vehicleType, status, driverId, paymentMethod,
            customerName: cust.name,
            customerPhone: cust.phone,
            notes: cust.scenario === 'accessible_ride' ? 'זקוק לעזרה עם כיסא גלגלים' : '',
            estimatedKm: parseFloat(km.toFixed(1)),
            estimatedPrice: price,
            when: cust.scenario === 'scheduled_future' ? 'scheduled' : 'now',
            scheduledAt: cust.scenario === 'scheduled_future' ? new Date(Date.now() + 2 * 3600 * 1000).toISOString() : null,
            createdAt: new Date(Date.now() - i * 300000).toISOString(),
            _demo: true
        };

        // If app payment, add fake token
        if (paymentMethod === 'app' || paymentMethod === 'card') {
            ride.cardToken = 'tok_test' + i;
            ride.cardLast4 = String(1000 + i).slice(-4);
            ride.cardBrand = ['Visa', 'Mastercard', 'Isracard'][i % 3];
        }

        rides.push(ride);

        // Add rating for completed_with_rating
        if (cust.scenario === 'completed_with_rating') {
            ratings.push({
                id: 'RRT-T' + i,
                rideId: ride.id,
                driverId: driverId,
                stars: 4 + (i % 2),
                text: 'נסיעה נעימה!',
                customerName: cust.name,
                createdAt: new Date().toISOString(),
                _demo: true
            });
        }

        log(`${i + 1}. ${cust.name} (${cust.scenario})`, true, `${status} · ${vehicleType} · ₪${price}`);
    });

    DB.set('rides', rides);
    DB.set('rideRatings', ratings);

    // Verify — read back
    const verifyRides = DB.get('rides').filter(r => customers.some(c => c.phone === r.customerPhone));
    log('', true, '───────────');
    log(`סה"כ נסיעות שנוצרו`, verifyRides.length === 10, `${verifyRides.length}/10`);
    log(`משוייכות לנהגים`, verifyRides.filter(r => r.driverId).length === 8, `${verifyRides.filter(r => r.driverId).length}/10`);
    log(`עם כרטיס אשראי`, verifyRides.filter(r => r.cardToken).length === 4, `${verifyRides.filter(r => r.cardToken).length}/10`);
    log(`הושלמו`, verifyRides.filter(r => r.status === 'completed').length === 2, `${verifyRides.filter(r => r.status === 'completed').length}/10`);
    log(`בוטלו`, verifyRides.filter(r => r.status === 'cancelled').length === 1, `${verifyRides.filter(r => r.status === 'cancelled').length}/10`);
    log(`דירוגים חדשים`, DB.get('rideRatings').filter(r => customers.some(c => c.name === r.customerName)).length === 1, '1/1');

    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    const report = results.map(r => `${r.ok ? '✓' : '✗'} ${r.name} ${r.note || ''}`).join('\n');
    alert(`בדיקת 10 לקוחות הושלמה\n\n${passed} עברו · ${failed} נכשלו\n\n${report}\n\nעבור לטאב "נסיעות (מוניות)" לראות את התוצאות.`);
    if (document.getElementById('tab-rides').classList.contains('active')) loadRides();
    loadDashboard();
}

// Seed 10 taxi rides with random customers, drivers, pickup/dropoff
function seedRandomRides() {
    if (!confirm('תוסיף 10 נסיעות מוניות אקראיות עם נהגים ומיקומים על המפה. להמשיך?')) return;

    const drivers = DB.get('drivers');
    if (drivers.length < 5) {
        if (!confirm('יש פחות מ-5 נהגים. מומלץ קודם ליצור 10 נהגים. להמשיך בכל זאת?')) return;
    }

    const firstNames = ['דנה', 'משה', 'אבי', 'רחל', 'יוסי', 'מירי', 'דן', 'תמר', 'עומר', 'שרה', 'רון', 'לאה', 'בן', 'נטע', 'גיל'];
    const lastNames = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'אברהם', 'ביטון', 'חדד', 'שטרית'];
    const streets = [
        'שד׳ הרצל', 'רח׳ הנשיא', 'רח׳ החלוצים', 'רח׳ יצחק רבין', 'רח׳ ז׳בוטינסקי',
        'רח׳ הבנים', 'רח׳ הגפן', 'שד׳ בן גוריון', 'רח׳ הדקל', 'רח׳ התמר',
        'רח׳ האגוז', 'מרכז מסחרי', 'תחנה מרכזית', 'קניון אופקים', 'בית ספר יגאל אלון',
        'קופת חולים כללית', 'מתנ״ס אופקים', 'פארק גלוי', 'רח׳ הרב עוזיאל', 'רח׳ אהוד קינמון'
    ];
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const vehicleTypes = ['standard', 'standard', 'standard', 'large', 'accessible', 'premium'];
    const statusOptions = ['requested', 'requested', 'accepted', 'on_way_to_pickup', 'in_ride', 'in_ride'];

    const rides = DB.get('rides');
    const baseLat = 31.3133, baseLng = 34.6200;

    for (let i = 0; i < 10; i++) {
        const customerName = `${pick(firstNames)} ${pick(lastNames)}`;
        const fromStreet = pick(streets);
        const toStreet = pick(streets.filter(s => s !== fromStreet));
        const vehicleType = pick(vehicleTypes);
        const status = pick(statusOptions);
        // Assign driver if not requested-only
        let driverId = null;
        if (status !== 'requested' && drivers.length > 0) {
            const matching = drivers.filter(d => d.vehicleType === vehicleType);
            driverId = (matching[0] || drivers[rnd(0, drivers.length - 1)]).id;
        }
        const km = 2 + Math.random() * 8;
        const price = Math.round(15 + km * 3);
        rides.push({
            id: 'RD-R' + Date.now().toString().slice(-4) + '-' + i,
            fromAddress: `${fromStreet} ${rnd(1, 120)}, אופקים`,
            toAddress: `${toStreet} ${rnd(1, 120)}, אופקים`,
            pickupLat: baseLat + (Math.random() - 0.5) * 0.03,
            pickupLng: baseLng + (Math.random() - 0.5) * 0.03,
            dropoffLat: baseLat + (Math.random() - 0.5) * 0.03,
            dropoffLng: baseLng + (Math.random() - 0.5) * 0.03,
            passengers: rnd(1, vehicleType === 'large' ? 7 : 4),
            vehicleType,
            when: 'now',
            scheduledAt: null,
            customerName,
            customerPhone: `052-${rnd(2000000, 9999999)}`,
            notes: '',
            estimatedKm: parseFloat(km.toFixed(1)),
            estimatedPrice: price,
            status,
            driverId,
            _demo: true,
            createdAt: new Date(Date.now() - rnd(0, 3600 * 1000 * 5)).toISOString()
        });
    }
    DB.set('rides', rides);

    // Set matching drivers to busy
    const busyDriverIds = new Set(rides.filter(r => r.driverId && r.status !== 'completed' && r.status !== 'cancelled').map(r => r.driverId));
    drivers.forEach(d => { if (busyDriverIds.has(d.id) && d.status === 'available') d.status = 'busy'; });
    DB.set('drivers', drivers);

    alert('נוספו 10 נסיעות מוניות אקראיות!');
    if (document.getElementById('tab-rides').classList.contains('active')) loadRides();
    loadDashboard();
}

// Random seed: 10 drivers + 10 couriers with varied data
function seedRandomTeam() {
    if (!confirm('תוסיף 10 נהגי מוניות ו-10 שליחים אקראיים עם תמונות. להמשיך?')) return;

    const firstNames = ['יוסי', 'אבי', 'דני', 'רון', 'משה', 'שלמה', 'עומר', 'איתי', 'אליאב', 'תמיר', 'שרה', 'מיכל', 'רונית', 'יעל', 'נועה', 'קרן', 'ליאת', 'טל', 'אורית', 'הילה', 'מאיר', 'יגאל', 'ברק', 'אלי', 'גיא'];
    const lastNames = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'אברהם', 'דוד', 'שטרית', 'ביטון', 'חדד', 'עזרא', 'אוחיון', 'זהבי', 'בן דוד', 'אליהו', 'רחמים'];
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomPhone = () => `05${pick(['0','2','3','4','8'])}-${rnd(2000000, 9999999)}`;

    // 10 drivers
    const drivers = DB.get('drivers');
    const driverIconDef = { icon: 'fa-id-card', color: '#D4A843' };
    const vehicleTypes = ['standard', 'standard', 'standard', 'large', 'accessible', 'premium'];
    for (let i = 0; i < 10; i++) {
        const name = `${pick(firstNames)} ${pick(lastNames)}`;
        const vehicleType = pick(vehicleTypes);
        const plate = `${rnd(10, 99)}-${rnd(100, 999)}-${rnd(10, 99)}`;
        const id = 'drv-rnd-' + Date.now().toString().slice(-4) + '-' + i;
        drivers.push({
            id,
            name,
            phone: randomPhone(),
            license: `DL-${rnd(100000, 999999)}`,
            plate,
            vehicleType,
            seats: vehicleType === 'large' ? 7 : (vehicleType === 'premium' ? 5 : 4),
            accessible: vehicleType === 'accessible',
            status: pick(['available', 'available', 'available', 'busy', 'offline']),
            rating: (3.5 + Math.random() * 1.5).toFixed(1),
            ridesCount: rnd(5, 500),
            photo: generatePersonAvatar(name, driverIconDef, i),
            vehicleImages: [
                generateTaxiImage(plate, vehicleType, 0),
                generateTaxiImage(plate + ' · פנים', vehicleType, 1)
            ],
            lat: 31.3133 + (Math.random() - 0.5) * 0.03,
            lng: 34.62 + (Math.random() - 0.5) * 0.03,
            _demo: true
        });
    }
    DB.set('drivers', drivers);

    // 10 couriers
    const couriers = DB.get('couriers');
    const iconKeys = ['bike', 'scooter', 'scooter', 'car', 'van', 'drone', 'walking', 'runner', 'eco'];
    for (let i = 0; i < 10; i++) {
        const name = `${pick(firstNames)} ${pick(lastNames)}`;
        const iconKey = pick(iconKeys);
        const def = getIconDef(iconKey, COURIER_ICONS);
        const id = 'courier-rnd-' + Date.now().toString().slice(-4) + '-' + i;
        couriers.push({
            id,
            name,
            phone: randomPhone(),
            iconKey,
            photo: generatePersonAvatar(name, def, i),
            isActive: pick([true, true, true, false]),
            lat: 31.3133 + (Math.random() - 0.5) * 0.03,
            lng: 34.62 + (Math.random() - 0.5) * 0.03,
            _demo: true
        });
    }
    DB.set('couriers', couriers);

    alert('נוספו 10 נהגי מוניות ו-10 שליחים אקראיים עם תמונות!');
    if (document.getElementById('tab-drivers').classList.contains('active')) loadDrivers();
    if (document.getElementById('tab-couriers').classList.contains('active')) loadCouriers();
}

function deleteDriver(id) {
    if (!confirm('למחוק נהג?')) return;
    const drivers = DB.get('drivers').filter(d => d.id !== id);
    DB.set('drivers', drivers);
    loadDrivers();
}

function toggleDriverStatus(id) {
    const drivers = DB.get('drivers');
    const d = drivers.find(x => x.id === id);
    if (!d) return;
    const cycle = { available: 'busy', busy: 'offline', offline: 'available' };
    d.status = cycle[d.status] || 'available';
    DB.set('drivers', drivers);
    loadDrivers();
}

function loadDrivers() {
    const grid = document.getElementById('driversGrid');
    const drivers = DB.get('drivers');
    if (drivers.length === 0) {
        grid.innerHTML = '<p style="color:var(--gray);padding:20px;">אין נהגים. לחץ "הוסף נהג".</p>';
        return;
    }
    const statusLabels = { available: 'פנוי', busy: 'עסוק', offline: 'לא פעיל' };
    const statusColors = { available: '#28a745', busy: '#D97706', offline: '#6B7280' };
    const fleet = DB.get('fleet');
    // Taxi fleet that's available (not assigned to another active driver)
    const assignedVehicleIds = new Set(drivers.filter(x => x.currentVehicleId).map(x => x.currentVehicleId));
    const taxiFleet = fleet.filter(v => v.type === 'taxi');

    grid.innerHTML = drivers.map(d => {
        const photoHtml = d.photo
            ? `<img src="${d.photo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${statusColors[d.status] || '#6B7280'};display:block;margin:0 auto 10px;">`
            : `<div style="width:80px;height:80px;border-radius:50%;background:#D4A843;color:white;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 10px;"><i class="fas fa-id-card"></i></div>`;

        const currentVehicle = d.currentVehicleId ? fleet.find(v => v.id === d.currentVehicleId) : null;
        const options = taxiFleet
            .filter(v => !assignedVehicleIds.has(v.id) || v.id === d.currentVehicleId)
            .map(v => `<option value="${v.id}" ${v.id === d.currentVehicleId ? 'selected' : ''}>${v.plate} · ${vehicleTypeLabels[v.type]}</option>`)
            .join('');
        const vehicleBlock = `
            <div style="margin:10px 0;padding:10px;background:#fef3c7;border-radius:8px;border:1px solid #fbbf24;">
                <div style="font-size:11px;color:#92400E;font-weight:600;margin-bottom:6px;"><i class="fas fa-taxi"></i> מונית משוייכת</div>
                ${currentVehicle
                    ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                          ${currentVehicle.image ? `<img src="${currentVehicle.image}" style="width:60px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #d97706;">` : ''}
                          <div style="text-align:right;flex:1;">
                              <strong style="font-size:12px;">${currentVehicle.plate}</strong><br>
                              <span style="font-size:11px;color:#666;">${vehicleTypeLabels[currentVehicle.type]}</span>
                          </div>
                       </div>`
                    : '<div style="font-size:12px;color:#92400E;margin-bottom:6px;">לא משוייך רכב</div>'
                }
                <div style="display:flex;gap:4px;">
                    <select onchange="assignVehicleToDriver('${d.id}', this.value)" style="flex:1;padding:4px;font-size:11px;border:1px solid #d97706;border-radius:4px;">
                        <option value="">- בחר רכב -</option>
                        ${options}
                    </select>
                    ${currentVehicle ? `<button onclick="unassignDriverVehicle('${d.id}')" style="background:#dc3545;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;"><i class="fas fa-unlink"></i></button>` : ''}
                </div>
            </div>
        `;

        return `
        <div class="supplier-card" style="border-top:4px solid ${statusColors[d.status] || '#6B7280'};text-align:center;position:relative;">
            <button onclick="openIconPicker('driver','${d.id}')" title="שנה אייקון מפה" style="position:absolute;top:8px;left:8px;background:none;border:none;color:#2563EB;cursor:pointer;font-size:16px;"><i class="fas fa-palette"></i></button>
            ${photoHtml}
            <h3 style="margin-bottom:4px;">${d.name}</h3>
            <p><i class="fas fa-phone"></i> ${d.phone || '-'}</p>
            ${vehicleBlock}
            <p><i class="fas fa-car"></i> ${rideVehicleLabels[d.vehicleType] || d.vehicleType} · ${d.seats} מושבים</p>
            <p><i class="fas fa-id-badge"></i> ${d.plate || '-'}</p>
            ${d.accessible ? '<p style="color:#2563EB;"><i class="fas fa-wheelchair"></i> נגיש לנכים</p>' : ''}
            <div class="supplier-meta">
                <span class="supplier-tag" style="color:${statusColors[d.status]};cursor:pointer;" onclick="toggleDriverStatus('${d.id}')">
                    <i class="fas fa-circle"></i> ${statusLabels[d.status] || '-'}
                </span>
                <span class="supplier-tag"><i class="fas fa-star" style="color:#FFB800;"></i> ${(parseFloat(d.rating) || 0).toFixed(1)}</span>
                <span class="supplier-tag"><i class="fas fa-route"></i> ${d.ridesCount || 0} נסיעות</span>
                ${d.phone ? `<a class="supplier-tag" href="tel:${d.phone.replace(/[^\d+]/g, '')}" style="color:#059669;text-decoration:none;"><i class="fas fa-phone"></i> חייג</a>` : ''}
            </div>
            <button class="action-btn cancel" onclick="deleteDriver('${d.id}')" style="margin-top:10px;"><i class="fas fa-trash"></i> מחק</button>
        </div>
    `;
    }).join('');
}

/* ===================== */
/* Rentals (bikes/scooters) */
/* ===================== */

const rentalTypeLabels = {
    bike_electric: 'אופניים חשמליים',
    bike_regular: 'אופניים רגילים',
    scooter: 'קורקינט חשמלי'
};
const rentalPickupLabels = {
    main: 'מרכז העיר',
    park: 'פארק גלוי',
    mall: 'קניון אופקים',
    station: 'תחנה מרכזית'
};
const rentalStatusLabels = { active: 'פעיל', returned: 'הוחזר', cancelled: 'בוטל' };

function loadRentals() {
    const all = DB.get('rentals');
    const filter = (document.getElementById('rentalStatusFilter') || {}).value || 'all';
    const search = ((document.getElementById('rentalSearch') || {}).value || '').trim().toLowerCase();

    let filtered = all;
    if (filter !== 'all') filtered = filtered.filter(r => r.status === filter);
    if (search) {
        filtered = filtered.filter(r =>
            r.id.toLowerCase().includes(search) ||
            (r.customerName || '').toLowerCase().includes(search) ||
            (r.customerPhone || '').includes(search)
        );
    }

    document.getElementById('rentalsTotal').textContent = all.length;
    document.getElementById('rentalsActive').textContent = all.filter(r => r.status === 'active').length;
    const totalRev = all.filter(r => r.status !== 'cancelled').reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
    document.getElementById('rentalsRevenue').textContent = '₪' + totalRev.toLocaleString('he-IL');

    const tbody = document.getElementById('rentalsTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--gray);padding:30px;">לא נמצאו השכרות</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.slice().reverse().map(r => `
        <tr>
            <td><strong>${r.id}</strong></td>
            <td>${r.customerName}</td>
            <td>${r.customerPhone ? `<a href="tel:${r.customerPhone.replace(/[^\d+]/g,'')}" style="color:#059669;">${r.customerPhone}</a>` : '-'}</td>
            <td><i class="fas ${r.type === 'scooter' ? 'fa-bolt' : 'fa-bicycle'}" style="color:#10B981;"></i> ${rentalTypeLabels[r.type] || r.type}</td>
            <td>${r.qty}</td>
            <td>₪${r.rate}/${r.duration === 'day' ? 'יום' : 'שעה'}</td>
            <td><strong>₪${r.total}</strong></td>
            <td>${rentalPickupLabels[r.pickup] || r.pickup}</td>
            <td style="font-size:12px;">${new Date(r.createdAt).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
            <td><span class="status-badge status-${r.status === 'active' ? 'pending' : r.status === 'returned' ? 'delivered' : 'cancelled'}">${rentalStatusLabels[r.status] || r.status}</span></td>
            <td>
                ${r.customerPhone ? `<a class="action-btn" href="tel:${r.customerPhone.replace(/[^\d+]/g,'')}" style="background:#059669;color:white;text-decoration:none;"><i class="fas fa-phone"></i></a>` : ''}
                ${r.status === 'active' ? `<button class="action-btn approve" onclick="markRentalReturned('${r.id}')">הוחזר</button>` : ''}
                ${r.status === 'active' ? `<button class="action-btn cancel" onclick="cancelRental('${r.id}')">בטל</button>` : ''}
                <button class="action-btn cancel" onclick="deleteRental('${r.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function markRentalReturned(id) {
    const rentals = DB.get('rentals');
    const r = rentals.find(x => x.id === id);
    if (!r) return;
    r.status = 'returned';
    r.returnedAt = new Date().toISOString();
    DB.set('rentals', rentals);
    loadRentals();
}

function cancelRental(id) {
    if (!confirm('לבטל השכרה זו?')) return;
    const rentals = DB.get('rentals');
    const r = rentals.find(x => x.id === id);
    if (!r) return;
    r.status = 'cancelled';
    DB.set('rentals', rentals);
    loadRentals();
}

function deleteRental(id) {
    if (!confirm('למחוק השכרה זו לצמיתות?')) return;
    const rentals = DB.get('rentals').filter(r => r.id !== id);
    DB.set('rentals', rentals);
    loadRentals();
}

function assignVehicleToDriver(driverId, vehicleId) {
    const drivers = DB.get('drivers');
    const fleet = DB.get('fleet');

    // Enforce: a vehicle can only be attached to one driver at a time
    if (vehicleId) {
        const currentHolder = drivers.find(x => x.currentVehicleId === vehicleId && x.id !== driverId);
        if (currentHolder) {
            if (!confirm(`רכב זה משוייך כעת ל-${currentHolder.name}. לשחרר ולשייך לנהג החדש?`)) {
                loadDrivers();
                return;
            }
            currentHolder.currentVehicleId = null;
        }
    }

    // Assign new vehicle (and release previous one from this driver)
    const d = drivers.find(x => x.id === driverId);
    if (!d) return;
    d.currentVehicleId = vehicleId || null;

    // Update fleet.currentDriverId for both new & previous vehicle
    fleet.forEach(v => {
        if (v.type !== 'taxi') return;
        if (v.id === vehicleId) v.currentDriverId = driverId;
        else if (v.currentDriverId === driverId && v.id !== vehicleId) v.currentDriverId = null;
    });

    DB.set('drivers', drivers);
    DB.set('fleet', fleet);
    loadDrivers();
}

function unassignDriverVehicle(driverId) {
    const drivers = DB.get('drivers');
    const fleet = DB.get('fleet');
    const d = drivers.find(x => x.id === driverId);
    if (!d) return;
    const prev = d.currentVehicleId;
    d.currentVehicleId = null;
    fleet.forEach(v => { if (v.id === prev) v.currentDriverId = null; });
    DB.set('drivers', drivers);
    DB.set('fleet', fleet);
    loadDrivers();
}

function loadRides() {
    const filter = (document.getElementById('ridesFilter') || {}).value || 'all';
    const rides = DB.get('rides');
    const drivers = DB.get('drivers');
    const filtered = filter === 'all' ? rides : rides.filter(r => r.status === filter);
    const tbody = document.getElementById('ridesTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--gray);padding:30px;">אין נסיעות</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.slice().reverse().map(r => {
        const driver = drivers.find(d => d.id === r.driverId);
        const driverOptions = drivers.filter(d => d.status !== 'offline').map(d =>
            `<option value="${d.id}" ${r.driverId === d.id ? 'selected' : ''}>${d.name}</option>`
        ).join('');
        return `
            <tr>
                <td><strong>${r.id}</strong></td>
                <td>${r.customerName}</td>
                <td>${r.customerPhone ? `<a href="tel:${r.customerPhone.replace(/[^\d+]/g,'')}" style="color:#059669;">${r.customerPhone}</a>` : '-'}</td>
                <td style="font-size:12px;">${r.fromAddress}</td>
                <td style="font-size:12px;">${r.toAddress}</td>
                <td>${r.passengers}</td>
                <td>${rideVehicleLabels[r.vehicleType] || r.vehicleType}</td>
                <td><strong>₪${r.estimatedPrice || 0}</strong></td>
                <td>
                    <select onchange="assignDriver('${r.id}', this.value)" style="padding:4px;font-size:12px;">
                        <option value="">- בחר -</option>
                        ${driverOptions}
                    </select>
                </td>
                <td><span class="status-badge status-${r.status}">${rideStatusLabels[r.status]}</span></td>
                <td style="font-size:12px;">${new Date(r.createdAt).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td>${getRideActionButtons(r)}</td>
            </tr>
        `;
    }).join('');
}

function getRideActionButtons(r) {
    const buttons = [];
    if (r.customerPhone) {
        buttons.push(`<a class="action-btn" href="tel:${r.customerPhone.replace(/[^\d+]/g,'')}" style="background:#059669;color:white;text-decoration:none;"><i class="fas fa-phone"></i></a>`);
    }
    if (r.status === 'requested') {
        buttons.push(`<button class="action-btn approve" onclick="updateRideStatus('${r.id}','accepted')">אשר</button>`);
        buttons.push(`<button class="action-btn cancel" onclick="updateRideStatus('${r.id}','cancelled')">בטל</button>`);
    }
    if (r.status === 'accepted') {
        buttons.push(`<button class="action-btn progress" onclick="updateRideStatus('${r.id}','on_way_to_pickup')">בדרך</button>`);
    }
    if (r.status === 'on_way_to_pickup') {
        buttons.push(`<button class="action-btn progress" onclick="updateRideStatus('${r.id}','in_ride')">התחל נסיעה</button>`);
    }
    if (r.status === 'in_ride') {
        buttons.push(`<button class="action-btn approve" onclick="updateRideStatus('${r.id}','completed')">סיום</button>`);
    }
    return buttons.join(' ') || '<span style="color:var(--gray)">-</span>';
}

function updateRideStatus(id, status) {
    const rides = DB.get('rides');
    const r = rides.find(x => x.id === id);
    if (!r) return;
    r.status = status;
    if (status === 'completed') {
        // Increment driver's rides count
        if (r.driverId) {
            const drivers = DB.get('drivers');
            const d = drivers.find(x => x.id === r.driverId);
            if (d) {
                d.ridesCount = (d.ridesCount || 0) + 1;
                d.status = 'available';
                DB.set('drivers', drivers);
            }
        }
    }
    DB.set('rides', rides);
    loadRides();
}

function assignDriver(rideId, driverId) {
    const rides = DB.get('rides');
    const r = rides.find(x => x.id === rideId);
    if (!r) return;
    r.driverId = driverId || null;
    DB.set('rides', rides);
    if (driverId) {
        const drivers = DB.get('drivers');
        const d = drivers.find(x => x.id === driverId);
        if (d && d.status === 'available') {
            d.status = 'busy';
            DB.set('drivers', drivers);
        }
    }
    loadRides();
}

/* ===================== */
/* Shared Icon Picker     */
/* ===================== */

// Expand customer avatars to multiple options for map display
const CUSTOMER_MAP_ICONS = [
    { key: 'user', label: 'לקוח', icon: 'fa-user', color: CUSTOMER_COLOR },
    { key: 'male', label: 'גבר', icon: 'fa-person', color: CUSTOMER_COLOR },
    { key: 'female', label: 'אישה', icon: 'fa-person-dress', color: CUSTOMER_COLOR },
    { key: 'child', label: 'ילד', icon: 'fa-child', color: CUSTOMER_COLOR },
    { key: 'elder', label: 'קשיש', icon: 'fa-user-large', color: CUSTOMER_COLOR },
    { key: 'family', label: 'משפחה', icon: 'fa-people-roof', color: CUSTOMER_COLOR },
    { key: 'tie', label: 'איש עסקים', icon: 'fa-user-tie', color: CUSTOMER_COLOR },
    { key: 'graduate', label: 'סטודנט', icon: 'fa-user-graduate', color: CUSTOMER_COLOR },
    { key: 'doctor', label: 'רופא', icon: 'fa-user-doctor', color: CUSTOMER_COLOR },
    { key: 'shield', label: 'אנונימי', icon: 'fa-user-shield', color: CUSTOMER_COLOR }
];

const TAXI_MAP_ICONS = [
    { key: 'taxi', label: 'מונית רגילה', icon: 'fa-taxi', color: '#D4A843' },
    { key: 'car', label: 'רכב פרטי', icon: 'fa-car', color: '#D4A843' },
    { key: 'van', label: 'מרווחה', icon: 'fa-van-shuttle', color: '#D4A843' },
    { key: 'shuttle', label: 'שאטל', icon: 'fa-shuttle-van', color: '#D4A843' },
    { key: 'accessible', label: 'נגישה', icon: 'fa-wheelchair-move', color: '#D4A843' },
    { key: 'premium', label: 'פרימיום', icon: 'fa-crown', color: '#D4A843' },
    { key: 'electric', label: 'חשמלית', icon: 'fa-bolt', color: '#D4A843' },
    { key: 'suv', label: 'SUV', icon: 'fa-truck-pickup', color: '#D4A843' }
];

let currentIconPickerContext = null;

function openIconPicker(type, id) {
    currentIconPickerContext = { type, id };
    const titleMap = {
        supplier: 'אייקון ספק על המפה',
        customer: 'אייקון לקוח על המפה',
        driver: 'אייקון מונית על המפה',
        courier: 'אייקון שליח על המפה'
    };
    const setMap = {
        supplier: BUSINESS_ICONS,
        customer: CUSTOMER_MAP_ICONS,
        driver: TAXI_MAP_ICONS,
        courier: COURIER_ICONS
    };
    const set = setMap[type];
    if (!set) return;

    // Find current selection
    let currentKey = null;
    if (type === 'supplier') {
        const s = DB.get('suppliers').find(x => x.id === id);
        currentKey = s ? s.iconKey : null;
    } else if (type === 'driver') {
        const d = DB.get('drivers').find(x => x.id === id);
        currentKey = d ? (d.mapIconKey || 'taxi') : 'taxi';
    } else if (type === 'courier') {
        const c = DB.get('couriers').find(x => x.id === id);
        currentKey = c ? c.iconKey : null;
    } else if (type === 'customer') {
        const icons = JSON.parse(localStorage.getItem('tikitaka_customerIcons') || '{}');
        currentKey = icons[id];
    }

    document.getElementById('iconPickerTitle').textContent = titleMap[type];
    const grid = document.getElementById('iconPickerGrid');
    grid.innerHTML = set.map(i => `
        <div onclick="selectMapIcon('${i.key}')" style="cursor:pointer;border:2px solid ${i.key === currentKey ? i.color : '#e0e0e0'};background:${i.key === currentKey ? i.color + '20' : '#fff'};border-radius:12px;padding:16px 8px;text-align:center;transition:all 0.2s;" onmouseover="this.style.borderColor='${i.color}';" onmouseout="if(this.dataset.selected!=='1')this.style.borderColor='#e0e0e0';">
            <i class="fas ${i.icon}" style="font-size:32px;color:${i.color};"></i>
            <div style="margin-top:8px;font-size:12px;color:#333;">${i.label}</div>
        </div>
    `).join('');
    document.getElementById('iconPickerModal').style.display = 'flex';
}

function closeIconPicker() {
    document.getElementById('iconPickerModal').style.display = 'none';
    currentIconPickerContext = null;
}

function selectMapIcon(key) {
    if (!currentIconPickerContext) return;
    const { type, id } = currentIconPickerContext;
    if (type === 'supplier') {
        const suppliers = DB.get('suppliers');
        const s = suppliers.find(x => x.id === id);
        if (s) { s.iconKey = key; DB.set('suppliers', suppliers); }
        loadSuppliers();
    } else if (type === 'driver') {
        const drivers = DB.get('drivers');
        const d = drivers.find(x => x.id === id);
        if (d) { d.mapIconKey = key; DB.set('drivers', drivers); }
        loadDrivers();
    } else if (type === 'courier') {
        const couriers = DB.get('couriers');
        const c = couriers.find(x => x.id === id);
        if (c) { c.iconKey = key; DB.set('couriers', couriers); }
        loadCouriers();
    } else if (type === 'customer') {
        const icons = JSON.parse(localStorage.getItem('tikitaka_customerIcons') || '{}');
        icons[id] = key;
        localStorage.setItem('tikitaka_customerIcons', JSON.stringify(icons));
        loadCustomers();
    }
    closeIconPicker();
}

function getCustomerMapIcon(phoneOrName) {
    const icons = JSON.parse(localStorage.getItem('tikitaka_customerIcons') || '{}');
    return getIconDef(icons[phoneOrName] || 'user', CUSTOMER_MAP_ICONS);
}

/* ===================== */
/* Photos gallery browser */
/* ===================== */

function renderPhotosBreadcrumb(path) {
    const bc = document.getElementById('photosBreadcrumb');
    const parts = [{ label: '<i class="fas fa-images"></i> תמונות', action: "renderPhotosMain()" }, ...path];
    bc.innerHTML = parts.map((p, i) =>
        i === parts.length - 1
            ? `<span style="color:#333;font-weight:600;">${p.label}</span>`
            : `<a href="#" onclick="${p.action};return false;" style="color:#2563EB;text-decoration:none;">${p.label}</a> <i class="fas fa-chevron-left" style="font-size:10px;color:#999;margin:0 6px;"></i>`
    ).join('');
}

function renderPhotosMain() {
    renderPhotosBreadcrumb([]);
    const content = document.getElementById('photosContent');
    // Count unique customers who have at least one listing in DB.customerProducts
    const customerProducts = DB.get('customerProducts');
    const uniqueSellers = new Set(customerProducts.map(p => p.sellerPhone || p.sellerName)).size;
    const folders = [
        { type: 'customers', label: 'לקוחות', icon: 'fa-users', color: '#2563EB', count: new Set(DB.get('orders').map(o => o.customerPhone || o.customerName)).size },
        { type: 'products', label: 'מוצרים', icon: 'fa-boxes-stacked', color: '#D4A843', count: DB.get('products').length },
        { type: 'customerProducts', label: 'מוצרים (מלקוחות)', icon: 'fa-box-open', color: '#EA580C', count: uniqueSellers },
        { type: 'suppliers', label: 'חנויות / ספקים', icon: 'fa-store', color: '#C41E2F', count: DB.get('suppliers').length },
        { type: 'couriers', label: 'שליחים', icon: 'fa-motorcycle', color: '#059669', count: DB.get('couriers').length },
        { type: 'drivers', label: 'נהגי מוניות', icon: 'fa-id-card', color: '#D4A843', count: DB.get('drivers').length },
        { type: 'taxis', label: 'מוניות (רכב)', icon: 'fa-taxi', color: '#F59E0B', count: DB.get('drivers').length }
    ];
    content.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;">
            ${folders.map(f => `
                <div onclick="openPhotoFolder('${f.type}')" style="cursor:pointer;background:#fff;border:2px solid #e0e0e0;border-radius:16px;padding:32px 24px;text-align:center;transition:all 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 10px 30px rgba(0,0,0,0.12)';this.style.borderColor='${f.color}';" onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='#e0e0e0';">
                    <div style="font-size:64px;color:${f.color};margin-bottom:12px;">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div style="font-size:18px;font-weight:700;color:#333;margin-bottom:4px;">
                        <i class="fas ${f.icon}"></i> ${f.label}
                    </div>
                    <div style="color:#666;font-size:13px;">${f.count} פריטים</div>
                </div>
            `).join('')}
        </div>`;
}

function openPhotoFolder(type) {
    const labelMap = {
        customers: 'לקוחות', suppliers: 'חנויות / ספקים', couriers: 'שליחים',
        drivers: 'נהגי מוניות', taxis: 'מוניות (רכב)', customerProducts: 'מוצרים (מלקוחות)',
        products: 'מוצרים'
    };
    renderPhotosBreadcrumb([{ label: labelMap[type], action: `openPhotoFolder('${type}')` }]);
    const content = document.getElementById('photosContent');
    let items = [];

    if (type === 'customers') {
        const map = {};
        DB.get('orders').forEach(o => {
            const key = o.customerPhone || o.customerName;
            if (!key) return;
            if (!map[key]) map[key] = { id: key, name: o.customerName || 'לקוח', phone: o.customerPhone || '', count: 0 };
            map[key].count++;
        });
        items = Object.values(map);
    } else if (type === 'suppliers') {
        items = DB.get('suppliers').map(s => ({ id: s.id, name: s.name, count: getSupplierProducts(s.id).length, iconKey: s.iconKey }));
    } else if (type === 'couriers') {
        items = DB.get('couriers').map(c => ({ id: c.id, name: c.name, iconKey: c.iconKey, phone: c.phone }));
    } else if (type === 'drivers' || type === 'taxis') {
        items = DB.get('drivers').map(d => ({ id: d.id, name: d.name, phone: d.phone, vehicleType: d.vehicleType, plate: d.plate }));
    } else if (type === 'customerProducts') {
        const map = {};
        DB.get('customerProducts').forEach(p => {
            const key = p.sellerPhone || p.sellerName || 'unknown';
            if (!map[key]) map[key] = { id: key, name: p.sellerName || 'לקוח', phone: p.sellerPhone || '', count: 0 };
            map[key].count++;
        });
        items = Object.values(map);
    } else if (type === 'products') {
        // Group products by category
        const map = {};
        DB.get('products').forEach(p => {
            const cat = p.category || 'other';
            if (!map[cat]) map[cat] = { id: cat, name: prodCategoryLabels[cat] || cat, count: 0 };
            map[cat].count++;
        });
        items = Object.values(map);
    }

    if (items.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">אין פריטים בתיקייה זו</p>';
        return;
    }

    content.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;">
            ${items.map(it => {
                let iconDef;
                if (type === 'suppliers') iconDef = getIconDef(it.iconKey || 'food', BUSINESS_ICONS);
                else if (type === 'couriers') iconDef = getIconDef(it.iconKey || 'scooter', COURIER_ICONS);
                else if (type === 'drivers') iconDef = { icon: 'fa-id-card', color: '#D4A843' };
                else if (type === 'taxis') iconDef = { icon: 'fa-taxi', color: '#F59E0B' };
                else if (type === 'customerProducts') iconDef = { icon: 'fa-box-open', color: '#EA580C' };
                else if (type === 'products') iconDef = { icon: 'fa-boxes-stacked', color: '#D4A843' };
                else iconDef = { icon: 'fa-user', color: CUSTOMER_COLOR };
                return `
                    <div onclick="openPhotoItem('${type}', '${String(it.id).replace(/'/g, "\\'")}')" style="cursor:pointer;background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:16px;text-align:center;transition:all 0.2s;" onmouseover="this.style.borderColor='${iconDef.color}';this.style.transform='scale(1.02)';" onmouseout="this.style.borderColor='#e0e0e0';this.style.transform='';">
                        <div style="font-size:42px;color:#D4A843;margin-bottom:6px;position:relative;">
                            <i class="fas fa-folder"></i>
                            <i class="fas ${iconDef.icon}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-30%);font-size:16px;color:white;"></i>
                        </div>
                        <div style="font-size:14px;font-weight:600;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.name}</div>
                        ${it.count !== undefined ? `<div style="font-size:11px;color:#999;">${it.count} פריטים</div>` : ''}
                        ${it.phone ? `<div style="font-size:11px;color:#999;">${it.phone}</div>` : ''}
                    </div>`;
            }).join('')}
        </div>`;
}

function openPhotoItem(type, id) {
    const labelMap = {
        customers: 'לקוחות', suppliers: 'חנויות / ספקים', couriers: 'שליחים',
        drivers: 'נהגי מוניות', taxis: 'מוניות (רכב)', customerProducts: 'מוצרים (מלקוחות)',
        products: 'מוצרים'
    };
    let images = [];
    let title = '';

    if (type === 'suppliers') {
        const s = DB.get('suppliers').find(x => x.id === id);
        title = s ? s.name : 'ספק';
        getSupplierProducts(id).forEach(p => {
            (p.images && p.images.length ? p.images : (p.image ? [p.image] : [])).forEach(img => {
                images.push({ src: img, caption: p.name });
            });
        });
        if (s && Array.isArray(s.images)) s.images.forEach(img => images.push({ src: img, caption: 'גלריית ספק' }));
    } else if (type === 'couriers') {
        const c = DB.get('couriers').find(x => x.id === id);
        title = c ? c.name : 'שליח';
        if (c && c.photo) images.push({ src: c.photo, caption: c.name });
    } else if (type === 'drivers') {
        const d = DB.get('drivers').find(x => x.id === id);
        title = d ? d.name : 'נהג';
        if (d && d.photo) images.push({ src: d.photo, caption: d.name });
    } else if (type === 'taxis') {
        const d = DB.get('drivers').find(x => x.id === id);
        title = d ? `מונית של ${d.name}` : 'מונית';
        if (d && Array.isArray(d.vehicleImages)) {
            d.vehicleImages.forEach((img, i) => images.push({ src: img, caption: (d.plate || '') + (i === 0 ? ' · חיצון' : ' · פנים') }));
        }
    } else if (type === 'customers') {
        const orders = DB.get('orders').filter(o => (o.customerPhone || o.customerName) === id);
        title = orders[0] ? orders[0].customerName : 'לקוח';
        orders.forEach(o => {
            (o.photos || []).forEach(img => images.push({ src: img, caption: 'הזמנה ' + o.id }));
        });
    } else if (type === 'products') {
        const prods = DB.get('products').filter(p => (p.category || 'other') === id);
        title = prodCategoryLabels[id] || id;
        prods.forEach(p => {
            const imgs = p.images && p.images.length ? p.images : (p.image ? [p.image] : []);
            imgs.forEach(img => images.push({
                src: img,
                caption: `${p.name} · ₪${p.price}${p.supplier ? ' · ' + p.supplier : ''}`
            }));
        });
    } else if (type === 'customerProducts') {
        const products = DB.get('customerProducts').filter(p => (p.sellerPhone || p.sellerName || 'unknown') === id);
        title = products[0] ? (products[0].sellerName || 'לקוח') : 'לקוח';
        products.forEach(p => {
            const imgs = p.images && p.images.length ? p.images : (p.image ? [p.image] : []);
            imgs.forEach(img => images.push({
                src: img,
                caption: `${p.name} · ₪${p.price}${p.status === 'sold' ? ' (נמכר)' : ''}`
            }));
        });
    }

    renderPhotosBreadcrumb([
        { label: labelMap[type], action: `openPhotoFolder('${type}')` },
        { label: title, action: `openPhotoItem('${type}', '${String(id).replace(/'/g, "\\'")}')` }
    ]);

    const content = document.getElementById('photosContent');
    if (images.length === 0) {
        content.innerHTML = `<p style="text-align:center;color:var(--gray);padding:40px;">אין תמונות עבור "${title}"</p>`;
        return;
    }
    content.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
            ${images.map(i => `
                <div style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
                    <img src="${i.src}" style="width:100%;height:160px;object-fit:cover;display:block;">
                    <div style="padding:8px;font-size:12px;color:#666;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i.caption}</div>
                </div>
            `).join('')}
        </div>`;
}

/* ===================== */
/* Couriers (שליחים)     */
/* ===================== */

let pendingCourierPhoto = null;

function previewCourierPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        pendingCourierPhoto = ev.target.result;
        document.getElementById('courierPhotoPreview').innerHTML =
            `<img src="${pendingCourierPhoto}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid #059669;">`;
    };
    reader.readAsDataURL(file);
}

function showAddCourier() {
    document.getElementById('addCourierForm').style.display = 'block';
    renderIconPicker('courierIconPicker', COURIER_ICONS, 'scooter', 'courierIcon');
}

function hideAddCourier() {
    document.getElementById('addCourierForm').style.display = 'none';
    document.getElementById('courierName').value = '';
    document.getElementById('courierPhone').value = '';
    document.getElementById('courierPhotoInput').value = '';
    document.getElementById('courierPhotoPreview').innerHTML = '';
    pendingCourierPhoto = null;
}

function addCourier() {
    const name = document.getElementById('courierName').value.trim();
    const phone = document.getElementById('courierPhone').value.trim();
    if (!name) return alert('נא להזין שם');
    const sel = document.querySelector('input[name="courierIcon"]:checked');
    const iconKey = sel ? sel.value : 'scooter';
    const def = getIconDef(iconKey, COURIER_ICONS);
    const courier = {
        id: 'courier-' + Date.now().toString().slice(-6),
        name, phone, iconKey,
        photo: pendingCourierPhoto || generatePersonAvatar(name, def, 0),
        isActive: true,
        lat: 31.3133 + (Math.random() - 0.5) * 0.02,
        lng: 34.62 + (Math.random() - 0.5) * 0.02
    };
    DB.add('couriers', courier);
    hideAddCourier();
    loadCouriers();
}

function deleteCourier(id) {
    if (!confirm('למחוק שליח?')) return;
    const couriers = DB.get('couriers').filter(c => c.id !== id);
    DB.set('couriers', couriers);
    loadCouriers();
}

function loadCouriers() {
    const grid = document.getElementById('couriersGrid');
    const couriers = DB.get('couriers');
    if (couriers.length === 0) {
        grid.innerHTML = '<p style="color:var(--gray);padding:20px;">אין שליחים. לחץ "הוסף שליח".</p>';
        return;
    }
    grid.innerHTML = couriers.map(c => {
        const def = getIconDef(c.iconKey || 'scooter', COURIER_ICONS);
        const photoHtml = c.photo
            ? `<img src="${c.photo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${def.color};display:block;margin:0 auto 10px;">`
            : `<div style="width:80px;height:80px;border-radius:50%;background:${def.color};color:white;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 10px;"><i class="fas ${def.icon}"></i></div>`;
        return `
            <div class="supplier-card" style="border-top:4px solid ${def.color};text-align:center;position:relative;">
                <button onclick="openIconPicker('courier','${c.id}')" title="שנה אייקון מפה" style="position:absolute;top:8px;left:8px;background:none;border:none;color:#2563EB;cursor:pointer;font-size:16px;"><i class="fas fa-palette"></i></button>
                ${photoHtml}
                <h3 style="margin-bottom:4px;">${c.name}</h3>
                <p style="color:var(--gray);font-size:13px;"><i class="fas ${def.icon}"></i> ${def.label}</p>
                <p><i class="fas fa-phone"></i> ${c.phone || '-'}</p>
                <div class="supplier-meta">
                    <span class="supplier-tag" style="color:${c.isActive !== false ? '#28a745' : '#dc3545'}">
                        <i class="fas fa-circle"></i> ${c.isActive !== false ? 'פעיל' : 'לא פעיל'}
                    </span>
                    ${c.phone ? `<a class="supplier-tag" href="tel:${c.phone.replace(/[^\d+]/g, '')}" style="color:#059669;text-decoration:none;"><i class="fas fa-phone"></i> חייג</a>` : ''}
                </div>
                <button class="action-btn cancel" onclick="deleteCourier('${c.id}')" style="margin-top:10px;"><i class="fas fa-trash"></i> מחק</button>
            </div>
        `;
    }).join('');
}

/* ===================== */
/* Analytics              */
/* ===================== */

function loadAnalytics() {
    const orders = DB.get('orders');
    const delivered = orders.filter(o => o.status === 'delivered');

    // KPIs
    const totalRev = delivered.reduce((s, o) => s + getOrderPrice(o), 0);
    const avgOrder = delivered.length ? totalRev / delivered.length : 0;
    const uniqueCust = new Set(orders.map(o => o.customerPhone)).size;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    document.getElementById('analyticsKPIs').innerHTML = `
        <div class="stat-card"><div class="stat-card-icon" style="background:#28a745;"><i class="fas fa-shekel-sign"></i></div>
            <div class="stat-card-info"><h3>₪${totalRev.toLocaleString('he-IL', {maximumFractionDigits: 0})}</h3><p>סה"כ מחזור</p></div></div>
        <div class="stat-card"><div class="stat-card-icon" style="background:#2563EB;"><i class="fas fa-receipt"></i></div>
            <div class="stat-card-info"><h3>₪${avgOrder.toFixed(0)}</h3><p>ערך הזמנה ממוצע</p></div></div>
        <div class="stat-card"><div class="stat-card-icon" style="background:#7C3AED;"><i class="fas fa-user-friends"></i></div>
            <div class="stat-card-info"><h3>${uniqueCust}</h3><p>לקוחות ייחודיים</p></div></div>
        <div class="stat-card"><div class="stat-card-icon" style="background:#dc3545;"><i class="fas fa-times-circle"></i></div>
            <div class="stat-card-info"><h3>${cancelled}</h3><p>בוטלו</p></div></div>
    `;

    // Top products
    const prodMap = {};
    orders.forEach(o => {
        (o.items || []).forEach(it => {
            if (!prodMap[it.name]) prodMap[it.name] = { name: it.name, qty: 0, revenue: 0 };
            prodMap[it.name].qty += it.qty;
            prodMap[it.name].revenue += it.price * it.qty;
        });
    });
    const topProds = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 10);
    document.getElementById('topProducts').innerHTML = topProds.length === 0
        ? '<p style="color:var(--gray);">אין נתונים</p>'
        : '<table class="admin-table"><thead><tr><th>מוצר</th><th>כמות</th><th>הכנסה</th></tr></thead><tbody>' +
            topProds.map(p => `<tr><td>${p.name}</td><td>${p.qty}</td><td>₪${p.revenue.toFixed(0)}</td></tr>`).join('') + '</tbody></table>';

    // Peak hours
    const hours = Array(24).fill(0);
    orders.forEach(o => {
        if (o.createdAt) hours[new Date(o.createdAt).getHours()]++;
    });
    const maxH = Math.max(...hours, 1);
    document.getElementById('peakHours').innerHTML = hours.map((c, h) => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:13px;">
            <span style="width:40px;text-align:left;">${String(h).padStart(2, '0')}:00</span>
            <div style="flex:1;background:#f0f0f0;border-radius:4px;overflow:hidden;">
                <div style="width:${(c / maxH * 100).toFixed(0)}%;height:20px;background:#2563EB;"></div>
            </div>
            <span style="width:30px;text-align:right;">${c}</span>
        </div>
    `).join('');

    // Top customers
    const custMap = {};
    orders.forEach(o => {
        const key = o.customerPhone || o.customerName;
        if (!custMap[key]) custMap[key] = { name: o.customerName, phone: o.customerPhone, count: 0, total: 0 };
        custMap[key].count++;
        custMap[key].total += getOrderPrice(o);
    });
    const topCusts = Object.values(custMap).sort((a, b) => b.count - a.count).slice(0, 10);
    document.getElementById('topCustomers').innerHTML = topCusts.length === 0
        ? '<p style="color:var(--gray);">אין נתונים</p>'
        : '<table class="admin-table"><thead><tr><th>שם</th><th>הזמנות</th><th>סה"כ</th></tr></thead><tbody>' +
            topCusts.map(c => `<tr><td>${c.name}</td><td>${c.count}</td><td>₪${c.total.toFixed(0)}</td></tr>`).join('') + '</tbody></table>';

    // Top suppliers (by revenue from their items)
    const supRev = {};
    orders.forEach(o => {
        (o.items || []).forEach(it => {
            const key = it.supplierId || it.supplier || 'כללי';
            if (!supRev[key]) supRev[key] = { name: it.supplier || key, revenue: 0, count: 0 };
            supRev[key].revenue += it.price * it.qty;
            supRev[key].count++;
        });
    });
    const topSups = Object.values(supRev).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    document.getElementById('topSuppliers').innerHTML = topSups.length === 0
        ? '<p style="color:var(--gray);">אין נתונים</p>'
        : '<table class="admin-table"><thead><tr><th>ספק</th><th>פריטים</th><th>הכנסה</th></tr></thead><tbody>' +
            topSups.map(s => `<tr><td>${s.name}</td><td>${s.count}</td><td>₪${s.revenue.toFixed(0)}</td></tr>`).join('') + '</tbody></table>';
}

/* ===================== */
/* Accounting (הנהלת חשבונות) */
/* ===================== */

const expenseCategoryLabels = {
    'fuel': 'דלק',
    'maintenance': 'תחזוקה',
    'salary': 'משכורות',
    'suppliers': 'ספקים',
    'rent': 'שכירות',
    'utilities': 'חשבונות',
    'marketing': 'שיווק',
    'other': 'אחר'
};

function initAccounting() {
    // Populate supplier filter
    const sel = document.getElementById('accSupplier');
    const current = sel.value || 'all';
    const suppliers = DB.get('suppliers');
    sel.innerHTML = '<option value="all">כל הספקים</option>' +
        '<option value="none">ללא ספק (כללי)</option>' +
        suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    sel.value = current;

    if (!document.getElementById('accFrom').value) {
        setAccPeriod('month');
    } else {
        loadAccounting();
    }
}

function setAccPeriod(period) {
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
    document.getElementById('accFrom').value = from;
    document.getElementById('accTo').value = to;
    loadAccounting();
}

function inAccRange(dateStr) {
    const from = document.getElementById('accFrom').value;
    const to = document.getElementById('accTo').value;
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
}

function getOrderPrice(o) {
    if (typeof o.price === 'number') return o.price;
    if (typeof o.totalPrice === 'number') return o.totalPrice;
    if (typeof o.amount === 'number') return o.amount;
    return 0;
}

function loadAccounting() {
    const supFilter = (document.getElementById('accSupplier') || {}).value || 'all';
    const suppliers = DB.get('suppliers');
    const supName = supFilter !== 'all' && supFilter !== 'none'
        ? (suppliers.find(s => s.id === supFilter) || {}).name : null;

    let orders = DB.get('orders').filter(o =>
        o.status === 'delivered' && inAccRange(o.createdAt)
    );

    // Per-order revenue depending on filter
    orders = orders.map(o => {
        let rev = 0;
        if (supFilter === 'all') {
            rev = getOrderPrice(o);
        } else if (supFilter === 'none') {
            // Orders with no items (classic price-based) or no supplierId at all
            if (!Array.isArray(o.items) || o.items.length === 0) {
                rev = getOrderPrice(o);
            }
        } else if (Array.isArray(o.items)) {
            const myItems = o.items.filter(it =>
                it.supplierId === supFilter || (!it.supplierId && it.supplier === supName)
            );
            rev = myItems.reduce((s, it) => s + (it.price * it.qty), 0);
        }
        return { ...o, _rev: rev };
    }).filter(o => o._rev > 0 || supFilter === 'all');

    let expenses = DB.get('expenses').filter(e => inAccRange(e.date));
    if (supFilter === 'none') {
        expenses = expenses.filter(e => !e.supplierId);
    } else if (supFilter !== 'all') {
        expenses = expenses.filter(e => e.supplierId === supFilter);
    }

    const revenue = orders.reduce((s, o) => s + (o._rev || 0), 0);
    const settings = getSettings();
    const commissionPct = parseFloat(settings.commission) || 0;
    const vatPct = parseFloat(settings.vat) || 0;
    const commissionAmt = revenue * commissionPct / 100;
    const vatAmt = vatPct > 0 ? revenue - (revenue / (1 + vatPct / 100)) : 0;
    document.getElementById('accCommission').textContent = '₪' + commissionAmt.toLocaleString('he-IL', {maximumFractionDigits: 0});
    document.getElementById('accVat').textContent = '₪' + vatAmt.toLocaleString('he-IL', {maximumFractionDigits: 0});
    const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const profit = revenue - totalExp;

    document.getElementById('accRevenue').textContent = '₪' + revenue.toLocaleString('he-IL');
    document.getElementById('accExpenses').textContent = '₪' + totalExp.toLocaleString('he-IL');
    document.getElementById('accProfit').textContent = '₪' + profit.toLocaleString('he-IL');
    document.getElementById('accProfit').style.color = profit >= 0 ? '#28a745' : '#dc3545';
    document.getElementById('accOrdersCount').textContent = orders.length;

    // Revenue table
    const revTbody = document.getElementById('accRevenueTable');
    revTbody.innerHTML = orders.length === 0
        ? '<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:30px;">אין הזמנות בתקופה זו</td></tr>'
        : orders.slice().reverse().map(o => `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>${new Date(o.createdAt).toLocaleDateString('he-IL')}</td>
                <td>${o.customerName}</td>
                <td>${categoryLabels[o.category] || o.category}</td>
                <td>
                    ${supFilter === 'all'
                        ? `<input type="number" value="${getOrderPrice(o)}" min="0" step="0.01" style="width:100px;padding:4px 8px;border:1px solid #e0e0e0;border-radius:6px;" onchange="setOrderPrice('${o.id}', this.value)">`
                        : `<strong>₪${(o._rev || 0).toLocaleString('he-IL')}</strong>`
                    }
                </td>
                <td><span style="color:var(--gray);font-size:12px;">${supFilter === 'all' ? '₪ ידני' : 'חלק הספק'}</span></td>
            </tr>
        `).join('');

    // Expenses table
    const expTbody = document.getElementById('accExpensesTable');
    expTbody.innerHTML = expenses.length === 0
        ? '<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:30px;">אין הוצאות בתקופה זו</td></tr>'
        : expenses.slice().reverse().map(e => `
            <tr>
                <td>${new Date(e.date).toLocaleDateString('he-IL')}</td>
                <td>${expenseCategoryLabels[e.category] || e.category}</td>
                <td>${e.description || '-'}</td>
                <td>${e.receipt || '-'}</td>
                <td><strong>₪${parseFloat(e.amount).toLocaleString('he-IL')}</strong></td>
                <td><button class="action-btn cancel" onclick="deleteExpense('${e.id}')"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
}

function setOrderPrice(orderId, value) {
    const orders = DB.get('orders');
    const i = orders.findIndex(o => o.id === orderId);
    if (i !== -1) {
        orders[i].price = parseFloat(value) || 0;
        DB.set('orders', orders);
        loadAccounting();
    }
}

function showAddExpense() {
    document.getElementById('addExpenseForm').style.display = 'block';
    if (!document.getElementById('expDate').value) {
        document.getElementById('expDate').value = new Date().toISOString().slice(0, 10);
    }
}

function hideExpenseForm() {
    document.getElementById('addExpenseForm').style.display = 'none';
}

function addExpense() {
    const date = document.getElementById('expDate').value;
    const amount = parseFloat(document.getElementById('expAmount').value);

    if (!date || !amount || amount <= 0) {
        alert('נא למלא תאריך וסכום תקין');
        return;
    }

    const expense = {
        id: 'EXP-' + Date.now().toString().slice(-6),
        date: date,
        category: document.getElementById('expCategory').value,
        description: document.getElementById('expDesc').value.trim(),
        amount: amount,
        receipt: document.getElementById('expReceipt').value.trim(),
        createdAt: new Date().toISOString()
    };

    DB.add('expenses', expense);

    ['expDesc', 'expAmount', 'expReceipt'].forEach(id => {
        document.getElementById(id).value = '';
    });
    hideExpenseForm();
    loadAccounting();
}

function deleteExpense(id) {
    if (!confirm('למחוק הוצאה זו?')) return;
    const expenses = DB.get('expenses').filter(e => e.id !== id);
    DB.set('expenses', expenses);
    loadAccounting();
}

function exportAccountingCSV() {
    const orders = DB.get('orders').filter(o =>
        o.status === 'delivered' && inAccRange(o.createdAt)
    );
    const expenses = DB.get('expenses').filter(e => inAccRange(e.date));

    const rows = [['סוג', 'תאריך', 'תיאור', 'קטגוריה', 'סכום']];
    orders.forEach(o => {
        rows.push(['הכנסה', new Date(o.createdAt).toLocaleDateString('he-IL'),
            `הזמנה ${o.id} - ${o.customerName}`, categoryLabels[o.category] || o.category,
            getOrderPrice(o)]);
    });
    expenses.forEach(e => {
        rows.push(['הוצאה', new Date(e.date).toLocaleDateString('he-IL'),
            e.description || '', expenseCategoryLabels[e.category] || e.category,
            -parseFloat(e.amount)]);
    });

    const csv = '\ufeff' + rows.map(r =>
        r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounting_${document.getElementById('accFrom').value}_${document.getElementById('accTo').value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// SETTLEMENT (Driver Billing) — 20% Commission
// ============================================
function getDriverCommissionRate() {
    const s = getSettings();
    return (s.driverCommission !== undefined ? s.driverCommission : 20) / 100;
}
function getCourierCommissionRate() {
    const s = getSettings();
    return (s.courierCommission !== undefined ? s.courierCommission : 20) / 100;
}
function getSupplierCommissionRate() {
    const s = getSettings();
    return (s.supplierCommission !== undefined ? s.supplierCommission : 10) / 100;
}

function loadSettlement() {
    populateSettlementDrivers();
    setSettlementPeriodDefaults();
    renderSettlement();
}

function populateSettlementDrivers() {
    const sel = document.getElementById('settlementDriver');
    if (!sel) return;
    const drivers = DB.get('drivers');
    const current = sel.value;
    sel.innerHTML = '<option value="all">כל הנהגים</option>';
    drivers.forEach(d => {
        sel.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
    sel.value = current || 'all';
}

function setSettlementPeriodDefaults() {
    const period = (document.getElementById('settlementPeriod') || {}).value || 'week';
    const now = new Date();
    const from = document.getElementById('settlementFrom');
    const to = document.getElementById('settlementTo');
    if (!from || !to) return;
    to.value = now.toISOString().slice(0, 10);
    if (period === 'week') {
        const d = new Date(now); d.setDate(d.getDate() - 7);
        from.value = d.toISOString().slice(0, 10);
    } else if (period === 'month') {
        const d = new Date(now); d.setMonth(d.getMonth() - 1);
        from.value = d.toISOString().slice(0, 10);
    }
}

function setSettlementPeriod() {
    const period = document.getElementById('settlementPeriod').value;
    if (period !== 'custom') {
        setSettlementPeriodDefaults();
        renderSettlement();
    }
}

function getSettlementRides() {
    const driverFilter = (document.getElementById('settlementDriver') || {}).value || 'all';
    const fromDate = (document.getElementById('settlementFrom') || {}).value || '';
    const toDate = (document.getElementById('settlementTo') || {}).value || '';
    let rides = DB.get('rides').filter(r => r.status === 'completed' && r.driverId);
    if (driverFilter !== 'all') rides = rides.filter(r => r.driverId === driverFilter);
    if (fromDate) rides = rides.filter(r => r.createdAt && r.createdAt.slice(0, 10) >= fromDate);
    if (toDate) rides = rides.filter(r => r.createdAt && r.createdAt.slice(0, 10) <= toDate);
    return rides;
}

function renderSettlement() {
    const rides = getSettlementRides();
    const drivers = DB.get('drivers');
    const settlements = DB.get('settlements');

    const totalRevenue = rides.reduce((s, r) => s + (r.estimatedPrice || 0), 0);
    const totalCommission = Math.round(totalRevenue * getDriverCommissionRate());
    const totalDriverPay = totalRevenue - totalCommission;
    const totalPaid = settlements.reduce((s, p) => s + (p.amount || 0), 0);

    const statsEl = document.getElementById('settlementStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat-card"><div class="stat-number">${rides.length}</div><div class="stat-label">נסיעות</div></div>
            <div class="stat-card"><div class="stat-number">₪${totalRevenue.toLocaleString()}</div><div class="stat-label">הכנסות ברוטו</div></div>
            <div class="stat-card" style="border-right:3px solid #C41E2F;"><div class="stat-number">₪${totalCommission.toLocaleString()}</div><div class="stat-label">עמלת טיקי טאקה (20%)</div></div>
            <div class="stat-card" style="border-right:3px solid #059669;"><div class="stat-number">₪${totalDriverPay.toLocaleString()}</div><div class="stat-label">לתשלום לנהגים</div></div>`;
    }

    renderSettlementDriverCards(rides, drivers);
    renderSettlementTable(rides, drivers);
    renderPaymentHistory();
}

function renderSettlementDriverCards(rides, drivers) {
    const wrap = document.getElementById('settlementDriverCards');
    if (!wrap) return;
    const byDriver = {};
    rides.forEach(r => {
        if (!byDriver[r.driverId]) byDriver[r.driverId] = { rides: [], total: 0 };
        byDriver[r.driverId].rides.push(r);
        byDriver[r.driverId].total += r.estimatedPrice || 0;
    });

    const settlements = DB.get('settlements');
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">';
    Object.entries(byDriver).forEach(([driverId, data]) => {
        const driver = drivers.find(d => d.id === driverId);
        const name = driver ? driver.name : driverId;
        const photo = driver && driver.photo ? `<img src="${driver.photo}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">` : '<div style="width:44px;height:44px;border-radius:50%;background:#C41E2F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;"><i class="fas fa-user"></i></div>';
        const commission = Math.round(data.total * getDriverCommissionRate());
        const driverPay = data.total - commission;
        const paidTotal = settlements.filter(s => s.driverId === driverId).reduce((s, p) => s + (p.amount || 0), 0);
        const balance = driverPay - paidTotal;
        const balanceColor = balance > 0 ? '#C41E2F' : '#059669';
        const balanceLabel = balance > 0 ? 'חוב' : 'מסולק';

        html += `
            <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    ${photo}
                    <div>
                        <strong style="font-size:15px;">${escapeHtml(name)}</strong>
                        <div style="font-size:12px;color:#888;">${data.rides.length} נסיעות</div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;">
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;">
                        <div style="color:#888;font-size:11px;">סה"כ</div>
                        <div style="font-weight:700;">₪${data.total}</div>
                    </div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;">
                        <div style="color:#888;font-size:11px;">עמלה</div>
                        <div style="font-weight:700;color:#C41E2F;">₪${commission}</div>
                    </div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;">
                        <div style="color:#888;font-size:11px;">לנהג</div>
                        <div style="font-weight:700;color:#059669;">₪${driverPay}</div>
                    </div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;">
                        <div style="color:#888;font-size:11px;">${balanceLabel}</div>
                        <div style="font-weight:700;color:${balanceColor};">₪${Math.abs(balance)}</div>
                    </div>
                </div>
                ${balance > 0 ? `<button onclick="payDriver('${driverId}',${driverPay})" class="btn btn-primary" style="width:100%;margin-top:10px;background:#059669;justify-content:center;font-size:13px;padding:8px;"><i class="fas fa-money-bill-wave"></i> סמן תשלום ₪${driverPay}</button>` : ''}
            </div>`;
    });
    html += '</div>';
    wrap.innerHTML = Object.keys(byDriver).length ? html : '<div style="text-align:center;color:#888;padding:20px;">אין נסיעות בתקופה שנבחרה</div>';
}

function renderSettlementTable(rides, drivers) {
    const tbody = document.getElementById('settlementTableBody');
    if (!tbody) return;
    const sorted = rides.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    tbody.innerHTML = sorted.map(r => {
        const driver = drivers.find(d => d.id === r.driverId);
        const price = r.estimatedPrice || 0;
        const commission = Math.round(price * getDriverCommissionRate());
        const driverPay = price - commission;
        const date = r.createdAt ? new Date(r.createdAt) : null;
        const dateStr = date ? date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}) : '-';
        const payLabel = ({cash:'מזומן',card:'אשראי',bit:'ביט',app:'אפליקציה'})[r.paymentMethod] || '-';
        return `<tr>
            <td>${r.id}</td>
            <td>${dateStr}</td>
            <td>${driver ? escapeHtml(driver.name) : '-'}</td>
            <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.fromAddress || '-')}</td>
            <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.toAddress || '-')}</td>
            <td>${(r.estimatedKm || 0).toFixed(1)}</td>
            <td style="font-weight:700;">₪${price}</td>
            <td style="color:#C41E2F;font-weight:600;">₪${commission}</td>
            <td style="color:#059669;font-weight:600;">₪${driverPay}</td>
            <td>${payLabel}</td>
            <td><span style="background:#d1fae5;color:#059669;padding:2px 8px;border-radius:10px;font-size:11px;">הושלם</span></td>
        </tr>`;
    }).join('');
}

function payDriver(driverId, amount) {
    const drivers = DB.get('drivers');
    const driver = drivers.find(d => d.id === driverId);
    const name = driver ? driver.name : driverId;
    if (!confirm(`לסמן תשלום של ₪${amount} ל${name}?`)) return;
    const payment = {
        id: 'PAY-' + Date.now().toString().slice(-6),
        driverId,
        driverName: name,
        amount,
        date: new Date().toISOString(),
        method: 'העברה בנקאית',
        note: ''
    };
    DB.add('settlements', payment);
    renderSettlement();
}

function markSettlementPaid() {
    const rides = getSettlementRides();
    const drivers = DB.get('drivers');
    const settlements = DB.get('settlements');
    const byDriver = {};
    rides.forEach(r => {
        if (!byDriver[r.driverId]) byDriver[r.driverId] = 0;
        byDriver[r.driverId] += r.estimatedPrice || 0;
    });
    let count = 0;
    Object.entries(byDriver).forEach(([driverId, total]) => {
        const driverPay = total - Math.round(total * getDriverCommissionRate());
        const paidTotal = settlements.filter(s => s.driverId === driverId).reduce((s, p) => s + (p.amount || 0), 0);
        const balance = driverPay - paidTotal;
        if (balance > 0) {
            const driver = drivers.find(d => d.id === driverId);
            DB.add('settlements', {
                id: 'PAY-' + Date.now().toString().slice(-6) + '-' + (++count),
                driverId,
                driverName: driver ? driver.name : driverId,
                amount: balance,
                date: new Date().toISOString(),
                method: 'סילוק תקופתי',
                note: ''
            });
        }
    });
    if (count > 0) {
        alert(`${count} נהגים סומנו כשולמו`);
        renderSettlement();
    } else {
        alert('אין יתרות פתוחות לסילוק');
    }
}

function renderPaymentHistory() {
    const wrap = document.getElementById('settlementPaymentHistory');
    if (!wrap) return;
    const payments = DB.get('settlements').slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!payments.length) {
        wrap.innerHTML = '<div style="text-align:center;color:#888;padding:16px;">אין תשלומים עדיין</div>';
        return;
    }
    wrap.innerHTML = `<table class="admin-table"><thead><tr>
        <th>מס׳</th><th>תאריך</th><th>נהג</th><th>סכום</th><th>אמצעי</th>
    </tr></thead><tbody>${payments.map(p => {
        const date = p.date ? new Date(p.date).toLocaleDateString('he-IL') : '-';
        return `<tr>
            <td>${p.id}</td>
            <td>${date}</td>
            <td>${escapeHtml(p.driverName || '-')}</td>
            <td style="font-weight:700;color:#059669;">₪${p.amount}</td>
            <td>${escapeHtml(p.method || '-')}</td>
        </tr>`;
    }).join('')}</tbody></table>`;
}

function exportSettlementCSV() {
    const rides = getSettlementRides();
    const drivers = DB.get('drivers');
    let csv = '\uFEFF"מס׳","תאריך","נהג","מוצא","יעד","ק״מ","מחיר","עמלה (20%)","לנהג","תשלום"\n';
    rides.forEach(r => {
        const driver = drivers.find(d => d.id === r.driverId);
        const price = r.estimatedPrice || 0;
        const commission = Math.round(price * getDriverCommissionRate());
        const driverPay = price - commission;
        const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('he-IL') : '';
        const pay = ({cash:'מזומן',card:'אשראי',bit:'ביט',app:'אפליקציה'})[r.paymentMethod] || '';
        csv += `"${r.id}","${date}","${driver ? driver.name : ''}","${r.fromAddress || ''}","${r.toAddress || ''}","${(r.estimatedKm||0).toFixed(1)}","${price}","${commission}","${driverPay}","${pay}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// COURIER SETTLEMENT
// ============================================
function loadCourierSettlement() {
    populateCourierSettlementList();
    setCourierSettlementDefaults();
    renderCourierSettlement();
}

function populateCourierSettlementList() {
    const sel = document.getElementById('courierSettlementCourier');
    if (!sel) return;
    const couriers = DB.get('couriers');
    const cur = sel.value;
    sel.innerHTML = '<option value="all">כל השליחים</option>';
    couriers.forEach(c => { sel.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`; });
    sel.value = cur || 'all';
}

function setCourierSettlementDefaults() {
    const period = (document.getElementById('courierSettlementPeriod') || {}).value || 'week';
    const now = new Date();
    const from = document.getElementById('courierSettlementFrom');
    const to = document.getElementById('courierSettlementTo');
    if (!from || !to) return;
    to.value = now.toISOString().slice(0, 10);
    if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); from.value = d.toISOString().slice(0, 10); }
    else if (period === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); from.value = d.toISOString().slice(0, 10); }
}
function setCourierSettlementPeriod() {
    if (document.getElementById('courierSettlementPeriod').value !== 'custom') { setCourierSettlementDefaults(); renderCourierSettlement(); }
}

function getCourierSettlementOrders() {
    const filter = (document.getElementById('courierSettlementCourier') || {}).value || 'all';
    const fromDate = (document.getElementById('courierSettlementFrom') || {}).value || '';
    const toDate = (document.getElementById('courierSettlementTo') || {}).value || '';
    let orders = DB.get('orders').filter(o => o.status === 'delivered' && o.courierId);
    if (filter !== 'all') orders = orders.filter(o => o.courierId === filter);
    if (fromDate) orders = orders.filter(o => o.createdAt && o.createdAt.slice(0, 10) >= fromDate);
    if (toDate) orders = orders.filter(o => o.createdAt && o.createdAt.slice(0, 10) <= toDate);
    return orders;
}

function renderCourierSettlement() {
    const orders = getCourierSettlementOrders();
    const couriers = DB.get('couriers');
    const rate = getCourierCommissionRate();
    const rateDisplay = Math.round(rate * 100);

    const totalDeliveryFees = orders.reduce((s, o) => s + (o.deliveryFee || 0), 0);
    const totalCommission = Math.round(totalDeliveryFees * rate);
    const totalCourierPay = totalDeliveryFees - totalCommission;

    const statsEl = document.getElementById('courierSettlementStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat-card"><div class="stat-number">${orders.length}</div><div class="stat-label">משלוחים</div></div>
            <div class="stat-card"><div class="stat-number">₪${totalDeliveryFees.toLocaleString()}</div><div class="stat-label">דמי משלוח</div></div>
            <div class="stat-card" style="border-right:3px solid #C41E2F;"><div class="stat-number">₪${totalCommission.toLocaleString()}</div><div class="stat-label">עמלת טיקי טאקה (${rateDisplay}%)</div></div>
            <div class="stat-card" style="border-right:3px solid #059669;"><div class="stat-number">₪${totalCourierPay.toLocaleString()}</div><div class="stat-label">לתשלום לשליחים</div></div>`;
    }

    const byC = {};
    orders.forEach(o => {
        if (!byC[o.courierId]) byC[o.courierId] = { orders: [], total: 0 };
        byC[o.courierId].orders.push(o);
        byC[o.courierId].total += o.deliveryFee || 0;
    });
    const payments = DB.get('settlements').filter(s => s.type === 'courier');
    const cardsEl = document.getElementById('courierSettlementCards');
    if (cardsEl) {
        let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">';
        Object.entries(byC).forEach(([cId, data]) => {
            const courier = couriers.find(c => c.id === cId);
            const name = courier ? courier.name : cId;
            const commission = Math.round(data.total * rate);
            const courierPay = data.total - commission;
            const paidTotal = payments.filter(p => p.targetId === cId).reduce((s, p) => s + (p.amount || 0), 0);
            const balance = courierPay - paidTotal;
            const balColor = balance > 0 ? '#C41E2F' : '#059669';
            html += `<div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <div style="width:44px;height:44px;border-radius:50%;background:#7C3AED;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;"><i class="fas fa-motorcycle"></i></div>
                    <div><strong>${escapeHtml(name)}</strong><div style="font-size:12px;color:#888;">${data.orders.length} משלוחים</div></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;">
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;"><div style="color:#888;font-size:11px;">דמי משלוח</div><div style="font-weight:700;">₪${data.total}</div></div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;"><div style="color:#888;font-size:11px;">עמלה</div><div style="font-weight:700;color:#C41E2F;">₪${commission}</div></div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;"><div style="color:#888;font-size:11px;">לשליח</div><div style="font-weight:700;color:#059669;">₪${courierPay}</div></div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;"><div style="color:#888;font-size:11px;">${balance > 0 ? 'חוב' : 'מסולק'}</div><div style="font-weight:700;color:${balColor};">₪${Math.abs(balance)}</div></div>
                </div>
                ${balance > 0 ? `<button onclick="paySettlementTarget('courier','${cId}','${escapeHtml(name)}',${courierPay})" class="btn btn-primary" style="width:100%;margin-top:10px;background:#059669;justify-content:center;font-size:13px;padding:8px;"><i class="fas fa-money-bill-wave"></i> סמן תשלום ₪${courierPay}</button>` : ''}
            </div>`;
        });
        html += '</div>';
        cardsEl.innerHTML = Object.keys(byC).length ? html : '<div style="text-align:center;color:#888;padding:20px;">אין משלוחים בתקופה</div>';
    }

    const tbody = document.getElementById('courierSettlementBody');
    if (tbody) {
        tbody.innerHTML = orders.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(o => {
            const courier = couriers.find(c => c.id === o.courierId);
            const fee = o.deliveryFee || 0;
            const comm = Math.round(fee * rate);
            const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('he-IL') : '-';
            return `<tr><td>${o.id}</td><td>${date}</td><td>${courier ? escapeHtml(courier.name) : '-'}</td><td>${o.category || '-'}</td><td>${(o.distance || 0).toFixed(1)}</td><td style="font-weight:700;">₪${fee}</td><td style="color:#C41E2F;">₪${comm}</td><td style="color:#059669;">₪${fee - comm}</td><td><span style="background:#d1fae5;color:#059669;padding:2px 8px;border-radius:10px;font-size:11px;">נמסר</span></td></tr>`;
        }).join('');
    }

    renderGenericPaymentHistory('courierPaymentHistory', 'courier');
}

function markCourierSettlementPaid() { markGenericSettlementPaid('courier', getCourierSettlementOrders, getCourierCommissionRate, 'courierId', 'deliveryFee', renderCourierSettlement); }
function exportCourierSettlementCSV() { exportGenericCSV('courier', getCourierSettlementOrders, getCourierCommissionRate, 'courierId', 'deliveryFee'); }

// ============================================
// SUPPLIER SETTLEMENT
// ============================================
function loadSupplierSettlement() {
    populateSupplierSettlementList();
    setSupplierSettlementDefaults();
    renderSupplierSettlement();
}

function populateSupplierSettlementList() {
    const sel = document.getElementById('supplierSettlementSupplier');
    if (!sel) return;
    const suppliers = DB.get('suppliers');
    const cur = sel.value;
    sel.innerHTML = '<option value="all">כל הספקים</option>';
    suppliers.forEach(s => { sel.innerHTML += `<option value="${s.id}">${escapeHtml(s.name)}</option>`; });
    sel.value = cur || 'all';
}

function setSupplierSettlementDefaults() {
    const period = (document.getElementById('supplierSettlementPeriod') || {}).value || 'week';
    const now = new Date();
    const from = document.getElementById('supplierSettlementFrom');
    const to = document.getElementById('supplierSettlementTo');
    if (!from || !to) return;
    to.value = now.toISOString().slice(0, 10);
    if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); from.value = d.toISOString().slice(0, 10); }
    else if (period === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); from.value = d.toISOString().slice(0, 10); }
}
function setSupplierSettlementPeriod() {
    if (document.getElementById('supplierSettlementPeriod').value !== 'custom') { setSupplierSettlementDefaults(); renderSupplierSettlement(); }
}

function getSupplierSettlementOrders() {
    const filter = (document.getElementById('supplierSettlementSupplier') || {}).value || 'all';
    const fromDate = (document.getElementById('supplierSettlementFrom') || {}).value || '';
    const toDate = (document.getElementById('supplierSettlementTo') || {}).value || '';
    let orders = DB.get('orders').filter(o => o.status === 'delivered' && o.supplierId);
    if (filter !== 'all') orders = orders.filter(o => o.supplierId === filter);
    if (fromDate) orders = orders.filter(o => o.createdAt && o.createdAt.slice(0, 10) >= fromDate);
    if (toDate) orders = orders.filter(o => o.createdAt && o.createdAt.slice(0, 10) <= toDate);
    return orders;
}

function renderSupplierSettlement() {
    const orders = getSupplierSettlementOrders();
    const suppliers = DB.get('suppliers');
    const rate = getSupplierCommissionRate();
    const rateDisplay = Math.round(rate * 100);

    const totalProductValue = orders.reduce((s, o) => s + (o.totalPrice || o.price || 0), 0);
    const totalCommission = Math.round(totalProductValue * rate);
    const totalSupplierPay = totalProductValue - totalCommission;

    const statsEl = document.getElementById('supplierSettlementStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat-card"><div class="stat-number">${orders.length}</div><div class="stat-label">הזמנות</div></div>
            <div class="stat-card"><div class="stat-number">₪${totalProductValue.toLocaleString()}</div><div class="stat-label">ערך מוצרים</div></div>
            <div class="stat-card" style="border-right:3px solid #C41E2F;"><div class="stat-number">₪${totalCommission.toLocaleString()}</div><div class="stat-label">עמלת טיקי טאקה (${rateDisplay}%)</div></div>
            <div class="stat-card" style="border-right:3px solid #059669;"><div class="stat-number">₪${totalSupplierPay.toLocaleString()}</div><div class="stat-label">להעברה לספקים</div></div>`;
    }

    const byS = {};
    orders.forEach(o => {
        const sId = o.supplierId;
        if (!byS[sId]) byS[sId] = { orders: [], total: 0 };
        byS[sId].orders.push(o);
        byS[sId].total += o.totalPrice || o.price || 0;
    });
    const payments = DB.get('settlements').filter(s => s.type === 'supplier');
    const cardsEl = document.getElementById('supplierSettlementCards');
    if (cardsEl) {
        let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">';
        Object.entries(byS).forEach(([sId, data]) => {
            const supplier = suppliers.find(s => s.id === sId);
            const name = supplier ? supplier.name : sId;
            const commission = Math.round(data.total * rate);
            const supplierPay = data.total - commission;
            const paidTotal = payments.filter(p => p.targetId === sId).reduce((s, p) => s + (p.amount || 0), 0);
            const balance = supplierPay - paidTotal;
            const balColor = balance > 0 ? '#C41E2F' : '#059669';
            html += `<div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <div style="width:44px;height:44px;border-radius:50%;background:#D4A843;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;"><i class="fas fa-store"></i></div>
                    <div><strong>${escapeHtml(name)}</strong><div style="font-size:12px;color:#888;">${data.orders.length} הזמנות</div></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;">
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;"><div style="color:#888;font-size:11px;">ערך מוצרים</div><div style="font-weight:700;">₪${data.total}</div></div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;"><div style="color:#888;font-size:11px;">עמלה</div><div style="font-weight:700;color:#C41E2F;">₪${commission}</div></div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;"><div style="color:#888;font-size:11px;">לספק</div><div style="font-weight:700;color:#059669;">₪${supplierPay}</div></div>
                    <div style="background:#f8f9fa;border-radius:8px;padding:8px;text-align:center;"><div style="color:#888;font-size:11px;">${balance > 0 ? 'חוב' : 'מסולק'}</div><div style="font-weight:700;color:${balColor};">₪${Math.abs(balance)}</div></div>
                </div>
                ${balance > 0 ? `<button onclick="paySettlementTarget('supplier','${sId}','${escapeHtml(name)}',${supplierPay})" class="btn btn-primary" style="width:100%;margin-top:10px;background:#059669;justify-content:center;font-size:13px;padding:8px;"><i class="fas fa-money-bill-wave"></i> סמן תשלום ₪${supplierPay}</button>` : ''}
            </div>`;
        });
        html += '</div>';
        cardsEl.innerHTML = Object.keys(byS).length ? html : '<div style="text-align:center;color:#888;padding:20px;">אין הזמנות בתקופה</div>';
    }

    const tbody = document.getElementById('supplierSettlementBody');
    if (tbody) {
        tbody.innerHTML = orders.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(o => {
            const supplier = suppliers.find(s => s.id === o.supplierId);
            const price = o.totalPrice || o.price || 0;
            const comm = Math.round(price * rate);
            const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('he-IL') : '-';
            return `<tr><td>${o.id}</td><td>${date}</td><td>${supplier ? escapeHtml(supplier.name) : '-'}</td><td>${o.itemsSummary || o.category || '-'}</td><td style="font-weight:700;">₪${price}</td><td style="color:#C41E2F;">₪${comm}</td><td style="color:#059669;">₪${price - comm}</td><td><span style="background:#d1fae5;color:#059669;padding:2px 8px;border-radius:10px;font-size:11px;">נמסר</span></td></tr>`;
        }).join('');
    }

    renderGenericPaymentHistory('supplierPaymentHistory', 'supplier');
}

function markSupplierSettlementPaid() { markGenericSettlementPaid('supplier', getSupplierSettlementOrders, getSupplierCommissionRate, 'supplierId', 'totalPrice', renderSupplierSettlement); }
function exportSupplierSettlementCSV() { exportGenericCSV('supplier', getSupplierSettlementOrders, getSupplierCommissionRate, 'supplierId', 'totalPrice'); }

// ============================================
// SHARED SETTLEMENT HELPERS
// ============================================
function paySettlementTarget(type, targetId, name, amount) {
    if (!confirm(`לסמן תשלום של ₪${amount} ל${name}?`)) return;
    DB.add('settlements', {
        id: 'PAY-' + Date.now().toString().slice(-6),
        type,
        targetId,
        driverName: name,
        amount,
        date: new Date().toISOString(),
        method: 'העברה בנקאית',
        note: ''
    });
    if (type === 'courier') renderCourierSettlement();
    else if (type === 'supplier') renderSupplierSettlement();
    else renderSettlement();
}

function renderGenericPaymentHistory(wrapperId, type) {
    const wrap = document.getElementById(wrapperId);
    if (!wrap) return;
    const payments = DB.get('settlements').filter(s => s.type === type).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!payments.length) { wrap.innerHTML = '<div style="text-align:center;color:#888;padding:16px;">אין תשלומים עדיין</div>'; return; }
    wrap.innerHTML = `<table class="admin-table"><thead><tr><th>מס׳</th><th>תאריך</th><th>שם</th><th>סכום</th><th>אמצעי</th></tr></thead><tbody>${payments.map(p => {
        const date = p.date ? new Date(p.date).toLocaleDateString('he-IL') : '-';
        return `<tr><td>${p.id}</td><td>${date}</td><td>${escapeHtml(p.driverName || '-')}</td><td style="font-weight:700;color:#059669;">₪${p.amount}</td><td>${escapeHtml(p.method || '-')}</td></tr>`;
    }).join('')}</tbody></table>`;
}

function markGenericSettlementPaid(type, getOrdersFn, getRateFn, idField, priceField, renderFn) {
    const orders = getOrdersFn();
    const rate = getRateFn();
    const payments = DB.get('settlements').filter(s => s.type === type);
    const byTarget = {};
    orders.forEach(o => {
        const tId = o[idField];
        if (!tId) return;
        if (!byTarget[tId]) byTarget[tId] = 0;
        byTarget[tId] += o[priceField] || o.totalPrice || o.price || 0;
    });
    let count = 0;
    const allEntities = type === 'courier' ? DB.get('couriers') : DB.get('suppliers');
    Object.entries(byTarget).forEach(([tId, total]) => {
        const pay = total - Math.round(total * rate);
        const paid = payments.filter(p => p.targetId === tId).reduce((s, p) => s + (p.amount || 0), 0);
        const balance = pay - paid;
        if (balance > 0) {
            const entity = allEntities.find(e => e.id === tId);
            DB.add('settlements', {
                id: 'PAY-' + Date.now().toString().slice(-6) + '-' + (++count),
                type, targetId: tId,
                driverName: entity ? entity.name : tId,
                amount: balance,
                date: new Date().toISOString(),
                method: 'סילוק תקופתי', note: ''
            });
        }
    });
    if (count > 0) { alert(`${count} ${type === 'courier' ? 'שליחים' : 'ספקים'} סומנו כשולמו`); renderFn(); }
    else { alert('אין יתרות פתוחות'); }
}

function exportGenericCSV(type, getOrdersFn, getRateFn, idField, priceField) {
    const orders = getOrdersFn();
    const rate = getRateFn();
    const entities = type === 'courier' ? DB.get('couriers') : DB.get('suppliers');
    const label = type === 'courier' ? 'שליח' : 'ספק';
    let csv = `\uFEFF"מס׳","תאריך","${label}","סכום","עמלה","לתשלום"\n`;
    orders.forEach(o => {
        const entity = entities.find(e => e.id === o[idField]);
        const price = o[priceField] || o.totalPrice || o.price || 0;
        const comm = Math.round(price * rate);
        const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('he-IL') : '';
        csv += `"${o.id}","${date}","${entity ? entity.name : ''}","${price}","${comm}","${price - comm}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_settlement_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// TEAM MANAGEMENT
// ============================================
const TEAM_ROLES = {
    admin: { label: 'מנהל מערכת', icon: 'fa-crown', color: '#C41E2F' },
    dispatcher: { label: 'מוקדן / דיספטצ\'ר', icon: 'fa-headset', color: '#2563EB' },
    field_manager: { label: 'מנהל שטח', icon: 'fa-map-marked-alt', color: '#059669' },
    courier_manager: { label: 'מנהל שליחים', icon: 'fa-motorcycle', color: '#7C3AED' },
    driver_manager: { label: 'מנהל נהגי מונית', icon: 'fa-taxi', color: '#D4A843' },
    supplier_manager: { label: 'מנהל ספקים', icon: 'fa-store', color: '#0891B2' },
    accountant: { label: 'חשב / הנה"ח', icon: 'fa-calculator', color: '#059669' },
    support: { label: 'תמיכת לקוחות', icon: 'fa-life-ring', color: '#F59E0B' }
};
const TEAM_SHIFTS = {
    morning: { label: 'בוקר', time: '06:00-14:00', color: '#F59E0B' },
    afternoon: { label: 'צהריים', time: '14:00-22:00', color: '#2563EB' },
    night: { label: 'לילה', time: '22:00-06:00', color: '#7C3AED' },
    full: { label: 'יום מלא', time: '06:00-22:00', color: '#059669' },
    oncall: { label: 'כוננות', time: '24/7', color: '#dc3545' }
};

function loadTeam() {
    renderTeamStats();
    renderTeamList();
}

function renderTeamStats() {
    const members = DB.get('teamMembers');
    const active = members.filter(m => m.status !== 'inactive');
    const byRole = {};
    active.forEach(m => { byRole[m.role] = (byRole[m.role] || 0) + 1; });
    const el = document.getElementById('teamStats');
    if (!el) return;
    el.innerHTML = `
        <div class="stat-card"><div class="stat-number">${members.length}</div><div class="stat-label">סה"כ חברי צוות</div></div>
        <div class="stat-card" style="border-right:3px solid #059669;"><div class="stat-number">${active.length}</div><div class="stat-label">פעילים</div></div>
        <div class="stat-card" style="border-right:3px solid #2563EB;"><div class="stat-number">${byRole['dispatcher'] || 0}</div><div class="stat-label">מוקדנים</div></div>
        <div class="stat-card" style="border-right:3px solid #7C3AED;"><div class="stat-number">${byRole['field_manager'] || 0}</div><div class="stat-label">מנהלי שטח</div></div>`;
}

function addTeamMember() {
    const name = document.getElementById('teamName').value.trim();
    const phone = document.getElementById('teamPhone').value.trim();
    const role = document.getElementById('teamRole').value;
    const shift = document.getElementById('teamShift').value;
    const email = document.getElementById('teamEmail').value.trim();
    const password = document.getElementById('teamPassword').value.trim();
    const notes = document.getElementById('teamNotes').value.trim();
    if (!name || !phone) { alert('נא למלא שם וטלפון'); return; }

    const perms = [];
    document.querySelectorAll('.team-perm:checked').forEach(cb => perms.push(cb.value));

    const member = {
        id: 'TM-' + Date.now().toString().slice(-6),
        name, phone, role, shift, email, password, notes,
        permissions: perms,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    DB.add('teamMembers', member);
    ['teamName','teamPhone','teamEmail','teamPassword','teamNotes'].forEach(id => { document.getElementById(id).value = ''; });
    loadTeam();
}

function toggleTeamStatus(id) {
    const members = DB.get('teamMembers');
    const m = members.find(x => x.id === id);
    if (!m) return;
    m.status = m.status === 'active' ? 'inactive' : 'active';
    DB.set('teamMembers', members);
    loadTeam();
}

function deleteTeamMember(id) {
    if (!confirm('להסיר חבר צוות זה?')) return;
    const members = DB.get('teamMembers').filter(m => m.id !== id);
    DB.set('teamMembers', members);
    loadTeam();
}

function renderTeamList() {
    const members = DB.get('teamMembers');
    const wrap = document.getElementById('teamList');
    if (!wrap) return;
    if (!members.length) {
        wrap.innerHTML = '<div style="text-align:center;color:#888;padding:30px;font-size:14px;"><i class="fas fa-users" style="font-size:40px;color:#e0e0e0;display:block;margin-bottom:10px;"></i>אין חברי צוות עדיין</div>';
        return;
    }

    wrap.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;">' +
        members.map(m => {
            const role = TEAM_ROLES[m.role] || { label: m.role, icon: 'fa-user', color: '#666' };
            const shift = TEAM_SHIFTS[m.shift] || { label: m.shift, time: '', color: '#666' };
            const isActive = m.status === 'active';
            const opacity = isActive ? '1' : '0.5';
            const permLabels = {
                orders: 'הזמנות', rides: 'נסיעות', couriers: 'שליחים', drivers: 'נהגים',
                suppliers: 'ספקים', settlement: 'התחשבנויות', settings: 'הגדרות', analytics: 'אנליטיקה'
            };
            return `
            <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);opacity:${opacity};transition:opacity 0.3s;">
                <!-- Header -->
                <div style="background:${role.color};padding:16px 20px;display:flex;align-items:center;gap:14px;">
                    <div style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;">
                        <i class="fas ${role.icon}"></i>
                    </div>
                    <div style="flex:1;color:#fff;">
                        <div style="font-size:17px;font-weight:800;">${escapeHtml(m.name)}</div>
                        <div style="font-size:12px;opacity:0.85;">${role.label}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#fff;font-weight:600;">
                        ${isActive ? '<i class="fas fa-circle" style="color:#34d399;font-size:8px;"></i> פעיל' : '<i class="fas fa-circle" style="color:#fca5a5;font-size:8px;"></i> לא פעיל'}
                    </div>
                </div>
                <!-- Body -->
                <div style="padding:16px 20px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
                        <div style="display:flex;align-items:center;gap:8px;font-size:13px;">
                            <i class="fas fa-phone" style="color:${role.color};width:16px;"></i>
                            <a href="tel:${m.phone.replace(/[^\d+]/g,'')}" style="color:#333;text-decoration:none;font-weight:600;">${escapeHtml(m.phone)}</a>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;font-size:13px;">
                            <i class="fas fa-clock" style="color:${shift.color};width:16px;"></i>
                            <span>${shift.label} <span style="color:#999;font-size:11px;">${shift.time}</span></span>
                        </div>
                        ${m.email ? `<div style="display:flex;align-items:center;gap:8px;font-size:13px;grid-column:span 2;">
                            <i class="fas fa-envelope" style="color:#999;width:16px;"></i>
                            <span style="color:#666;">${escapeHtml(m.email)}</span>
                        </div>` : ''}
                    </div>
                    <!-- Permissions -->
                    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">
                        ${(m.permissions || []).map(p => `<span style="background:#f0f0f0;color:#555;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;">${permLabels[p] || p}</span>`).join('')}
                    </div>
                    ${m.notes ? `<div style="font-size:12px;color:#888;margin-bottom:12px;"><i class="fas fa-sticky-note"></i> ${escapeHtml(m.notes)}</div>` : ''}
                    <!-- Actions -->
                    <div style="display:flex;gap:8px;border-top:1px solid #f0f0f0;padding-top:12px;">
                        <button onclick="toggleTeamStatus('${m.id}')" style="flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;background:${isActive ? '#fef2f2' : '#f0fdf4'};color:${isActive ? '#dc3545' : '#059669'};">
                            <i class="fas ${isActive ? 'fa-pause' : 'fa-play'}"></i> ${isActive ? 'השבת' : 'הפעל'}
                        </button>
                        <a href="tel:${m.phone.replace(/[^\d+]/g,'')}" style="flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;background:#f0fdf4;color:#059669;text-align:center;text-decoration:none;">
                            <i class="fas fa-phone"></i> חייג
                        </a>
                        <button onclick="deleteTeamMember('${m.id}')" style="padding:8px 12px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-size:12px;background:#f8f9fa;color:#999;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('') + '</div>';
}

// ============================================
// AUTO-BACKUP SYSTEM
// ============================================
function getFullBackupData() {
    const data = { _exportedAt: new Date().toISOString(), _version: 'tikitaka-backup-v2' };
    DB_KEYS.forEach(k => { data[k] = DB.get(k); });
    data.settings = getSettings();
    return data;
}

function runAutoBackupNow() {
    const data = getFullBackupData();
    const json = JSON.stringify(data);
    localStorage.setItem('tikitaka_autoBackup', json);
    localStorage.setItem('tikitaka_autoBackupDate', new Date().toISOString());
    localStorage.setItem('tikitaka_autoBackupSize', json.length.toString());
    updateBackupDashboard();
}

const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1clC5m-mtzjEod-qkUaFGf73iUjcV3V93';

function backupToDrive() {
    exportDB('all');
    setTimeout(() => { window.open(DRIVE_FOLDER_URL, '_blank'); }, 500);
}

function promptRestorePassword() {
    const s = getSettings();
    const savedPwd = s.restorePassword;
    if (!savedPwd) {
        alert('לא הוגדרה סיסמת שחזור. הגדר סיסמה בהגדרות > אבטחה > סיסמת שחזור');
        return;
    }
    const entered = prompt('הזן סיסמת שחזור:');
    if (entered === null) return;
    if (entered !== savedPwd) {
        alert('סיסמה שגויה!');
        return;
    }
    document.getElementById('restoreFileInput').click();
}

function runBackupWithProgress() {
    const wrap = document.getElementById('backupProgressWrap');
    const bar = document.getElementById('backupProgressBar');
    const pct = document.getElementById('backupProgressPct');
    const label = document.getElementById('backupProgressLabel');
    const icon = document.getElementById('backupStatusIcon');
    const title = document.getElementById('backupStatusTitle');
    const sub = document.getElementById('backupStatusSub');
    if (!wrap) return;

    wrap.style.display = 'block';
    bar.style.width = '0%';
    pct.textContent = '0%';
    if (icon) icon.innerHTML = '<i class="fas fa-sync fa-spin" style="color:#F59E0B;"></i>';
    if (icon) icon.style.borderColor = '#F59E0B';
    if (title) title.textContent = 'מגבה...';
    if (sub) sub.textContent = 'אנא המתן';

    const steps = [
        { pctVal: 15, text: 'קורא הגדרות...' },
        { pctVal: 30, text: 'מגבה ספקים ומוצרים...' },
        { pctVal: 50, text: 'מגבה הזמנות ונסיעות...' },
        { pctVal: 70, text: 'מגבה נהגים ושליחים...' },
        { pctVal: 85, text: 'מגבה התחשבנויות...' },
        { pctVal: 95, text: 'שומר גיבוי...' },
        { pctVal: 100, text: 'הושלם!' }
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i >= steps.length) {
            clearInterval(interval);
            runAutoBackupNow();
            if (icon) icon.innerHTML = '<i class="fas fa-check-circle" style="color:#059669;"></i>';
            if (icon) icon.style.borderColor = '#059669';
            if (title) title.textContent = 'גיבוי מערכת';
            if (sub) sub.textContent = 'הגיבוי הושלם בהצלחה';
            setTimeout(() => { wrap.style.display = 'none'; updateBackupDashboard(); }, 2000);
            return;
        }
        bar.style.width = steps[i].pctVal + '%';
        pct.textContent = steps[i].pctVal + '%';
        label.textContent = steps[i].text;
        i++;
    }, 400);
}

function updateBackupDashboard() {
    const lastDateStr = localStorage.getItem('tikitaka_autoBackupDate');
    const sizeStr = localStorage.getItem('tikitaka_autoBackupSize');

    const dateEl = document.getElementById('backupLastDate');
    const timeEl = document.getElementById('backupLastTime');
    const sizeEl = document.getElementById('backupSize');
    const badgeEl = document.getElementById('backupStatusBadge');
    const nextEl = document.getElementById('backupNextTime');
    const subEl = document.getElementById('backupStatusSub');

    if (lastDateStr) {
        const d = new Date(lastDateStr);
        if (dateEl) dateEl.textContent = d.toLocaleDateString('he-IL');
        if (timeEl) timeEl.textContent = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        if (subEl) subEl.textContent = 'גיבוי אחרון: ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } else {
        if (dateEl) dateEl.textContent = 'טרם בוצע';
        if (timeEl) timeEl.textContent = '--:--';
        if (subEl) subEl.textContent = 'לא בוצע גיבוי עדיין';
    }

    if (sizeStr && sizeEl) {
        const bytes = parseInt(sizeStr);
        if (bytes > 1048576) sizeEl.textContent = (bytes / 1048576).toFixed(1) + ' MB';
        else sizeEl.textContent = Math.round(bytes / 1024) + ' KB';
    }

    if (badgeEl) {
        const hoursAgo = lastDateStr ? (Date.now() - new Date(lastDateStr).getTime()) / 3600000 : 999;
        if (hoursAgo < 13) { badgeEl.textContent = 'תקין'; badgeEl.style.color = '#059669'; }
        else if (hoursAgo < 25) { badgeEl.textContent = 'ישן'; badgeEl.style.color = '#D97706'; }
        else { badgeEl.textContent = 'מיושן!'; badgeEl.style.color = '#dc3545'; }
    }

    if (nextEl) {
        const now = new Date();
        const h = now.getHours();
        let nextHour, nextMin = 0;
        if (h < 5) { nextHour = 5; }
        else if (h < 17) { nextHour = 17; }
        else { nextHour = 5; }
        const next = new Date(now);
        if (nextHour <= h) next.setDate(next.getDate() + 1);
        next.setHours(nextHour, nextMin, 0, 0);
        const diffMs = next - now;
        const diffH = Math.floor(diffMs / 3600000);
        const diffM = Math.floor((diffMs % 3600000) / 60000);
        nextEl.textContent = String(nextHour).padStart(2, '0') + ':00';
        nextEl.title = `בעוד ${diffH} שעות ו-${diffM} דקות`;
    }
}

function downloadLastAutoBackup() {
    const raw = localStorage.getItem('tikitaka_autoBackup');
    if (!raw) { alert('אין גיבוי אוטומטי שמור'); return; }
    const date = (localStorage.getItem('tikitaka_autoBackupDate') || '').slice(0, 10);
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tikitaka_autobackup_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function toggleAutoBackup() {
    const on = document.getElementById('autoBackupToggle').checked;
    const s = getSettings();
    s.autoBackup = on;
    saveSettingsObj(s);
}

function updateLastBackupInfo() {
    const el = document.getElementById('lastBackupInfo');
    if (!el) return;
    const date = localStorage.getItem('tikitaka_autoBackupDate');
    if (date) {
        const d = new Date(date);
        el.innerHTML = `<i class="fas fa-check-circle" style="color:#059669;"></i> גיבוי אחרון: ${d.toLocaleDateString('he-IL')} בשעה ${d.toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'})}`;
    } else {
        el.innerHTML = '<i class="fas fa-info-circle" style="color:#D97706;"></i> לא בוצע גיבוי אוטומטי עדיין';
    }
}

function checkAutoBackup() {
    const s = getSettings();
    if (s.autoBackup === false) return;
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    const last = localStorage.getItem('tikitaka_autoBackupDate');
    const lastDate = last ? new Date(last) : null;
    const isBackupWindow = (hour === 5 && min < 30) || (hour === 17 && min < 30);
    const alreadyBackedThisWindow = lastDate && (now.getTime() - lastDate.getTime()) < 6 * 60 * 60 * 1000;
    if (isBackupWindow && !alreadyBackedThisWindow) {
        const data = getFullBackupData();
        const json = JSON.stringify(data);
        localStorage.setItem('tikitaka_autoBackup', json);
        localStorage.setItem('tikitaka_autoBackupDate', now.toISOString());
        localStorage.setItem('tikitaka_autoBackupSize', json.length.toString());
    }
    if (!last) {
        const data = getFullBackupData();
        const json = JSON.stringify(data);
        localStorage.setItem('tikitaka_autoBackup', json);
        localStorage.setItem('tikitaka_autoBackupDate', now.toISOString());
        localStorage.setItem('tikitaka_autoBackupSize', json.length.toString());
    }
}

function initSettingsDragDrop() {
    document.querySelectorAll('.settings-form > div').forEach(col => {
        const blocks = col.querySelectorAll('[style*="cursor:grab"]');
        blocks.forEach(block => {
            block.draggable = true;
            block.addEventListener('dragstart', e => {
                e.dataTransfer.effectAllowed = 'move';
                block.classList.add('settings-block-dragging');
                block._dragParent = col;
            });
            block.addEventListener('dragend', () => {
                block.classList.remove('settings-block-dragging');
                document.querySelectorAll('.settings-block-over').forEach(el => el.classList.remove('settings-block-over'));
            });
            block.addEventListener('dragover', e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                block.classList.add('settings-block-over');
            });
            block.addEventListener('dragleave', () => {
                block.classList.remove('settings-block-over');
            });
            block.addEventListener('drop', e => {
                e.preventDefault();
                block.classList.remove('settings-block-over');
                const dragging = col.querySelector('.settings-block-dragging') || document.querySelector('.settings-block-dragging');
                if (dragging && dragging !== block) {
                    const parent = block.parentNode;
                    parent.insertBefore(dragging, block);
                }
            });
        });
    });
}
setTimeout(initSettingsDragDrop, 500);

checkAutoBackup();
setInterval(checkAutoBackup, 5 * 60 * 1000);
setTimeout(updateBackupDashboard, 300);

// Init
loadDashboard();
if (sessionStorage.getItem('adminAuthed') === '1') {
    setTimeout(() => { initDashMap(); }, 200);
}
