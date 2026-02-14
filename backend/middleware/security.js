const rateLimit = require('express-rate-limit');

// In-memory store for rate limiting (use Redis in production)
const store = new Map();

// Login rate limiter - 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { 
    message: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  },
  handler: (req, res, next, options) => {
    console.log(`[SECURITY] Login rate limit exceeded for ${req.body.email || req.ip}`);
    res.status(429).json(options.message);
  }
});

// Registration rate limiter - 3 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Increased for local testing
  message: { 
    message: 'Too many registration attempts. Please try again after an hour.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip;
  },
  handler: (req, res, next, options) => {
    console.log(`[SECURITY] Registration rate limit exceeded for ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// OTP rate limiter - 3 OTP requests per hour per email
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { 
    message: 'Too many OTP requests. Please try again after an hour.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  }
});

// Password reset rate limiter - 3 requests per hour per email
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { 
    message: 'Too many password reset requests. Please try again after an hour.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  }
});

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for sensitive operations
const sensitiveOpsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Rate limit exceeded for sensitive operation.' }
});

// Track failed login attempts for brute force detection
const failedLoginAttempts = new Map();

const trackFailedLogin = (email) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minute window
  
  if (!failedLoginAttempts.has(email)) {
    failedLoginAttempts.set(email, []);
  }
  
  const attempts = failedLoginAttempts.get(email);
  // Remove attempts older than window
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  recentAttempts.push(now);
  
  failedLoginAttempts.set(email, recentAttempts);
  return recentAttempts.length;
};

const checkBruteForce = (email) => {
  const attempts = failedLoginAttempts.get(email) || [];
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  return recentAttempts.length >= 5;
};

const clearFailedLogins = (email) => {
  failedLoginAttempts.delete(email);
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  
  // HSTS (uncomment in production with HTTPS)
  // res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const maxSize = '10mb';
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);
    const maxBytes = parseSize(maxSize);
    if (contentLength > maxBytes) {
      return res.status(413).json({ message: 'Request too large' });
    }
  }
  next();
};

const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
  if (!match) return 0;
  return parseInt(match[1]) * (units[match[2] || 'b'] || 1);
};

module.exports = {
  loginLimiter,
  registerLimiter,
  otpLimiter,
  passwordResetLimiter,
  apiLimiter,
  sensitiveOpsLimiter,
  trackFailedLogin,
  checkBruteForce,
  clearFailedLogins,
  securityHeaders,
  sanitizeInput,
  requestSizeLimiter
};
