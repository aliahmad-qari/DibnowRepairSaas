const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Plan = require('../models/Plan');
const User = require('../models/User');

// Middleware to check admin privileges
const requireAdmin = async (req, res, next) => {
  try {
    // In a real app, you'd check the user's role here
    // const user = await User.findById(req.user?.userId);
    // if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    //   return res.status(403).json({ message: 'Admin access required' });
    // }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authentication error' });
  }
};

// ==================== TRANSACTIONS MANAGEMENT ====================

// Get all transactions with filtering
router.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      paymentMethod,
      userId,
      startDate,
      endDate 
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (userId) query.userId = userId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('planId', 'name')
      .populate('subscriptionId', 'status endDate');

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Get transaction details
router.get('/transactions/:id', requireAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('planId')
      .populate('subscriptionId')
      .populate('processedBy', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Error fetching transaction' });
  }
});

// ==================== REFUND MANAGEMENT ====================

// Process refund for a transaction
router.post('/refunds', requireAdmin, async (req, res) => {
  try {
    const { transactionId, amount, reason, adminId } = req.body;

    // Get original transaction
    const originalTransaction = await Transaction.findById(transactionId)
      .populate('userId', 'name email');

    if (!originalTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (originalTransaction.status === 'refunded') {
      return res.status(400).json({ message: 'Transaction already refunded' });
    }

    if (originalTransaction.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed transactions can be refunded' });
    }

    const refundAmount = amount || originalTransaction.amount;

    // Determine which payment provider to use
    const paymentMethod = originalTransaction.paymentMethod;
    let refundResult = null;

    // Call the appropriate payment provider's refund endpoint
    try {
      const refundResponse = await fetch(`http://localhost:5000/api/${paymentMethod}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          amount: refundAmount,
          reason,
          adminId
        })
      });
      refundResult = await refundResponse.json();
    } catch (providerError) {
      console.error(`[ADMIN] Provider refund error:`, providerError);
    }

    // Update original transaction
    originalTransaction.status = refundAmount < originalTransaction.amount ? 'partially_refunded' : 'refunded';
    originalTransaction.refundAmount = refundAmount;
    originalTransaction.refundReason = reason;
    originalTransaction.refundedAt = new Date();
    originalTransaction.refundId = refundResult?.refund?.id || `ADMIN_REFUND_${Date.now()}`;
    await originalTransaction.save();

    // Create refund transaction record
    const refundTransaction = new Transaction({
      userId: originalTransaction.userId._id,
      type: 'refund',
      amount: -refundAmount,
      currency: originalTransaction.currency,
      status: 'completed',
      paymentMethod: paymentMethod,
      paymentId: originalTransaction.refundId,
      refundId: originalTransaction.refundId,
      refundAmount: refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
      subscriptionId: originalTransaction.subscriptionId,
      planId: originalTransaction.planId,
      description: `Admin refund for ${originalTransaction.description}`,
      processedBy: adminId || req.body.adminId,
      metadata: refundResult
    });
    await refundTransaction.save();

    // Update wallet if applicable
    if (originalTransaction.type === 'wallet_topup') {
      const wallet = await Wallet.findOne({ userId: originalTransaction.userId._id });
      if (wallet) {
        wallet.balance -= refundAmount;
        wallet.updatedAt = new Date();
        wallet.transactions.push(refundTransaction._id);
        await wallet.save();
      }
    }

    // Update subscription status if refunding subscription
    if (originalTransaction.type === 'subscription' && originalTransaction.subscriptionId) {
      await Subscription.findByIdAndUpdate(originalTransaction.subscriptionId, {
        status: 'cancelled',
        cancelledAt: new Date(),
        autoRenew: false
      });
    }

    // Log the refund
    console.log(`[ADMIN] Refund processed: ${originalTransaction.refundId} for ${refundAmount} by admin ${adminId || 'system'}`);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundTransaction,
      originalTransaction
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Error processing refund' });
  }
});

// Get all refunds
router.get('/refunds', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const refunds = await Transaction.find({ type: 'refund' })
      .sort({ refundedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('processedBy', 'name email');

    const total = await Transaction.countDocuments({ type: 'refund' });

    res.json({
      refunds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get refunds error:', error);
    res.status(500).json({ message: 'Error fetching refunds' });
  }
});

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Get all subscriptions
router.get('/subscriptions', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, planId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (planId) query.planId = planId;

    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email phone')
      .populate('planId', 'name price duration');

    const total = await Subscription.countDocuments(query);

    res.json({
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

// Get subscription details
router.get('/subscriptions/:id', requireAdmin, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('planId')
      .populate({
        path: 'transactions',
        match: { type: { $in: ['subscription', 'renewal', 'refund'] } },
        select: 'type amount status createdAt'
      });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Error fetching subscription' });
  }
});

// Cancel subscription
router.post('/subscriptions/:id/cancel', requireAdmin, async (req, res) => {
  try {
    const { adminId } = req.body;

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    await subscription.save();

    console.log(`[ADMIN] Subscription cancelled: ${subscription._id} by admin ${adminId}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Error cancelling subscription' });
  }
});

// Enable/disable auto-renewal
router.post('/subscriptions/:id/auto-renew', requireAdmin, async (req, res) => {
  try {
    const { enable, adminId } = req.body;

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.autoRenew = enable;
    
    // Update next renewal date if enabling
    if (enable && subscription.status === 'active') {
      const plan = await Plan.findById(subscription.planId);
      if (plan) {
        const endDate = new Date(subscription.endDate);
        const nextRenewal = new Date(endDate);
        nextRenewal.setDate(nextRenewal.getDate() + plan.duration);
        subscription.nextRenewalDate = nextRenewal;
      }
    }
    
    await subscription.save();

    console.log(`[ADMIN] Auto-renewal ${enable ? 'enabled' : 'disabled'} for subscription: ${subscription._id} by admin ${adminId}`);

    res.json({
      success: true,
      message: `Auto-renewal ${enable ? 'enabled' : 'disabled'} successfully`,
      subscription
    });
  } catch (error) {
    console.error('Update auto-renewal error:', error);
    res.status(500).json({ message: 'Error updating auto-renewal' });
  }
});

// ==================== DASHBOARD STATISTICS ====================

// Get payment statistics
router.get('/statistics', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    const matchQuery = {};
    if (startDate || endDate) matchQuery.createdAt = dateQuery;

    // Revenue by payment method
    const revenueByMethod = await Transaction.aggregate([
      { $match: { ...matchQuery, status: 'completed', type: { $in: ['subscription', 'wallet_topup'] } } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue by transaction type
    const revenueByType = await Transaction.aggregate([
      { $match: { ...matchQuery, status: 'completed' } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Total refunds
    const totalRefunds = await Transaction.aggregate([
      { $match: { ...matchQuery, type: 'refund' } },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: '$amount' } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Subscription status breakdown
    const subscriptionStats = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');

    res.json({
      revenueByMethod,
      revenueByType,
      totalRefunds: totalRefunds[0] || { total: 0, count: 0 },
      subscriptionStats,
      recentTransactions
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;
