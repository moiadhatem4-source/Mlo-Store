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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const TELEGRAM_BOT_TOKEN = "8919456647:AAESGivvUguo9qeHVONUBGzL6q62ws9_iyw"; 
const TELEGRAM_CHAT_ID = "5420681705";

function sendTelegramNotification(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: "Markdown" })
    }).catch(err => console.error("فشل إرسال الإشعار لـ تلجرام:", err));
}

let currentSeller = null;
let allSellersOrdered = [];
let rawProductsList = [];
let selectedCategory = "all";
let uploadedImageBase64 = ""; 
let uploadedAvatarBase64 = ""; // لتخزين كود صورة البائع الشخصية

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
    if (sellerData.rank === "vip") return ` <span style="background: linear-gradient(135deg, #ffcc00, #ff9900); color: #000; padding: 2px 7px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; margin-right: 5px;"><i class="fa-solid fa-crown"></i> VIP</span>`;
    if (sellerData.rank === "premium") return ` <i class="fa-solid fa-circle-check" style="color: #00b3ff; margin-right: 4px;"></i>`;
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
                alert("الحساب غير موجود!");
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

    const searchKey = document.getElementById('searchInput').value.trim().toLowerCase();
    const sortVal = document.getElementById('priceSort').value;

    let filtered = rawProductsList.filter(product => {
        if (filterUsername && product.sellerUsername !== filterUsername) return false;
        if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
        if (searchKey && !product.name.toLowerCase().includes(searchKey)) return false;
        return true;
    });

    if (sortVal === "low") filtered.sort((a, b) => a.price - b.price);
    else if (sortVal === "high") filtered.sort((a, b) => b.price - a.price);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color: #888; grid-column: 1/-1; text-align: center; padding: 20px;">لا توجد نتائج مطابقة لخيارات العرض الحالية.</p>`;
        return;
    }

    filtered.forEach(product => {
        const imgUrl = product.image ? product.image : "https://via.placeholder.com/260x200/16161f/00ffcc?text=MLO+Store";
        const badge = getSellerBadge(product.sellerUsername);
        const sellerData = allSellersOrdered.find(s => s.username === product.sellerUsername);
        const sellerAvatar = sellerData && sellerData.avatar ? `<img src="${sellerData.avatar}" style="width:22px; height:22px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-left:5px;">` : "";

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${imgUrl}" alt="${product.name}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
            <h3>${product.name}</h3>
            <p style="font-size:0.85rem; color:#aaa; margin-bottom: 8px; display:flex; align-items:center; justify-content:center;">
                ${sellerAvatar} المتجر: <a href="?shop=${product.sellerUsername}" style="color:#00ffcc; text-decoration:none; font-weight:bold; margin-right:3px;">@${product.sellerUsername}</a> ${badge}
            </p>
            <p class="price">${product.price} SDG</p>
            <button class="add-to-cart-btn" onclick="openOrderModal('${product.sellerUsername}', '${product.name}', ${product.price})"><i class="fa-solid fa-cart-plus"></i> اطلب الآن</button>
        `;
        container.appendChild(card);
    });
}

function searchProducts() { const urlParams = new URLSearchParams(window.location.search); renderProducts(urlParams.get('shop')); }
function sortProducts() { const urlParams = new URLSearchParams(window.location.search); renderProducts(urlParams.get('shop')); }

function filterByCategory(categoryName, element) {
    selectedCategory = categoryName;
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => { btn.style.background = "#16161f"; btn.style.color = "#fff"; btn.style.border = "1px solid #2a2a35"; });
    element.style.background = "#00ffcc"; element.style.color = "#0d0d12"; element.style.border = "none";
    const urlParams = new URLSearchParams(window.location.search);
    renderProducts(urlParams.get('shop'));
}

function previewImageFile(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { uploadedImageBase64 = e.target.result; document.getElementById('imageFilePreview').style.display = "block"; }
        reader.readAsDataURL(file);
    }
}

function previewSellerAvatar(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { uploadedAvatarBase64 = e.target.result; document.getElementById('avatarPreviewStatus').style.display = "block"; }
        reader.readAsDataURL(file);
    }
}

// 🛒 نظام معالجة وإشعار الطلبات المطور
function openOrderModal(sellerUsername, prodName, price) {
    // 1. يظهر للزبون فورا تنبيه بأن الطلب قيد المعالجة
    alert(`⏳ طلبك قيد المعالجة حالياً!\n\nتم إرسال إشعار فوري لـ إدارة MLO Store وللبائع (@${sellerUsername}) لتجهيز طلبك وتجهيز الشحن.`);
    
    // 2. جلب بيانات هاتف البائع لإرسالها بالتقرير
    database.ref('sellers').child(sellerUsername).once('value', (snapshot) => {
        const seller = snapshot.val();
        const sellerPhone = seller ? seller.phone : "غير مسجل";

        // 3. إرسال الإشعار الكامل لجروب التلجرام الخاص بك
        const msg = `🔔 *طلب جديد قيد المعالجة!*\n\n📦 *المنتج:* ${prodName}\n💰 *السعر:* ${price} SDG\n🏪 *التاجر المسئول:* @${sellerUsername}\n📞 *هاتف التاجر:* ${sellerPhone}\n\n_يرجى مراجعة اللوحة أو تنبيه التاجر إذا كان غير نشط!_`;
        sendTelegramNotification(msg);

        // 4. حفظ الطلب في Firebase لتنبيه البائع داخل حسابه الشخصي
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
            container.innerHTML = "<p style='color:#666; text-align:center;'>لا توجد طلبات جديدة معلقة حالياً.</p>";
            return;
        }
        Object.keys(data).forEach(key => {
            const order = data[key];
            const div = document.createElement('div');
            div.style.cssText = "background:#1d1d27; padding:8px; border-radius:6px; margin-bottom:8px; border-right:3px solid #ff9900; display:flex; justify-content:space-between; align-items:center;";
            div.innerHTML = `
                <span>🛍️ <b>${order.productName}</b> بسعر ${order.price} SDG</span>
                <button onclick="clearOrder('${key}')" style="background:#25D366; color:#fff; border:none; padding:3px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-family:'Cairo';">تم التسليم ✓</button>
            `;
            container.appendChild(div);
        });
    });
}

function clearOrder(orderKey) {
    if(confirm("هل تم تسليم الطلب للزبون وتريد إزالته من لوحة التنبيهات؟")) {
        database.ref('orders').child(orderKey).remove();
    }
}

function toggleAuthMode(isRegister) {
    document.getElementById('loginForm').style.display = isRegister ? 'none' : 'block';
    document.getElementById('registerForm').style.display = isRegister ? 'block' : 'none';
    document.getElementById('authTitle').innerHTML = isRegister ? 'تسجيل بائع جديد' : 'دخول التجار';
}

function registerSeller() {
    const storeName = document.getElementById('regStoreName').value.trim();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const securityAnswer = document.getElementById('regSecurityAnswer').value.trim().toLowerCase();

    if (!storeName || !username || !password || !phone || !securityAnswer) {
        alert("يرجى تعبئة كافة الحقول ورفع الصورة الشخصية ورقم الهاتف!");
        return;
    }

    database.ref('sellers').child(username).once('value', (snapshot) => {
        if (snapshot.exists()) {
            alert("يوزر المتجر هذا محجوز لتاجر آخر!");
        } else {
            database.ref('sellers').child(username).set({
                storeName: storeName,
                password: password,
                phone: phone,
                avatar: uploadedAvatarBase64, // حفظ الصورة الشخصية بنجاح
                rank: "normal",
                securityAnswer: securityAnswer,
                timestamp: Date.now()
            }).then(() => {
                alert(`تم التسجيل بنجاح!`);
                sendTelegramNotification(`🏪 *تاجر جديد انضم للمنصة!*\n\n• اسم المتجر: ${storeName}\n• اسم المستخدم: @${username}\n• رقم الهاتف: ${phone}`);
                toggleAuthMode(false);
            });
        }
    });
}

function loginSeller() {
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value.trim();

    database.ref('sellers').child(username).once('value', (snapshot) => {
        const seller = snapshot.val();
        if (seller && seller.password === password) {
            currentSeller = username;
            const badge = getSellerBadge(username);
            alert(`تم تسجيل الدخول بنجاح!`);
            
            document.getElementById('sellerWelcomeMsg').innerHTML = `المتجر الفعال: ${seller.storeName} (@${username}) ${badge}`;
            document.getElementById('sellerProfileLink').innerHTML = `رابط بروفايلك الخاص للزبائن: <br><a href="?shop=${username}" target="_blank" style="color:#00ffcc; text-decoration: underline;">${window.location.origin}${window.location.pathname}?shop=${username}</a>`;
            
            if (seller.avatar) {
                document.getElementById('sellerAvatarContainer').innerHTML = `<img src="${seller.avatar}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid #00ffcc;">`;
            } else {
                document.getElementById('sellerAvatarContainer').innerHTML = "";
            }
            
            listenToSellerOrders(username); // تشغيل تنبيهات الطلبات للبائع
            switchView('sellerDashboardView');
        } else {
            alert("الرمز السري أو اسم المستخدم غير صحيح!");
        }
    });
}

function forgotPassword() {
    const username = prompt("أدخل يوزر حسابك المنسي:");
    if (!username) return;

    database.ref('sellers').child(username.toLowerCase()).once('value', (snapshot) => {
        const seller = snapshot.val();
        if (!seller) { alert("هذا اليوزر غير مسجل بالمنصة!"); return; }
        const answer = prompt(`سؤال الأمان التحققي:\nما هي لعبتك المفضلة؟`);
        if (answer && answer.trim().toLowerCase() === seller.securityAnswer) {
            alert(`رمز دخولك السري هو: [ ${seller.password} ]`);
        } else if (answer !== null) { alert("إجابة سؤال الأمان خاطئة!"); }
    });
}

function handleUploadProduct() {
    if (!currentSeller) return;
    const name = document.getElementById('prodName').value.trim();
    const cat = document.getElementById('prodCategory').value;
    const price = document.getElementById('prodPrice').value.trim();

    if (!name || !price) { alert("يرجى كتابة اسم المنتج وتحديد السعر!"); return; }

    database.ref('products').push().set({
        name: name, category: cat, price: parseInt(price),
        image: uploadedImageBase64, sellerUsername: currentSeller
    }).then(() => {
        alert("تم النشر بنجاح!");
        sendTelegramNotification(`📦 *منتج جديد تم نشره!*\n\n• المنتج: ${name}\n• السعر: ${price} SDG\n• بواسطة التاجر: @${currentSeller}`);
        document.getElementById('prodName').value = ""; document.getElementById('prodPrice').value = "";
        document.getElementById('prodImageFile').value = ""; document.getElementById('imageFilePreview').style.display = "none";
        uploadedImageBase64 = ""; showStoreFront();
    });
}

function logoutSeller() { currentSeller = null; switchView('sellerAuthView'); }

function showStoreFront() {
    window.history.pushState({}, document.title, window.location.pathname);
    selectedCategory = "all";
    document.getElementById('searchInput').value = "";
    document.getElementById('priceSort').value = "default";
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach((btn, idx) => {
        if(idx === 0) { btn.style.background = "#00ffcc"; btn.style.color = "#0d0d12"; btn.style.border = "none"; } 
        else { btn.style.background = "#16161f"; btn.style.color = "#fff"; btn.style.border = "1px solid #2a2a35"; }
    });
    loadStoreData(); switchView('store');
}

function switchView(view) {
    document.getElementById('storeView').style.display = view === 'store' ? 'block' : 'none';
    document.getElementById('sellerAuthView').style.display = view === 'sellerAuthView' ? 'block' : 'none';
    document.getElementById('sellerDashboardView').style.display = view === 'sellerDashboardView' ? 'block' : 'none';
    document.getElementById('adminView').style.display = view === 'admin' ? 'block' : 'none';
}

let clickCount = 0; let clickTimer;
document.getElementById('mainLogo').addEventListener('click', () => {
    clickCount++; clearTimeout(clickTimer);
    if (clickCount === 3) {
        clickCount = 0;
        const pass = prompt("بوابة التحكم العليا:\nالرجاء إدخل رمز المشرف:");
        if (pass === "1221") { alert("تم تفعيل صلاحيات المشرف!"); switchView('admin'); } 
        else if (pass !== null) { alert("الرمز خاطئ!"); }
        return;
    }
    clickTimer = setTimeout(() => { clickCount = 0; }, 500);
});

function updateAdminPanel() {
    const sellersListContainer = document.getElementById('adminSellersList');
    const productsListContainer = document.getElementById('adminProductsList');
    if (!sellersListContainer || !productsListContainer) return;

    sellersListContainer.innerHTML = "";
    if (allSellersOrdered.length === 0) { sellersListContainer.innerHTML = "<p style='color:#666;'>لا يوجد تجار مسجلين حالياً.</p>"; } 
    else {
        allSellersOrdered.forEach((seller, index) => {
            const item = document.createElement('div');
            item.style.cssText = "display:flex; justify-content:space-between; background:#16161f; padding:12px; margin-bottom:10px; border-radius:8px; align-items:center; border:1px solid #2a2a35;";
            let currentRank = seller.rank ? seller.rank : "normal";
            item.innerHTML = `
                <div><span style="color:#ffcc00; font-weight:bold;">[#${index+1}]</span> <strong>${seller.storeName}</strong> <span style="color:#888;">(@${seller.username})</span></div>
                <div>
                    <button onclick="cycleSellerRank('${seller.username}', '${currentRank}')" style="background:#00b3ff; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:0.8rem; font-family:'Cairo';">رتبة: ${currentRank}</button>
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
    database.ref('sellers').child(username).update({ rank: nextRank }).then(() => { alert("تم تحديث الرتبة بنجاح!"); });
}
function deleteSellerAccount(username) { if (confirm(`حذف حساب @${username}؟`)) { database.ref('sellers').child(username).remove(); } }
function deleteProductAdmin(key) { if (confirm("إزالة هذا المنتج؟")) { database.ref('products').child(key).remove(); } }
