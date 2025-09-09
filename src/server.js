require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // or axios
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const BUSINESS_NUMBER = process.env.BUSINESS_NUMBER;

app.post('/send-whatsapp', async (req, res) => {
    try {
        const { message } = req.body;
        console.log("inside server.js");
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: BUSINESS_NUMBER,
                type: 'text',
                text: { body: message }
            })
        });

        const data = await response.json();
        if (response.ok) res.json({ success: true });
        else res.status(500).json({ error: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
