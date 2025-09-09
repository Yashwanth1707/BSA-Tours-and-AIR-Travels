import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Allow requests from your frontend
app.use(cors({
  origin: "http://127.0.0.1:3000", // frontend URL
  methods: ["GET","POST"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(bodyParser.json());

// Your /send-whatsapp endpoint
app.post("/send-whatsapp", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const url = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: process.env.BUSINESS_NUMBER,
        type: "text",
        text: { body: message }
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
