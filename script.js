// ==========================================
// 1. إعدادات Firebase وتلجرام
// ==========================================
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

// تهيئة الفايربيس
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// إعدادات بوت تلجرام (لإرسال إشعارات الطلبات)
const TELEGRAM_BOT_TOKEN = "8919456647:AAESGivvUguo9qeHVONUBGzL6q62ws9_iyw"; 
const TELEGRAM_CHAT_ID = "5420681705";

// ==========================================
// 2. المتغيرات العامة
// ==========================================
let currentSeller = null;
let allSellersOrdered = [];
let rawProductsList = [];
let selectedCategory = "all";
let uploadedImageBase64 = ""; 
let uploadedAvatarBase64 = "";

// ==========================================
// 3. دوال التنقل والواجهات (حل مشكلة التعليق)
// ==========================================
function switchView(viewId) {
    // إخفاء جميع الواجهات
    const allViews = ['storeView', 'sellerAuthView', 'sellerDashboardView', 'adminView'];
    allViews.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // إظهار الواجهة المطلوبة فقط
    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = 'block';
        window.scrollTo(0, 0); // رفع الشاشة للأعلى
    }
}

function showStoreFront() {
    window.history.pushState({}, document.title, window.location.pathname);
    selectedCategory = "all";
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = "";
    if (document.getElementById('priceSort')) document.getElementById('priceSort').value = "default";
    
    // إعادة تفعيل زر "الكل" في التصنيفات
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach((btn, idx) => {
        if(idx === 0) {
            btn.style.background = "#00ffcc"; btn.style.color = "#0d0d12"; btn.style.border = "none";
        } else {
            btn.style.background = "#16161f"; btn.style.color = "#fff"; btn.style.border = "1px solid #2a2a35";
        }
    });
    
    switchView('storeView');
    loadStoreData();
}

function toggleAuthMode(isRegister) {
    document.getElementById('loginForm').style.display = isRegister ? 'none' : 'block';
    document.getElementById('registerForm').style.display = isRegister ? 'block' : 'none';
    document.getElementById('authTitle').innerHTML = isRegister ? '<i class="fa-solid fa-user-plus"></i> تسجيل بائع جديد' : '<i class="fa-solid fa-key"></i> دخول التجار';
}

// ==========================================
// 4. تحميل البيانات (التجار والمنتجات)
// ==========================================
window.onload = function() {
    database.ref('sellers').orderByChild('timestamp').on('value', (snapshot) => {
        allSellersOrdered = [];
        snapshot.forEach((childSnapshot) => {
            allSellersOrdered.push({ username: childSnapshot.key, ...childSnapshot.val() });
        });
        loadStoreData();
    });
};

function getSellerBadge(username) {
    const sellerData = allSellersOrdered.find(s => s.username === username);
    if (!sellerData) return "";
    if (sellerData.rank === "vip") return ` <span style="background: linear-gradient(135deg, #ffcc00, #ff9900); color: #000; padding: 2px 7px; border-radius: 6px; font-size: 0.7rem; font-weight: bold;"><i class="fa-solid fa-crown"></i> VIP</span>`;
    if (sellerData.rank === "premium") return ` <i class="fa-solid fa-circle-check" style="color: #00b3ff;"></i>`;
    return "";
}

function loadStoreData() {
    const urlParams = new URLSearchParams(window.location.search);
    const shopUsername = urlParams.get('shop');

    if (shopUsername) {
        database.ref('sellers').child(shopUsername).once('value', (snapshot) => {
            const seller = snapshot.val();
            if (seller) {
                const badge = getSellerBadge(shopUsername);
                const avatarHtml = seller.avatar ? `<img src="${seller.avatar}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid #00ffcc; margin-bottom:10px;">` : "";
                document.getElementById('storeHero').innerHTML = `
                    ${avatarHtml}
                    <h1>${seller.storeName} ${badge}</h1>
                    <p>المتجر الرسمي للبائع: @${shopUsername} | هاتف: ${seller.phone || 'غير مسجل'}</p>
                    <button onclick="showStoreFront()" style="background:#00ffcc; color:#0d0d12; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold; margin-top:12px; font-family: 'Cairo';">العودة للمركز المشترك</button>
                `;
                listenToProducts(shopUsername);
            } else {
                showStoreFront();
            }
        });
    } else {
        document.getElementById('storeHero').innerHTML = `<h1>MLO Store</h1><p>تصفح أحدث المنتجات والخدمات الحصرية بأفضل الأسعار</p>`;
        listenToProducts(null);
    }
    updateAdminPanel();
}

