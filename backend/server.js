require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const contentRoutes = require('./routes/content');
const contactRoutes = require('./routes/contact');

const path = require('path');
const app = express();

// ✅ CORS: allows your frontend (Netlify/Vercel) + local dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:5500',       // VS Code Live Server
  process.env.CLIENT_URL,        // Set this in Railway to your Netlify URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AppVerteX Backend API', version: '1.0.0' });
});

app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Running on port ${PORT}`));
