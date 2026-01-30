/**
 * Salla Social Proof Living Border - Client Script
 * This script injects the "Living Social Proof" effect onto Salla Add-to-Cart buttons.
 */

(function() {
    // --- إعدادات الرابط ---
    // تأكد أن هذا الرابط هو رابط سيرفرك في Render بدون شرطة في الأخير
    const APP_URL = 'https://nabdh-live.onrender.com'; 
    const FETCH_INTERVAL = 3000; 
    
    // --- بيانات وهمية (احتياطية) ---
    const FALLBACK_DATA = {
        en: {
            names: ["Sarah", "James", "Elena", "Marcus", "Aisha", "Liam", "Sophia", "David"],
            actions: ["bought this!", "just purchased", "added to cart", "is viewing", "highly recommends"],
        },
        ar: {
            names: ["سارة", "أحمد", "ليلى", "عبدالله", "مريم", "ياسين", "نورة", "خالد"],
            actions: ["قام بالشراء!", "أضاف للسلة", "يتصفح الآن", "اشترى للتو", "أعجبه المتج"],
        }
    };

    const AVATARS = [
        'https://randomuser.me/api/portraits/women/10.jpg', 'https://randomuser.me/api/portraits/men/15.jpg',
        'https://randomuser.me/api/portraits/women/22.jpg', 'https://randomuser.me/api/portraits/men/33.jpg',
        'https://randomuser.me/api/portraits/women/44.jpg', 'https://randomuser.me/api/portraits/men/55.jpg',
        'https://randomuser.me/api/portraits/women/66.jpg', 'https://randomuser.me/api/portraits/men/77.jpg'
    ];

    // --- حقن التصميم (CSS) ---
    const injectStyles = () => {
        if (document.getElementById('nabdh-styles')) return; // منع التكرار
        
        const style = document.createElement('style');
        style.id = 'nabdh-styles';
        style.innerHTML = `
            /* الحاوية الرئيسية */
            .social-proof-wrapper {
                position: relative !important;
                display: inline-block !important;
                width: 100% !important; /* لضمان أن الزر يأخذ راحته */
            }
            
            /* الطبقة العائمة */
            .living-layer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
                overflow: visible !important;
            }

            /* تأثير النبض للزر */
            .salla-social-pulse {
                animation: sallaHeartBeat 2s ease-in-out infinite !important;
                position: relative;
                z-index: 2; /* ليكون فوق الخلفية */
            }

            /* مجموعة الإشعار (الصورة + النص) */
            .salla-activity-group {
                position: absolute;
                display: flex;
                align-items: center;
                gap: 8px;
                opacity: 0;
                will-change: transform, opacity;
                animation: sallaSlideAcross 4.8s ease-in-out forwards;
                pointer-events: none;
                z-index: 10000;
                direction: ltr; /* لضمان ترتيب الصورة والنص */
            }
            
            /* دعم العربية */
            [dir="rtl"] .salla-activity-group { 
                flex-direction: row-reverse; 
            }

            .salla-avatar {
                width: 32px; height: 32px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                background-size: cover; background-position: center;
                flex-shrink: 0;
                background-color: #eee;
            }

            .salla-tooltip {
                background: rgba(15, 23, 42, 0.90);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: normal;
                white-space: nowrap;
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                font-family: inherit;
            }

            @keyframes sallaHeartBeat {
                0% { transform: scale(1); }
                5% { transform: scale(1.02); }
                10% { transform: scale(1); }
                15% { transform: scale(1.01); }
                20% { transform: scale(1); }
            }

            @keyframes sallaSlideAcross {
                0% { opacity: 0; transform: translateY(10px) scale(0.8); }
                10% { opacity: 1; transform: translateY(0) scale(1); }
                80% { opacity: 1; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-10px) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    };

    // --- المنطق الرئيسي ---
    const init = () => {
        injectStyles();
        
        // هنا السر! أضفنا الكلاسات الخاصة بقالبك
        const selectors = [
            'button[product-type="product"]',   // أقوى احتمال لقالبك
            '.s-button-element',                // الكلاس اللي طلعته أنت
            '.s-button-btn',
            '.product-details__btn-add',
            '.salla-add-product-button'
        ];

        let targetBtn = null;
        
        // محاولة البحث عن الزر كل ثانية (لأن سلة أحياناً تتأخر في تحميل الزر)
        const checkBtn = setInterval(() => {
            for (let selector of selectors) {
                // نبحث عن زر يكون "ظاهر" وليس مخفياً
                const found = document.querySelector(selector);
                if (found && found.offsetParent !== null) { 
                    targetBtn = found;
                    break;
                }
            }

            if (targetBtn && !targetBtn.dataset.socialProofInit) {
                clearInterval(checkBtn);
                console.log("✅ Nabdh: Button Found!", targetBtn); // عشان تشوف في الكونسول
                enhanceButton(targetBtn);
            }
        }, 800);
        
        // إيقاف البحث بعد 10 ثواني لتوفير الموارد
        setTimeout(() => clearInterval(checkBtn), 10000);
    };

    const enhanceButton = (btn) => {
        btn.dataset.socialProofInit = "true";
        btn.classList.add('salla-social-pulse');

        // إنشاء الحاوية حول الزر الموجود
        const wrapper = document.createElement('div');
        wrapper.className = 'social-proof-wrapper';
        
        // حيلة لنقل الزر داخل الحاوية دون كسر التصميم
        btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);

        // إنشاء طبقة الفقاعات
        const layer = document.createElement('div');
        layer.className = 'living-layer';
        wrapper.appendChild(layer);

        // بدء الحلقة
        startActivityLoop(layer, btn, wrapper);
    };

    const startActivityLoop = (layer, btn, wrapper) => {
        const spawn = async () => {
            // نتحقق إذا المستخدم فاتح الصفحة ولا لا (عشان الأداء)
            if (document.hidden) {
                setTimeout(spawn, FETCH_INTERVAL);
                return;
            }

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
        
        group.innerHTML = `
            <div class="salla-avatar" style="background-image: url('${avatar}')"></div>
            <div class="salla-tooltip"><strong>${name}</strong> ${action}</div>
        `;

        // حساب الموقع: فوق الزر في المنتصف
        const btnRect = btn.getBoundingClientRect();
        
        // تعديل المواقع ليكون فوق الزر مباشرة
        // نستخدم النسبة المئوية لضمان التوافق مع الجوال
        group.style.left = '50%';
        group.style.top = '-50px'; 
        group.style.transform = 'translateX(-50%)'; // لتوسيط العنصر
        
        // في الكود القديم كنا نحسب بالبكسل، هنا بسطناها عشان تشتغل مع كل القوالب
        
        layer.appendChild(group);
        
        // حذف العنصر بعد انتهاء الانيميشن
        setTimeout(() => group.remove(), 5000);
    };

    // التشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
