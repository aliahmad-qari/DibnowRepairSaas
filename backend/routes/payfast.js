const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

// ==================== HELPER FUNCTIONS ====================

// Generate PayFast signature
function generatePayFastSignature(data) {
  const pfParamString = Object.keys(data)
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');
  
  return crypto
    .createHash('md5')
    .update(pfParamString + `&passphrase=${process.env.PAYFAST_PASSPHRASE || ''}`)
    .digest('hex');
}

// Check for duplicate transaction
async function checkDuplicateTransaction(paymentId) {
  const existing = await Transaction.findOne({ paymentId, status: { $in: ['completed', 'pending'] } });
  return !!existing;
}

// ==================== SUBSCRIPTION ENDPOINTS ====================

// Create PayFast Payment Request for Plan Subscription
router.post('/create-payment', async (req, res) => {
  try {
    const { planId, userId, enableAutoRenew = false } = req.body;

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Generate unique payment ID
    const paymentId = `PF_${Date.now()}_${userId}`;

    // Prepare PayFast data
    const payfastData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: `${process.env.PAYFAST_RETURN_URL}?payment_id=${paymentId}&plan_id=${planId}&user_id=${userId}&auto_renew=${enableAutoRenew}`,
      cancel_url: `${process.env.PAYFAST_CANCEL_URL}?payment_id=${paymentId}`,
      notify_url: `${process.env.PAYFAST_NOTIFY_URL}`,
      m_payment_id: paymentId,
      amount: plan.price.toFixed(2),
      item_name: plan.name,
      item_description: plan.description,
      email_confirmation: 1,
      confirmation_address: process.env.EMAIL_FROM,
      custom_str1: userId,
      custom_str2: planId,
      custom_str3: 'subscription',
      custom_str4: enableAutoRenew.toString()
    };

    // Generate signature
    payfastData.signature = generatePayFastSignature(payfastData);

    // Create payment URL
    const paymentUrl = `${process.env.PAYFAST_HPP_URL}?${Object.keys(payfastData)
      .map(key => `${key}=${encodeURIComponent(payfastData[key])}`)
      .join('&')}`;

    res.json({
      paymentId: paymentId,
      paymentUrl: paymentUrl,
      amount: plan.price,
      currency: plan.currency
    });
  } catch (error) {
    console.error('PayFast create payment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify PayFast Payment and Activate Subscription
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentId, planId, userId, autoRenew } = req.body;

    // Check for duplicate
    if (await checkDuplicateTransaction(paymentId)) {
      return res.status(400).json({ message: 'Transaction already processed', duplicate: true });
    }

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Calculate next renewal date
    const nextRenewalDate = autoRenew === 'true' ? new Date(endDate) : null;

    // Create subscription
    const subscription = new Subscription({
      userId: userId,
      planId: planId,
      status: 'active',
      startDate: new Date(),
      endDate: endDate,
      paymentMethod: 'payfast',
      paymentId: paymentId,
      amount: plan.price,
      currency: plan.currency,
      autoRenew: autoRenew === 'true',
      nextRenewalDate: nextRenewalDate
    });
    await subscription.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: userId,
      transactionType: 'subscription',
      amount: plan.price,
      currency: plan.currency,
      status: 'completed',
      paymentMethod: 'payfast',
      paymentId: paymentId,
      subscriptionId: subscription._id,
      planId: planId,
      description: `Subscription to ${plan.name} via PayFast`
    });
    await transaction.save();

    res.json({
      success: true,
      subscription: subscription,
      transaction: transaction
    });
  } catch (error) {
    console.error('PayFast verify payment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== AUTO-RENEWAL ENDPOINTS ====================

// Manual subscription renewal
router.post('/renew-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (!subscription.autoRenew) {
      return res.status(400).json({ message: 'Auto-renewal is not enabled for this subscription' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ message: 'Subscription is not active' });
    }

    const plan = await Plan.findById(subscription.planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check for duplicate renewal
    const duplicate = await Transaction.findOne({
      subscriptionId: subscriptionId,
      transactionType: 'renewal',
      status: { $in: ['pending', 'completed'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Renewal already in progress' });
    }

    // Generate new payment ID for renewal
    const paymentId = `PF_RENEW_${Date.now()}_${subscription.userId}`;

    // Prepare PayFast renewal data
    const payfastData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: `${process.env.PAYFAST_RETURN_URL}?payment_id=${paymentId}&subscription_id=${subscriptionId}&type=renewal`,
      cancel_url: `${process.env.PAYFAST_CANCEL_URL}?payment_id=${paymentId}`,
      notify_url: `${process.env.PAYFAST_NOTIFY_URL}`,
      m_payment_id: paymentId,
      amount: plan.price.toFixed(2),
      item_name: `Renewal: ${plan.name}`,
      item_description: `Subscription renewal for ${plan.name}`,
      email_confirmation: 1,
      confirmation_address: process.env.EMAIL_FROM,
      custom_str1: subscription.userId.toString(),
      custom_str2: subscriptionId,
      custom_str3: 'renewal'
    };

    // Generate signature
    payfastData.signature = generatePayFastSignature(payfastData);

    // Create pending transaction
    const transaction = new Transaction({
      userId: subscription.userId,
      transactionType: 'renewal',
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      paymentMethod: 'payfast',
      paymentId: paymentId,
      subscriptionId: subscription._id,
      planId: plan._id,
      description: `Renewal of ${plan.name}`
    });
    await transaction.save();

    // Create payment URL
    const paymentUrl = `${process.env.PAYFAST_HPP_URL}?${Object.keys(payfastData)
      .map(key => `${key}=${encodeURIComponent(payfastData[key])}`)
      .join('&')}`;

    res.json({
      paymentId: paymentId,
      paymentUrl: paymentUrl,
      transaction: transaction
    });
  } catch (error) {
    console.error('PayFast renewal error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== REFUND ENDPOINTS ====================

// Process refund (PayFast doesn't have native refund API, so we record it manually)
router.post('/refund', async (req, res) => {
  try {
    const { transactionId, amount, reason, adminId } = req.body;

    // Get original transaction
    const originalTransaction = await Transaction.findById(transactionId);
    if (!originalTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (originalTransaction.status === 'refunded') {
      return res.status(400).json({ message: 'Transaction already refunded' });
    }

    if (originalTransaction.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed transactions can be refunded' });
    }

    // Check if refund already exists
    const existingRefund = await Transaction.findOne({
      paymentId: originalTransaction.paymentId,
      transactionType: 'refund'
    });

    if (existingRefund) {
      return res.status(400).json({ message: 'Refund already processed for this transaction' });
    }

    const refundAmount = amount || originalTransaction.amount;

    // Update original transaction
    originalTransaction.status = amount && amount < originalTransaction.amount ? 'partially_refunded' : 'refunded';
    originalTransaction.refundAmount = refundAmount;
    originalTransaction.refundReason = reason;
    originalTransaction.refundedAt = new Date();
    originalTransaction.refundId = `PF_REFUND_${Date.now()}`;
    await originalTransaction.save();

    // Create refund transaction record
    const refundTransaction = new Transaction({
      userId: originalTransaction.userId,
      transactionType: 'refund',
      amount: -refundAmount,
      currency: originalTransaction.currency,
      status: 'completed',
      paymentMethod: 'payfast',
      paymentId: originalTransaction.refundId,
      refundId: originalTransaction.refundId,
      refundAmount: refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
      subscriptionId: originalTransaction.subscriptionId,
      planId: originalTransaction.planId,
      description: `Refund for ${originalTransaction.description}`,
      processedBy: adminId
    });
    await refundTransaction.save();

    // Update wallet if applicable
    if (originalTransaction.transactionType === 'wallet_topup') {
      const wallet = await Wallet.findOne({ userId: originalTransaction.userId });
      if (wallet) {
        wallet.balance -= refundAmount;
        wallet.updatedAt = new Date();
        wallet.transactions.push(refundTransaction._id);
        await wallet.save();
      }
    }

    // Update subscription status if refunding subscription
    if (originalTransaction.transactionType === 'subscription') {
      await Subscription.findByIdAndUpdate(originalTransaction.subscriptionId, {
        status: 'cancelled',
        cancelledAt: new Date(),
        autoRenew: false
      });
    }

    console.log(`[PAYFAST] Refund processed: ${originalTransaction.refundId} for ${refundAmount}`);

    res.json({
      success: true,
      refundTransaction: refundTransaction,
      originalTransaction: originalTransaction
    });
  } catch (error) {
    console.error('PayFast refund error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== WALLET TOP-UP ====================

router.post('/wallet-topup', async (req, res) => {
  try {
    const { userId, amount, currency = 'USD' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Generate unique payment ID
    const paymentId = `PF_WALLET_${Date.now()}_${userId}`;

    // Check for duplicate
    if (await checkDuplicateTransaction(paymentId)) {
      return res.status(400).json({ message: 'Transaction already in progress' });
    }

    // Prepare PayFast data
    const payfastData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: `${process.env.APP_BASE_URL}/wallet/payfast/success?payment_id=${paymentId}&user_id=${userId}&amount=${amount}`,
      cancel_url: `${process.env.APP_BASE_URL}/wallet/payfast/cancel?payment_id=${paymentId}`,
      notify_url: `${process.env.APP_BASE_URL}/api/payfast/webhook`,
      m_payment_id: paymentId,
      amount: amount.toFixed(2),
      item_name: 'Wallet Top-up',
      item_description: `Add ${amount} ${currency} to your wallet`,
      email_confirmation: 1,
      confirmation_address: process.env.EMAIL_FROM,
      custom_str1: userId,
      custom_str2: amount.toString(),
      custom_str3: 'wallet_topup'
    };

    // Generate signature
    payfastData.signature = generatePayFastSignature(payfastData);

    // Create payment URL
    const paymentUrl = `${process.env.PAYFAST_HPP_URL}?${Object.keys(payfastData)
      .map(key => `${key}=${encodeURIComponent(payfastData[key])}`)
      .join('&')}`;

    res.json({
      paymentId: paymentId,
      paymentUrl: paymentUrl,
      amount: amount,
      currency: currency
    });
  } catch (error) {
    console.error('PayFast wallet topup error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== WEBHOOK HANDLER (ITN) ====================

router.post('/webhook', async (req, res) => {
  try {
    const data = req.body;

    // Verify signature
    const receivedSignature = data.signature;
    const calculatedSignature = generatePayFastSignature(data);

    if (receivedSignature !== calculatedSignature) {
      console.error('[PAYFAST WEBHOOK] Signature verification failed');
      return res.status(400).send('Bad Signature');
    }

    console.log(`[PAYFAST WEBHOOK] Received payment notification: ${data.m_payment_id}`);

    // Verify payment status
    if (data.payment_status !== 'COMPLETE') {
      console.log(`[PAYFAST WEBHOOK] Payment not complete: ${data.payment_status}`);
      return res.send('Payment not complete');
    }

    const paymentId = data.m_payment_id;
    const userId = data.custom_str1;
    const type = data.custom_str3;

    // Check for duplicate processing
    if (await checkDuplicateTransaction(paymentId)) {
      console.log(`[PAYFAST WEBHOOK] Transaction already processed: ${paymentId}`);
      return res.send('Transaction already processed');
    }

    if (type === 'subscription') {
      const planId = data.custom_str2;
      const autoRenew = data.custom_str4 === 'true';
      const amount = parseFloat(data.amount_gross);

      // Get plan details
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).send('Plan not found');
      }

      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // Calculate next renewal date
      const nextRenewalDate = autoRenew ? new Date(endDate) : null;

      // Create subscription
      const subscription = new Subscription({
        userId: userId,
        planId: planId,
        status: 'active',
        startDate: new Date(),
        endDate: endDate,
        paymentMethod: 'payfast',
        paymentId: paymentId,
        amount: amount,
        currency: data.currency_code || 'USD',
        autoRenew: autoRenew,
        nextRenewalDate: nextRenewalDate
      });
      await subscription.save();

      // Create transaction record
      const transaction = new Transaction({
        userId: userId,
        transactionType: 'subscription',
        amount: amount,
        currency: data.currency_code || 'USD',
        status: 'completed',
        paymentMethod: 'payfast',
        paymentId: paymentId,
        subscriptionId: subscription._id,
        planId: planId,
        description: `Subscription to ${plan.name} via PayFast`,
        extraData: data
      });
      await transaction.save();

      console.log(`[PAYFAST WEBHOOK] Subscription created: ${subscription._id}`);

    } else if (type === 'renewal') {
      const subscriptionId = data.custom_str2;
      const amount = parseFloat(data.amount_gross);

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).send('Subscription not found');
      }

      const plan = await Plan.findById(subscription.planId);
      if (!plan) {
        return res.status(404).send('Plan not found');
      }

      // Calculate new end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // Update subscription
      subscription.endDate = endDate;
      subscription.lastRenewalDate = new Date();
      subscription.renewAttempts = 0;
      subscription.nextRenewalDate = subscription.autoRenew ? new Date(endDate) : null;
      await subscription.save();

      // Create renewal transaction
      const transaction = new Transaction({
        userId: subscription.userId,
        transactionType: 'renewal',
        amount: amount,
        currency: data.currency_code || 'USD',
        status: 'completed',
        paymentMethod: 'payfast',
        paymentId: paymentId,
        subscriptionId: subscription._id,
        planId: subscription.planId,
        description: `Renewal of ${plan.name}`,
        extraData: data
      });
      await transaction.save();

      console.log(`[PAYFAST WEBHOOK] Subscription renewed: ${subscription._id}`);

    } else if (type === 'wallet_topup') {
      const amount = parseFloat(data.amount_gross);
      const currency = data.currency_code || 'USD';

      // Find or create wallet
      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        wallet = new Wallet({ userId: userId, balance: 0, currency: currency });
      }

      // Update wallet balance
      wallet.balance += amount;
      wallet.updatedAt = new Date();
      await wallet.save();

      // Create transaction record
      const transaction = new Transaction({
        userId: userId,
        transactionType: 'wallet_topup',
        amount: amount,
        currency: currency,
        status: 'completed',
        paymentMethod: 'payfast',
        paymentId: paymentId,
        description: `Wallet top-up of ${amount} ${currency} via PayFast`,
        extraData: data
      });
      await transaction.save();

      // Add transaction to wallet
      wallet.transactions.push(transaction._id);
      await wallet.save();

      console.log(`[PAYFAST WEBHOOK] Wallet top-up completed: ${amount}`);
    }

    res.send('OK');
  } catch (error) {
    console.error('[PAYFAST WEBHOOK] Error:', error);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;
