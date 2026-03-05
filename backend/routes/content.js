const express = require('express');
const Content = require('../models/Content');
const { login, protect } = require('../middleware/auth');

const router = express.Router();

// Default content to seed DB on first run
const DEFAULT_CONTENT = require('../data/content.json');

// Helper: get all content as a single object
const getAllContent = async () => {
  const docs = await Content.find({});
  if (docs.length === 0) {
    // Seed database with default content on first run
    const entries = Object.entries(DEFAULT_CONTENT).map(([key, data]) => ({ key, data }));
    await Content.insertMany(entries);
    return DEFAULT_CONTENT;
  }
  const result = {};
  docs.forEach(doc => { result[doc.key] = doc.data; });
  return result;
};

// Admin login
router.post('/login', login);

// GET all content (public)
router.get('/', async (req, res) => {
  try {
    const content = await getAllContent();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a specific section
router.get('/:section', async (req, res) => {
  try {
    const doc = await Content.findOne({ key: req.params.section });
    if (!doc) return res.status(404).json({ error: 'Section not found' });
    res.json(doc.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE all content (admin only) ✅ PROTECTED
router.put('/', protect, async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    await Promise.all(entries.map(([key, data]) =>
      Content.findOneAndUpdate({ key }, { data }, { upsert: true, new: true })
    ));
    res.json({ success: true, message: 'Content updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a section (admin only) ✅ PROTECTED
router.put('/:section', protect, async (req, res) => {
  try {
    const doc = await Content.findOneAndUpdate(
      { key: req.params.section },
      { $set: { data: req.body } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: doc.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
