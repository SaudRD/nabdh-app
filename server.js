const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SALLA_WEBHOOK_SECRET = process.env.SALLA_WEBHOOK_SECRET;

app.use(cors());
// حفظ النص الخام للتحقق من التوقيع
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

// 1. استقبال التنبيهات (Webhooks)
app.post('/webhook', (req, res) => {
    console.log('--- 🔔 Incoming Webhook ---');
    
    // التحقق الأمني (اختياري حالياً لتسهيل التجربة)
    if (SALLA_WEBHOOK_SECRET) {
        const signature = req.headers['x-salla-signature'];
        if (signature) {
            const hmac = crypto.createHmac('sha256', SALLA_WEBHOOK_SECRET);
            const digest = hmac.update(req.rawBody).digest('hex');
            if (signature !== digest) {
                console.log('⚠️ Signature mismatch (Ignored for debug)');
            }
        }
    }

    const payload = req.body;

    // تخزين عمليات الشراء الجديدة
    if (payload.event === 'order.created') {
        const customerName = payload.data?.customer?.first_name || "زائر";
        const productName = payload.data?.items?.[0]?.name || "منتج";
        
        const newNotification = {
            name: customerName,
            action: `اشترى ${productName}`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=random&color=fff`,
            timestamp: Date.now()
        };

        notificationsStore.unshift(newNotification);
        if (notificationsStore.length > 50) notificationsStore.pop();
        console.log(`💰 New Order: ${customerName}`);
    }

    // الرد دائماً بنجاح لسلة
    res.status(200).send({ success: true });
});

// 2. إعطاء البيانات للواجهة
app.get('/notifications', (req, res) => {
    const recentItems = notificationsStore.slice(0, 5);
    const randomItem = recentItems[Math.floor(Math.random() * recentItems.length)] || notificationsStore[0];
    res.json(randomItem);
});

// 3. تقديم ملف السكربت (مهم جداً)
app.get('/client.js', (req, res) => {
    const clientScriptPath = path.join(__dirname, 'client.js');
    if (fs.existsSync(clientScriptPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(clientScriptPath);
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(PORT, () => console.log(`✅ Server Running on Port ${PORT}`));
