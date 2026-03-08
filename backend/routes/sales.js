const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const { authenticateToken } = require('../middleware/auth');

// Get all sales for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sales = await Sale.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales' });
  }
});

// Create new sale
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, qty, price, total, customer, productName } = req.body;
    
    // Create the sale record
    const newSale = new Sale({
      productId,
      productName,
      qty,
      price,
      total,
      customer,
      ownerId: req.user.userId
    });

    await newSale.save();

    // Deduct stock if productId is provided
    if (productId) {
      await Inventory.findOneAndUpdate(
        { _id: productId, ownerId: req.user.userId },
        { $inc: { stock: -qty } }
      );
    }

    res.status(201).json(newSale);
  } catch (error) {
    res.status(500).json({ message: 'Error creating sale record' });
  }
});

module.exports = router;
