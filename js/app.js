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

// Toggle mobile menu
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// Submit order
function submitOrder(e) {
    e.preventDefault();

    const order = {
        id: 'TK-' + Date.now().toString().slice(-6),
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        customerEmail: document.getElementById('customerEmail').value || '',
        category: document.getElementById('category').value,
        pickupAddress: document.getElementById('pickupAddress').value,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        notes: document.getElementById('notes').value || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        estimatedDelivery: '30-45 דקות'
    };

    DB.add('orders', order);

    document.getElementById('orderNumber').textContent = order.id;
    document.getElementById('orderModal').classList.add('open');
    document.getElementById('orderForm').reset();
}

// Close modal
function closeModal() {
    document.getElementById('orderModal').classList.remove('open');
}

// Track order
function trackOrder() {
    const trackNumber = document.getElementById('trackNumber').value.trim();
    if (!trackNumber) return;

    const orders = DB.get('orders');
    const order = orders.find(o => o.id === trackNumber);
    const resultDiv = document.getElementById('trackResult');

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
