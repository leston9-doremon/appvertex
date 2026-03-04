const express = require('express');
const fs = require('fs');
const path = require('path');
const { login, protect } = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/content.json');

// Helper
const readContent = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeContent = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Admin login
router.post('/login', login);

// GET all content (public — your frontend reads this)
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json(readContent());
});

// GET a specific section (e.g. /api/content/hero)
router.get('/:section', (req, res) => {
  const content = readContent();
  const section = content[req.params.section];
  if (!section) return res.status(404).json({ error: 'Section not found' });
  res.json(section);
});

// UPDATE all content (admin only) ✅ PROTECTED
router.put('/', protect, (req, res) => {
  writeContent(req.body);
  res.json({ success: true, message: 'Content updated' });
});

// UPDATE a section (admin only) ✅ PROTECTED
router.put('/:section', protect, (req, res) => {
  const content = readContent();
  content[req.params.section] = { ...content[req.params.section], ...req.body };
  writeContent(content);
  res.json({ success: true, data: content[req.params.section] });
});

module.exports = router;
