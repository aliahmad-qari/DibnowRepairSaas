const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: true,
    default: 'Technician'
  },
  department: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  permissions: {
    type: [String],
    default: []
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

teamMemberSchema.index({ ownerId: 1, email: 1 });
teamMemberSchema.index({ userId: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
