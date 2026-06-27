// الكود البرمجي الرئيسي لمنصة MLO Store

// التبديل بين واجهات المنصة المختلفة
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
            logoClickCount = 0; // إعادة التصفير
            openAdminModal();
            return;
        }
        
        // تصفير العداد إذا مر أكثر من 500 مللي ثانية بين النقرات
        logoTimer = setTimeout(() => { logoClickCount = 0; }, 500);
    });
}

// نافذة الدخول السرية للمشرف
function openAdminModal() {
    const password = prompt("🔐 نظام الأمان الحماية: أدخل الرمز السري للمشرف:");
    
    // كود المشرف الافتراضي الخاص بك
    if (password === "1221") {
        alert("✓ مرحباً بك يا مدير المنصة! تم الدخول بنجاح إلى لوحة التحكم.");
        // هنا سنقوم بربط لوحة تحكم الإدارة الكاملة لاحقاً
    } else if (password !== null) {
        alert("❌ الرمز السري خاطئ! ليس لديك صلاحية الوصول.");
    }
}

