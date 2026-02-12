const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

// ==================== HELPER FUNCTIONS ====================

// Check for duplicate transaction
async function checkDuplicateTransaction(paymentId) {
  const existing = await Transaction.findOne({ paymentId, status: { $in: ['completed', 'pending'] } });
  return !!existing;
}

// Create subscription with duplicate protection
async function createSubscriptionWithProtection(subscriptionData, transactionData) {
  const duplicate = await checkDuplicateTransaction(transactionData.paymentId);
  if (duplicate) {
    throw new Error('DUPLICATE_TRANSACTION');
  }
  
  const subscription = new Subscription(subscriptionData);
  await subscription.save();
  
  const transaction = new Transaction(transactionData);
  await transaction.save();
  
  return { subscription, transaction };
}

// ==================== SUBSCRIPTION ENDPOINTS ====================

// Create Stripe Checkout Session for Plan Subscription with Auto-Renewal
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { planId, userId, enableAutoRenew = false } = req.body;

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: Math.round(plan.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_BASE_URL}/pricing/stripe/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}&user_id=${userId}&auto_renew=${enableAutoRenew}`,
      cancel_url: `${process.env.APP_BASE_URL}/pricing/stripe/cancel`,
      metadata: {
        planId: planId,
        userId: userId,
        type: 'subscription',
        autoRenew: enableAutoRenew.toString()
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify Stripe Payment and Activate Subscription with Auto-Renewal
router.post('/verify-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Check for duplicate
    if (await checkDuplicateTransaction(sessionId)) {
      return res.status(400).json({ message: 'Transaction already processed', duplicate: true });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const { planId, userId, type, autoRenew } = session.metadata;

    if (type === 'subscription') {
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // Calculate next renewal date
      const nextRenewalDate = autoRenew === 'true' ? new Date(endDate) : null;

      const { subscription, transaction } = await createSubscriptionWithProtection(
        {
          userId: userId,
          planId: planId,
          status: 'active',
          startDate: new Date(),
          endDate: endDate,
          paymentMethod: 'stripe',
          paymentId: session.payment_intent,
          stripeSubscriptionId: session.subscription,
          amount: plan.price,
          currency: plan.currency,
          autoRenew: autoRenew === 'true',
          nextRenewalDate: nextRenewalDate
        },
        {
          userId: userId,
          transactionType: 'subscription',
          amount: plan.price,
          currency: plan.currency,
          status: 'completed',
          paymentMethod: 'stripe',
          paymentId: session.payment_intent,
          subscriptionId: null,
          planId: planId,
          description: `Subscription to ${plan.name}`
        }
      );

      // Update transaction with subscription ID
      transaction.subscriptionId = subscription._id;
      await transaction.save();

      res.json({
        success: true,
        subscription: subscription,
        transaction: transaction
      });
    } else if (type === 'wallet_topup') {
      const amount = parseFloat(session.metadata.amount);
      const currency = session.metadata.currency;

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
        paymentMethod: 'stripe',
        paymentId: session.payment_intent,
        description: `Wallet top-up of ${amount} ${currency}`
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
    console.error('Stripe verify payment error:', error);
    if (error.message === 'DUPLICATE_TRANSACTION') {
      return res.status(400).json({ message: 'Transaction already processed', duplicate: true });
    }
    res.status(500).json({ message: error.message });
  }
});

// ==================== AUTO-RENEWAL ENDPOINTS ====================

// Manual subscription renewal (for scheduled renewals)
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

    // Create payment intent for renewal
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: plan.currency.toLowerCase(),
      metadata: {
        subscriptionId: subscription._id.toString(),
        userId: subscription.userId.toString(),
        type: 'renewal',
        planId: plan._id.toString()
      }
    });

    // Create pending transaction
    const transaction = new Transaction({
      userId: subscription.userId,
      transactionType: 'renewal',
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      paymentMethod: 'stripe',
      paymentId: paymentIntent.id,
      subscriptionId: subscription._id,
      planId: plan._id,
      description: `Renewal of ${plan.name}`
    });
    await transaction.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      transaction: transaction
    });
  } catch (error) {
    console.error('Stripe renewal error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Confirm renewal payment
router.post('/confirm-renewal', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const transaction = await Transaction.findOne({ paymentId: paymentIntentId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      return res.json({ success: true, message: 'Renewal already completed', transaction });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      transaction.status = 'failed';
      await transaction.save();
      return res.status(400).json({ message: 'Payment not successful' });
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
    await transaction.save();

    res.json({
      success: true,
      subscription: subscription,
      transaction: transaction
    });
  } catch (error) {
    console.error('Stripe confirm renewal error:', error);
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

    // Check if Stripe refund exists
    const existingRefund = await Transaction.findOne({
      refundId: { $exists: true },
      paymentId: originalTransaction.paymentId
    });

    if (existingRefund) {
      return res.status(400).json({ message: 'Refund already processed for this transaction' });
    }

    // Process refund through Stripe
    const refundParams = {
      payment_intent: originalTransaction.paymentId,
      reason: 'requested_by_customer'
    };

    if (amount && amount < originalTransaction.amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    const stripeRefund = await stripe.refunds.create(refundParams);

    // Update original transaction
    originalTransaction.status = amount && amount < originalTransaction.amount ? 'partially_refunded' : 'refunded';
    originalTransaction.refundAmount = amount || originalTransaction.amount;
    originalTransaction.refundReason = reason;
    originalTransaction.refundedAt = new Date();
    originalTransaction.refundId = stripeRefund.id;
    await originalTransaction.save();

    // Create refund transaction record
    const refundTransaction = new Transaction({
      userId: originalTransaction.userId,
      transactionType: 'refund',
      amount: -(originalTransaction.refundAmount),
      currency: originalTransaction.currency,
      status: 'completed',
      paymentMethod: 'stripe',
      paymentId: stripeRefund.id,
      refundId: stripeRefund.id,
      refundAmount: originalTransaction.refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
      subscriptionId: originalTransaction.subscriptionId,
      planId: originalTransaction.planId,
      description: `Refund for ${originalTransaction.description}`,
      processedBy: adminId,
      extraData: stripeRefund
    });
    await refundTransaction.save();

    // Update wallet if applicable
    if (originalTransaction.transactionType === 'wallet_topup') {
      const wallet = await Wallet.findOne({ userId: originalTransaction.userId });
      if (wallet) {
        wallet.balance -= originalTransaction.refundAmount;
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

    console.log(`[STRIPE] Refund processed: ${stripeRefund.id} for ${originalTransaction.refundAmount}`);

    res.json({
      success: true,
      refund: stripeRefund,
      originalTransaction: originalTransaction,
      refundTransaction: refundTransaction
    });
  } catch (error) {
    console.error('Stripe refund error:', error);
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Wallet Top-up',
            description: `Add ${amount} ${currency} to your wallet`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_BASE_URL}/wallet/stripe/success?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}&amount=${amount}`,
      cancel_url: `${process.env.APP_BASE_URL}/wallet/stripe/cancel`,
      metadata: {
        userId: userId,
        amount: amount,
        currency: currency,
        type: 'wallet_topup'
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe wallet topup error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== WEBHOOK HANDLER ====================

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('[STRIPE WEBHOOK] Checkout session completed:', session.id);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('[STRIPE WEBHOOK] Payment intent succeeded:', paymentIntent.id);

      // Check if this is a renewal
      if (paymentIntent.metadata?.type === 'renewal') {
        const transaction = await Transaction.findOne({ paymentId: paymentIntent.id });
        if (transaction && transaction.status !== 'completed') {
          transaction.status = 'completed';
          await transaction.save();

          const subscription = await Subscription.findById(transaction.subscriptionId);
          if (subscription) {
            const plan = await Plan.findById(subscription.planId);
            if (plan) {
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + plan.duration);
              subscription.endDate = endDate;
              subscription.lastRenewalDate = new Date();
              subscription.nextRenewalDate = subscription.autoRenew ? new Date(endDate) : null;
              await subscription.save();
            }
          }
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      console.log('[STRIPE WEBHOOK] Payment failed:', failedIntent.id);
      
      // Update transaction status
      await Transaction.findOneAndUpdate(
        { paymentId: failedIntent.id },
        { status: 'failed', updatedAt: new Date() }
      );

      // Update renewal attempts
      if (failedIntent.metadata?.subscriptionId) {
        await Subscription.findByIdAndUpdate(
          failedIntent.metadata.subscriptionId,
          { $inc: { renewAttempts: 1 } }
        );
      }
      break;

    default:
      console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
