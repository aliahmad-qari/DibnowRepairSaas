const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

// ==================== HELPER FUNCTIONS ====================

/**
 * Get Access Token from APPS Pakistan
 */
async function getAppsAccessToken() {
  try {
    const tokenUrl = process.env.PAYFAST_TOKEN_URL;
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    
    // Log configuration (masking secrets)
    console.log(`[PAYFAST] Requesting token from: ${tokenUrl}`);
    console.log(`[PAYFAST] Using MerchantId: ${merchantId}`);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        MerchantId: parseInt(merchantId, 10) || merchantId, // Ensure integer
        SecuredKey: process.env.PAYFAST_SECURED_KEY
      })
    });

    // Clone response to read text body for debugging without consuming stream
    const responseClone = response.clone();
    const rawBody = await responseClone.text();
    console.log(`[PAYFAST] Raw Token Response: ${rawBody}`);

    // Parse JSON
    let data;
    try {
        data = JSON.parse(rawBody);
    } catch (e) {
        throw new Error(`Invalid JSON response: ${rawBody}`);
    }

    if (data && (data.ACCESS_TOKEN || data.access_token)) {
      return data.ACCESS_TOKEN || data.access_token;
    }
    
    throw new Error(data.MESSAGE || data.message || 'Failed to obtain access token from APPS');
  } catch (error) {
    console.error('[PAYFAST] Token acquisition failed:', error.message);
    throw error;
  }
}

// ==================== SUBSCRIPTION ENDPOINTS ====================

