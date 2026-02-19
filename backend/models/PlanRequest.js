const mongoose = require('mongoose');

const planRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  currentPlanId: {
    type: String,
    default: 'starter'
  },
  currentPlanName: {
    type: String,
    default: 'Starter'
  },
  requestedPlanId: {
    type: String,
    required: true
  },
  requestedPlanName: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'GBP'
  },
  manualMethod: {
    type: String, 
    default: 'Bank Transfer'
  },
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  invoiceStatus: {
    type: String,
    enum: ['pending', 'paid', 'unpaid', 'void'],
    default: 'pending'
  },
  adminComment: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('PlanRequest', planRequestSchema);
