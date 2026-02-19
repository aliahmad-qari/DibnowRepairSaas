const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  duration: {
    type: Number,
    required: true // in days
  },
  planDuration: {
    type: Number,
    default: 30 // Plan validity in days (e.g., 30, 60, 90, 365)
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  stripePriceId: {
    type: String
  },
  limits: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

module.exports = mongoose.model('Plan', planSchema);
