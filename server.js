require('dotenv').config({ path: './src/variables.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch'); // for Node <18

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Rate limiter
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: 'Too many requests, please try again later.'
});
app.use('/send-whatsapp', limiter);

// Env vars
const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, BUSINESS_NUMBER, PORT } = process.env;

// WhatsApp send endpoint
app.post('/send-whatsapp', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        console.log("📩 Custom message received:", message);

        // Send to WhatsApp Cloud API
        const waResponse = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: BUSINESS_NUMBER, // your target number
                type: 'text',
                text: { body: message }
            })
        });

        const waData = await waResponse.json();

        if (waResponse.ok) {
            console.log("✅ WhatsApp API response:", waData);
            res.json({ success: true, message: 'WhatsApp message sent!', response: waData });
        } else {
            console.error("❌ WhatsApp API error:", waData);
            res.status(500).json({ error: 'Failed to send WhatsApp message', details: waData });
        }
    } catch (err) {
        console.error("🔥 Internal error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT || 5500, () => {
    console.log(`🚀 Server running on port ${PORT || 5500}`);
});
