const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// Get user wallet
router.get('/:userId', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.params.userId })
      .populate('transactions');
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = new Wallet({ userId: req.params.userId, balance: 0 });
      await newWallet.save();
      return res.json(newWallet);
    }
    
    res.json(wallet);
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get wallet transactions
router.get('/:userId/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Deduct from wallet (for purchases, etc.)
router.post('/:userId/deduct', async (req, res) => {
  try {
    const { amount, description, planId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Find wallet
    let wallet = await Wallet.findOne({ userId: req.params.userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Check if sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct amount
    wallet.balance -= amount;
    wallet.updatedAt = new Date();
    await wallet.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.params.userId,
      transactionType: planId ? 'subscription' : 'wallet_deduction',
      amount: -amount,
      currency: wallet.currency,
      status: 'completed',
      paymentMethod: 'wallet',
      planId: planId || undefined,
      description: description || 'Wallet deduction'
    });
    await transaction.save();

    // Add transaction to wallet
    wallet.transactions.push(transaction._id);
    await wallet.save();

    // If this is a subscription purchase, update user's planId
    if (planId) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.params.userId, { planId: planId, status: 'active' });
      console.log(`[WALLET] Updated user ${req.params.userId} planId to ${planId}`);
    }

    res.json({
      success: true,
      wallet: wallet,
      transaction: transaction
    });
  } catch (error) {
    console.error('Deduct from wallet error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get wallet balance
router.get('/:userId/balance', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.params.userId });
    
    if (!wallet) {
      return res.json({ balance: 0, currency: 'USD' });
    }
    
    res.json({ balance: wallet.balance, currency: wallet.currency });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
