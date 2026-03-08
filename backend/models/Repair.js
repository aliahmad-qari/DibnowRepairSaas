const mongoose = require('mongoose');

// Counter model for generating sequential tracking IDs
const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  }
});

const Counter = mongoose.model('Counter', counterSchema);

const repairSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  customerPhone: {
    type: String,
    trim: true
  },
  device: {
    type: String,
    required: [true, 'Device information is required'],
    trim: true,
    maxlength: [200, 'Device info cannot exceed 200 characters']
  },
  deviceModel: {
    type: String,
    trim: true,
    maxlength: [100, 'Model cannot exceed 100 characters']
  },
  serialNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Problem description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  estimatedCost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  finalCost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'diagnosing', 'in_progress', 'parts_ordered', 'completed', 'ready', 'delivered', 'cancelled', 'refunded'],
      message: 'Invalid status'
    },
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  warrantyInfo: {
    warrantyType: String,
    warrantyPeriod: Number,
    warrantyStartDate: Date,
    warrantyEndDate: Date,
    warrantyProvider: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  publicView: {
    type: Boolean,
    default: true
  },
  notificationsSent: [{
    type: {
      type: String,
      enum: ['email', 'sms']
    },
    status: String,
    sentAt: Date,
    message: String
  }],
  estimatedCompletionDate: {
    type: Date
  },
  actualCompletionDate: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes (remove duplicates - trackingId and customerEmail already have index:true in schema)
repairSchema.index({ ownerId: 1, status: 1 });
repairSchema.index({ createdAt: -1 });
repairSchema.index({ 'statusHistory.timestamp': -1 });

// Virtual for status progress percentage
repairSchema.virtual('progressPercentage').get(function() {
  const statusProgress = {
    'pending': 10,
    'diagnosing': 25,
    'in_progress': 50,
    'parts_ordered': 70,
    'completed': 90,
    'ready': 95,
    'delivered': 100,
    'cancelled': 0,
    'refunded': 0
  };
  return statusProgress[this.status] || 0;
});

// Generate unique tracking ID (new format: DIB-REP-YYYY-NNNNNN)
repairSchema.statics.generateTrackingId = async function() {
  const year = new Date().getFullYear();
  
  // Get or create counter for this year
  let counter = await Counter.findOne({ name: `repairs_${year}` });
  if (!counter) {
    counter = await Counter.create({ name: `repairs_${year}`, count: 100000 }); // Start from 100000
  }
  
  // Increment counter
  counter.count += 1;
  await counter.save();
  
  // Format: DIB-REP-2026-000123
  const sequenceNumber = String(counter.count).padStart(6, '0');
  return `DIB-REP-${year}-${sequenceNumber}`;
};

// Regenerate tracking ID for existing repair
repairSchema.statics.regenerateTrackingId = async function(currentTrackingId) {
  const year = new Date().getFullYear();
  
  // Get or create counter for this year
  let counter = await Counter.findOne({ name: `repairs_${year}` });
  if (!counter) {
    counter = await Counter.create({ name: `repairs_${year}`, count: 100000 });
  }
  
  // Increment counter
  counter.count += 1;
  await counter.save();
  
  // Format: DIB-REP-2026-000123
  const sequenceNumber = String(counter.count).padStart(6, '0');
  return `DIB-REP-${year}-${sequenceNumber}`;
};

// Get public repair details
repairSchema.methods.getPublicDetails = function() {
  return {
    trackingId: this.trackingId,
    customerName: this.customerName,
    device: this.device,
    deviceModel: this.deviceModel,
    status: this.status,
    priority: this.priority,
    category: this.category,
    brand: this.brand,
    estimatedCost: this.estimatedCost,
    finalCost: this.finalCost,
    paymentStatus: this.paymentStatus,
    estimatedCompletionDate: this.estimatedCompletionDate,
    actualCompletionDate: this.actualCompletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    progressPercentage: this.progressPercentage,
    statusHistory: this.statusHistory.map(h => ({
      status: h.status,
      note: h.note,
      timestamp: h.timestamp
    }))
  };
};

// Add status update
repairSchema.methods.addStatusUpdate = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note: note,
    updatedBy: updatedBy,
    timestamp: new Date()
  });

  // Set completion date if status is completed
  if (newStatus === 'completed' || newStatus === 'ready') {
    this.actualCompletionDate = new Date();
  }

  return this.save();
};

// Check if repair can be cancelled
repairSchema.methods.canBeCancelled = function() {
  return ['pending', 'diagnosing', 'in_progress'].includes(this.status);
};

// Check if repair can be refunded
repairSchema.methods.canBeRefunded = function() {
  return ['delivered', 'completed'].includes(this.status) && this.paymentStatus === 'paid';
};

module.exports = mongoose.model('Repair', repairSchema);
