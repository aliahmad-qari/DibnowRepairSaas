const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in-review', 'resolved', 'closed'], default: 'pending' },
  user: { type: String, required: true }, // Customer name or ID
  userId: { type: String, required: true }, // User who submitted or customer ID
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, default: () => new Date().toLocaleDateString() },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
