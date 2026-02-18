const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission, checkUserStatus } = require('../middleware/permissions');
const checkLimits = require('../middleware/checkLimits');

// Apply user status check to all routes
router.use(authenticateToken, checkUserStatus);

// Get all categories
router.get('/', checkPermission('categories'), async (req, res) => {
  try {
    const categories = await Category.find({ ownerId: req.user.userId }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Add category
router.post('/', checkPermission('categories'), checkLimits('categories'), async (req, res) => {
  try {
    const newCategory = new Category({
      ...req.body,
      ownerId: req.user.userId
    });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Delete category
router.delete('/:id', checkPermission('categories'), async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId });
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category' });
  }
});

module.exports = router;
