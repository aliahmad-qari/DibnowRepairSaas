const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const User = require('../models/User');
const { notifyAdmin } = require('../services/notificationHelper');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission, checkUserStatus, getEffectiveOwnerId } = require('../middleware/permissions');
const checkLimits = require('../middleware/checkLimits');
const { logActivity } = require('./activities');

// Apply user status check to all routes
router.use(authenticateToken, checkUserStatus);

// Get all brands
router.get('/', authenticateToken, checkUserStatus, async (req, res) => {
  try {
    const ownerId = await getEffectiveOwnerId(req.user.userId);
    const brands = await Brand.find({ ownerId }).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands' });
  }
});

// Add brand
router.post('/', checkLimits('brands'), async (req, res) => {
  try {
    const ownerId = await getEffectiveOwnerId(req.user.userId);
    const newBrand = new Brand({
      ...req.body,
      ownerId
    });
    await newBrand.save();
    
    // Get user name for activity log
    const user = await User.findById(req.user.userId);
    await logActivity(ownerId, 'Brand Created', 'Brands', newBrand._id, 'Success', user?.name || 'User');
    
    // Notify admin of new brand
    await notifyAdmin('New Brand Added', `${user.name} added brand: ${newBrand.name}`, 'info');
    
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ message: 'Error creating brand' });
  }
});

// Delete brand
router.delete('/:id', async (req, res) => {
  try {
    const ownerId = await getEffectiveOwnerId(req.user.userId);
    const deleted = await Brand.findOneAndDelete({ _id: req.params.id, ownerId });
    if (!deleted) return res.status(404).json({ message: 'Brand not found' });
    
    // Get user name for activity log
    const user = await User.findById(req.user.userId);
    await logActivity(ownerId, 'Brand Deleted', 'Brands', req.params.id, 'Success', user?.name || 'User');
    
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting brand' });
  }
});

module.exports = router;
