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

let currentSeller = null;
let allSellersOrdered = [];

window.onload = function() {
    database.ref('sellers').orderByChild('timestamp').on('value', (snapshot) => {
        allSellersOrdered = [];
        snapshot.forEach((childSnapshot) => {
            allSellersOrdered.push({
                username: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        loadStoreData();
    });
};

// توليد الشارات باستخدام أيقونات Font Awesome النظيفة
function getSellerBadge(username) {
    const index = allSellersOrdered.findIndex(s => s.username === username);
    const sellerData = allSellersOrdered.find(s => s.username === username);
    
    let badge = "";
    // إذا كان من أول 5 مسجلين تظهر شارة VIP البرمجية الفخمة باللون الذهبي
    if (index !== -1 && index < 5) {
        badge += ` <span style="background: linear-gradient(135deg, #ffcc00, #ff9900); color: #000; padding: 2px 7px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; margin-right: 5px; display: inline-flex; align-items: center; gap: 3px; box-shadow: 0 0 8px rgba(255,204,0,0.4);"><i class="fa-solid fa-crown"></i> VIP</span>`;
    }
    // شارة النجمة الموثقة المستوحاة من تلجرام (أيقونة النجمة داخل دائرة باللون الأزرق المميز للتوثيق)
    if (sellerData && sellerData.isPremium) {
        badge += ` <i class="fa-solid fa-circle-check" style="color: #00b3ff; margin-right: 4px; font-size: 0.95rem;" title="بائع موثق"></i>`;
    }
    return badge;
}

function loadStoreData() {
    const urlParams = new URLSearchParams(window.location.search);
    const shopUsername = urlParams.get('shop');

    if (shopUsername) {
        database.ref('sellers').child(shopUsername).once('value', (snapshot) => {
            const seller = snapshot.val();
            if (seller) {
                const badge = getSellerBadge(shopUsername);
                document.getElementById('storeHero').innerHTML = `
                    <h1>${seller.storeName} ${badge}</h1>
                    <p>المتجر الرسمي المعتمد للبائع: @${shopUsername}</p>
                    <button onclick="showStoreFront()" style="background:#00ffcc; color:#0d0d12; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold; margin-top:12px;"><i class="fa-solid fa-arrow-left"></i> العودة للمركز المشترك</button>
                `;
                loadProducts(shopUsername);
            } else {
                alert("الحساب غير موجود!");
                showStoreFront();
            }
        });
    } else {
        document.getElementById('storeHero').innerHTML = `
            <h1>MLO Store</h1>
            <p>تصفح أحدث المنتجات والخدمات الحصرية بأفضل الأسعار</p>
        `;
        loadProducts(null);
    }
    updateAdminPanel();
}

function loadProducts(filterUsername) {
    database.ref('products').on('value', (snapshot) => {
        const container = document.getElementById('productsContainer');
        if (!container) return;
        container.innerHTML = "";

        const data = snapshot.val();
        if (!data) {
            container.innerHTML = `<p style="color: #888; grid-column: 1/-1; text-align: center;">لا توجد معروضات متاحة حالياً.</p>`;
            return;
        }

        Object.keys(data).forEach(key => {
            const product = data[key];
            if (filterUsername && product.sellerUsername !== filterUsername) return;
            
            const imgUrl = product.image ? product.image : "https://via.placeholder.com/260x200/16161f/00ffcc?text=MLO+Store";
            const badge = getSellerBadge(product.sellerUsername);

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${imgUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p style="font-size:0.85rem; color:#aaa; margin-bottom: 8px;">التاجر: <a href="?shop=${product.sellerUsername}" style="color:#00ffcc; text-decoration:none; font-weight:bold;">@${product.sellerUsername}</a> ${badge}</p>
                <p class="price">${product.price} SDG</p>
                <button class="add-to-cart-btn" onclick="addToCart('${key}', '${product.name}')"><i class="fa-solid fa-cart-plus"></i> إضافة للسلة</button>
            `;
            container.appendChild(card);
        });
    });
}

function toggleAuthMode(isRegister) {
    document.getElementById('loginForm').style.display = isRegister ? 'none' : 'block';
    document.getElementById('registerForm').style.display = isRegister ? 'block' : 'none';
    document.getElementById('authTitle').innerHTML = isRegister ? '<i class="fa-solid fa-user-plus"></i> تسجيل بائع جديد' : '<i class="fa-solid fa-key"></i> دخول التجار';
}

function registerSeller() {
    const storeName = document.getElementById('regStoreName').value.trim();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value.trim();
    const securityAnswer = document.getElementById('regSecurityAnswer').value.trim().toLowerCase();

    if (!storeName || !username || !password || !securityAnswer) {
        alert("يرجى تعبئة كافة الحقول المتاحة!");
        return;
    }

    database.ref('sellers').child(username).once('value', (snapshot) => {
        if (snapshot.exists()) {
            alert("يوزر المتجر هذا محجوز لتاجر آخر!");
        } else {
            database.ref('sellers').child(username).set({
                storeName: storeName,
                password: password,
                securityAnswer: securityAnswer,
                isPremium: false,
                timestamp: Date.now()
            }).then(() => {
                alert(`تم التسجيل بنجاح!`);
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
        if (!seller) {
            alert("هذا اليوزر غير مسجل بالمنصة!");
            return;
        }

        const answer = prompt(`سؤال الأمان التحققي:\nما هي لعبتك أو صديقك المفضل؟`);
        if (answer && answer.trim().toLowerCase() === seller.securityAnswer) {
            alert(`رمز دخولك السري هو: [ ${seller.password} ]`);
        } else if (answer !== null) {
            alert("إجابة سؤال الأمان خاطئة!");
        }
    });
}

function handleUploadProduct() {
    if (!currentSeller) return;

    const name = document.getElementById('prodName').value.trim();
    const price = document.getElementById('prodPrice').value.trim();
    const image = document.getElementById('prodImage').value.trim();

    if (!name || !price) {
        alert("يرجى كتابة اسم المنتج وتحديد السعر!");
        return;
    }

    database.ref('products').push().set({
        name: name,
        price: parseInt(price),
        image: image,
        sellerUsername: currentSeller
    }).then(() => {
        alert("تم النشر بنجاح!");
        document.getElementById('prodName').value = "";
        document.getElementById('prodPrice').value = "";
        document.getElementById('prodImage').value = "";
        showStoreFront();
    });
}

function addToCart(id, name) {
    alert(`تم إضافة "${name}" إلى سلة التسوق!`);
}

function logoutSeller() {
    currentSeller = null;
    switchView('sellerAuthView');
}

function showStoreFront() {
    window.history.pushState({}, document.title, window.location.pathname);
    loadStoreData();
    switchView('store');
}

function switchView(view) {
    document.getElementById('storeView').style.display = view === 'store' ? 'block' : 'none';
    document.getElementById('sellerAuthView').style.display = view === 'sellerAuthView' ? 'block' : 'none';
    document.getElementById('sellerDashboardView').style.display = view === 'sellerDashboardView' ? 'block' : 'none';
    document.getElementById('adminView').style.display = view === 'admin' ? 'block' : 'none';
}

// تفعيل الثلاث ضغطات السرية للوجو (مويد)
let clickCount = 0;
let clickTimer;
document.getElementById('mainLogo').addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);
    if (clickCount === 3) {
        clickCount = 0;
        const pass = prompt("بوابة التحكم العليا:\nالرجاء إدخال رمز المشرف:");
        if (pass === "1221") {
            alert("تم تفعيل صلاحيات المشرف!");
            switchView('admin');
        } else if (pass !== null) {
            alert("الرمز خاطئ!");
        }
        return;
    }
    clickTimer = setTimeout(() => { clickCount = 0; }, 500);
});

function updateAdminPanel() {
    const sellersListContainer = document.getElementById('adminSellersList');
    const productsListContainer = document.getElementById('adminProductsList');
    
    if (!sellersListContainer || !productsListContainer) return;

    sellersListContainer.innerHTML = "";
    if (allSellersOrdered.length === 0) {
        sellersListContainer.innerHTML = "<p style='color:#666;'>لا يوجد تجار مسجلين حالياً.</p>";
    } else {
        allSellersOrdered.forEach((seller, index) => {
            const item = document.createElement('div');
            item.style.cssText = "display:flex; justify-content:space-between; background:#16161f; padding:12px; margin-bottom:10px; border-radius:8px; align-items:center; border:1px solid #2a2a35;";
            
            let rankText = `[#${index + 1}]`;
            let badgeText = getSellerBadge(seller.username);

            item.innerHTML = `
                <div>
                    <span style="color:#ffcc00; font-weight:bold; margin-left:5px;">${rankText}</span>
                    <strong style="color:#fff;">${seller.storeName}</strong> 
                    <span style="color:#888; font-size:0.85rem;">(@${seller.username})</span>
                    ${badgeText}
                </div>
                <div>
                    <button onclick="togglePremiumSeller('${seller.username}', ${seller.isPremium})" style="background:#00b3ff; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold; margin-left:5px;">
                        ${seller.isPremium ? '<i class="fa-solid fa-circle-minus"></i> إلغاء التوثيق' : '<i class="fa-solid fa-circle-check"></i> توثيق الحساب'}
                    </button>
                    <button onclick="deleteSellerAccount('${seller.username}')" style="background:#ff3366; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold;"><i class="fa-solid fa-trash"></i> حذف</button>
                </div>
            `;
            sellersListContainer.appendChild(item);
        });
    }

    database.ref('products').once('value', (snapshot) => {
        productsListContainer.innerHTML = "";
        const data = snapshot.val();
        if (!data) {
            productsListContainer.innerHTML = "<p style='color:#666;'>لا توجد منتجات معروضة حالياً.</p>";
            return;
        }

        Object.keys(data).forEach(key => {
            const product = data[key];
            const item = document.createElement('div');
            item.style.cssText = "display:flex; justify-content:space-between; background:#16161f; padding:10px; margin-bottom:10px; border-radius:8px; align-items:center; border:1px solid #2a2a35;";
            item.innerHTML = `
                <span style="color:#fff;"><i class="fa-solid fa-box"></i> ${product.name} (${product.price} SDG) | التاجر: @${product.sellerUsername}</span>
                <button onclick="deleteProductAdmin('${key}')" style="background:#ff3366; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold;"><i class="fa-solid fa-trash"></i> حذف</button>
            `;
            productsListContainer.appendChild(item);
        });
    });
}

function togglePremiumSeller(username, currentStatus) {
    database.ref('sellers').child(username).update({ isPremium: !currentStatus }).then(() => alert("تم تحديث الرتبة!"));
}

function deleteSellerAccount(username) {
    if (confirm(`هل أنت متأكد من حذف الحساب [@${username}]؟`)) {
        database.ref('sellers').child(username).remove().then(() => alert("تم حذف الحساب."));
    }
}

function deleteProductAdmin(key) {
    if (confirm("هل تريد إزالة هذا المنتج؟")) {
        database.ref('products').child(key).remove().then(() => alert("تم حذف المنتج."));
    }
}
