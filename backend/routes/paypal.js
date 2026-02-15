const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

// ==================== HELPER FUNCTIONS ====================

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// Get PayPal Access Token
async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Failed to get PayPal access token');
  }
  return data.access_token;
}

// Check for duplicate transaction
async function checkDuplicateTransaction(paymentId) {
  const existing = await Transaction.findOne({ paymentId, status: { $in: ['completed', 'pending'] } });
  return !!existing;
}


// ==================== SUBSCRIPTION ENDPOINTS ====================

// Create PayPal Order for Plan Subscription
router.post('/create-order', async (req, res) => {
  try {
    const { planId, userId, enableAutoRenew = false } = req.body;

    // Validate ObjectId format to avoid CastError 500
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      console.error(`[PAYPAL] Invalid Plan ID format: ${planId}`);
      return res.status(400).json({ 
        message: 'Invalid Plan ID format. Please ensure plans are seeded in the database.' 
      });
    }

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `PP_${Date.now()}_${userId}`,
          description: plan.description,
          custom_id: JSON.stringify({ planId, userId, type: 'subscription', autoRenew: enableAutoRenew }),
          amount: {
            currency_code: plan.currency,
            value: plan.price.toFixed(2)
          }
        }],
        application_context: {
          return_url: `${process.env.APP_BASE_URL}/pricing/paypal/success`,
          cancel_url: `${process.env.APP_BASE_URL}/pricing/paypal/cancel`,
          brand_name: 'DibNow',
          user_action: 'PAY_NOW'
        }
      })
    });

    const order = await response.json();

    if (response.ok) {
      res.json({
        orderId: order.id,
        approvalUrl: order.links.find(link => link.rel === 'approve').href
      });
    } else {
      console.error('[PAYPAL] Create order error:', order);
      res.status(400).json({ message: order.message || 'Failed to create PayPal order' });
    }
  } catch (error) {
    console.error('PayPal create order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Capture PayPal Payment and Activate Subscription
router.post('/capture-payment', async (req, res) => {
  try {
    const { orderId } = req.body;

    // Check for duplicate
    if (await checkDuplicateTransaction(orderId)) {
      return res.status(400).json({ message: 'Transaction already processed', duplicate: true });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Capture payment
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const order = await response.json();

    if (!response.ok) {
      return res.status(400).json({ message: order.message || 'Failed to capture PayPal payment' });
    }

    // Get custom data from order
    const customData = JSON.parse(order.purchase_units[0].custom_id);
    const { planId, userId, type, autoRenew } = customData;

    if (type === 'subscription') {
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
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
        paymentMethod: 'paypal',
        paymentId: order.id,
        amount: plan.price,
        currency: plan.currency,
        autoRenew: autoRenew || false,
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
        paymentMethod: 'paypal',
        paymentId: order.id,
        subscriptionId: subscription._id,
        planId: planId,
        description: `Subscription to ${plan.name} via PayPal`
      });
      await transaction.save();

      // UPDATE USER'S PLANID
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, { planId: planId, status: 'active' });
      console.log(`[PAYPAL] Updated user ${userId} planId to ${planId}`);

      res.json({
        success: true,
        subscription: subscription,
        transaction: transaction
      });

    } else if (type === 'wallet_topup') {
      const walletData = JSON.parse(order.purchase_units[0].custom_id);
      const amount = walletData.amount;
      const currency = walletData.currency;

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
        paymentMethod: 'paypal',
        paymentId: order.id,
        description: `Wallet top-up of ${amount} ${currency} via PayPal`
      });
      await transaction.save();

      // Add transaction to wallet
      wallet.transactions.push(transaction._id);
      await wallet.save();

      res.json({
        success: true,
        wallet: wallet,
        transaction: transaction
      });
    }
  } catch (error) {
    console.error('PayPal capture payment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== AUTO-RENEWAL ENDPOINTS ====================

// Create PayPal Order for Subscription Renewal
router.post('/create-renewal-order', async (req, res) => {
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

    // Create pending transaction
    const transaction = new Transaction({
      userId: subscription.userId,
      transactionType: 'renewal',
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      paymentMethod: 'paypal',
      paymentId: `PP_RENEW_${Date.now()}_${subscription.userId}`,
      subscriptionId: subscription._id,
      planId: plan._id,
      description: `Renewal of ${plan.name}`
    });
    await transaction.save();

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order for renewal
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: transaction.paymentId,
          description: `Renewal: ${plan.name}`,
          custom_id: JSON.stringify({ 
            subscriptionId: subscriptionId,
            transactionId: transaction._id.toString(),
            type: 'renewal' 
          }),
          amount: {
            currency_code: plan.currency,
            value: plan.price.toFixed(2)
          }
        }],
        application_context: {
          return_url: `${process.env.APP_BASE_URL}/subscription/paypal/renewal-success?transaction_id=${transaction._id}`,
          cancel_url: `${process.env.APP_BASE_URL}/subscription/paypal/renewal-cancel?transaction_id=${transaction._id}`,
          brand_name: 'DibNow',
          user_action: 'PAY_NOW'
        }
      })
    });

    const order = await response.json();

    if (response.ok) {
      res.json({
        orderId: order.id,
        transactionId: transaction._id,
        approvalUrl: order.links.find(link => link.rel === 'approve').href
      });
    } else {
      transaction.status = 'failed';
      await transaction.save();
      res.status(400).json({ message: order.message || 'Failed to create PayPal renewal order' });
    }
  } catch (error) {
    console.error('PayPal create renewal order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Capture renewal payment
router.post('/capture-renewal', async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      return res.json({ success: true, message: 'Renewal already completed', transaction });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Capture payment
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const order = await response.json();

    if (!response.ok) {
      transaction.status = 'failed';
      await transaction.save();
      return res.status(400).json({ message: order.message || 'Failed to capture PayPal renewal payment' });
    }

    const subscription = await Subscription.findById(transaction.subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const plan = await Plan.findById(subscription.planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
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

    // Update transaction
    transaction.status = 'completed';
    transaction.paymentId = order.id;
    await transaction.save();

    res.json({
      success: true,
      subscription: subscription,
      transaction: transaction
    });
  } catch (error) {
    console.error('PayPal capture renewal error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== REFUND ENDPOINTS ====================

// Process refund
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

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Process refund through PayPal
    let paypalRefund = null;
    try {
      const refundResponse = await fetch(`${PAYPAL_API_BASE}/v2/payments/captures/${originalTransaction.paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          amount: {
            value: refundAmount.toFixed(2),
            currency_code: originalTransaction.currency
          }
        })
      });

      paypalRefund = await refundResponse.json();
      
      if (!refundResponse.ok) {
        console.error('[PAYPAL] Refund error:', paypalRefund);
      }
    } catch (refundError) {
      console.error('[PAYPAL] Refund API error:', refundError);
    }

    // Update original transaction
    originalTransaction.status = amount && amount < originalTransaction.amount ? 'partially_refunded' : 'refunded';
    originalTransaction.refundAmount = refundAmount;
    originalTransaction.refundReason = reason;
    originalTransaction.refundedAt = new Date();
    originalTransaction.refundId = paypalRefund?.id || `PP_REFUND_${Date.now()}`;
    await originalTransaction.save();

    // Create refund transaction record
    const refundTransaction = new Transaction({
      userId: originalTransaction.userId,
      transactionType: 'refund',
      amount: -refundAmount,
      currency: originalTransaction.currency,
      status: 'completed',
      paymentMethod: 'paypal',
      paymentId: originalTransaction.refundId,
      refundId: originalTransaction.refundId,
      refundAmount: refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
      subscriptionId: originalTransaction.subscriptionId,
      planId: originalTransaction.planId,
      description: `Refund for ${originalTransaction.description}`,
      processedBy: adminId,
      extraData: paypalRefund
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

    console.log(`[PAYPAL] Refund processed: ${originalTransaction.refundId} for ${refundAmount}`);

    res.json({
      success: true,
      refund: paypalRefund,
      refundTransaction: refundTransaction,
      originalTransaction: originalTransaction
    });
  } catch (error) {
    console.error('PayPal refund error:', error);
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

    // Check for duplicate
    const duplicateTxId = `PP_WALLET_${Date.now()}_${userId}`;
    if (await checkDuplicateTransaction(duplicateTxId)) {
      return res.status(400).json({ message: 'Transaction already in progress' });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `PP_WALLET_${Date.now()}_${userId}`,
          description: `Wallet Top-up - Add ${amount} ${currency} to your wallet`,
          custom_id: JSON.stringify({ userId, amount, currency, type: 'wallet_topup' }),
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }],
        application_context: {
          return_url: `${process.env.APP_BASE_URL}/wallet/paypal/success`,
          cancel_url: `${process.env.APP_BASE_URL}/wallet/paypal/cancel`,
          brand_name: 'DibNow',
          user_action: 'PAY_NOW'
        }
      })
    });

    const order = await response.json();

    if (response.ok) {
      res.json({
        orderId: order.id,
        approvalUrl: order.links.find(link => link.rel === 'approve').href
      });
    } else {
      res.status(400).json({ message: order.message || 'Failed to create PayPal wallet topup order' });
    }
  } catch (error) {
    console.error('PayPal wallet topup error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== WEBHOOK HANDLER ====================

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    const eventType = event.event_type;

    console.log(`[PAYPAL WEBHOOK] Received event: ${eventType}`);

    // Handle the event
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const captureData = event.resource;
        const customData = captureData.custom_id ? JSON.parse(captureData.custom_id) : {};
        const { planId, userId, type, autoRenew, subscriptionId, transactionId } = customData;

        // Check for duplicate
        if (await checkDuplicateTransaction(captureData.id)) {
          console.log(`[PAYPAL WEBHOOK] Transaction already processed: ${captureData.id}`);
          return res.send('OK');
        }

        if (type === 'subscription') {
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
            paymentMethod: 'paypal',
            paymentId: captureData.id,
            amount: parseFloat(captureData.amount.value),
            currency: captureData.amount.currency_code,
            autoRenew: autoRenew || false,
            nextRenewalDate: nextRenewalDate
          });
          await subscription.save();

          // Create transaction record
          const transaction = new Transaction({
            userId: userId,
            transactionType: 'subscription',
            amount: parseFloat(captureData.amount.value),
            currency: captureData.amount.currency_code,
            status: 'completed',
            paymentMethod: 'paypal',
            paymentId: captureData.id,
            subscriptionId: subscription._id,
            planId: planId,
            description: `Subscription to ${plan.name} via PayPal`,
            extraData: event
          });
          await transaction.save();

          // UPDATE USER'S PLANID
          const User = require('../models/User');
          await User.findByIdAndUpdate(userId, { planId: planId, status: 'active' });

          console.log(`[PAYPAL WEBHOOK] Subscription created: ${subscription._id}`);
          console.log(`[PAYPAL WEBHOOK] Updated user ${userId} planId to ${planId}`);

        } else if (type === 'renewal') {
          const sub = await Subscription.findById(subscriptionId);
          if (!sub) {
            return res.status(404).send('Subscription not found');
          }

          const plan = await Plan.findById(sub.planId);
          if (!plan) {
            return res.status(404).send('Plan not found');
          }

          // Calculate new end date
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.duration);

          // Update subscription
          sub.endDate = endDate;
          sub.lastRenewalDate = new Date();
          sub.renewAttempts = 0;
          sub.nextRenewalDate = sub.autoRenew ? new Date(endDate) : null;
          await sub.save();

          // Update transaction
          const renewalTx = await Transaction.findById(transactionId);
          if (renewalTx) {
            renewalTx.status = 'completed';
            renewalTx.paymentId = captureData.id;
            await renewalTx.save();
          }

          console.log(`[PAYPAL WEBHOOK] Subscription renewed: ${sub._id}`);

        } else if (type === 'wallet_topup') {
          const amount = parseFloat(captureData.amount.value);
          const currency = captureData.amount.currency_code;

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
            paymentMethod: 'paypal',
            paymentId: captureData.id,
            description: `Wallet top-up of ${amount} ${currency} via PayPal`,
            extraData: event
          });
          await transaction.save();

          // Add transaction to wallet
          wallet.transactions.push(transaction._id);
          await wallet.save();

          console.log(`[PAYPAL WEBHOOK] Wallet top-up completed: ${amount}`);
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        const failedData = event.resource;
        console.log(`[PAYPAL WEBHOOK] Payment denied: ${failedData.id}`);
        
        // Update transaction status to failed
        await Transaction.findOneAndUpdate(
          { paymentId: failedData.id },
          { status: 'failed', updatedAt: new Date() }
        );
        break;

      default:
        console.log(`[PAYPAL WEBHOOK] Unhandled event type: ${eventType}`);
    }

    res.send('OK');
  } catch (error) {
    console.error('[PAYPAL WEBHOOK] Error:', error);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;
