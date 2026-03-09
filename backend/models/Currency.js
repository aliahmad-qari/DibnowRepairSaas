const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Currency code is required'],
    unique: true,
    uppercase: true,
    minlength: [3, 'Currency code must be 3 characters'],
    maxlength: [3, 'Currency code must be 3 characters'],
    match: [/^[A-Z]{3}$/, 'Currency code must be 3 uppercase letters']
  },
  name: {
    type: String,
    required: [true, 'Currency name is required'],
    trim: true,
    maxlength: [100, 'Currency name cannot exceed 100 characters']
  },
  countryCode: {
    type: String,
    required: [true, 'Country code is required'],
    uppercase: true,
    minlength: [2, 'Country code must be 2 characters'],
    maxlength: [2, 'Country code must be 2 characters'],
    match: [/^[A-Z]{2}$/, 'Country code must be 2 uppercase letters']
  },
  symbol: {
    type: String,
    required: [true, 'Currency symbol is required'],
    maxlength: [10, 'Currency symbol cannot exceed 10 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient sorting
currencySchema.index({ countryCode: 1 });

module.exports = mongoose.model('Currency', currencySchema);