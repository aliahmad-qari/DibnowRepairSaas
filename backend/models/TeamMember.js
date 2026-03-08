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
  role: {
    type: String,
    required: true,
    default: 'technician'
  },
  status: {
    type: String,
    default: 'enabled'
  },
  permissions: {
    type: [String],
    default: []
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

teamMemberSchema.index({ ownerId: 1, email: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
