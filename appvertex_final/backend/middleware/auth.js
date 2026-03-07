const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Login endpoint - generates JWT token
const login = async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt:', { email, adminEmail: process.env.ADMIN_EMAIL });
  
  // Simple admin check (in production, use a database)
  if (email !== process.env.ADMIN_EMAIL) {
    console.log('❌ Email mismatch');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (password !== process.env.ADMIN_PASSWORD) {
    console.log('❌ Password mismatch');
    console.log('Received password:', JSON.stringify(password));
    console.log('Expected password:', JSON.stringify(process.env.ADMIN_PASSWORD));
    console.log('Received password length:', password.length);
    console.log('Expected password length:', process.env.ADMIN_PASSWORD?.length);
    console.log('Match:', password === process.env.ADMIN_PASSWORD);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log('✅ Login successful for:', email);
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
};

// Protect middleware - verify JWT token
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { login, protect };
