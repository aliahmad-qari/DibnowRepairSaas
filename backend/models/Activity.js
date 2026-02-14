const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleName: { type: String, required: true }, // e.g., 'Inventory', 'Sales', 'Team'
  actionType: { type: String, required: true }, // e.g., 'Stock Created', 'Sale Liquidated'
  status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
