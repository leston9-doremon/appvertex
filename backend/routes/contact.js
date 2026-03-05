const express = require('express');
const router = express.Router();

// Basic email sanitizer
const sanitize = (str) => String(str).replace(/<[^>]*>/g, '').trim();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const safeName = sanitize(name);
  const safeEmail = sanitize(email);
  const safeMessage = sanitize(message);

  try {
    // Use Resend HTTP API directly (bypasses SMTP port blocking)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AppVerteX <onboarding@resend.dev>',
        to: [process.env.CONTACT_RECEIVER],
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
      throw new Error(data.message || 'Resend API error');
    }

    // Auto-reply to sender
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AppVerteX <onboarding@resend.dev>',
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

    res.json({ success: true, message: 'Message sent!' });

  } catch (err) {
    console.error('EMAIL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

module.exports = router;