function listenToProducts(filterUsername) {
    database.ref('products').on('value', (snapshot) => {
        rawProductsList = [];
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => { rawProductsList.push({ id: key, ...data[key] }); });
        }
        renderProducts(filterUsername);
    });
}

function renderProducts(filterUsername) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    container.innerHTML = "";

    const searchKey = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim().toLowerCase() : "";
    const sortVal = document.getElementById('priceSort') ? document.getElementById('priceSort').value : "default";

    let filtered = rawProductsList.filter(product => {
        if (filterUsername && product.sellerUsername !== filterUsername) return false;
        if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
        if (searchKey && !product.name.toLowerCase().includes(searchKey)) return false;
        return true;
    });

    if (sortVal === "low") filtered.sort((a, b) => a.price - b.price);
    else if (sortVal === "high") filtered.sort((a, b) => b.price - a.price);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color: #888; grid-column: 1/-1; text-align: center; padding: 20px;">لا توجد نتائج مطابقة.</p>`;
        return;
    }

    filtered.forEach(product => {
        const imgUrl = product.image ? product.image : "https://via.placeholder.com/260x200/16161f/00ffcc?text=MLO+Store";
        const badge = getSellerBadge(product.sellerUsername);
        
        const card = document.createElement('div');
        card.style.cssText = "background: #16161f; border: 1px solid #2a2a35; border-radius: 12px; padding: 15px; text-align: center;";
        card.innerHTML = `
            <img src="${imgUrl}" alt="${product.name}" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
            <h3 style="margin: 10px 0; font-size: 1.1rem; color: #fff;">${product.name}</h3>
            <p style="font-size:0.85rem; color:#aaa; margin-bottom: 8px;">
                المتجر: <a href="?shop=${product.sellerUsername}" style="color:#00ffcc; text-decoration:none; font-weight:bold;">@${product.sellerUsername}</a> ${badge}
            </p>
            <p style="color: #ffcc00; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;">${product.price} SDG</p>
            <button onclick="openOrderModal('${product.sellerUsername}', '${product.name}', ${product.price})" style="width: 100%; background: #00ffcc; color: #0d0d12; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Cairo';"><i class="fa-solid fa-cart-plus"></i> اطلب الآن</button>
        `;
        container.appendChild(card);
    });
}

function searchProducts() { const urlParams = new URLSearchParams(window.location.search); renderProducts(urlParams.get('shop')); }
function sortProducts() { const urlParams = new URLSearchParams(window.location.search); renderProducts(urlParams.get('shop')); }

function filterByCategory(categoryName, element) {
    selectedCategory = categoryName;
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.style.background = "#16161f"; btn.style.color = "#fff"; btn.style.border = "1px solid #2a2a35";
    });
    element.style.background = "#00ffcc"; element.style.color = "#0d0d12"; element.style.border = "none";
    const urlParams = new URLSearchParams(window.location.search);
    renderProducts(urlParams.get('shop'));
}

// ==========================================
// 5. نظام رفع الصور
// ==========================================
function previewImageFile(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { 
            uploadedImageBase64 = e.target.result; 
            alert("تم إرفاق صورة المنتج بنجاح!");
        }
        reader.readAsDataURL(file);
    }
}

function previewSellerAvatar(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { 
            uploadedAvatarBase64 = e.target.result; 
            if(document.getElementById('avatarPreviewStatus')) document.getElementById('avatarPreviewStatus').style.display = "block"; 
        }
        reader.readAsDataURL(file);
    }
}

// ==========================================
// 6. تسجيل الدخول والاشتراك للتجار
// ==========================================
function registerSeller() {
    const storeName = document.getElementById('regStoreName').value.trim();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const securityAnswer = document.getElementById('regSecurityAnswer').value.trim().toLowerCase();

    if (!storeName || !username || !password || !phone || !securityAnswer) {
        alert("يرجى تعبئة كافة الحقول!");
        return;
    }

    database.ref('sellers').child(username).once('value', (snapshot) => {
        if (snapshot.exists()) {
            alert("يوزر المتجر محجوز لتاجر آخر!");
        } else {
            database.ref('sellers').child(username).set({
                storeName: storeName,
                password: password,
                phone: phone,
                avatar: uploadedAvatarBase64,
                rank: "normal",
                securityAnswer: securityAnswer,
                timestamp: Date.now()
            }).then(() => {
                alert("تم إنشاء حسابك بنجاح! جاري تحويلك للوحة التحكم...");
                sendTelegramNotification(`🏪 *تاجر جديد انضم للمنصة!*\n\n• المتجر: ${storeName}\n• اليوزر: @${username}\n• الهاتف: ${phone}`);
                
                // تسجيل الدخول التلقائي فوراً بعد التسجيل
                currentSeller = username;
                if (document.getElementById('sellerWelcomeMsg')) {
                    document.getElementById('sellerWelcomeMsg').innerText = `مرحباً بك: ${storeName} (@${username})`;
                }
                listenToSellerOrders(username);
                switchView('sellerDashboardView');
                
                // تصفير الحقول
                document.getElementById('regStoreName').value = "";
                document.getElementById('regUsername').value = "";
                document.getElementById('regPassword').value = "";
                document.getElementById('regPhone').value = "";
                uploadedAvatarBase64 = "";
            });
        }
    });
}

