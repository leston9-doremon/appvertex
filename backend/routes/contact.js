const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587, // ✅ must be a number, not a string
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465 (SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Basic email sanitizer — strip HTML tags to prevent injection
const sanitize = (str) => String(str).replace(/<[^>]*>/g, '').trim();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // ✅ Sanitize inputs before putting them in email HTML
  const safeName = sanitize(name);
  const safeEmail = sanitize(email);
  const safeMessage = sanitize(message);

  try {
    // Notify you
    await transporter.sendMail({
      from: `"AppVerteX Contact" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECEIVER || process.env.SMTP_USER,
      subject: `New message from ${safeName}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong><br>${safeMessage}</p>
      `,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"AppVerteX" <${process.env.SMTP_USER}>`,
      to: safeEmail,
      subject: `Thanks for reaching out, ${safeName}!`,
      html: `
        <p>Hi ${safeName},</p>
        <p>Thanks for contacting us! We've received your message and will get back to you shortly.</p>
        <br/>
        <p>— The AppVerteX Team</p>
      `,
    });

    res.json({ success: true, message: 'Message sent!' });
  } catch (err) {
    console.error('EMAIL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' }); // ✅ don't leak internal error details
  }
});

module.exports = router;
