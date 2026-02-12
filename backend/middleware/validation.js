const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Registration validation
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name can only contain letters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .isLength({ max: 128 }).withMessage('Password too long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-+()]+$/).withMessage('Invalid phone number format'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name too long'),
  handleValidationErrors
];

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// OTP verification validation
const otpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  handleValidationErrors
];

// Password reset request validation
const passwordResetRequestValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  handleValidationErrors
];

// Password reset confirmation validation
const passwordResetConfirmValidation = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .isLength({ max: 128 }).withMessage('Password too long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidationErrors
];

// User ID parameter validation
const userIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors
];

// Repair ID parameter validation
const repairIdValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Repair ID is required')
    .isLength({ min: 6, max: 50 }).withMessage('Invalid repair ID format'),
  handleValidationErrors
];

// Wallet top-up validation
const walletTopupValidation = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID format'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1, max: 10000 }).withMessage('Amount must be between 1 and 10,000'),
  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 }).withMessage('Invalid currency code'),
  handleValidationErrors
];

// Subscription plan validation
const subscriptionValidation = [
  body('planId')
    .notEmpty().withMessage('Plan ID is required')
    .isMongoId().withMessage('Invalid plan ID format'),
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors
];

// Email validation helper
const isValidEmail = function(email) {
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength checker
var validatePasswordStrength = function(password) {
  var checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  
  var score = Object.keys(checks).filter(function(key) {
    return checks[key];
  }).length;
  
  return { checks: checks, score: score, isValid: score >= 4 };
};

module.exports = {
  handleValidationErrors: handleValidationErrors,
  registerValidation: registerValidation,
  loginValidation: loginValidation,
  otpValidation: otpValidation,
  passwordResetRequestValidation: passwordResetRequestValidation,
  passwordResetConfirmValidation: passwordResetConfirmValidation,
  userIdValidation: userIdValidation,
  repairIdValidation: repairIdValidation,
  walletTopupValidation: walletTopupValidation,
  subscriptionValidation: subscriptionValidation,
  isValidEmail: isValidEmail,
  validatePasswordStrength: validatePasswordStrength
};
