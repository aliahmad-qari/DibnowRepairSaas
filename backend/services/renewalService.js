const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Plan = require('../models/Plan');

// Configuration
const RENEWAL_DAYS_BEFORE_EXPIRY = 7; // Start renewal process 7 days before expiry
const MAX_RENEW_ATTEMPTS = 3;

/**
 * Check for subscriptions that need renewal
 */
async function checkExpiringSubscriptions() {
  console.log(`[RENEWAL] Checking for expiring subscriptions...`);

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + RENEWAL_DAYS_BEFORE_EXPIRY);

  // Find active subscriptions that are due for renewal
  const expiringSubscriptions = await Subscription.find({
    status: 'active',
    autoRenew: true,
    endDate: {
      $lte: futureDate,
      $gte: now // Only subscriptions expiring within the renewal window
    },
    renewAttempts: { $lt: MAX_RENEW_ATTEMPTS }
  }).populate('planId');

  console.log(`[RENEWAL] Found ${expiringSubscriptions.length} subscriptions needing renewal`);

  for (const subscription of expiringSubscriptions) {
    try {
      await processRenewal(subscription);
    } catch (error) {
      console.error(`[RENEWAL] Error renewing subscription ${subscription._id}:`, error);
      
      // Increment renew attempts
      subscription.renewAttempts += 1;
      await subscription.save();
    }
  }

  console.log(`[RENEWAL] Renewal check complete`);
}

/**
 * Process a single subscription renewal
 */
async function processRenewal(subscription) {
  const plan = subscription.planId;
  
  if (!plan) {
    console.error(`[RENEWAL] Plan not found for subscription ${subscription._id}`);
    return;
  }

  // Create renewal order based on payment method
  switch (subscription.paymentMethod) {
    case 'stripe':
      await createStripeRenewal(subscription, plan);
      break;
    case 'payfast':
      await createPayFastRenewal(subscription, plan);
      break;
    case 'paypal':
      await createPayPalRenewal(subscription, plan);
      break;
    default:
      console.warn(`[RENEWAL] Unknown payment method: ${subscription.paymentMethod}`);
  }
}

/**
 * Create Stripe renewal order
 */
async function createStripeRenewal(subscription, plan) {
  try {
    const response = await fetch('http://localhost:5000/api/stripe/renew-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: subscription._id.toString()
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[RENEWAL] Stripe renewal initiated for subscription ${subscription._id}`);
      
      // Send notification to user about renewal
      // await sendRenewalNotification(subscription.userId, plan.name, data.clientSecret);
    } else {
      console.error(`[RENEWAL] Stripe renewal failed: ${data.message}`);
    }
  } catch (error) {
    console.error(`[RENEWAL] Stripe renewal error:`, error);
    throw error;
  }
}

/**
 * Create PayFast renewal order
 */
async function createPayFastRenewal(subscription, plan) {
  try {
    const response = await fetch('http://localhost:5000/api/payfast/renew-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: subscription._id.toString()
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[RENEWAL] PayFast renewal initiated for subscription ${subscription._id}`);
      
      // Redirect user to PayFast payment URL
      // await sendRenewalNotification(subscription.userId, plan.name, data.paymentUrl);
    } else {
      console.error(`[RENEWAL] PayFast renewal failed: ${data.message}`);
    }
  } catch (error) {
    console.error(`[RENEWAL] PayFast renewal error:`, error);
    throw error;
  }
}

/**
 * Create PayPal renewal order
 */
async function createPayPalRenewal(subscription, plan) {
  try {
    const response = await fetch('http://localhost:5000/api/paypal/create-renewal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: subscription._id.toString()
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[RENEWAL] PayPal renewal initiated for subscription ${subscription._id}`);
      
      // Send user PayPal approval URL
      // await sendRenewalNotification(subscription.userId, plan.name, data.approvalUrl);
    } else {
      console.error(`[RENEWAL] PayPal renewal failed: ${data.message}`);
    }
  } catch (error) {
    console.error(`[RENEWAL] PayPal renewal error:`, error);
    throw error;
  }
}

/**
 * Check for expired subscriptions
 */
async function checkExpiredSubscriptions() {
  console.log(`[RENEWAL] Checking for expired subscriptions...`);

  const now = new Date();

  // Find subscriptions that have expired but are still marked as active
  const expiredSubscriptions = await Subscription.find({
    status: 'active',
    endDate: { $lt: now }
  });

  console.log(`[RENEWAL] Found ${expiredSubscriptions.length} expired subscriptions`);

  for (const subscription of expiredSubscriptions) {
    subscription.status = 'expired';
    
    if (!subscription.autoRenew) {
      // If auto-renewal is off, mark as expired
      console.log(`[RENEWAL] Subscription ${subscription._id} has expired`);
    } else {
      // If auto-renewal is on but expired, try to renew
      console.log(`[RENEWAL] Auto-renewal subscription ${subscription._id} has expired, attempting renewal...`);
      subscription.renewAttempts = 0; // Reset attempts
    }
    
    await subscription.save();
  }

  console.log(`[RENEWAL] Expiry check complete`);
}

/**
 * Generate renewal report
 */
async function generateRenewalReport() {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingRenewals = await Subscription.countDocuments({
    status: 'active',
    autoRenew: true,
    endDate: {
      $gte: now,
      $lte: nextWeek
    }
  });

  const failedRenewals = await Transaction.countDocuments({
    type: 'renewal',
    status: 'failed',
    createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) }
  });

  const successfulRenewals = await Transaction.countDocuments({
    type: 'renewal',
    status: 'completed',
    createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) }
  });

  return {
    upcomingRenewals,
    successfulRenewalsToday: successfulRenewals,
    failedRenewalsToday: failedRenewals,
    timestamp: now
  };
}

/**
 * Start the renewal scheduler
 */
function startRenewalScheduler() {
  // Run initial check
  console.log('[RENEWAL] Starting renewal scheduler...');
  
  // Check for expiring subscriptions every hour
  setInterval(async () => {
    await checkExpiringSubscriptions();
    await checkExpiredSubscriptions();
  }, 60 * 60 * 1000); // 1 hour

  // Also run immediately on startup
  checkExpiringSubscriptions();
  checkExpiredSubscriptions();

  console.log('[RENEWAL] Renewal scheduler started');
}

module.exports = {
  checkExpiringSubscriptions,
  checkExpiredSubscriptions,
  processRenewal,
  generateRenewalReport,
  startRenewalScheduler
};
