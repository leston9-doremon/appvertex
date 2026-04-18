const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

// Sanitize input
const sanitize = (str) => String(str || "").replace(/<[^>]*>/g, "").trim();

/**
 * Contact Form Handler
 * Replaces the old /api/contact Express route
 */
exports.contact = functions.https.onRequest(async (req, res) => {
  // Fix CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const safeName = sanitize(name);
  const safeEmail = sanitize(email);
  const safeMessage = sanitize(message);

  const RESEND_API_KEY = functions.config().resend.key;
  const CONTACT_RECEIVER = functions.config().contact.receiver || "info@appvertex.in";

  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in functions config");
    res.status(500).json({ error: "Email service misconfigured" });
    return;
  }

  try {
    // Send email to owner
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AppVerteX <info@appvertex.in>",
        to: [CONTACT_RECEIVER],
        subject: `New message from ${safeName}`,
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong><br>${safeMessage}</p>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Resend API error");
    }

    // Auto-reply to sender
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AppVerteX <info@appvertex.in>",
        to: [safeEmail],
        subject: `Thanks for reaching out, ${safeName}!`,
        html: `
          <p>Hi ${safeName},</p>
          <p>Thanks for contacting us! We've received your message and will get back to you shortly.</p>
          <br/>
          <p>— The AppVerteX Team</p>
        `,
      }),
    });

    res.json({ success: true, message: "Message sent!" });
  } catch (err) {
    console.error("EMAIL ERROR:", err.message);
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});
