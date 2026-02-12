const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'pending'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'payfast', 'paypal', 'manual'],
    required: true
  },
  paymentId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  paypalAgreementId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  renewAttempts: {
    type: Number,
    default: 0
  },
  lastRenewalDate: {
    type: Date
  },
  nextRenewalDate: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for finding subscriptions needing renewal
subscriptionSchema.index({ status: 1, endDate: 1, autoRenew: 1 });
subscriptionSchema.index({ paymentId: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