// Create PayFast Payment Request for Plan Subscription
router.post('/create-payment', async (req, res) => {
  try {
    const { planId, userId, amount, currency = 'PKR', enableAutoRenew = false } = req.body;

    console.log(`[PAYFAST] Initiating payment for User: ${userId}, Plan: ${planId}, Amount: ${amount}`);

    let plan;

    // Check if planId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(planId)) {
      plan = await Plan.findById(planId);
    } else {
      // Fallback: Try to find by name (legacy support for 'gold', 'premium', etc.)
      console.log(`[PAYFAST] Non-ObjectId planId detected: ${planId}. Attempting lookup by name...`);
      const nameMap = {
        'starter': 'FREE TRIAL',
        'basic': 'BASIC',
        'premium': 'PREMIUM',
        'gold': 'GOLD'
      };
      
      const searchName = nameMap[planId.toLowerCase()] || planId.toUpperCase();
      plan = await Plan.findOne({ name: searchName });
      
      if (plan) {
         console.log(`[PAYFAST] Resolved legacy ID '${planId}' to Plan: ${plan.name} (${plan._id})`);
      }
    }

    if (!plan) {
      console.error(`[PAYFAST] Plan not found in database: ${planId}`);
      return res.status(404).json({ message: 'Plan not found in database. Please contact support.' });
    }

    // Use amount from request if provided (localized), otherwise fallback to plan price
    const finalAmount = amount ? parseFloat(amount).toFixed(2) : plan.price.toFixed(2);

    // Generate unique payment ID
    const paymentId = `PF_${Date.now()}_${userId}`;

    // 1. Get Access Token
    console.log('[PAYFAST] Requesting access token from APPS...');
    const accessToken = await getAppsAccessToken();
    console.log('[PAYFAST] Access token acquired successfully.');

    // 2. Prepare Transaction Data (APPS Pakistan Format)
    const transactionData = {
      MerchantId: process.env.PAYFAST_MERCHANT_ID,
      Amount: finalAmount,
      Order_Id: paymentId,
      CurrencyCode: 'PKR', // Mandatory for APPS Pakistan
      Return_Url: `${process.env.PAYFAST_RETURN_URL}?payment_id=${paymentId}&plan_id=${planId}&user_id=${userId}&auto_renew=${enableAutoRenew}`,
      Cancel_Url: `${process.env.PAYFAST_CANCEL_URL}?payment_id=${paymentId}`,
      Error_Url: `${process.env.PAYFAST_CANCEL_URL}?payment_id=${paymentId}`,
      Checkout_Url: process.env.PAYFAST_RETURN_URL, // Fallback
      IsBasket: '0',
      Basket_Id: paymentId,
      Basket_Data: plan.name,
      Payment_Type: 'All', // Allow all payment methods
      Customer_Email: userId + '@dibnow.com', // Fallback if no user email in req
      Customer_Mobile: '03000000000',
      Custom_Str1: userId,
      Custom_Str2: planId,
      Custom_Str3: 'subscription',
      Custom_Str4: enableAutoRenew.toString()
    };

    // 3. Initiate Transaction
    console.log(`[PAYFAST] Posting transaction to ${process.env.PAYFAST_TRANSACTION_URL}...`);
    const txResponse = await fetch(process.env.PAYFAST_TRANSACTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(transactionData)
    });

    const txResult = await txResponse.json();

    if (txResult && txResult.RedirectUrl) {
      console.log(`[PAYFAST] Transaction successful. Redirecting to: ${txResult.RedirectUrl.substring(0, 50)}...`);
      res.json({
        paymentId: paymentId,
        paymentUrl: txResult.RedirectUrl,
        amount: plan.price,
        currency: 'PKR'
      });
    } else {
      console.error('[PAYFAST] APPS Transaction Error:', txResult);
      throw new Error(txResult.MESSAGE || 'Failed to initiate transaction with APPS. Verify credentials.');
    }

  } catch (error) {
    console.error('PayFast create payment exception:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    const { userId, amount, currency = 'PKR' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Generate unique payment ID
    const paymentId = `PF_WALLET_${Date.now()}_${userId}`;

    // 1. Get Access Token
    const accessToken = await getAppsAccessToken();

    // 2. Prepare Transaction Data
    const transactionData = {
      MerchantId: process.env.PAYFAST_MERCHANT_ID,
      Amount: amount.toFixed(2),
      Order_Id: paymentId,
      CurrencyCode: 'PKR',
      Return_Url: `${process.env.APP_BASE_URL}/wallet/payfast/success?payment_id=${paymentId}&user_id=${userId}&amount=${amount}`,
      Cancel_Url: `${process.env.APP_BASE_URL}/wallet/payfast/cancel?payment_id=${paymentId}`,
      Error_Url: `${process.env.APP_BASE_URL}/wallet/payfast/cancel?payment_id=${paymentId}`,
      Checkout_Url: process.env.APP_BASE_URL,
      IsBasket: '0',
      Basket_Id: paymentId,
      Basket_Data: 'Wallet Top-up',
      Payment_Type: 'All',
      Customer_Email: userId + '@dibnow.com',
      Customer_Mobile: '03000000000',
      Custom_Str1: userId,
      Custom_Str2: amount.toString(),
      Custom_Str3: 'wallet_topup'
    };

    // 3. Initiate Transaction
    const txResponse = await fetch(process.env.PAYFAST_TRANSACTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(transactionData)
    });

    const txResult = await txResponse.json();

    if (txResult && txResult.RedirectUrl) {
      res.json({
        paymentId: paymentId,
        paymentUrl: txResult.RedirectUrl,
        amount: amount,
        currency: 'PKR'
      });
    } else {
      throw new Error(txResult.MESSAGE || 'Failed to initiate wallet top-up');
    }

  } catch (error) {
    console.error('PayFast wallet topup error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== WEBHOOK HANDLER (ITN) ====================

router.post('/webhook', async (req, res) => {
  try {
    // APPS Pakistan sends data in body
    const data = req.body;
    
    // Note: APPS Pakistan parameter names might vary slightly, but they usually include Order_Id, Transaction_Status
    // We'll support both old (South Africa) and new (Pakistan) names for maximum compatibility
    const paymentId = data.Order_Id || data.m_payment_id;
    const status = data.Transaction_Status || data.payment_status;
    const userId = data.Custom_Str1 || data.custom_str1;
    const type = data.Custom_Str3 || data.custom_str3;
    const amountGross = data.Amount || data.amount_gross;

    console.log(`[PAYFAST WEBHOOK] Received notification for Order: ${paymentId}, Status: ${status}`);

    // Verify payment status (APPS success is usually 'SUCCESS' or '00')
    if (status !== 'SUCCESS' && status !== '00' && status !== 'COMPLETE') {
      console.log(`[PAYFAST WEBHOOK] Payment not successful: ${status}`);
      return res.send('Payment not successful');
    }

    // Check for duplicate processing (Already implemented helper in payfast.js)
    const existing = await Transaction.findOne({ paymentId });
    if (existing && existing.status === 'completed') {
      console.log(`[PAYFAST WEBHOOK] Transaction already processed: ${paymentId}`);
      return res.send('Transaction already processed');
    }

    if (type === 'subscription') {
      const planId = data.Custom_Str2 || data.custom_str2;
      const autoRenew = (data.Custom_Str4 || data.custom_str4) === 'true';
      const amount = parseFloat(amountGross);

      const plan = await Plan.findById(planId);
      if (!plan) return res.status(404).send('Plan not found');

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      const subscription = new Subscription({
        userId, planId, status: 'active',
        startDate: new Date(), endDate,
        paymentMethod: 'payfast', paymentId,
        amount, currency: 'PKR', autoRenew,
        nextRenewalDate: autoRenew ? new Date(endDate) : null
      });
      await subscription.save();

      const transaction = new Transaction({
        userId, transactionType: 'subscription', amount,
        currency: 'PKR', status: 'completed',
        paymentMethod: 'payfast', paymentId,
        subscriptionId: subscription._id, planId,
        description: `Subscription to ${plan.name} via PayFast Pakistan`,
        extraData: data
      });
      await transaction.save();

    } else if (type === 'wallet_topup') {
      const amount = parseFloat(amountGross);

      let wallet = await Wallet.findOne({ userId });
      if (!wallet) wallet = new Wallet({ userId, balance: 0, currency: 'PKR' });

      wallet.balance += amount;
      wallet.updatedAt = new Date();
      
      const transaction = new Transaction({
        userId, transactionType: 'wallet_topup', amount,
        currency: 'PKR', status: 'completed',
        paymentMethod: 'payfast', paymentId,
        description: `Wallet top-up via PayFast Pakistan`,
        extraData: data
      });
      await transaction.save();
      
      wallet.transactions.push(transaction._id);
      await wallet.save();
    }

    res.send('OK');
  } catch (error) {
    console.error('[PAYFAST WEBHOOK] Error:', error);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;
