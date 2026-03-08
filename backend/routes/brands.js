const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission, checkUserStatus } = require('../middleware/permissions');
const checkLimits = require('../middleware/checkLimits');
const { logActivity } = require('./activities');

// Apply user status check to all routes
router.use(authenticateToken, checkUserStatus);

// Get all brands
router.get('/', authenticateToken, checkUserStatus, async (req, res) => {
  try {
    const brands = await Brand.find({ ownerId: req.user.userId }).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands' });
  }
});

// Add brand
router.post('/', checkLimits('brands'), async (req, res) => {
  try {
    const newBrand = new Brand({
      ...req.body,
      ownerId: req.user.userId
    });
    await newBrand.save();
    
    // Get user name for activity log
    const user = await User.findById(req.user.userId);
    await logActivity(req.user.userId, 'Brand Created', 'Brands', newBrand._id, 'Success', user?.name || 'User');
    
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ message: 'Error creating brand' });
  }
});

// Delete brand
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Brand.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId });
    if (!deleted) return res.status(404).json({ message: 'Brand not found' });
    
    // Get user name for activity log
    const user = await User.findById(req.user.userId);
    await logActivity(req.user.userId, 'Brand Deleted', 'Brands', req.params.id, 'Success', user?.name || 'User');
    
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting brand' });
  }
});

module.exports = router;
