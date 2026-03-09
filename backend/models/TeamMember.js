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
    default: 'technician'
  },
  department: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed, // Allow both array and object structures
    default: {}
  },
  ownerId: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string for system admin
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

module.exports = mongoose.model('TeamMember', teamMemberSchema);
