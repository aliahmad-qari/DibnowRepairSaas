const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');
const { authenticateToken } = require('../middleware/auth');

// Get all currencies
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const currencies = await Currency.find({}).sort({ code: 1 });
    res.json(currencies);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ message: 'Error fetching currencies' });
  }
});

// Add currency
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const currency = new Currency(req.body);
    await currency.save();
    res.status(201).json(currency);
  } catch (error) {
    console.error('Error creating currency:', error);
    res.status(500).json({ message: 'Error creating currency' });
  }
});

// Update currencies (bulk update)
router.put('/', authenticateToken, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const currencies = req.body;
    if (!Array.isArray(currencies)) {
      return res.status(400).json({ message: 'Currencies must be an array' });
    }

    const updatePromises = currencies.map(currency =>
      Currency.findByIdAndUpdate(currency._id || currency.id, currency, { new: true })
    );

    const updatedCurrencies = await Promise.all(updatePromises);
    res.json(updatedCurrencies);
  } catch (error) {
    console.error('Error updating currencies:', error);
    res.status(500).json({ message: 'Error updating currencies' });
  }
});

// Delete currency
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const currency = await Currency.findByIdAndDelete(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    res.json({ message: 'Currency deleted successfully' });
  } catch (error) {
    console.error('Error deleting currency:', error);
    res.status(500).json({ message: 'Error deleting currency' });
  }
});

module.exports = router;