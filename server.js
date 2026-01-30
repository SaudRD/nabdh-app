const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-Memory Database (Last 50 Purchases)
let notificationsStore = [
    { name: "سارة", action: "اشترت هذا المنتج", avatar: "https://randomuser.me/api/portraits/women/10.jpg" },
    { name: "Ahmed", action: "purchased this!", avatar: "https://randomuser.me/api/portraits/men/15.jpg" }
];

// Endpoint 1: Salla Webhook (order.created)
app.post('/webhook', (req, res) => {
    console.log('--- Incoming Salla Webhook ---');
    
    try {
        const payload = req.body;
        
        // Extracting data from Salla's typical webhook structure
        // Salla structure: payload.data.customer (name) and payload.data.items[0].name (product)
        const customerName = payload.data?.customer?.first_name || "Someone";
        const productName = payload.data?.items?.[0]?.name || "a product";
        
        // Create new notification
        const newNotification = {
            name: customerName,
            action: `bought ${productName}`,
            avatar: `https://avatar.iran.liara.run/username?username=${customerName}`, // Dynamic avatar fallback
            timestamp: Date.now()
        };

        // Add to the beginning and keep only last 50
        notificationsStore.unshift(newNotification);
        if (notificationsStore.length > 50) notificationsStore.pop();

        console.log(`Success: Registered purchase by ${customerName}`);
        res.status(200).send({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error.message);
        res.status(500).send({ success: false });
    }
});

// Endpoint 2: Serve Notifications
app.get('/notifications', (req, res) => {
    // Return a random entry from the most recent 5
    if (notificationsStore.length === 0) {
        return res.status(404).send({ error: "No data" });
    }

    const recentItems = notificationsStore.slice(0, 5);
    const randomItem = recentItems[Math.floor(Math.random() * recentItems.length)];
    
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

// Default Route
app.get('/', (req, res) => {
    res.send('Social Proof Server is Running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Social Proof Server Running on Port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`Script URL: http://localhost:${PORT}/client.js`);
    console.log(`========================================`);
});
