(function() {
    const APP_URL = 'https://nabdh-live.onrender.com'; // ⚠️ تأكد أن الرابط هو رابطك في Render
    const FETCH_INTERVAL = 3000; 

    // 1. دالة البحث عن هوية المتجر
    const getStoreId = () => {
        try {
            if (window.salla && window.salla.config && window.salla.config.store && window.salla.config.store.id) return window.salla.config.store.id;
            if (window.salla && window.salla.config && typeof window.salla.config.get === 'function') return window.salla.config.get('store.id');
            if (window.CNfG && window.CNfG.store && window.CNfG.store.id) return window.CNfG.store.id;
            return null;
        } catch (e) { return null; }
    };

    // 2. جلب الإعدادات من السيرفر
    const applyMerchantSettings = async () => {
        let storeId = getStoreId();
        if (!storeId) {
            await new Promise(r => setTimeout(r, 1000)); // انتظار بسيط
            storeId = getStoreId();
        }
        
        // ⛔️ حظر العمل في صفحة السلة تماماً
        if (window.location.href.includes('/cart')) {
            return null;
        }

        try {
            const res = await fetch(`${APP_URL}/settings?store_id=${storeId}`);
            return await res.json();
        } catch (e) {
            return { brand_color: '#22c55e', position: 'top-left' };
        }
    };

    // 3. حقن التصاميم
    const injectStyles = (settings) => {
        if (!settings || document.getElementById('nabdh-styles')) return;

        let positionStyle = 'left: 0; top: -55px;';
        if (settings.position === 'top-right') positionStyle = 'right: 0; left: auto; top: -55px;';
        else if (settings.position === 'bottom-center') positionStyle = 'left: 50%; transform: translateX(-50%); top: 110%; bottom: auto;';

        const style = document.createElement('style');
        style.id = 'nabdh-styles';
        style.innerHTML = `
            /* إخفاء إجباري لأي تنبيه يظهر بالخطأ داخل كروت المنتجات */
            .s-product-card-content .social-proof-wrapper,
            .s-product-card-content-footer .social-proof-wrapper { display: none !important; }

            .social-proof-wrapper { position: relative !important; display: inline-block !important; width: 100% !important; }
            .living-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; }
            
            .salla-social-pulse {
                animation: sallaHeartBeat 2s ease-in-out infinite !important;
                box-shadow: 0 0 15px ${settings.brand_color || '#22c55e'}66 !important;
            }

            .salla-activity-group {
                position: absolute; display: flex; align-items: center; gap: 8px;
                opacity: 0; animation: sallaSlideUp 4s ease-in-out forwards;
                pointer-events: none; z-index: 10000; direction: ltr;
                ${positionStyle}
            }
            [dir="rtl"] .salla-activity-group { flex-direction: row-reverse; }

            .salla-tooltip {
                background: ${settings.brand_color || '#22c55e'};
                padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold;
                color: #fff; border: 1px solid rgba(255,255,255,0.3);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2); font-family: inherit; white-space: nowrap;
            }
            .salla-avatar { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #fff; background-size: cover; background-color: #eee; flex-shrink: 0; }
            
            @keyframes sallaHeartBeat { 0% { transform: scale(1); } 5% { transform: scale(1.02); } 10% { transform: scale(1); } }
            @keyframes sallaSlideUp { 0% { opacity: 0; transform: translateY(10px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }
        `;
        document.head.appendChild(style);
    };

    // 4. التشغيل والبحث عن الزر الصحيح
    const init = async () => {
        setTimeout(async () => {
            const settings = await applyMerchantSettings();
            if (!settings) return; // توقف إذا كنا في السلة
            injectStyles(settings);

            const checkBtn = setInterval(() => {
                // نبحث عن كل الأزرار المحتملة
                const potentialButtons = document.querySelectorAll('salla-add-product-button button, .s-button-element');

                potentialButtons.forEach(btn => {
                    // ⛔️ فلتر 1: هل الزر داخل كرت منتج صغير؟ (هذا هو الحل لمشكلتك)
                    const isInsideCard = btn.closest('.s-product-card-content') || 
                                         btn.closest('.s-product-card-content-footer') ||
                                         btn.closest('.product-entry'); // لبعض الثيمات الأخرى

                    // ⛔️ فلتر 2: هل الزر داخل السلة؟
                    const isInCart = btn.closest('.cart-item') || btn.closest('salla-cart-summary');

                    // ⛔️ فلتر 3: هل هو زر حذف؟
                    const isDeleteBtn = btn.classList.contains('btn--delete') || btn.getAttribute('color') === 'danger';

                    // ✅ الشرط الذهبي: إذا لم يكن في كرت، ولم يكن في سلة، ولم يكن زر حذف.. إذن هو الزر الرئيسي!
                    if (!isInsideCard && !isInCart && !isDeleteBtn && !btn.dataset.socialProofInit) {
                        // تأكد أن الزر كبير وواضح (اختياري)
                        // غالباً الزر الرئيسي يكون عرضه wide
                        enhanceButton(btn);
                    }
                });

            }, 1000);
            
            // نوقف البحث بعد 10 ثواني لتوفير الموارد
            setTimeout(() => clearInterval(checkBtn), 10000);
        }, 1000);
    };

    const enhanceButton = (btn) => {
        btn.dataset.socialProofInit = "true";
        btn.classList.add('salla-social-pulse');
        const wrapper = document.createElement('div');
        wrapper.className = 'social-proof-wrapper';
        
        btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);
        
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
