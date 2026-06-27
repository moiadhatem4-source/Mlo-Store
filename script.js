// بيانات المنتجات الافتراضية في المتجر
let products = [
    { id: 1, name: "منتج تجريبي 1", price: 150, image: "https://via.placeholder.com/260x200/16161f/00ffcc?text=MLO+Store" },
    { id: 2, name: "منتج تجريبي 2", price: 280, image: "https://via.placeholder.com/260x200/16161f/00ffcc?text=MLO+Store" }
];

// سلة التسوق
let cart = [];

// عند تحميل الصفحة، يتم عرض المنتجات فوراً
document.addEventListener("DOMContentLoaded", () => {
    displayProducts();
});

// دالة عرض المنتجات في واجهة المتجر
function displayProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = ""; // تفريغ الحاوية قبل العرض
    
    if (products.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">لا توجد منتجات معروضة حالياً.</p>`;
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.cssText = `
            background-color: var(--card-dark);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            transition: transform 0.3s ease;
        `;
        
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="font-size: 1.1rem; margin-bottom: 10px;">${product.name}</h3>
            <p style="color: var(--primary); font-weight: bold; margin-bottom: 15px;">${product.price} SDG</p>
            <button onclick="addToCart(${product.id})" style="
                background-color: var(--primary); 
                color: var(--bg-dark); 
                border: none; 
                padding: 8px 15px; 
                border-radius: 6px; 
                font-weight: bold; 
                cursor: pointer;
                width: 100%;
            ">إضافة للسلة</button>
        `;
        container.appendChild(productCard);
    });
}

// دالة إضافة منتج إلى السلة
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        alert(`✓ تم إضافة "${product.name}" إلى السلة بنجاح!`);
    }
}

// التبديل بين واجهات المنصة
function switchView(view) {
    const storeView = document.getElementById('storeView');
    const sellerView = document.getElementById('sellerView');
    
    if (view === 'store') {
        storeView.style.display = 'block';
        sellerView.style.display = 'none';
    } else if (view === 'seller') {
        storeView.style.display = 'none';
        sellerView.style.display = 'block';
    }
}

// ─── ميزة النقر 3 مرات السرية لشعار الموقع ───
let logoClickCount = 0;
let logoTimer;
const mainLogo = document.getElementById('mainLogo');

if (mainLogo) {
    mainLogo.addEventListener('click', () => {
        logoClickCount++;
        clearTimeout(logoTimer);
        
        if (logoClickCount === 3) {
            logoClickCount = 0;
            openAdminModal();
            return;
        }
        
        logoTimer = setTimeout(() => { logoClickCount = 0; }, 500);
    });
}

// نافذة الدخول السرية للمشرف
function openAdminModal() {
    const password = prompt("🔐 نظام الأمان: أدخل الرمز السري للمشرف:");
    
    if (password === "1221") {
        alert("✓ مرحباً بك يا مدير المنصة! تم الدخول بنجاح.");
        // سيتم فتح لوحة تحكم متقدمة هنا لاحقاً
    } else if (password !== null) {
        alert("❌ الرمز السري خاطئ!");
    }
}
