/**
 * Salla Social Proof Living Border - Client Script
 * Updated: Green Color & Left Position
 */

(function() {
    // رابط السيرفر (تأكد أنه صحيح)
    const APP_URL = 'https://nabdh-live.onrender.com'; 
    const FETCH_INTERVAL = 3000; 
    
    // بيانات وهمية
    const FALLBACK_DATA = {
        en: { names: ["Sarah", "James", "Elena", "Marcus"], actions: ["bought this!", "just purchased", "added to cart"] },
        ar: { names: ["سارة", "أحمد", "ليلى", "عبدالله", "مريم"], actions: ["طلبت هذا المنتج!", "أضافت للسلة", "اشترى للتو", "ينصح به"] }
    };

    const AVATARS = [
        'https://randomuser.me/api/portraits/women/10.jpg', 'https://randomuser.me/api/portraits/men/15.jpg',
        'https://randomuser.me/api/portraits/women/44.jpg', 'https://randomuser.me/api/portraits/men/33.jpg'
    ];

    // --- حقن التصميم (CSS) ---
    const injectStyles = () => {
        if (document.getElementById('nabdh-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'nabdh-styles';
        style.innerHTML = `
            .social-proof-wrapper {
                position: relative !important;
                display: inline-block !important;
                width: 100% !important;
            }
            .living-layer {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                z-index: 9999;
                overflow: visible !important;
            }
            
            /* الأنيميشن للزر */
            .salla-social-pulse {
                animation: sallaHeartBeat 2s ease-in-out infinite !important;
                /* إضافة ظل أخضر خفيف */
                box-shadow: 0 0 15px rgba(34, 197, 94, 0.4) !important; 
            }

            .salla-activity-group {
                position: absolute;
                display: flex;
                align-items: center;
                gap: 8px;
                opacity: 0;
                will-change: transform, opacity;
                animation: sallaSlideUp 4s ease-in-out forwards;
                pointer-events: none;
                z-index: 10000;
                direction: ltr; 
            }
            [dir="rtl"] .salla-activity-group { flex-direction: row-reverse; }

            .salla-avatar {
                width: 34px; height: 34px;
                border-radius: 50%;
                border: 2px solid #ffffff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                background-size: cover; background-position: center;
                flex-shrink: 0;
                background-color: #eee;
            }

            .salla-tooltip {
                /* --- التعديل: اللون الأخضر --- */
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                white-space: nowrap;
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 5px 15px rgba(22, 163, 74, 0.3);
                font-family: inherit;
            }

            @keyframes sallaHeartBeat {
                0% { transform: scale(1); }
                5% { transform: scale(1.02); }
                10% { transform: scale(1); }
            }

            /* حركة ظهور ناعمة للأعلى */
            @keyframes sallaSlideUp {
                0% { opacity: 0; transform: translateY(10px); }
                15% { opacity: 1; transform: translateY(0); }
                85% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    };

    const init = () => {
        injectStyles();
        const selectors = ['button[product-type="product"]', '.s-button-element', '.s-button-btn', '.product-details__btn-add', '.salla-add-product-button'];
        let targetBtn = null;
        
        const checkBtn = setInterval(() => {
            for (let selector of selectors) {
                const found = document.querySelector(selector);
                if (found && found.offsetParent !== null) { 
                    targetBtn = found;
                    break;
                }
            }
            if (targetBtn && !targetBtn.dataset.socialProofInit) {
                clearInterval(checkBtn);
                enhanceButton(targetBtn);
            }
        }, 800);
        setTimeout(() => clearInterval(checkBtn), 10000);
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
        startActivityLoop(layer, btn, wrapper);
    };

    const startActivityLoop = (layer, btn, wrapper) => {
        const spawn = async () => {
            if (document.hidden) { setTimeout(spawn, FETCH_INTERVAL); return; }
            let name, action, avatar;
            try {
                const response = await fetch(`${APP_URL}/notifications`);
                if (!response.ok) throw new Error();
                const data = await response.json();
                name = data.name;
                action = data.action;
                avatar = data.avatar;
            } catch (e) {
                const isAr = document.documentElement.dir === 'rtl';
                const lang = isAr ? 'ar' : 'en';
                name = FALLBACK_DATA[lang].names[Math.floor(Math.random() * FALLBACK_DATA[lang].names.length)];
                action = FALLBACK_DATA[lang].actions[Math.floor(Math.random() * FALLBACK_DATA[lang].actions.length)];
                avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
            }
            createNotification(layer, btn, wrapper, name, action, avatar);
            setTimeout(spawn, FETCH_INTERVAL + (Math.random() * 3000));
        };
        spawn();
    };

    const createNotification = (layer, btn, wrapper, name, action, avatar) => {
        const group = document.createElement('div');
        group.className = 'salla-activity-group';
        group.innerHTML = `<div class="salla-avatar" style="background-image: url('${avatar}')"></div><div class="salla-tooltip"><strong>${name}</strong> ${action}</div>`;

        // --- التعديل: الموقع لليسار ---
        // في المواقع العربية (RTL)، الـ left هو جهة اليسار فعلياً للشاشة
        group.style.left = '0px'; 
        group.style.right = 'auto'; // إلغاء اليمين
        
        // رفع العنصر للأعلى ليكون فوق الزر تماماً
        group.style.top = '-55px'; 
        
        layer.appendChild(group);
        setTimeout(() => group.remove(), 4000);
    };

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
