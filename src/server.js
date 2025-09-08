require('dotenv').config({ path: './src/variables.env' });
const express = require('express');
const fetch = require('node-fetch'); // or axios
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // security headers
const xss = require('xss'); // sanitize inputs

const app = express();
app.use(express.json());
app.use(helmet()); // adds security headers

// Rate limiter to prevent abuse
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // max 5 requests per IP per minute
    message: "Too many requests, please try again later."
});
app.use('/send-whatsapp', limiter);

// Helper: sanitize input
const sanitizeInput = (str) => str ? xss(str.trim()) : '';

// WhatsApp API endpoint
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const BUSINESS_NUMBER = process.env.BUSINESS_NUMBER;

// Endpoint to receive inquiry
app.post('/send-whatsapp', async (req, res) => {
    try {
        const {
            name, email, phone, destination,
            dates, travelers, accommodation, budget, comments
        } = req.body;

        // Basic validation
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Name, email, and phone are required.' });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        // Sanitize all inputs
        const sanitizedData = {
            name: sanitizeInput(name),
            email: sanitizeInput(email),
            phone: sanitizeInput(phone),
            destination: sanitizeInput(destination),
            dates: sanitizeInput(dates),
            travelers: sanitizeInput(travelers),
            accommodation: sanitizeInput(accommodation),
            budget: sanitizeInput(budget),
            comments: sanitizeInput(comments)
        };

        // Build WhatsApp message
        let message = `New Inquiry from Website:\n` +
            `Name: ${sanitizedData.name}\n` +
            `Email: ${sanitizedData.email}\n` +
            `Phone: ${sanitizedData.phone}\n`;

        if (sanitizedData.destination) message += `Destination: ${sanitizedData.destination}\n`;
        if (sanitizedData.dates) message += `Dates: ${sanitizedData.dates}\n`;
        if (sanitizedData.travelers) message += `Travelers: ${sanitizedData.travelers}\n`;
        if (sanitizedData.accommodation) message += `Accommodation: ${sanitizedData.accommodation}\n`;
        if (sanitizedData.budget) message += `Budget: ${sanitizedData.budget}\n`;
        if (sanitizedData.comments) message += `Comments: ${sanitizedData.comments}\n`;

        // Send message via WhatsApp Cloud API
        const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: BUSINESS_NUMBER,
                type: "text",
                text: { body: message }
            })
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ success: true, message: 'Inquiry sent successfully!' });
        } else {
            console.error('WhatsApp API error:', data);
            res.status(500).json({ error: 'Failed to send WhatsApp message' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
