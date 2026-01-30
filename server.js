const express = require('express');
const cors = require('cors');
const { JsonDB, Config } = require('node-json-db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد قاعدة البيانات
const db = new JsonDB(new Config("myDatabase", true, false, '/'));

app.use(cors());
app.use(express.json());

// الإعدادات الافتراضية
const DEFAULT_SETTINGS = { brand_color: "#22c55e", position: "top-left" };

// --- 1. الويب هوك (استقبال التغييرات من سلة) ---
app.post('/webhook', async (req, res) => {
    const payload = req.body;
    const event = payload.event;

    try {
        // أ) التاجر غير اللون في الإعدادات
        if (event === 'app.settings.updated') {
            const settings = payload.data.settings;
            console.log('🎨 Settings Updated:', settings);
            
            // حفظ الإعدادات
            await db.push("/settings", {
                brand_color: settings.brand_color || DEFAULT_SETTINGS.brand_color,
                position: settings.position || DEFAULT_SETTINGS.position
            });
        }

        // ب) طلب جديد (تسجيل الإشعار)
        else if (event === 'order.created') {
            const customerName = payload.data?.customer?.first_name || "زائر";
            const productName = payload.data?.items?.[0]?.name || "منتج";
            
            const newNotification = {
                name: customerName,
                action: `اشترى ${productName}`,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=random&color=fff`,
                timestamp: Date.now()
            };

            await db.push("/orders[]", newNotification);
            
            // تنظيف القديم (آخر 50 فقط)
            const allOrders = await db.getData("/orders");
            if (allOrders.length > 50) await db.push("/orders", allOrders.slice(-50));
        }

        res.status(200).send({ success: true });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send({ success: false });
    }
});

// --- 2. إرسال الإعدادات لملف الجافاسكريبت ---
app.get('/settings', async (req, res) => {
    try {
        const settings = await db.getData("/settings");
        res.json(settings);
    } catch (e) {
        res.json(DEFAULT_SETTINGS);
    }
});

// --- 3. إرسال الإشعارات ---
app.get('/notifications', async (req, res) => {
    try {
        const orders = await db.getData("/orders");
        if (orders.length === 0) throw new Error("Empty");
        const recent = orders.slice(-10);
        res.json(recent[Math.floor(Math.random() * recent.length)]);
    } catch (e) {
        res.json({ name: "زائر", action: "يتصفح المتجر", avatar: "https://randomuser.me/api/portraits/lego/1.jpg" });
    }
});

// --- 4. ملف العميل ---
app.get('/client.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.js'));
});

app.listen(PORT, () => console.log(`✅ Server Running on Port ${PORT}`));