function loginSeller() {
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        alert("أدخل اليوزر وكلمة المرور!");
        return;
    }

    database.ref('sellers').child(username).once('value', (snapshot) => {
        const seller = snapshot.val();
        if (seller && seller.password === password) {
            alert("تم تسجيل الدخول بنجاح!");
            currentSeller = username;
            
            // تهيئة واجهة المستخدم للتاجر
            const badge = getSellerBadge(username);
            if (document.getElementById('sellerWelcomeMsg')) {
                document.getElementById('sellerWelcomeMsg').innerHTML = `المتجر الفعال: ${seller.storeName} (@${username}) ${badge}`;
            }
            if (document.getElementById('sellerAvatarContainer') && seller.avatar) {
                document.getElementById('sellerAvatarContainer').innerHTML = `<img src="${seller.avatar}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid #00ffcc;">`;
            }
            
            // تشغيل تنبيهات الطلبات والانتقال للوحة التحكم
            listenToSellerOrders(username);
            switchView('sellerDashboardView');
            
            // تصفير الحقول
            document.getElementById('loginUsername').value = "";
            document.getElementById('loginPassword').value = "";

        } else {
            alert("اسم المستخدم أو كلمة المرور غير صحيحة!");
        }
    }).catch(err => {
        console.error(err);
        alert("تأكد من اتصالك بالإنترنت!");
    });
}

function logoutSeller() { 
    currentSeller = null; 
    switchView('sellerAuthView'); 
}

// ==========================================
// 7. إدارة المنتجات للتاجر
// ==========================================
function handleUploadProduct() {
    if (!currentSeller) return;
    const name = document.getElementById('prodName').value.trim();
    const price = document.getElementById('prodPrice').value.trim();
    const cat = "others"; // يمكنك إضافة قائمة منسدلة للأقسام لاحقاً إذا أردت

    if (!name || !price) { alert("يرجى كتابة اسم المنتج وتحديد السعر!"); return; }

    database.ref('products').push().set({
        name: name, 
        category: cat, 
        price: parseInt(price),
        image: uploadedImageBase64, 
        sellerUsername: currentSeller
    }).then(() => {
        alert("تم نشر المنتج بنجاح!");
        sendTelegramNotification(`📦 *منتج جديد!*\n\n• المنتج: ${name}\n• السعر: ${price} SDG\n• البائع: @${currentSeller}`);
        document.getElementById('prodName').value = ""; 
        document.getElementById('prodPrice').value = "";
        if(document.getElementById('prodImageFile')) document.getElementById('prodImageFile').value = "";
        uploadedImageBase64 = ""; 
        showStoreFront();
    });
}

// ==========================================
// 8. نظام الطلبات والإشعارات
// ==========================================
function sendTelegramNotification(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: "Markdown" })
    }).catch(err => console.error("Telegram Error:", err));
}

function openOrderModal(sellerUsername, prodName, price) {
    alert(`⏳ طلبك قيد المعالجة!\nتم إرسال إشعار فوري لمتجر (@${sellerUsername}) لتجهيز طلبك.`);
    
    database.ref('sellers').child(sellerUsername).once('value', (snapshot) => {
        const seller = snapshot.val();
        const sellerPhone = seller && seller.phone ? seller.phone : "غير مسجل";

        // إرسال للتلجرام
        const msg = `🔔 *طلب جديد للتاجر!*\n\n📦 *المنتج:* ${prodName}\n💰 *السعر:* ${price} SDG\n🏪 *التاجر:* @${sellerUsername}\n📞 *واتساب التاجر:* [${sellerPhone}](https://wa.me/${sellerPhone})\n\n_يرجى متابعة الطلب_`;
        sendTelegramNotification(msg);

        // إرسال للوحة تحكم التاجر
        database.ref('orders').push().set({
            sellerUsername: sellerUsername,
            productName: prodName,
            price: price,
            timestamp: Date.now()
        });
    });
}

