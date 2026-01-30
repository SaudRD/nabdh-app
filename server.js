const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. الاتصال بقاعدة البيانات ---
// نستخدم متغير بيئة للرابط عشان الأمان
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- 2. تصميم شكل البيانات (Schemas) ---
// جدول الإعدادات
const SettingsSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true }, // رقم التاجر هو المفتاح
  brand_color: { type: String, default: "#22c55e" },
  position: { type: String, default: "top-left" }
});
const Settings = mongoose.model('Settings', SettingsSchema);

// جدول الطلبات (سنحفظ آخر الطلبات)
const OrderSchema = new mongoose.Schema({
  merchantId: String,
  name: String,
  action: String,
  avatar: String,
  timestamp: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

app.use(cors());
app.use(express.json());

const DEFAULT_SETTINGS = { brand_color: "#22c55e", position: "top-left" };

// --- 3. الويب هوك (Webhook) ---
app.post('/webhook', async (req, res) => {
    const payload = req.body;
    const event = payload.event;
    const merchantId = payload.merchant; // رقم التاجر من سلة

    try {
        // أ) تحديث الإعدادات
        if (event === 'app.settings.updated') {
            const newSettings = payload.data.settings;
            console.log(`🎨 Settings Update for Merchant: ${merchantId}`);
            
            // "Upsert": حدث البيانات لو موجودة، أو أنشئ جديدة لو غير موجودة
            await Settings.findOneAndUpdate(
                { merchantId: merchantId },
                { 
                  brand_color: newSettings.brand_color,
                  position: newSettings.position
                },
                { upsert: true, new: true }
            );
        }

        // ب) طلب جديد
        else if (event === 'order.created') {
            const customerName = payload.data?.customer?.first_name || "زائر";
            const productName = payload.data?.items?.[0]?.name || "منتج";
            
            // حفظ الطلب في قاعدة البيانات
            await Order.create({
                merchantId: merchantId,
                name: customerName,
                action: `اشترى ${productName}`,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=random&color=fff`
            });

            // (اختياري) تنظيف الطلبات القديمة لتقليل المساحة
            // نحذف ما زاد عن أحدث 50 طلب لهذا التاجر
            const count = await Order.countDocuments({ merchantId });
            if (count > 50) {
                const oldOrders = await Order.find({ merchantId }).sort({ timestamp: 1 }).limit(count - 50);
                await Order.deleteMany({ _id: { $in: oldOrders.map(o => o._id) } });
            }
        }

        res.status(200).send({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ success: false });
    }
});

// --- 4. API للإعدادات والواجهة ---
app.get('/settings', async (req, res) => {
    const storeId = req.query.store_id;
    if (!storeId) return res.json(DEFAULT_SETTINGS);

    try {
        const settings = await Settings.findOne({ merchantId: storeId });
        res.json(settings || DEFAULT_SETTINGS);
    } catch (e) {
        res.json(DEFAULT_SETTINGS);
    }
});

app.get('/notifications', async (req, res) => {
    // يمكننا مستقبلاً تصفية الإشعارات حسب التاجر
    // const storeId = req.query.store_id; 
    
    try {
        // جلب أحدث 10 طلبات بشكل عام (للعرض)
        // أو يمكنك جعلها خاصة بكل تاجر إذا مررت store_id من الواجهة
        const recentOrders = await Order.find().sort({ timestamp: -1 }).limit(10);
        
        if (recentOrders.length === 0) throw new Error("Empty");
        
        const randomOrder = recentOrders[Math.floor(Math.random() * recentOrders.length)];
        res.json(randomOrder);
    } catch (e) {
        res.json({ name: "زائر", action: "يتصفح المتجر", avatar: "https://randomuser.me/api/portraits/lego/1.jpg" });
    }
});

app.get('/client.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.js'));
});

app.listen(PORT, () => console.log(`✅ Server Running on Port ${PORT}`));
