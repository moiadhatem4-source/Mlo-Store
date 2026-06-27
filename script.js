// إعدادات Firebase الخاصة بمشروعك (mlo-bece1)
const firebaseConfig = {
    apiKey: "AIzaSyAfDgxELrgDb0LEF20OowC2x42dWphVY38",
    authDomain: "mlo-bece1.firebaseapp.com",
    projectId: "mlo-bece1",
    storageBucket: "mlo-bece1.firebasestorage.app",
    messagingSenderId: "518550152197",
    appId: "1:518550152197:web:0c6e2347c62c4341e286c",
    measurementId: "G-NMS96VEJ9V",
    databaseURL: "https://mlo-bece1-default-rtdb.firebaseio.com/"
};

// تفعيل فايربيس وقاعدة البيانات
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// سلة التسوق المحلية
let cart = [];

// جلب المنتجات وعرضها تلقائياً عند حدوث أي تغيير في الداتابيز
database.ref('products').on('value', (snapshot) => {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;
    
    productsContainer.innerHTML = ""; // تصفير الحاوية قبل العرض
    
    const data = snapshot.val();
    if (!data) {
        productsContainer.innerHTML = `<p style="color: #888; grid-column: 1/-1; text-align: center; font-family: 'Cairo', sans-serif;">لا توجد منتجات معروضة حالياً. كن أول من يضيف منتجاً!</p>`;
        return;
    }
    
    // التكرار لعرض كل منتج
    Object.keys(data).forEach(key => {
        const product = data[key];
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.cssText = `
            background-color: #16161f;
            border: 1px solid #2a2a35;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
        `;
        
        const imgUrl = product.image ? product.image : "https://via.placeholder.com/260x200/16161f/00ffcc?text=MLO+Store";
        
        productCard.innerHTML = `
            <img src="${imgUrl}" alt="${product.name}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="font-size: 1.1rem; margin-bottom: 10px; color: #fff;">${product.name}</h3>
            <p style="color: #00ffcc; font-weight: bold; margin-bottom: 15px;">${product.price} SDG</p>
            <button onclick="addToCart('${key}', '${product.name}')" style="
                background-color: #00ffcc; 
                color: #0d0d12; 
                border: none; 
                padding: 8px 15px; 
                border-radius: 6px; 
                font-weight: bold; 
                cursor: pointer;
                width: 100%;
            ">إضافة للسلة</button>
        `;
        productsContainer.appendChild(productCard);
    });
});

// دالة رفع المنتج للتاجر
function handleUploadProduct() {
    const name = document.getElementById('prodName').value.trim();
    const price = document.getElementById('prodPrice').value.trim();
    const image = document.getElementById('prodImage').value.trim();
    
    if (!name || !price) {
        alert("⚠️ الرجاء كتابة اسم المنتج والسعر على الأقل!");
        return;
    }
    
    const newProductRef = database.ref('products').push();
    newProductRef.set({
        name: name,
        price: parseInt(price),
        image: image
    }).then(() => {
        alert("🚀 تم نشر منتجك بنجاح وسيظهر للجميع الآن!");
        document.getElementById('prodName').value = "";
        document.getElementById('prodPrice').value = "";
        document.getElementById('prodImage').value = "";
        switchView('store');
    }).catch((error) => {
        alert("❌ خطأ في الاتصال بقاعدة البيانات: " + error.message);
    });
}

// إضافة للسلة
function addToCart(id, name) {
    cart.push({ id, name });
    alert(`✓ تم إضافة "${name}" إلى السلة!`);
}

// التبديل بين واجهات المتجر والتاجر
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

function openAdminModal() {
    const password = prompt("🔐 نظام الأمان: أدخل الرمز السري للمشرف:");
    if (password === "1221") {
        alert("✓ مرحباً بك يا مدير المنصة! تم الدخول بنجاح.");
    } else if (password !== null) {
        alert("❌ الرمز السري خاطئ!");
    }
}