function listenToSellerOrders(username) {
    const container = document.getElementById('sellerOrdersContainer');
    if (!container) return;
    
    database.ref('orders').orderByChild('sellerUsername').equalTo(username).on('value', (snapshot) => {
        container.innerHTML = "";
        const data = snapshot.val();
        if (!data) {
            container.innerHTML = "<p style='color:#666; text-align:center;'>لا توجد طلبات جديدة حالياً.</p>";
            return;
        }
        Object.keys(data).forEach(key => {
            const order = data[key];
            const div = document.createElement('div');
            div.style.cssText = "background:#1d1d27; padding:10px; border-radius:6px; margin-bottom:8px; border-right:3px solid #ff9900; display:flex; justify-content:space-between; align-items:center;";
            div.innerHTML = `
                <span>🛍️ <b>${order.productName}</b> - ${order.price} SDG</span>
                <button onclick="clearOrder('${key}')" style="background:#25D366; color:#fff; border:none; padding:5px 10px; border-radius:4px; font-size:0.8rem; cursor:pointer; font-family:'Cairo';">تم التسليم ✓</button>
            `;
            container.appendChild(div);
        });
    });
}

function clearOrder(orderKey) {
    if(confirm("هل أتممت هذا الطلب وتريد إخفاءه من القائمة؟")) {
        database.ref('orders').child(orderKey).remove();
    }
}

// ==========================================
// 9. لوحة تحكم المشرف (Admin)
// ==========================================
let clickCount = 0; let clickTimer;
document.addEventListener('DOMContentLoaded', () => {
    const logoEl = document.getElementById('mainLogo');
    if(logoEl) {
        logoEl.addEventListener('click', () => {
            clickCount++; clearTimeout(clickTimer);
            if (clickCount === 3) {
                clickCount = 0;
                const pass = prompt("بوابة المشرف:\nالرجاء إدخال الرمز السري:");
                if (pass === "1221") { 
                    alert("تم تفعيل صلاحيات المشرف!"); 
                    switchView('adminView'); 
                } else if (pass !== null) { 
                    alert("الرمز السري خاطئ!"); 
                }
                return;
            }
            clickTimer = setTimeout(() => { clickCount = 0; }, 500);
        });
    }
});

function updateAdminPanel() {
    const sellersListContainer = document.getElementById('adminSellersList');
    const productsListContainer = document.getElementById('adminProductsList');
    if (!sellersListContainer || !productsListContainer) return;

    sellersListContainer.innerHTML = "";
    if (allSellersOrdered.length === 0) { sellersListContainer.innerHTML = "<p style='color:#666;'>لا يوجد تجار مسجلين.</p>"; } 
    else {
        allSellersOrdered.forEach((seller, index) => {
            const item = document.createElement('div');
            item.style.cssText = "display:flex; justify-content:space-between; background:#16161f; padding:12px; margin-bottom:10px; border-radius:8px; align-items:center; border:1px solid #2a2a35;";
            let currentRank = seller.rank ? seller.rank : "normal";
            item.innerHTML = `
                <div><span style="color:#ffcc00;">[#${index+1}]</span> <strong>${seller.storeName}</strong> <span style="color:#888;">(@${seller.username})</span></div>
                <div>
                    <button onclick="cycleSellerRank('${seller.username}', '${currentRank}')" style="background:#00b3ff; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:0.8rem;">رتبة: ${currentRank}</button>
                    <button onclick="deleteSellerAccount('${seller.username}')" style="background:#ff3366; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>`;
            sellersListContainer.appendChild(item);
        });
    }

    database.ref('products').once('value', (snapshot) => {
        productsListContainer.innerHTML = "";
        const data = snapshot.val();
        if (!data) { productsListContainer.innerHTML = "<p style='color:#666;'>لا توجد منتجات.</p>"; return; }
        Object.keys(data).forEach(key => {
            const product = data[key];
            const item = document.createElement('div');
            item.style.cssText = "display:flex; justify-content:space-between; background:#16161f; padding:10px; margin-bottom:10px; border-radius:8px; align-items:center;";
            item.innerHTML = `<span>${product.name} (${product.price} SDG)</span><button onclick="deleteProductAdmin('${key}')" style="background:#ff3366; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`;
            productsListContainer.appendChild(item);
        });
    });
}

function cycleSellerRank(username, currentRank) {
    let nextRank = "normal";
    if (currentRank === "normal") nextRank = "premium";
    else if (currentRank === "premium") nextRank = "vip";
    else if (currentRank === "vip") nextRank = "normal";
    database.ref('sellers').child(username).update({ rank: nextRank }).then(() => { alert("تم التحديث!"); });
}
function deleteSellerAccount(username) { if (confirm(`حذف حساب @${username}؟`)) { database.ref('sellers').child(username).remove(); } }
function deleteProductAdmin(key) { if (confirm("إزالة هذا المنتج؟")) { database.ref('products').child(key).remove(); } }

