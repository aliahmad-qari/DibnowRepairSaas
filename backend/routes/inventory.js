const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { authenticateToken } = require('../middleware/auth');
const checkLimits = require('../middleware/checkLimits');

// Get all inventory items for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Inventory.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

// Add new inventory item
router.post('/', authenticateToken, checkLimits('inventoryItems'), async (req, res) => {
  try {
    const newItem = new Inventory({
      ...req.body,
      ownerId: req.user.userId
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating inventory item' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedItem = await Inventory.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId });
    if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item' });
  }
});

module.exports = router;
