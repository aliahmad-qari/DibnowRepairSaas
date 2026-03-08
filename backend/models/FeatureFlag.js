const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Feature flag name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Feature flag name cannot exceed 100 characters']
  },
  group: {
    type: String,
    required: [true, 'Feature flag group is required'],
    trim: true,
    maxlength: [50, 'Feature flag group cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  enabled: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient sorting
featureFlagSchema.index({ group: 1 });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);