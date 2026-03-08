const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission, checkUserStatus, getEffectiveOwnerId } = require('../middleware/permissions');
const checkLimits = require('../middleware/checkLimits');
const { logActivity } = require('./activities');

// Apply user status check to all routes
router.use(authenticateToken, checkUserStatus);

// Get all categories
router.get('/', authenticateToken, checkUserStatus, async (req, res) => {
  try {
    const ownerId = await getEffectiveOwnerId(req.user.userId);
    const categories = await Category.find({ ownerId }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Add category
router.post('/', checkPermission('categories'), checkLimits('categories'), async (req, res) => {
  try {
    const ownerId = await getEffectiveOwnerId(req.user.userId);
    const newCategory = new Category({
      ...req.body,
      ownerId
    });
    await newCategory.save();
    
    // Get user name for activity log
    const user = await User.findById(req.user.userId);
    await logActivity(ownerId, 'Category Created', 'Categories', newCategory._id, 'Success', user?.name || 'User');
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Delete category
router.delete('/:id', checkPermission('categories'), async (req, res) => {
  try {
    const ownerId = await getEffectiveOwnerId(req.user.userId);
    const deleted = await Category.findOneAndDelete({ _id: req.params.id, ownerId });
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    
    // Get user name for activity log
    const user = await User.findById(req.user.userId);
    await logActivity(ownerId, 'Category Deleted', 'Categories', req.params.id, 'Success', user?.name || 'User');
    
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category' });
  }
});

module.exports = router;
