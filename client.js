(function() {
    const APP_URL = 'https://nabdh-live.onrender.com'; // ⚠️ تأكد من الرابط
    const FETCH_INTERVAL = 3000; 

    // جلب رقم المتجر
    const getStoreId = () => {
        try {
            if (window.salla && window.salla.config && window.salla.config.store && window.salla.config.store.id) return window.salla.config.store.id;
            if (window.salla && window.salla.config && typeof window.salla.config.get === 'function') return window.salla.config.get('store.id');
            if (window.CNfG && window.CNfG.store && window.CNfG.store.id) return window.CNfG.store.id;
            return null;
        } catch (e) { return null; }
    };

    const applyMerchantSettings = async () => {
        // حظر العمل في السلة تماماً
        if (window.location.href.includes('/cart')) return null;

        let storeId = getStoreId();
        if (!storeId) await new Promise(r => setTimeout(r, 1000));
        
        try {
            const res = await fetch(`${APP_URL}/settings?store_id=${storeId}`);
            return await res.json();
        } catch (e) {
            return { brand_color: '#22c55e', position: 'top-left' };
        }
    };

    const injectStyles = (settings) => {
        if (!settings || document.getElementById('nabdh-styles')) return;

        let positionStyle = 'left: 0; top: -55px;'; // الافتراضي (فوق الزر يسار)
        
        // تعديل مكان التنبيه بناءً على الإعدادات
        if (settings.position === 'top-right') positionStyle = 'right: 0; left: auto; top: -55px;';
        else if (settings.position === 'bottom-center') positionStyle = 'left: 50%; transform: translateX(-50%); top: 110%; bottom: auto;';

        const style = document.createElement('style');
        style.id = 'nabdh-styles';
        style.innerHTML = `
            /* نخفي التنبيهات في الأماكن غير المرغوبة (مثل كروت المنتجات الصغيرة) */
            .s-product-card-content .social-proof-wrapper,
            .cart-item .social-proof-wrapper { display: none !important; }

            /* تنسيق الحاوية لتأخذ مساحة الزر كاملة */
            .social-proof-wrapper { 
                position: relative !important; 
                display: block !important; 
                width: 100% !important; 
            }
            
            /* الطبقة العائمة للتنبيهات */
            .living-layer { 
                position: absolute; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                pointer-events: none; 
                z-index: 9999; 
            }
            
            /* نبض الزر */
            .salla-social-pulse {
                animation: sallaHeartBeat 2s ease-in-out infinite !important;
                box-shadow: 0 0 15px ${settings.brand_color || '#22c55e'}66 !important;
            }

            /* مجموعة التنبيه (الصورة والنص) */
            .salla-activity-group {
                position: absolute; 
                display: flex; 
                align-items: center; 
                gap: 8px;
                opacity: 0; 
                animation: sallaSlideUp 4s ease-in-out forwards;
                pointer-events: none; 
                z-index: 10000; 
                direction: ltr;
                ${positionStyle} /* تطبيق المكان */
            }
            
            /* دعم اللغة العربية */
            [dir="rtl"] .salla-activity-group { flex-direction: row-reverse; }

            /* شكل التنبيه */
            .salla-tooltip {
                background: ${settings.brand_color || '#22c55e'};
                padding: 6px 14px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: bold;
                color: #fff; 
                border: 1px solid rgba(255,255,255,0.3);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2); 
                font-family: inherit; 
                white-space: nowrap;
            }
            
            /* صورة المشتري */
            .salla-avatar { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #fff; background-size: cover; background-color: #eee; flex-shrink: 0; }
            
            @keyframes sallaHeartBeat { 0% { transform: scale(1); } 5% { transform: scale(1.02); } 10% { transform: scale(1); } }
            @keyframes sallaSlideUp { 0% { opacity: 0; transform: translateY(10px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }
        `;
        document.head.appendChild(style);
    };

    const init = async () => {
        setTimeout(async () => {
            const settings = await applyMerchantSettings();
            if (!settings) return; // توقف إذا كنا في السلة
            injectStyles(settings);

            // 🎯 قائمة الأهداف: نبحث عن الزر في المكانين (الصفحة الرئيسية للمنتج + البار الثابت)
            const targetSelectors = [
                // 1. الزر داخل البار الثابت (الكود اللي أرسلته لي)
                '.sticky-product-bar salla-add-product-button .s-button-element',
                // 2. الزر الرئيسي في صفحة تفاصيل المنتج العادية
                '.product-details salla-add-product-button .s-button-element',
                '.s-product-info-wrapper salla-add-product-button .s-button-element' 
            ];

            const checkBtn = setInterval(() => {
                let targetBtn = null;

                // ندور في الأماكن المحددة فقط
                for (let selector of targetSelectors) {
                    const btn = document.querySelector(selector);
                    // نتأكد أننا ما اخترنا زر داخل كرت منتج صغير بالغلط
                    if (btn && !btn.closest('.s-product-card-content') && !btn.dataset.socialProofInit) {
                        targetBtn = btn;
                        break; 
                    }
                }

                if (targetBtn) {
                    // لا توقف البحث فوراً، لأن البار الثابت قد يظهر لاحقاً
                    // لكن تأكد أننا ما نكرر العمل على نفس الزر
                    enhanceButton(targetBtn);
                }
            }, 1000);
            
            // نوقف البحث بعد 15 ثانية (وقت كافي لظهور البار الثابت)
            setTimeout(() => clearInterval(checkBtn), 15000);
        }, 1000);
    };

    const enhanceButton = (btn) => {
        if (btn.dataset.socialProofInit) return; // حماية من التكرار
        btn.dataset.socialProofInit = "true";
        
        btn.classList.add('salla-social-pulse');
        
        // إنشاء الغلاف حول الزر
        const wrapper = document.createElement('div');
        wrapper.className = 'social-proof-wrapper';
        
        // نقل الزر داخل الغلاف بحذر
        btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);
        
        // إضافة طبقة التنبيهات
        const layer = document.createElement('div');
        layer.className = 'living-layer';
        wrapper.appendChild(layer);
        
        startActivityLoop(layer);
    };

    const startActivityLoop = (layer) => {
        const spawn = async () => {
            if (document.hidden) { setTimeout(spawn, FETCH_INTERVAL); return; }
            try {
                const response = await fetch(`${APP_URL}/notifications`);
                const data = await response.json();
                createNotification(layer, data.name, data.action, data.avatar);
            } catch (e) {}
            setTimeout(spawn, FETCH_INTERVAL + (Math.random() * 3000));
        };
        spawn();
    };

    const createNotification = (layer, name, action, avatar) => {
        const group = document.createElement('div');
        group.className = 'salla-activity-group';
        group.innerHTML = `<div class="salla-avatar" style="background-image: url('${avatar}')"></div><div class="salla-tooltip"><strong>${name}</strong> ${action}</div>`;
        layer.appendChild(group);
        setTimeout(() => group.remove(), 4000);
    };

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
