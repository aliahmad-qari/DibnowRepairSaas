const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Ensure we have the userId field for compatibility
    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based Access Control Middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Admin-only middleware (ADMIN or SUPER_ADMIN)
const adminOnly = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Super Admin only middleware
const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  next();
};

// Verify email is confirmed
const emailVerified = (req, res, next) => {
  if (!req.user || !req.user.emailVerified) {
    return res.status(403).json({ message: 'Email verification required' });
  }
  next();
};

// Check if account is active
const activeAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.is_disabled) {
      return res.status(403).json({ message: 'Account is disabled' });
    }
    if (user.status === 'expired') {
      return res.status(403).json({ message: 'Account has expired' });
    }
    req.userData = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error verifying account status' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid but continue without auth
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  adminOnly,
  superAdminOnly,
  emailVerified,
  activeAccount,
  optionalAuth
};
