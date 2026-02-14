const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const { authenticateToken } = require('../middleware/auth');
const checkLimits = require('../middleware/checkLimits');

// Get all brands
router.get('/', authenticateToken, async (req, res) => {
  try {
    const brands = await Brand.find({ ownerId: req.user.userId }).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands' });
  }
});

// Add brand
router.post('/', authenticateToken, checkLimits('brands'), async (req, res) => {
  try {
    const newBrand = new Brand({
      ...req.body,
      ownerId: req.user.userId
    });
    await newBrand.save();
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ message: 'Error creating brand' });
  }
});

// Delete brand
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Brand.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId });
    if (!deleted) return res.status(404).json({ message: 'Brand not found' });
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting brand' });
  }
});

module.exports = router;
