const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  productName: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  customer: {
    type: String,
    default: 'Walk-in Customer'
  },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString()
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

saleSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
