import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import nodemailer from "nodemailer";


dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());



// Allow requests from your frontend
// List of allowed origins
const allowedOrigins = [
  "https://bsaairtravels.vercel.app",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

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





// Email API route
app.post("/send-email", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      destination,
      dates,
      travelers,
      accommodation,
      budget,
      message
    } = req.body;

    // Configure transporter (Gmail example, you can replace with SMTP)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail
        pass: process.env.EMAIL_PASS  // App password
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "yashwanthgunam@gmail.com", // Where you want to receive inquiries
      subject: "New Travel Inquiry",
      text: ` ${message ? ` ${message}` : ''}
       Regards,
       Bot`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});


const PORT = process.env.PORT || 5500;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));