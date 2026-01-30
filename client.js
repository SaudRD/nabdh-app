/**
 * Salla Social Proof Living Border - Client Script
 * This script injects the "Living Social Proof" effect onto Salla Add-to-Cart buttons.
 */

(function() {
    // Configuration
    const APP_URL = 'https://nabdh-live.onrender.com'; // Replace with your actual app URL
    const FETCH_INTERVAL = 3000; // Time between spawns
    
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

    // CSS Injection
    const injectStyles = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            .social-proof-wrapper {
                position: relative !important;
                display: inline-block !important;
                width: 100%;
            }
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
            .salla-social-pulse {
                animation: sallaHeartBeat 2s ease-in-out infinite !important;
                box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.4) !important;
            }
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
            }
            [dir="rtl"] .salla-activity-group { flex-direction: row-reverse; }
            .salla-avatar {
                width: 32px; height: 32px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                background-size: cover; background-position: center;
                flex-shrink: 0;
            }
            .salla-tooltip {
                background: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(8px);
                padding: 5px 12px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 5px 15px rgba(0,0,0,0.4);
                font-family: sans-serif;
            }
            @keyframes sallaHeartBeat {
                0% { transform: scale(1); }
                5% { transform: scale(1.03); }
                10% { transform: scale(1); }
                15% { transform: scale(1.02); }
                20% { transform: scale(1); }
            }
            @keyframes sallaSlideAcross {
                0% { opacity: 0; transform: translateX(80px) translateY(5px) scale(0.7); }
                15% { opacity: 1; transform: translateX(50px) translateY(0) scale(1); }
                50% { transform: translateX(0) translateY(-4px) scale(1); }
                85% { opacity: 1; transform: translateX(-50px) translateY(0) scale(1); }
                100% { opacity: 0; transform: translateX(-80px) translateY(5px) scale(0.7); }
            }
        `;
        document.head.appendChild(style);
    };

    // Main Logic
    const init = () => {
        injectStyles();
        
        // Salla Button Selectors
        const selectors = [
            '.salla-add-product-button',
            '.product-details__btn-add',
            'button[data-type="add_to_cart"]',
            '.btn-add-to-cart'
        ];

        let targetBtn = null;
        
        // Polling to find the button (it might be rendered late)
        const checkBtn = setInterval(() => {
            for (let selector of selectors) {
                targetBtn = document.querySelector(selector);
                if (targetBtn) break;
            }

            if (targetBtn && !targetBtn.dataset.socialProofInit) {
                clearInterval(checkBtn);
                enhanceButton(targetBtn);
            }
        }, 1000);
    };

    const enhanceButton = (btn) => {
        btn.dataset.socialProofInit = "true";
        btn.classList.add('salla-social-pulse');

        // Create Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'social-proof-wrapper';
        btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);

        // Create Living Layer
        const layer = document.createElement('div');
        layer.className = 'living-layer';
        wrapper.appendChild(layer);

        // Start Activity Loop
        startActivityLoop(layer, btn, wrapper);
    };

    const startActivityLoop = (layer, btn, wrapper) => {
        const spawn = async () => {
            let name, action, avatar;
            
            try {
                // Try fetching real data
                const response = await fetch(`${APP_URL}/notifications`);
                if (!response.ok) throw new Error();
                const data = await response.json();
                name = data.name;
                action = data.action;
                avatar = data.avatar;
            } catch (e) {
                // Fallback to random data
                const isAr = document.documentElement.dir === 'rtl';
                const lang = isAr ? 'ar' : 'en';
                name = FALLBACK_DATA[lang].names[Math.floor(Math.random() * FALLBACK_DATA[lang].names.length)];
                action = FALLBACK_DATA[lang].actions[Math.floor(Math.random() * FALLBACK_DATA[lang].actions.length)];
                avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
            }

            createNotification(layer, btn, wrapper, name, action, avatar);
            setTimeout(spawn, FETCH_INTERVAL + (Math.random() * 2000));
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

        const btnRect = btn.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Exact offsets from approved index.html
        const x = (btnRect.left - wrapperRect.left) + (btnRect.width / 2) - 80;
        const y = (btnRect.top - wrapperRect.top) - 35;

        group.style.left = `${x}px`;
        group.style.top = `${y}px`;
        
        layer.appendChild(group);
        setTimeout(() => group.remove(), 5000);
    };

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

