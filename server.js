const express = require('express');
const cors = require('cors');
const path = require('path');
const { JsonDB, Config } = require('node-json-db');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد قاعدة البيانات (ستنشئ ملفاً اسمه myDatabase.json)
const db = new JsonDB(new Config("myDatabase", true, false, '/'));

app.use(cors());
app.use(express.json());

// تهيئة البيانات الافتراضية إذا كانت قاعدة البيانات فارغة
(async () => {
    try {
        await db.getData("/settings");
    } catch(error) {
        await db.push("/settings", { color: "#22c55e", position: "top-left" });
    }
    try {
        await db.getData("/orders");
    } catch(error) {
        await db.push("/orders", []);
    }
})();

// --- 1. الويب هوك (حفظ الطلبات في قاعدة البيانات) ---
app.post('/webhook', async (req, res) => {
    console.log('--- 🔔 New Webhook ---');
    const payload = req.body;

    if (payload.event === 'order.created') {
        const customerName = payload.data?.customer?.first_name || "زائر";
        const productName = payload.data?.items?.[0]?.name || "منتج";
        
        const newNotification = {
            name: customerName,
            action: `اشترى ${productName}`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=random&color=fff`,
            timestamp: Date.now()
        };

        // حفظ الطلب في قاعدة البيانات
        await db.push("/orders[]", newNotification);
        
        // المحافظة على آخر 50 طلب فقط
        const allOrders = await db.getData("/orders");
        if (allOrders.length > 50) {
            // حذف الأقدم
            const recentOrders = allOrders.slice(-50);
            await db.push("/orders", recentOrders);
        }
        
        console.log(`💾 Saved to DB: ${customerName}`);
    }
    res.status(200).send({ success: true });
});

// --- 2. جلب الإشعارات للواجهة (من قاعدة البيانات) ---
app.get('/notifications', async (req, res) => {
    try {
        const orders = await db.getData("/orders");
        if (orders.length === 0) {
            // بيانات وهمية إذا ما فيه طلبات
            return res.json({ name: "زائر", action: "يتصفح المتجر", avatar: "https://randomuser.me/api/portraits/lego/1.jpg" });
        }
        // إرجاع طلب عشوائي من آخر 10
        const recent = orders.slice(-10);
        const randomOrder = recent[Math.floor(Math.random() * recent.length)];
        res.json(randomOrder);
    } catch (error) {
        res.json({ name: "Error", action: "No Data" });
    }
});

// --- 3. إعدادات التاجر (حفظ واسترجاع) ---
app.get('/settings', async (req, res) => {
    try {
        const settings = await db.getData("/settings");
        res.json(settings);
    } catch(e) {
        res.json({ color: "#22c55e", position: "top-left" });
    }
});

app.post('/settings', async (req, res) => {
    const { color, position } = req.body;
    await db.push("/settings", { color, position });
    console.log(`⚙️ Settings Updated: ${color}, ${position}`);
    res.json({ success: true });
});

app.get('/settings-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

// --- 4. ملف الجافاسكريبت ---
app.get('/client.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.js'));
});

app.listen(PORT, () => console.log(`✅ Server with DB Running on Port ${PORT}`));
