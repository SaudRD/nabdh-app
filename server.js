const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); // تأكد من وجود هذا السطر
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// --- إعدادات الأمان (قراءة المفاتيح من Render) ---
const SALLA_WEBHOOK_SECRET = process.env.SALLA_WEBHOOK_SECRET;
const SALLA_CLIENT_ID = process.env.SALLA_CLIENT_ID;

// التحقق من وجود المفاتيح
if (!SALLA_WEBHOOK_SECRET) {
    console.warn("⚠️ تحذير: لم يتم العثور على SALLA_WEBHOOK_SECRET في متغيرات البيئة.");
}

// Middleware
app.use(cors());

// ميزة خاصة للتحقق من التوقيع (Signature Verification)
// نحتاج "النص الخام" (Raw Body) للتأكد أن الرسالة لم يتم التلاعب بها
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

// قاعدة بيانات مؤقتة
let notificationsStore = [
    { name: "سارة", action: "اشترت هذا المنتج", avatar: "https://randomuser.me/api/portraits/women/10.jpg" },
    { name: "Ahmed", action: "purchased this!", avatar: "https://randomuser.me/api/portraits/men/15.jpg" }
];

// --- Endpoint 1: استقبال التنبيهات من سلة ---
app.post('/webhook', async (req, res) => {
    console.log('--- 🔔 Incoming Salla Webhook ---');
    
    // 1. التحقق الأمني (هل الرسالة فعلاً من سلة؟)
    if (SALLA_WEBHOOK_SECRET) {
        const signature = req.headers['x-salla-signature'];
        if (signature) {
            const hmac = crypto.createHmac('sha256', SALLA_WEBHOOK_SECRET);
            const digest = hmac.update(req.rawBody).digest('hex');
            if (signature !== digest) {
                console.error('⛔ Security Alert: Invalid Signature! Request rejected.');
                return res.status(401).send({ error: 'Invalid Signature' });
            }
            console.log('✅ Security Check: Passed');
        }
    }

    const payload = req.body;
    
    try {
        // أ) حدث تثبيت التطبيق (الحقن التلقائي)
        if (payload.event === 'app.store.authorize') {
            console.log('🎉 Merchant Authorized App! Starting Injection...');
            const token = payload.data.access_token;
            
            // حقن السكربت تلقائياً
            // نستخدم رابط السيرفر الحالي ديناميكياً
            const myServerUrl = `https://${req.get('host')}`; 
            
            await axios.post('https://api.salla.dev/admin/v2/merchant/scripts', {
                name: "Nabdh Living Border",
                src: `${myServerUrl}/client.js`,
                event: "on_load",
                load_method: "defer"
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('🚀 Script Injected Successfully into Merchant Store!');
        }

        // ب) حدث طلب جديد (تحديث الإشعارات)
        else if (payload.event === 'order.created') {
            const customerName = payload.data?.customer?.first_name || "زائر";
            const productName = payload.data?.items?.[0]?.name || "منتج مميز";
            
            const newNotification = {
                name: customerName,
                action: `اشترى ${productName}`,
                // نستخدم صورة رمزية ملونة بناءً على الاسم
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=random&color=fff`,
                timestamp: Date.now()
            };

            notificationsStore.unshift(newNotification);
            if (notificationsStore.length > 50) notificationsStore.pop();
            console.log(`💰 New Order: ${customerName} bought ${productName}`);
        }
        
        // ج) أحداث أخرى (مثل حذف التطبيق)
        else if (payload.event === 'app.uninstalled') {
            console.log('💔 App Uninstalled by merchant.');
            // هنا يمكنك حذف بيانات التاجر مستقبلاً
        }

        res.status(200).send({ success: true });
    } catch (error) {
        // طباعة تفاصيل الخطأ في حال فشل الحقن
        console.error('❌ Error processing webhook:', error.response?.data || error.message);
        res.status(500).send({ success: false });
    }
});

// --- Endpoint 2: إرسال البيانات للواجهة ---
app.get('/notifications', (req, res) => {
    // إرجاع إشعار عشوائي من آخر 5 طلبات
    if (notificationsStore.length === 0) {
        return res.json({
            name: "زائر", 
            action: "يتصفح المتجر الآن", 
            avatar: "https://randomuser.me/api/portraits/lego/1.jpg"
        });
    }
    const recentItems = notificationsStore.slice(0, 5);
    const randomItem = recentItems[Math.floor(Math.random() * recentItems.length)];
    res.json(randomItem);
});

// --- Endpoint 3: ملف الجافاسكريبت ---
app.get('/client.js', (req, res) => {
    const clientScriptPath = path.join(__dirname, 'client.js');
    if (fs.existsSync(clientScriptPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(clientScriptPath);
    } else {
        res.status(404).send('client.js not found');
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🛡️  Secure Server Running on Port ${PORT}`);
    console.log(`🔐 Webhook Secret Status: ${SALLA_WEBHOOK_SECRET ? 'Loaded ✅' : 'Missing ⚠️'}`);
    console.log(`========================================`);
});
