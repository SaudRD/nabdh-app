const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // تأكد أنك مثبت هذه المكتبة

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// قاعدة بيانات مؤقتة
let notificationsStore = [
    { name: "سارة", action: "اشترت هذا المنتج", avatar: "https://randomuser.me/api/portraits/women/10.jpg" },
    { name: "Ahmed", action: "purchased this!", avatar: "https://randomuser.me/api/portraits/men/15.jpg" }
];

// Endpoint 1: Salla Webhook
app.post('/webhook', async (req, res) => {
    console.log('--- Incoming Salla Webhook ---');
    const payload = req.body;
    
    try {
        // 1. حدث تثبيت التطبيق (الحقن التلقائي)
        if (payload.event === 'app.store.authorize') {
            console.log('Merchant Authorized App! Injecting Script...');
            const token = payload.data.access_token;
            
            // حقن السكربت في متجر التاجر عبر API سلة
            await axios.post('https://api.salla.dev/admin/v2/merchant/scripts', {
                name: "Nabdh Living Border",
                src: "https://nabdh-live.onrender.com/client.js", // رابط السكربت حقك
                event: "on_load",
                load_method: "defer"
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Script Injected Successfully!');
        }

        // 2. حدث طلب جديد (تحديث الإشعارات)
        else if (payload.event === 'order.created') {
            const customerName = payload.data?.customer?.first_name || "زائر";
            const productName = payload.data?.items?.[0]?.name || "منتج مميز";
            
            const newNotification = {
                name: customerName,
                action: `اشترى ${productName}`,
                avatar: `https://ui-avatars.com/api/?name=${customerName}&background=random`,
                timestamp: Date.now()
            };

            notificationsStore.unshift(newNotification);
            if (notificationsStore.length > 50) notificationsStore.pop();
            console.log(`Notification Added: ${customerName}`);
        }

        res.status(200).send({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error.response?.data || error.message);
        res.status(500).send({ success: false });
    }
});

// Endpoint 2: Serve Notifications
app.get('/notifications', (req, res) => {
    if (notificationsStore.length === 0) return res.json({name: "زائر", action: "يتصفح المتجر"});
    const randomItem = notificationsStore[Math.floor(Math.random() * Math.min(5, notificationsStore.length))];
    res.json(randomItem);
});

// Endpoint 3: Serve client.js
app.get('/client.js', (req, res) => {
    const clientScriptPath = path.join(__dirname, 'client.js');
    if (fs.existsSync(clientScriptPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(clientScriptPath);
    } else {
        res.status(404).send('client.js not found');
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
